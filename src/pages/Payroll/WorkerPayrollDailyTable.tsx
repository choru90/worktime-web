import { DailyDetail } from '../../types/payroll';

interface WorkerPayrollDailyTableProps {
    items: DailyDetail[];
}

export const WorkerPayrollDailyTable = ({ items }: WorkerPayrollDailyTableProps) => {
    const formatWorkTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}시간 ${mins}분`;
    };

    const formatAmount = (amount: number) => {
        return amount.toLocaleString() + '원';
    };

    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                근무 기록이 없습니다.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            날짜
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            근무 시간
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            시급
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            일급
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{item.date}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                    {formatWorkTime(item.workMinutes)}
                                </div>
                                <div className="text-xs text-gray-500">
                                    ({item.workHours.toFixed(1)}시간)
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                    {formatAmount(item.hourlyWage)}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">
                                    {formatAmount(item.amount)}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
