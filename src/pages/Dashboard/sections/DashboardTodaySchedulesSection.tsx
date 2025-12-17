import React, { useEffect, useState } from 'react';
import { dashboardApi, TodayScheduleItem } from '../../../api/dashboardApi';
import { Loading } from '../../../components/common/Loading';
import { ErrorState } from '../../../components/common/ErrorState';
import { EmptyState } from '../../../components/common/EmptyState';
import { useNavigate } from 'react-router-dom';

interface Props {
    date: string;
}

export const DashboardTodaySchedulesSection: React.FC<Props> = ({ date }) => {
    const [schedules, setSchedules] = useState<TodayScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            // Assuming getTodaySchedules returns { data: { items: [] } } or similar structure
            // If API returns list directly, adjust accordingly. 
            // Based on previous patterns, let's assume standard response wrapper or direct list.
            // For now, let's assume it matches TodayScheduleListResponse structure from API definition.
            const response = await dashboardApi.getTodaySchedules(date);
            // Adjust based on actual API response structure. 
            // If backend is not ready, we might need safe navigation.
            // Assuming response.data is TodayScheduleListResponse or List<Item>
            // Let's handle both for robustness during dev.
            const items = response.data?.items || (Array.isArray(response.data) ? response.data : []);
            setSchedules(items);
        } catch (err) {
            console.error('Failed to fetch today schedules', err);
            setError('스케줄을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [date]);

    const handleItemClick = (scheduleId: string) => {
        // Navigate to schedule detail or list
        // Since we don't have deeply nested schedule detail page in main router yet?
        // Let's use /schedule or if detail page exists /schedule/:id
        // Router has /schedule. Let's redirect there for now or log TODO.
        // User prompt: "라우트가 정해져 있으면 그걸 사용, 없으면 console.warn + TODO 주석"
        // Router has /schedule, but maybe not detail.
        console.warn('TODO: Navigate to schedule detail', scheduleId);
        navigate('/schedule');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ONGOING':
                return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">근무중</span>;
            case 'COMPLETED':
                return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">종료</span>;
            case 'LATE':
                return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">지각</span>;
            default: // SCHEDULED
                return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">예정</span>;
        }
    };

    const formatTime = (timeStr: string) => {
        // Ensure HH:mm format
        if (!timeStr) return '';
        return timeStr.substring(0, 5);
    };

    if (loading) return (
        <div className="bg-white rounded-lg shadow p-6 h-64 flex items-center justify-center">
            <Loading message="스케줄 로딩중..." />
        </div>
    );

    if (error) return (
        <div className="bg-white rounded-lg shadow p-6 h-64">
            <ErrorState message={error} onRetry={fetchData} />
        </div>
    );

    return (
        <div className="bg-white rounded-lg shadow flex flex-col h-full max-h-[500px]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">오늘의 스케줄 ({schedules.length}건)</h2>
                {/* Optional: Add Link/Button to view full schedule */}
            </div>

            <div className="overflow-y-auto flex-1 p-2">
                {schedules.length === 0 ? (
                    <EmptyState
                        message="오늘 예정된 근무가 없어요"
                        description="새로운 스케줄을 등록해보세요."
                        className="h-full border-none bg-transparent"
                    />
                ) : (
                    <div className="space-y-2">
                        {schedules.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => handleItemClick(item.id)}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-center min-w-[60px] text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                        <span className="text-sm font-bold">{formatTime(item.startTime)}</span>
                                        <span className="text-xs text-gray-400">~{formatTime(item.endTime)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{item.workerName}</span>
                                            {getStatusBadge(item.status)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {item.flags?.includes('LATE') && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">
                                            지각
                                        </span>
                                    )}
                                    {item.flags?.includes('NEEDS_CHECKIN') && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-600 border border-orange-200">
                                            출근미체크
                                        </span>
                                    )}
                                    {item.flags?.includes('NEEDS_CHECKOUT') && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-600 border border-orange-200">
                                            퇴근미체크
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
