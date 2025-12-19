import React, { useEffect, useState } from 'react';
import { dashboardApi, ActionItem } from '../../../api/dashboardApi';
import { Loading } from '../../../components/common/Loading';
import { ErrorState } from '../../../components/common/ErrorState';
import { useNavigate } from 'react-router-dom';

interface Props {
    date: string;
}

type FilterType = 'ALL' | 'PENDING' | 'CHECKIN' | 'CHECKOUT';

export const DashboardActionsSection: React.FC<Props> = ({ date }) => {
    const [actions, setActions] = useState<ActionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterType>('ALL');
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            let types: string[] | undefined;
            if (filter === 'PENDING') types = ['PENDING_SCHEDULE_APPROVAL'];
            else if (filter === 'CHECKIN') types = ['MISSING_CHECKIN'];
            else if (filter === 'CHECKOUT') types = ['MISSING_CHECKOUT'];

            const response = await dashboardApi.getActions({
                date,
                limit: 20,
                types
            });
            // Assuming response structure matches ActionListResponse
            const items = response.data?.items || (Array.isArray(response.data) ? response.data : []);
            setActions(items);
        } catch (err) {
            console.error('Failed to fetch dashboard actions', err);
            setError('할 일을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [date, filter]);

    const handleActionClick = (item: ActionItem) => {
        if (item.target.deepLink) {
            navigate(item.target.deepLink);
            return;
        }

        switch (item.target.type) {
            case 'SCHEDULE':
                navigate('/schedule');
                break;
            case 'WORK_LOG':
                // navigate(`/work-log/${item.target.id}`);
                navigate('/owner/attendance'); // Fallback
                break;
            default:
                console.warn('Unknown target type:', item.target.type);
                break;
        }
    };

    const getPriorityBadge = (priority: string) => {
        if (priority === 'HIGH') {
            return <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>;
        }
        return <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>;
    };

    const formatTime = (isoString: string) => {
        // Simple relative time or time format
        try {
            const date = new Date(isoString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

            if (diffHours < 24) return `${diffHours}시간 전`;
            return date.toLocaleDateString();
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow flex flex-col h-full max-h-[600px]">
            <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Action Center</h2>
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                        {actions.length}
                    </span>
                </div>

                {/* Filters */}
                <div className="flex gap-2 text-sm overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${filter === 'ALL' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        전체
                    </button>
                    <button
                        onClick={() => setFilter('PENDING')}
                        className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${filter === 'PENDING' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        승인 대기
                    </button>
                    <button
                        onClick={() => setFilter('CHECKIN')}
                        className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${filter === 'CHECKIN' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                    >
                        출근 미체크
                    </button>
                    <button
                        onClick={() => setFilter('CHECKOUT')}
                        className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${filter === 'CHECKOUT' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                            }`}
                    >
                        퇴근 미체크
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                    <div className="h-40 flex items-center justify-center">
                        <Loading message="할 일을 불러오는 중..." />
                    </div>
                ) : error ? (
                    <div className="h-40">
                        <ErrorState message={error} onRetry={fetchData} />
                    </div>
                ) : actions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <span className="text-4xl mb-3">🎉</span>
                        <h3 className="text-gray-900 font-medium mb-1">처리할 일이 없어요</h3>
                        <p className="text-gray-500 text-sm">모든 업무가 완료되었습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {actions.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => handleActionClick(item)}
                                className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-gray-300 group"
                            >
                                <div className="flex items-start justify-between mb-1">
                                    <div className="flex items-center">
                                        {getPriorityBadge(item.priority)}
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            {item.type.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {formatTime(item.createdAt)}
                                    </span>
                                </div>
                                <h3 className="text-gray-800 font-bold mb-1 group-hover:text-gray-900 transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {item.message}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
