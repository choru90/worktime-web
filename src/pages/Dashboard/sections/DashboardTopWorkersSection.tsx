import React, { useEffect, useState } from 'react';
import { dashboardApi, TopWorkerItem, TopWorkersParams } from '../../../api/dashboardApi';
import { Loading } from '../../../components/common/Loading';
import { ErrorState } from '../../../components/common/ErrorState';
import { EmptyState } from '../../../components/common/EmptyState';

interface Props {
    date: string;
}

type SortOption = 'WAGE_DESC' | 'MINUTES_DESC' | 'SHIFTS_DESC';

export const DashboardTopWorkersSection: React.FC<Props> = ({ date }) => {
    const [items, setItems] = useState<TopWorkerItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sort, setSort] = useState<SortOption>('WAGE_DESC');
    const [dateRangeText, setDateRangeText] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Calculate date range: date (to) and date - 6 days (from)
            const toDate = new Date(date);
            const fromDate = new Date(date);
            fromDate.setDate(toDate.getDate() - 6);

            const toStr = date; // Already YYYY-MM-DD
            const fromStr = fromDate.toISOString().split('T')[0];

            // Update UI text for range
            setDateRangeText(`${fromStr.substring(5).replace('-', '/')} ~ ${toStr.substring(5).replace('-', '/')}`);

            const params: TopWorkersParams = {
                from: fromStr,
                to: toStr,
                limit: 5,
                sort: sort
            };

            const response = await dashboardApi.getTopWorkers(params);

            const data = response.data;
            const fetchedItems = data.items || (Array.isArray(data) ? data : []);
            setItems(fetchedItems);

            // If API returns range, use that for accuracy
            if (data.range) {
                const rangeFrom = data.range.from.substring(5).replace('-', '/');
                const rangeTo = data.range.to.substring(5).replace('-', '/');
                setDateRangeText(`${rangeFrom} ~ ${rangeTo}`);
            }

        } catch (err) {
            console.error('Failed to fetch top workers', err);
            setError('데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [date, sort]);

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}시간 ${m}분`;
    };

    const formatWage = (amount: number) => {
        return amount.toLocaleString() + '원';
    };

    return (
        <div className="bg-white rounded-lg shadow flex flex-col h-full">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">최근 7일 TOP 알바생</h2>
                    <p className="text-xs text-gray-400 mt-1">{dateRangeText}</p>
                </div>

                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1 pl-2 pr-8"
                >
                    <option value="WAGE_DESC">급여순</option>
                    <option value="MINUTES_DESC">근무시간순</option>
                    <option value="SHIFTS_DESC">근무횟수순</option>
                </select>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                    <div className="h-40 flex items-center justify-center">
                        <Loading message="랭킹 집계중..." />
                    </div>
                ) : error ? (
                    <div className="h-40">
                        <ErrorState message={error} onRetry={fetchData} />
                    </div>
                ) : items.length === 0 ? (
                    <div className="h-40">
                        <EmptyState
                            message="집계된 데이터가 없어요"
                            description="기간 내 완료된 근무 기록이 없습니다."
                            className="bg-transparent border-none h-full"
                        />
                    </div>
                ) : (
                    <div className="space-y-2">
                        {items.map((item) => (
                            <div
                                key={item.worker.workerId}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 bg-white border border-transparent hover:border-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm
                                        ${item.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                                            item.rank === 2 ? 'bg-gray-100 text-gray-700' :
                                                item.rank === 3 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'}
                                    `}>
                                        {item.rank}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">{item.worker.name}</span>
                                        <span className="text-xs text-gray-400">
                                            {item.stats.completedShifts}회 근무
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {sort === 'WAGE_DESC' ? (
                                        <>
                                            <div className="font-bold text-gray-900">{formatWage(item.stats.accruedWage)}</div>
                                            <div className="text-xs text-gray-400">{formatDuration(item.stats.totalWorkMinutes)}</div>
                                        </>
                                    ) : sort === 'MINUTES_DESC' ? (
                                        <>
                                            <div className="font-bold text-gray-900">{formatDuration(item.stats.totalWorkMinutes)}</div>
                                            <div className="text-xs text-gray-400">{formatWage(item.stats.accruedWage)}</div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="font-bold text-gray-900">{item.stats.completedShifts}회</div>
                                            <div className="text-xs text-gray-400">{formatDuration(item.stats.totalWorkMinutes)}</div>
                                        </>
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
