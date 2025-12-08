import { useState, useEffect } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { WorkLogList } from './WorkLogList';
import apiClient from '../../lib/apiClient';
import { WorkLog } from '../../types/worklog';
import { useAuth } from '../../hooks/useAuth';

export const MyWorkLogsPage = () => {
    const { user } = useAuth();
    const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
    const [loading, setLoading] = useState(true);
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

    const fetchMyWorkLogs = async () => {
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
    };

    useEffect(() => {
        if (dateFilter.fromDate && dateFilter.toDate) {
            fetchMyWorkLogs();
        }
    }, [dateFilter]);

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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
