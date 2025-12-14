import { useNavigate } from 'react-router-dom';
import { PayrollSummary } from '../../types/payroll';

interface PayrollSummaryTableProps {
    items: PayrollSummary[];
    isLoading?: boolean;
    year: number;
    month: number;
}

export const PayrollSummaryTable = ({
    items,
    isLoading,
    year,
    month,
}: PayrollSummaryTableProps) => {
    const navigate = useNavigate();

    const formatWorkTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}시간 ${mins}분`;
    };

    const formatAmount = (amount: number) => {
        return amount.toLocaleString() + '원';
    };

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <div className="text-xl text-gray-500">Loading...</div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                해당 기간의 급여 데이터가 없습니다.
            </div>
        );
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);


    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            알바생
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            총 근무 시간
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            총 급여
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            액션
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {items.map((item) => (
                        <tr key={item.workerId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                    {item.workerName}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                    {formatWorkTime(item.totalWorkMinutes || 0)}
                                </div>
                                <div className="text-xs text-gray-500">
                                    ({(item.totalWorkHours || 0).toFixed(1)}시간)
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">
                                    {formatAmount(item.totalAmount || 0)}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                    onClick={() =>
                                        navigate(
                                            `/payroll/workers/${item.workerId}?year=${year}&month=${month}`
                                        )
                                    }
                                    className="text-blue-600 hover:text-blue-900"
                                >
                                    상세보기
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="bg-gray-50">
                    <tr>
                        <td className="px-6 py-3 text-sm font-bold text-gray-900">
                            합계
                        </td>
                        <td className="px-6 py-3"></td>
                        <td className="px-6 py-3 text-sm font-bold text-gray-900">
                            {formatAmount(totalAmount)}
                        </td>
                        <td className="px-6 py-3"></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};
