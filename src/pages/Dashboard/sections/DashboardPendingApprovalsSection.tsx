import React, { useEffect, useState } from 'react';
import apiClient from '../../../lib/apiClient';
import { Loading } from '../../../components/common/Loading';
import { ErrorState } from '../../../components/common/ErrorState';

interface Props {
    date: string;
}

interface PendingSchedule {
    id: string;
    workerName: string;
    workerId: string;
    startAtUtc: string;
    endAtUtc: string;
    status: string;
}

interface PendingWorkLog {
    id: string;
    workerName: string;
    workerId: string;
    scheduleDate: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    status: string;
}

export const DashboardPendingApprovalsSection: React.FC<Props> = ({ date }) => {
    const [pendingSchedules, setPendingSchedules] = useState<PendingSchedule[]>([]);
    const [pendingWorkLogs, setPendingWorkLogs] = useState<PendingWorkLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // 승인 대기 스케줄 조회 (REQUESTED_BY_WORKER 상태)
            const schedulesResponse = await apiClient.get('/schedules', {
                params: {
                    status: 'REQUESTED_BY_WORKER'
                }
            });
            setPendingSchedules(schedulesResponse.data.schedules || []);

            // 승인 대기 근무 기록 조회 (COMPLETED 상태 = 검수 대기)
            const workLogsResponse = await apiClient.get('/work-logs', {
                params: {
                    status: 'COMPLETED'
                }
            });
            setPendingWorkLogs(workLogsResponse.data || []);

        } catch (err) {
            console.error('Failed to fetch pending approvals', err);
            setError('승인 대기 항목을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [date]);

    const handleScheduleApprove = async (scheduleId: string) => {
        if (!window.confirm('이 스케줄을 승인하시겠습니까?')) return;

        try {
            setActionLoading(scheduleId);
            await apiClient.post(`/schedules/${scheduleId}/confirm`);
            await fetchData();
            alert('스케줄을 승인했습니다.');
        } catch (err: any) {
            console.error('Failed to approve schedule', err);
            alert(err.response?.data?.message || '스케줄 승인에 실패했습니다.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleScheduleReject = async (scheduleId: string) => {
        if (!window.confirm('이 스케줄을 거절하시겠습니까?')) return;

        try {
            setActionLoading(scheduleId);
            await apiClient.post(`/schedules/${scheduleId}/reject`);
            await fetchData();
            alert('스케줄을 거절했습니다.');
        } catch (err: any) {
            console.error('Failed to reject schedule', err);
            alert(err.response?.data?.message || '스케줄 거절에 실패했습니다.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleWorkLogApprove = async (workLogId: string) => {
        if (!window.confirm('이 근무 기록을 승인하시겠습니까?')) return;

        try {
            setActionLoading(workLogId);
            await apiClient.post(`/work-logs/${workLogId}/confirm`);
            await fetchData();
            alert('근무 기록을 승인했습니다.');
        } catch (err: any) {
            console.error('Failed to approve work log', err);
            alert(err.response?.data?.message || '근무 기록 승인에 실패했습니다.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleWorkLogReject = async (workLogId: string) => {
        if (!window.confirm('이 근무 기록을 거절하시겠습니까?')) return;

        try {
            setActionLoading(workLogId);
            await apiClient.post(`/work-logs/${workLogId}/reject`);
            await fetchData();
            alert('근무 기록을 거절했습니다.');
        } catch (err: any) {
            console.error('Failed to reject work log', err);
            alert(err.response?.data?.message || '근무 기록 거절에 실패했습니다.');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDateTime = (utcDateStr: string) => {
        const date = new Date(utcDateStr);
        return date.toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (utcDateStr: string | null) => {
        if (!utcDateStr) return '-';
        const date = new Date(utcDateStr);
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">승인 대기</h2>
                <Loading message="승인 대기 항목을 불러오는 중..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">승인 대기</h2>
                <ErrorState message={error} onRetry={fetchData} />
            </div>
        );
    }

    const totalPending = pendingSchedules.length + pendingWorkLogs.length;

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">승인 대기</h2>
                {totalPending > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                        {totalPending}
                    </span>
                )}
            </div>

            {totalPending === 0 ? (
                <div className="text-center py-12">
                    <span className="text-4xl mb-3 block">✅</span>
                    <h3 className="text-gray-900 font-medium mb-1">승인 대기 항목이 없습니다</h3>
                    <p className="text-gray-500 text-sm">모든 승인이 완료되었습니다.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* 스케줄 승인 대기 */}
                    {pendingSchedules.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                📅 스케줄 승인 대기
                                <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                                    {pendingSchedules.length}
                                </span>
                            </h3>
                            <div className="space-y-2">
                                {pendingSchedules.map((schedule) => (
                                    <div
                                        key={schedule.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{schedule.workerName}</div>
                                            <div className="text-sm text-gray-600">
                                                {formatDateTime(schedule.startAtUtc)} - {formatTime(schedule.endAtUtc)}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleScheduleApprove(schedule.id)}
                                                disabled={actionLoading === schedule.id}
                                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors disabled:bg-gray-400"
                                            >
                                                {actionLoading === schedule.id ? '처리중...' : '승인'}
                                            </button>
                                            <button
                                                onClick={() => handleScheduleReject(schedule.id)}
                                                disabled={actionLoading === schedule.id}
                                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors disabled:bg-gray-400"
                                            >
                                                거절
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 근무 기록 승인 대기 */}
                    {pendingWorkLogs.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                🕐 근무 기록 승인 대기
                                <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">
                                    {pendingWorkLogs.length}
                                </span>
                            </h3>
                            <div className="space-y-2">
                                {pendingWorkLogs.map((workLog) => (
                                    <div
                                        key={workLog.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{workLog.workerName}</div>
                                            <div className="text-sm text-gray-600">
                                                {workLog.scheduleDate} | 출근: {formatTime(workLog.checkInTime)} / 퇴근: {formatTime(workLog.checkOutTime)}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleWorkLogApprove(workLog.id)}
                                                disabled={actionLoading === workLog.id}
                                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors disabled:bg-gray-400"
                                            >
                                                {actionLoading === workLog.id ? '처리중...' : '승인'}
                                            </button>
                                            <button
                                                onClick={() => handleWorkLogReject(workLog.id)}
                                                disabled={actionLoading === workLog.id}
                                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors disabled:bg-gray-400"
                                            >
                                                거절
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
