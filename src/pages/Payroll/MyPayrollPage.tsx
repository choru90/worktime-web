import { useState, useEffect } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { WorkerPayrollDailyTable } from './WorkerPayrollDailyTable';
import apiClient from '../../lib/apiClient';
import { WorkerPayrollDetail } from '../../types/payroll';
import { useAuth } from '../../hooks/useAuth';

export const MyPayrollPage = () => {
    const { user } = useAuth();
    const [detail, setDetail] = useState<WorkerPayrollDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // 연/월 필터
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    useEffect(() => {
        const fetchMyPayroll = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get<WorkerPayrollDetail>(
                    '/payroll/my/monthly',
                    {
                        params: { year, month },
                    }
                );
                setDetail(response.data);
            } catch (error) {
                console.error('Failed to fetch my payroll:', error);
                alert('급여 정보를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        if (user?.role === 'WORKER') {
            fetchMyPayroll();
        }
    }, [year, month, user]);

    const formatWorkTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}시간 ${mins}분`;
    };

    const formatAmount = (amount: number) => {
        return amount.toLocaleString() + '원';
    };

    if (user?.role !== 'WORKER') {
        return (
            <PageContainer title="내 급여">
                <div className="text-center py-12 text-gray-500">
                    알바생 전용 페이지입니다.
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer title="내 급여">
            <div className="mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                연도
                            </label>
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}년
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                월
                            </label>
                            <select
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                            >
                                {months.map((m) => (
                                    <option key={m} value={m}>
                                        {m}월
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : detail ? (
                <>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                        <h3 className="text-xl font-bold mb-4">
                            {year}년 {month}월 급여
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm text-gray-500">총 근무 시간</label>
                                <p className="text-lg font-medium">
                                    {formatWorkTime(detail.totalWorkMinutes)}
                                </p>
                                <p className="text-xs text-gray-500">
                                    ({detail.totalWorkHours.toFixed(1)}시간)
                                </p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">총 급여</label>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatAmount(detail.totalAmount)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">일자별 급여 내역</h3>
                        <WorkerPayrollDailyTable items={detail.dailyDetails} />
                    </div>
                </>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    해당 기간의 급여 데이터가 없습니다.
                </div>
            )}
        </PageContainer>
    );
};
