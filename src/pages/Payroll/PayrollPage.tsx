import { useState, useEffect } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { PayrollFilterBar } from './PayrollFilterBar';
import { PayrollSummaryTable } from './PayrollSummaryTable';
import apiClient from '../../lib/apiClient';
import { PayrollFilter, PayrollSummary } from '../../types/payroll';
import { Worker } from '../../types/worker';

export const PayrollPage = () => {
    const [payrollData, setPayrollData] = useState<PayrollSummary[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);

    // 초기 필터: 현재 연/월
    const getInitialFilter = (): PayrollFilter => {
        const today = new Date();
        return {
            year: today.getFullYear(),
            month: today.getMonth() + 1,
        };
    };

    const [filter, setFilter] = useState<PayrollFilter>(getInitialFilter());

    const fetchPayrollData = async () => {
        try {
            setLoading(true);
            const params: any = {
                year: filter.year,
                month: filter.month,
            };

            if (filter.workerId) {
                params.workerId = filter.workerId;
            }

            const response = await apiClient.get<PayrollSummary[]>(
                '/payroll/owner/monthly',
                { params }
            );
            setPayrollData(response.data);
        } catch (error) {
            console.error('Failed to fetch payroll data:', error);
            alert('급여 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkers = async () => {
        try {
            const response = await apiClient.get<Worker[]>('/workers');
            setWorkers(response.data);
        } catch (error) {
            console.error('Failed to fetch workers:', error);
        }
    };

    useEffect(() => {
        fetchWorkers();
    }, []);

    useEffect(() => {
        fetchPayrollData();
    }, [filter]);

    return (
        <PageContainer title="월별 급여 요약">
            <div className="mb-4">
                <p className="text-gray-600">
                    {filter.year}년 {filter.month}월 급여 현황
                </p>
            </div>

            <PayrollFilterBar
                filter={filter}
                onChange={setFilter}
                workers={workers}
            />

            <PayrollSummaryTable
                items={payrollData}
                isLoading={loading}
                year={filter.year}
                month={filter.month}
            />
        </PageContainer>
    );
};
