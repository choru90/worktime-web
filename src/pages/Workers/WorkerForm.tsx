import { useState, FormEvent } from 'react';
import { WorkerCreateRequest, WorkerUpdateRequest } from '../../types/worker';
import { Store } from '../../types/store';

interface WorkerFormProps {
    mode: 'create' | 'edit';
    initialValues

    ?: {
        name: string;
        phoneNumber: string;
        storeId?: string;
    };
    storeList?: Store[];
    onSubmit: (values: WorkerCreateRequest | WorkerUpdateRequest) => Promise<void>;
    onCancel: () => void;
}

export const WorkerForm = ({
    mode,
    initialValues = { name: '', phoneNumber: '', storeId: '' },
    storeList = [],
    onSubmit,
    onCancel,
}: WorkerFormProps) => {
    const [formData, setFormData] = useState(initialValues);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        // 간단한 validation
        if (!formData.name.trim()) {
            setError('이름을 입력해주세요.');
            return;
        }
        if (!formData.phoneNumber.trim()) {
            setError('연락처를 입력해주세요.');
            return;
        }

        const submitData: WorkerCreateRequest | WorkerUpdateRequest = {
            name: formData.name,
            phoneNumber: formData.phoneNumber,
            ...(formData.storeId ? { storeId: formData.storeId } : {}),
        };

        try {
            setLoading(true);
            await onSubmit(submitData);
        } catch (err: any) {
            setError(err.message || '저장에 실패했습니다.');
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

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    이름 *
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    placeholder="홍길동"
                    disabled={loading}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    연락처 *
                </label>
                <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                        setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    placeholder="01012345678"
                    disabled={loading}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    소속 영업장
                </label>
                <select
                    value={formData.storeId || ''}
                    onChange={(e) =>
                        setFormData({ ...formData, storeId: e.target.value || undefined })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    disabled={loading}
                >
                    <option value="">전체 영업장 (미지정)</option>
                    {storeList.map((store) => (
                        <option key={store.id} value={store.id}>
                            {store.name}
                        </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                    미지정 시 모든 영업장에서 근무 가능합니다.
                </p>
            </div>

            <div className="flex gap-2 justify-end pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={loading}
                >
                    취소
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors disabled:bg-gray-400"
                    disabled={loading}
                >
                    {loading ? '저장 중...' : mode === 'create' ? '추가' : '수정'}
                </button>
            </div>
        </form>
    );
};
