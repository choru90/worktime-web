import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../lib/apiClient';
import { Loading } from '../../../components/common/Loading';
import { ErrorState } from '../../../components/common/ErrorState';
import { dashboardApi, ActionItem } from '../../../api/dashboardApi';

interface Props {
    date: string;
}

export const DashboardPendingApprovalsSection: React.FC<Props> = ({ date }) => {
    const navigate = useNavigate();
    const [actionList, setActionList] = useState<ActionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const dashboardActionResponse = await dashboardApi.getActions({ date });
            setActionList(dashboardActionResponse.data.items || []);
        } catch (err) {
            console.error('Failed to fetch dashboard actions', err);
            setError('확인 필요 항목을 불러오는데 실패했습니다.');
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

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">확인 필요</h2>
                <Loading message="확인 필요 항목을 불러오는 중..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">확인 필요</h2>
                <ErrorState message={error} onRetry={fetchData} />
            </div>
        );
    }

    const totalPending = actionList.length;

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">확인 필요</h2>
                {totalPending > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                        {totalPending}
                    </span>
                )}
            </div>

            {totalPending === 0 ? (
                <div className="text-center py-12">
                    <span className="text-4xl mb-3 block">✅</span>
                    <h3 className="text-gray-900 font-medium mb-1">확인 필요 항목이 없습니다</h3>
                    <p className="text-gray-500 text-sm">모든 확인이 완료되었습니다.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {actionList.map((actionListItem) => {
                        const targetId = actionListItem.target.targetId;

                        return (
                            <div
                                key={actionListItem.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                            {actionListItem.title}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(actionListItem.createdAt).toLocaleDateString('ko-KR', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <div className="font-medium text-gray-900">{actionListItem.message}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleScheduleApprove(targetId)}
                                        disabled={actionLoading === targetId}
                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors disabled:bg-gray-400"
                                    >
                                        {actionLoading === targetId ? '처리중...' : '승인'}
                                    </button>
                                    <button
                                        onClick={() => handleScheduleReject(targetId)}
                                        disabled={actionLoading === targetId}
                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors disabled:bg-gray-400"
                                    >
                                        거절
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
