// src/pages/Workers/WageContractList.tsx
import { WageContract } from '../../types/worker';

interface WageContractListProps {
    contracts: WageContract[];
}

export const WageContractList = ({ contracts }: WageContractListProps) => {
    if (contracts.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                등록된 시급 계약이 없습니다.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            시급
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            적용 시작일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            적용 종료일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            상태
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {contracts.map((contract) => (
                        <tr key={contract.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                    {contract.hourlyWage.toLocaleString()}원
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                    {contract.effectiveFrom}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                    {contract.effectiveTo || '-'}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {contract.isCurrent && (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                        현재 시급
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
