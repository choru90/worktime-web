// src/pages/Workers/WageContractList.tsx
import { useState } from 'react';
import { WageContract } from '../../types/worker';
import apiClient from '../../lib/apiClient';

interface WageContractListProps {
    contracts: WageContract[];
    workerId: string;
    onContractUpdated?: () => void;
}

export const WageContractList = ({ contracts, workerId, onContractUpdated }: WageContractListProps) => {
    const [showTerminateModal, setShowTerminateModal] = useState(false);
    const [selectedContract, setSelectedContract] = useState<WageContract | null>(null);
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTerminateClick = (contract: WageContract) => {
        setSelectedContract(contract);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        setEndDate(yesterday.toISOString().split('T')[0]);
        setShowTerminateModal(true);
    };

    const handleTerminateSubmit = async () => {
        if (!selectedContract) return;

        try {
            setLoading(true);
            await apiClient.patch(
                `/workers/${workerId}/wage-contracts/${selectedContract.id}/terminate`,
                null,
                { params: { endDate } }
            );
            setShowTerminateModal(false);
            onContractUpdated?.();
        } catch (error: any) {
            console.error('Failed to terminate contract:', error);
            const message = error.response?.data?.message || '계약 종료에 실패했습니다.';
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    if (contracts.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                등록된 시급 계약이 없습니다.
            </div>
        );
    }

    return (
        <>
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                작업
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
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {contract.isCurrent && !contract.effectiveTo && (
                                        <button
                                            onClick={() => handleTerminateClick(contract)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            종료
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Terminate Modal */}
            {showTerminateModal && selectedContract && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">시급 계약 종료</h3>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                현재 시급: <strong>{selectedContract.hourlyWage.toLocaleString()}원</strong>
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                                시작일: {selectedContract.effectiveFrom}
                            </p>

                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                종료일
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={selectedContract.effectiveFrom}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                종료일은 시작일 이후여야 합니다
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowTerminateModal(false)}
                                disabled={loading}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleTerminateSubmit}
                                disabled={loading || !endDate}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
                            >
                                {loading ? '처리 중...' : '종료'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
