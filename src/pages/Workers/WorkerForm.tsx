// src/pages/Workers/WorkerForm.tsx
import { useState, FormEvent } from 'react';
import { WorkerCreateRequest, WorkerUpdateRequest } from '../../types/worker';

interface WorkerFormProps {
    mode: 'create' | 'edit';
    initialValues?: {
        name: string;
        phoneNumber: string;
        active: boolean;
    };
    onSubmit: (values: WorkerCreateRequest | WorkerUpdateRequest) => Promise<void>;
    onCancel: () => void;
}

export const WorkerForm = ({
    mode,
    initialValues = { name: '', phoneNumber: '', active: true },
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

        try {
            setLoading(true);
            await onSubmit(formData);
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="010-1234-5678"
                    disabled={loading}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    상태 *
                </label>
                <select
                    value={formData.active ? 'true' : 'false'}
                    onChange={(e) =>
                        setFormData({ ...formData, active: e.target.value === 'true' })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={loading}
                >
                    <option value="true">ACTIVE</option>
                    <option value="false">INACTIVE</option>
                </select>
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
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-blue-300"
                    disabled={loading}
                >
                    {loading ? '저장 중...' : mode === 'create' ? '추가' : '수정'}
                </button>
            </div>
        </form>
    );
};
