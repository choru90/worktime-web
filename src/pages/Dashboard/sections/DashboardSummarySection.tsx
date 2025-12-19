import React, { useEffect, useState } from 'react';
import { dashboardApi, DashboardSummaryResponse } from '../../../api/dashboardApi';
import { Loading } from '../../../components/common/Loading';
import { ErrorState } from '../../../components/common/ErrorState';

interface Props {
    date: string;
}

export const DashboardSummarySection: React.FC<Props> = ({ date }) => {
    const [data, setData] = useState<DashboardSummaryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await dashboardApi.getSummary(date);
            setData(response.data);
        } catch (err) {
            console.error('Failed to fetch dashboard summary', err);
            setError('데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [date]);

    // Scroll handlers
    const scrollToSchedules = () => {
        document.getElementById('today-schedules')?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToActions = () => {
        document.getElementById('dashboard-actions')?.scrollIntoView({ behavior: 'smooth' });
    };

    if (loading) return <Loading className="h-32" message="요약 정보를 불러오는 중..." />;
    if (error) return <ErrorState message={error} onRetry={fetchData} className="h-32" />;
    if (!data) return null;

    const { today, month, actionNeededCount } = data;

    // Time formatting: 150 min -> 2시간 30분
    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h === 0 && m === 0) return '0시간';
        return `${h > 0 ? `${h}시간 ` : ''}${m > 0 ? `${m}분` : ''}`.trim();
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Today Status */}
            <div
                onClick={scrollToSchedules}
                className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            >
                <h3 className="text-gray-500 text-sm font-medium mb-2">오늘 근무</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">{today.scheduledCount}명</span>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex gap-2">
                    <span className="text-emerald-600">출근 {today.checkedInCount}</span>
                    <span className="text-red-500">미출근 {today.notCheckedInCount}</span>
                </div>
            </div>

            {/* Card 2: Month Wage */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-gray-500 text-sm font-medium mb-2">이번 달 인건비</h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">
                        {month.accruedWage.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-400">원</span>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                    누적 합계 (예상 포함 아님)
                </div>
            </div>

            {/* Card 3: Today Work Hours */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-gray-500 text-sm font-medium mb-2">오늘 누적 근무시간</h3>
                <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-gray-900">
                        {formatDuration(today.totalWorkMinutes)}
                    </span>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                    종료된 근무 기준
                </div>
            </div>

            {/* Card 4: Action Needed */}
            <div
                onClick={scrollToActions}
                className={`p-5 rounded-lg shadow-sm border cursor-pointer transition-shadow hover:shadow-md ${actionNeededCount > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'
                    }`}
            >
                <h3 className={`${actionNeededCount > 0 ? 'text-red-600' : 'text-gray-500'} text-sm font-medium mb-2`}>
                    확인 필요
                </h3>
                <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold ${actionNeededCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {actionNeededCount}
                    </span>
                    <span className={`text-sm ${actionNeededCount > 0 ? 'text-red-400' : 'text-gray-400'}`}>건</span>
                </div>
                <div className={`mt-2 text-xs ${actionNeededCount > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {actionNeededCount > 0 ? '지금 바로 확인해보세요' : '모두 정상입니다'}
                </div>
            </div>
        </div>
    );
};
