import { useState } from 'react';
import { regularShiftApi } from '../../api/storeApi';
import { DayOfWeek, DAY_OF_WEEK_LABELS } from '../../types/store';
import { Worker } from '../../types/worker';

interface RegularShiftModalProps {
    storeId: string;
    workers: Worker[];
    onClose: () => void;
    onCreated: () => void;
}

const DAYS_OF_WEEK: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export const RegularShiftModal = ({ storeId, workers, onClose, onCreated }: RegularShiftModalProps) => {
    const [workerId, setWorkerId] = useState('');
    const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('MONDAY');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('18:00');
    const [shiftName, setShiftName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!workerId) {
            alert('담당 알바생을 선택해주세요.');
            return;
        }

        try {
            setLoading(true);
            await regularShiftApi.createRegularShift(storeId, {
                workerId,
                dayOfWeek,
                startTime,
                endTime,
                shiftName: shiftName || undefined,
            });
            onCreated();
        } catch (error) {
            console.error('Failed to create shift:', error);
            alert('고정 근무 생성에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">고정 근무 추가</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 담당 알바 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            담당 알바생 *
                        </label>
                        <select
                            value={workerId}
                            onChange={(e) => setWorkerId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">선택해주세요</option>
                            {workers.map(worker => (
                                <option key={worker.id} value={worker.id}>
                                    {worker.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 요일 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            요일 *
                        </label>
                        <select
                            value={dayOfWeek}
                            onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {DAYS_OF_WEEK.map(day => (
                                <option key={day} value={day}>
                                    {DAY_OF_WEEK_LABELS[day]}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 시작/종료 시간 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                시작 시간 *
                            </label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                종료 시간 *
                            </label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    {/* 근무 이름 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            근무 이름 (선택)
                        </label>
                        <input
                            type="text"
                            value={shiftName}
                            onChange={(e) => setShiftName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="예: 오전 근무, 마감 근무"
                        />
                    </div>

                    {/* 버튼 */}
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                        >
                            {loading ? '저장 중...' : '저장'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
