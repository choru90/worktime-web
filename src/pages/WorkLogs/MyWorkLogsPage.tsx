import { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { WorkLogList } from './WorkLogList';
import apiClient from '../../lib/apiClient';
import { WorkLog } from '../../types/worklog';
import { useAuth } from '../../hooks/useAuth';

export const MyWorkLogsPage = () => {
    const { user } = useAuth();
    const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
    const [currentWorkLog, setCurrentWorkLog] = useState<WorkLog | null>(null);
    const [loading, setLoading] = useState(true);
    const [clockLoading, setClockLoading] = useState(false);
    const [dateFilter, setDateFilter] = useState({
        fromDate: '',
        toDate: '',
    });

    // 초기 날짜 범위: 이번 달
    useEffect(() => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        setDateFilter({
            fromDate: firstDay.toISOString().split('T')[0],
            toDate: lastDay.toISOString().split('T')[0],
        });
    }, []);

    const fetchCurrentWorkLog = useCallback(async () => {
        try {
            const response = await apiClient.get<WorkLog | null>('/worklogs/my/current');
            setCurrentWorkLog(response.data);
        } catch (error) {
            console.error('Failed to fetch current work log:', error);
        }
    }, []);

    const fetchMyWorkLogs = useCallback(async () => {
        if (!dateFilter.fromDate || !dateFilter.toDate) return;

        try {
            setLoading(true);
            const params = {
                fromDate: dateFilter.fromDate,
                toDate: dateFilter.toDate,
            };

            const response = await apiClient.get<WorkLog[]>('/worklogs/my', {
                params,
            });
            setWorkLogs(response.data);
        } catch (error) {
            console.error('Failed to fetch my work logs:', error);
            alert('출퇴근 기록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [dateFilter]);

    useEffect(() => {
        fetchCurrentWorkLog();
    }, [fetchCurrentWorkLog]);

    useEffect(() => {
        if (dateFilter.fromDate && dateFilter.toDate) {
            fetchMyWorkLogs();
        }
    }, [dateFilter, fetchMyWorkLogs]);

    const handleClockIn = async () => {
        try {
            setClockLoading(true);
            await apiClient.post('/worklogs/my/clock-in');
            alert('출근 처리되었습니다!');
            fetchCurrentWorkLog();
            fetchMyWorkLogs();
        } catch (error: any) {
            console.error('Failed to clock in:', error);
            const message = error.response?.data?.message || '출근 처리에 실패했습니다.';
            alert(message);
        } finally {
            setClockLoading(false);
        }
    };

    const handleClockOut = async () => {
        try {
            setClockLoading(true);
            await apiClient.post('/worklogs/my/clock-out');
            alert('퇴근 처리되었습니다!');
            fetchCurrentWorkLog();
            fetchMyWorkLogs();
        } catch (error: any) {
            console.error('Failed to clock out:', error);
            const message = error.response?.data?.message || '퇴근 처리에 실패했습니다.';
            alert(message);
        } finally {
            setClockLoading(false);
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (user?.role !== 'WORKER') {
        return (
            <PageContainer title="내 출퇴근 기록">
                <div className="text-center py-12 text-gray-500">
                    알바생 전용 페이지입니다.
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer title="내 출퇴근 기록">
            {/* 출퇴근 버튼 카드 */}
            <div className="mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-center md:text-left">
                            {currentWorkLog ? (
                                <>
                                    <p className="text-lg font-semibold text-emerald-600">
                                        🟢 근무 중
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        출근 시간: {formatTime(currentWorkLog.clockInAt)}
                                    </p>
                                </>
                            ) : (
                                <p className="text-lg font-semibold text-gray-500">
                                    현재 근무 중이 아닙니다
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleClockIn}
                                disabled={clockLoading || !!currentWorkLog}
                                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${currentWorkLog
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    }`}
                            >
                                {clockLoading ? '처리 중...' : '출근하기'}
                            </button>

                            <button
                                onClick={handleClockOut}
                                disabled={clockLoading || !currentWorkLog}
                                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${!currentWorkLog
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-red-500 hover:bg-red-600 text-white'
                                    }`}
                            >
                                {clockLoading ? '처리 중...' : '퇴근하기'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 날짜 필터 */}
            <div className="mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                시작일
                            </label>
                            <input
                                type="date"
                                value={dateFilter.fromDate}
                                onChange={(e) =>
                                    setDateFilter({ ...dateFilter, fromDate: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                종료일
                            </label>
                            <input
                                type="date"
                                value={dateFilter.toDate}
                                onChange={(e) =>
                                    setDateFilter({ ...dateFilter, toDate: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <p className="text-gray-600">총 {workLogs.length}건</p>
            </div>

            <WorkLogList
                workLogs={workLogs}
                onConfirm={() => { }}
                onReject={() => { }}
                isLoading={loading}
            />
        </PageContainer>
    );
};
