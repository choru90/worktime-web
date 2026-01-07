import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { WorkLog } from '../../types/worklog';

interface WorkerDashboardProps {
    workerName?: string;
}

export const WorkerDashboard = ({ workerName }: WorkerDashboardProps) => {
    const [currentWorkLog, setCurrentWorkLog] = useState<WorkLog | null>(null);
    const [recentWorkLogs, setRecentWorkLogs] = useState<WorkLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [clockLoading, setClockLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchCurrentWorkLog = useCallback(async () => {
        try {
            const response = await apiClient.get<WorkLog | null>('/worklogs/my/current');
            setCurrentWorkLog(response.data);
        } catch (error) {
            console.error('Failed to fetch current work log:', error);
        }
    }, []);

    const fetchRecentWorkLogs = useCallback(async () => {
        try {
            const today = new Date();
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);

            const response = await apiClient.get<WorkLog[]>('/worklogs/my', {
                params: {
                    fromDate: weekAgo.toISOString().split('T')[0],
                    toDate: today.toISOString().split('T')[0],
                },
            });
            setRecentWorkLogs(response.data.slice(0, 5)); // Last 5 records
        } catch (error) {
            console.error('Failed to fetch recent work logs:', error);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchCurrentWorkLog(), fetchRecentWorkLogs()]);
            setLoading(false);
        };
        init();
    }, [fetchCurrentWorkLog, fetchRecentWorkLogs]);

    const handleClockIn = async () => {
        try {
            setClockLoading(true);
            await apiClient.post('/worklogs/my/clock-in');
            await fetchCurrentWorkLog();
            await fetchRecentWorkLogs();
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
            await fetchCurrentWorkLog();
            await fetchRecentWorkLogs();
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
            weekday: 'short',
        });
    };

    const calculateWorkDuration = () => {
        if (!currentWorkLog) return null;
        const clockIn = new Date(currentWorkLog.clockInAt);
        const now = new Date();
        const diffMs = now.getTime() - clockIn.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}시간 ${minutes}분`;
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="text-xl text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Welcome & Current Time */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    안녕하세요{workerName ? `, ${workerName}님` : ''}!
                </h1>
                <p className="text-4xl font-light text-gray-600 mt-2">
                    {currentTime.toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    })}
                </p>
                <p className="text-gray-500 mt-1">
                    {currentTime.toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long',
                    })}
                </p>
            </div>

            {/* Clock In/Out Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                {currentWorkLog ? (
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full mb-4">
                            <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-emerald-700 font-semibold">근무 중</span>
                        </div>
                        <p className="text-gray-600 mb-2">
                            출근 시간: <span className="font-semibold">{formatTime(currentWorkLog.clockInAt)}</span>
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mb-6">
                            {calculateWorkDuration()}
                        </p>
                        <button
                            onClick={handleClockOut}
                            disabled={clockLoading}
                            className="w-full py-4 bg-red-500 hover:bg-red-600 text-white text-xl font-bold rounded-xl transition-colors disabled:bg-gray-400"
                        >
                            {clockLoading ? '처리 중...' : '퇴근하기'}
                        </button>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-4">
                            <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                            <span className="text-gray-600 font-semibold">출근 전</span>
                        </div>
                        <p className="text-gray-500 mb-6">오늘도 화이팅하세요! 💪</p>
                        <button
                            onClick={handleClockIn}
                            disabled={clockLoading}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-bold rounded-xl transition-colors disabled:bg-gray-400"
                        >
                            {clockLoading ? '처리 중...' : '출근하기'}
                        </button>
                    </div>
                )}
            </div>

            {/* Recent Work Logs */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">최근 근무 기록</h2>
                    <Link to="/my/worklogs" className="text-sm text-blue-600 hover:underline">
                        전체보기
                    </Link>
                </div>

                {recentWorkLogs.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">최근 근무 기록이 없습니다.</p>
                ) : (
                    <div className="space-y-3">
                        {recentWorkLogs.map((log) => (
                            <div key={log.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                                <div>
                                    <p className="font-medium text-gray-900">{formatDate(log.clockInAt)}</p>
                                    <p className="text-sm text-gray-500">
                                        {formatTime(log.clockInAt)} - {log.clockOutAt ? formatTime(log.clockOutAt) : '진행중'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-1 text-xs rounded-full ${log.status === 'ONGOING' ? 'bg-blue-100 text-blue-700' :
                                        log.status === 'COMPLETED' ? 'bg-yellow-100 text-yellow-700' :
                                            log.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>
                                        {log.status === 'ONGOING' ? '진행중' :
                                            log.status === 'COMPLETED' ? '검수대기' :
                                                log.status === 'CONFIRMED' ? '확정' : log.status}
                                    </span>
                                    {log.durationMinutes && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            {Math.floor(log.durationMinutes / 60)}시간 {log.durationMinutes % 60}분
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-3 gap-4 mt-6">
                <Link
                    to="/my/schedules"
                    className="bg-white rounded-xl shadow-sm p-4 text-center hover:bg-gray-50 transition-colors"
                >
                    <div className="text-2xl mb-2">📅</div>
                    <p className="font-medium text-gray-700">내 스케줄</p>
                </Link>
                <Link
                    to="/my/worklogs"
                    className="bg-white rounded-xl shadow-sm p-4 text-center hover:bg-gray-50 transition-colors"
                >
                    <div className="text-2xl mb-2">📋</div>
                    <p className="font-medium text-gray-700">내 근무 기록</p>
                </Link>
                <Link
                    to="/my/payroll"
                    className="bg-white rounded-xl shadow-sm p-4 text-center hover:bg-gray-50 transition-colors"
                >
                    <div className="text-2xl mb-2">💰</div>
                    <p className="font-medium text-gray-700">내 급여 조회</p>
                </Link>
            </div>
        </div>
    );
};
