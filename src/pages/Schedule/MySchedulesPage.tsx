import { useState, useEffect } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import apiClient from '../../lib/apiClient';

interface Schedule {
    id: string;
    workerName: string;
    workerId: string;
    startAtUtc: string; // ISO 8601 DateTime
    endAtUtc: string;   // ISO 8601 DateTime
    timezone: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

interface ScheduleListResponse {
    schedules: Schedule[];
    totalCount: number;
}

export const MySchedulesPage = () => {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const today = new Date();
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            const twoMonthsLater = new Date(today);
            twoMonthsLater.setMonth(today.getMonth() + 2);

            const response = await apiClient.get<ScheduleListResponse>('/worker/schedules', {
                params: {
                    from: monthAgo.toISOString(),
                    to: twoMonthsLater.toISOString(),
                },
            });
            setSchedules(response.data.schedules);
        } catch (error) {
            console.error('Failed to fetch schedules:', error);
            alert('스케줄 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    const handleConfirm = async (scheduleId: string) => {
        if (!window.confirm('이 스케줄을 수락하시겠습니까?')) return;

        try {
            setActionLoading(scheduleId);
            await apiClient.post(`/worker/schedules/${scheduleId}/confirm`);
            await fetchSchedules();
            alert('스케줄을 수락했습니다.');
        } catch (error: any) {
            console.error('Failed to confirm schedule:', error);
            const message = error.response?.data?.message || '스케줄 수락에 실패했습니다.';
            alert(message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (scheduleId: string) => {
        if (!window.confirm('이 스케줄을 거절하시겠습니까?')) return;

        try {
            setActionLoading(scheduleId);
            await apiClient.post(`/worker/schedules/${scheduleId}/reject`);
            await fetchSchedules();
            alert('스케줄을 거절했습니다.');
        } catch (error: any) {
            console.error('Failed to reject schedule:', error);
            const message = error.response?.data?.message || '스케줄 거절에 실패했습니다.';
            alert(message);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredSchedules = schedules.filter((schedule) => {
        if (filter === 'pending') {
            return schedule.status === 'PROPOSED_BY_OWNER' || schedule.status === 'REQUESTED_BY_WORKER';
        }
        if (filter === 'confirmed') {
            return schedule.status === 'CONFIRMED';
        }
        return true;
    });

    const formatDate = (utcDateStr: string) => {
        const date = new Date(utcDateStr);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short',
        });
    };

    const getTimeFromUtc = (utcDateStr: string) => {
        const date = new Date(utcDateStr);
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PROPOSED_BY_OWNER':
                return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">제안받음 ⏳</span>;
            case 'REQUESTED_BY_WORKER':
                return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">요청중</span>;
            case 'CONFIRMED':
                return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">확정</span>;
            case 'REJECTED':
                return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">거절됨</span>;
            case 'CANCELLED':
                return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">취소됨</span>;
            default:
                return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    if (loading) {
        return (
            <PageContainer title="내 스케줄">
                <div className="text-center py-12">Loading...</div>
            </PageContainer>
        );
    }

    return (
        <PageContainer title="내 스케줄">
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    전체
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'pending'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    대기중
                </button>
                <button
                    onClick={() => setFilter('confirmed')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'confirmed'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    확정됨
                </button>
            </div>

            {/* Schedules List */}
            {filteredSchedules.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <p className="text-gray-500">스케줄이 없습니다.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredSchedules.map((schedule) => (
                        <div
                            key={schedule.id}
                            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-semibold">{formatDate(schedule.startAtUtc)}</h3>
                                        {getStatusBadge(schedule.status)}
                                    </div>
                                    <p className="text-gray-600">
                                        {getTimeFromUtc(schedule.startAtUtc)} - {getTimeFromUtc(schedule.endAtUtc)}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                {schedule.status === 'PROPOSED_BY_OWNER' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleConfirm(schedule.id)}
                                            disabled={actionLoading === schedule.id}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-400"
                                        >
                                            {actionLoading === schedule.id ? '처리중...' : '수락'}
                                        </button>
                                        <button
                                            onClick={() => handleReject(schedule.id)}
                                            disabled={actionLoading === schedule.id}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:bg-gray-400"
                                        >
                                            거절
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PageContainer>
    );
};
