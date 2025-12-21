// src/pages/Workers/WageContractForm.tsx
import { useState, FormEvent } from 'react';
import apiClient from '../../lib/apiClient';
import { WageContractCreateRequest } from '../../types/worker';

interface WageContractFormProps {
    workerId: string;
    onCreated: () => void;
}

export const WageContractForm = ({
    workerId,
    onCreated,
}: WageContractFormProps) => {
    const [formData, setFormData] = useState<WageContractCreateRequest>({
        hourlyWage: 0,
        startDate: new Date().toISOString().split('T')[0],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.hourlyWage <= 0) {
            setError('시급을 입력해주세요.');
            return;
        }
        if (!formData.startDate) {
            setError('적용 시작일을 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            await apiClient.post(`/workers/${workerId}/wage-contracts`, formData);

            // 폼 초기화
            setFormData({
                hourlyWage: 0,
                startDate: new Date().toISOString().split('T')[0],
            });

            onCreated();
        } catch (error) {
            console.error('Failed to create wage contract:', error);
            setError('시급 계약 추가에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        시급 (원) *
                    </label>
                    <input
                        type="number"
                        value={formData.hourlyWage || ''}
                        onChange={(e) =>
                            setFormData({ ...formData, hourlyWage: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                        placeholder="10000"
                        disabled={loading}
                        min="0"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        적용 시작일 *
                    </label>
                    <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                            setFormData({ ...formData, startDate: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                        disabled={loading}
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors disabled:bg-gray-400"
                    disabled={loading}
                >
                    {loading ? '추가 중...' : '시급 계약 추가'}
                </button>
            </div>
        </form>
    );
};
