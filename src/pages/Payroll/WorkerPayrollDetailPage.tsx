import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { WorkerPayrollDailyTable } from './WorkerPayrollDailyTable';
import apiClient from '../../lib/apiClient';
import { WorkerPayrollDetail } from '../../types/payroll';

export const WorkerPayrollDetailPage = () => {
    const { workerId } = useParams<{ workerId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [detail, setDetail] = useState<WorkerPayrollDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // query string에서 year, month 가져오기 (기본값: 현재)
    const today = new Date();
    const year = Number(searchParams.get('year')) || today.getFullYear();
    const month = Number(searchParams.get('month')) || today.getMonth() + 1;

    useEffect(() => {
        const fetchDetail = async () => {
            if (!workerId) return;

            try {
                setLoading(true);
                const response = await apiClient.get<WorkerPayrollDetail>(
                    `/payroll/workers/${workerId}/monthly`,
                    {
                        params: { year, month },
                    }
                );
                setDetail(response.data);
            } catch (error) {
                console.error('Failed to fetch payroll detail:', error);
                alert('급여 상세 정보를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [workerId, year, month]);

    const formatWorkTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}시간 ${mins}분`;
    };

    const formatAmount = (amount: number) => {
        return amount.toLocaleString() + '원';
    };

    if (loading) {
        return (
            <PageContainer title="급여 상세">
                <div className="text-center py-12">Loading...</div>
            </PageContainer>
        );
    }

    if (!detail) {
        return (
            <PageContainer title="급여 상세">
                <div className="text-center py-12 text-gray-500">
                    급여 정보를 찾을 수 없습니다.
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer title="급여 상세">
            <div className="mb-6">
                <button
                    onClick={() => navigate('/payroll')}
                    className="text-blue-600 hover:text-blue-800 mb-4"
                >
                    ← 목록으로 돌아가기
                </button>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4">{detail.workerName}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm text-gray-500">기간</label>
                            <p className="text-lg font-medium">
                                {detail.year}년 {detail.month}월
                            </p>
                        </div>
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
                            <p className="text-xl font-bold text-blue-600">
                                {formatAmount(detail.totalAmount)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">일자별 급여 내역</h3>
                <WorkerPayrollDailyTable items={detail.dailyDetails} />
            </div>
        </PageContainer>
    );
};
