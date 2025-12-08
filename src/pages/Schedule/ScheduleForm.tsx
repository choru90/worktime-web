import { useState, FormEvent } from 'react';
import apiClient from '../../lib/apiClient';
import { Worker } from '../../types/worker';
import { ScheduleCreateRequest } from '../../types/schedule';

interface ScheduleFormProps {
    workers: Worker[];
    onSubmit: () => void;
    onCancel: () => void;
}

export const ScheduleForm = ({
    workers,
    onSubmit,
    onCancel,
}: ScheduleFormProps) => {
    const [formData, setFormData] = useState<ScheduleCreateRequest>({
        workerId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '18:00',
        memo: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.workerId) {
            setError('알바생을 선택해주세요.');
            return;
        }
        if (!formData.date) {
            setError('날짜를 입력해주세요.');
            return;
        }
        if (!formData.startTime || !formData.endTime) {
            setError('시간을 입력해주세요.');
            return;
        }
        if (formData.startTime >= formData.endTime) {
            setError('종료 시간은 시작 시간보다 늦어야 합니다.');
            return;
        }

        try {
            setLoading(true);
            await apiClient.post('/schedules/owner-requests', formData);

            // 폼 초기화
            setFormData({
                workerId: '',
                date: new Date().toISOString().split('T')[0],
                startTime: '09:00',
                endTime: '18:00',
                memo: '',
            });

            onSubmit();
        } catch (err: any) {
            console.error('Failed to create schedule:', err);
            setError(
                err.response?.data?.message || '스케줄 제안 생성에 실패했습니다.'
            );
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
                    알바생 *
                </label>
                <select
                    value={formData.workerId}
                    onChange={(e) =>
                        setFormData({ ...formData, workerId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={loading}
                    required
                >
                    <option value="">선택하세요</option>
                    {workers
                        .filter((w) => w.active)
                        .map((worker) => (
                            <option key={worker.id} value={worker.id}>
                                {worker.name}
                            </option>
                        ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    날짜 *
                </label>
                <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={loading}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        시작 시간 *
                    </label>
                    <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) =>
                            setFormData({ ...formData, startTime: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        disabled={loading}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        종료 시간 *
                    </label>
                    <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) =>
                            setFormData({ ...formData, endTime: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        disabled={loading}
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    메모
                </label>
                <textarea
                    value={formData.memo}
                    onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    rows={3}
                    placeholder="추가 메모 (선택사항)"
                    disabled={loading}
                />
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
                    {loading ? '생성 중...' : '스케줄 제안'}
                </button>
            </div>
        </form>
    );
};
