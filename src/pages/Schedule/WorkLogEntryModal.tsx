import { useState, FormEvent } from 'react';
import apiClient from '../../lib/apiClient';

interface WorkLogEntryModalProps {
    scheduleId: string;
    scheduledDate: string;  // ISO date string
    scheduledStartTime: string;  // HH:mm
    scheduledEndTime: string;    // HH:mm
    onSubmit: () => void;
    onCancel: () => void;
}

export const WorkLogEntryModal = ({
    scheduleId,
    scheduledDate,
    scheduledStartTime,
    scheduledEndTime,
    onSubmit,
    onCancel,
}: WorkLogEntryModalProps) => {
    const [clockInTime, setClockInTime] = useState(scheduledStartTime);
    const [clockOutTime, setClockOutTime] = useState(scheduledEndTime);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!clockInTime || !clockOutTime) {
            setError('출퇴근 시간을 모두 입력해주세요.');
            return;
        }
        if (clockInTime >= clockOutTime) {
            setError('퇴근 시간은 출근 시간보다 늦어야 합니다.');
            return;
        }

        try {
            setLoading(true);

            // ISO 8601 형식으로 변환
            const clockInAt = `${scheduledDate}T${clockInTime}:00+09:00`;
            const clockOutAt = `${scheduledDate}T${clockOutTime}:00+09:00`;

            await apiClient.post(`/worker/schedules/${scheduleId}/worklog`, {
                clockInAt,
                clockOutAt,
            });

            onSubmit();
        } catch (err: any) {
            console.error('Failed to create worklog:', err);
            setError(
                err.response?.data?.message || '근무 기록 생성에 실패했습니다.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">근무 기록 작성</h3>

                <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
                    <p className="text-blue-700">
                        <span className="font-semibold">스케줄 예정 시간:</span>{' '}
                        {scheduledStartTime} ~ {scheduledEndTime}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                실제 출근 시간 *
                            </label>
                            <input
                                type="time"
                                value={clockInTime}
                                onChange={(e) => setClockInTime(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                실제 퇴근 시간 *
                            </label>
                            <input
                                type="time"
                                value={clockOutTime}
                                onChange={(e) => setClockOutTime(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                disabled={loading}
                                required
                            />
                        </div>
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
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:bg-gray-400"
                            disabled={loading}
                        >
                            {loading ? '저장 중...' : '근무 기록 저장'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
