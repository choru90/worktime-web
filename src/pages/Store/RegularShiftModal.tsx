import { useState } from 'react';
import { regularShiftApi } from '../../api/storeApi';
import { DayOfWeek, DAY_OF_WEEK_SHORT } from '../../types/store';
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
    const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('18:00');
    const [shiftName, setShiftName] = useState('');
    const [loading, setLoading] = useState(false);

    const toggleDay = (day: DayOfWeek) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    const selectAllWeekdays = () => {
        setSelectedDays(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
    };

    const selectAllDays = () => {
        setSelectedDays([...DAYS_OF_WEEK]);
    };

    const clearDays = () => {
        setSelectedDays([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!workerId) {
            alert('담당 알바생을 선택해주세요.');
            return;
        }

        if (selectedDays.length === 0) {
            alert('최소 하나의 요일을 선택해주세요.');
            return;
        }

        try {
            setLoading(true);
            // 선택된 요일별로 각각 고정 근무 생성
            for (const dayOfWeek of selectedDays) {
                await regularShiftApi.createRegularShift(storeId, {
                    workerId,
                    dayOfWeek,
                    startTime,
                    endTime,
                    shiftName: shiftName || undefined,
                });
            }
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

                    {/* 요일 - 체크박스 */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                요일 * ({selectedDays.length}개 선택)
                            </label>
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    onClick={selectAllWeekdays}
                                    className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                    평일
                                </button>
                                <button
                                    type="button"
                                    onClick={selectAllDays}
                                    className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                    전체
                                </button>
                                <button
                                    type="button"
                                    onClick={clearDays}
                                    className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-100 rounded"
                                >
                                    초기화
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {DAYS_OF_WEEK.map(day => (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleDay(day)}
                                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${selectedDays.includes(day)
                                            ? day === 'SUNDAY'
                                                ? 'bg-red-500 text-white border-red-500'
                                                : day === 'SATURDAY'
                                                    ? 'bg-blue-500 text-white border-blue-500'
                                                    : 'bg-gray-900 text-white border-gray-900'
                                            : day === 'SUNDAY'
                                                ? 'text-red-500 border-gray-300 hover:bg-red-50'
                                                : day === 'SATURDAY'
                                                    ? 'text-blue-500 border-gray-300 hover:bg-blue-50'
                                                    : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {DAY_OF_WEEK_SHORT[day]}
                                </button>
                            ))}
                        </div>
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
                            disabled={loading || selectedDays.length === 0}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                        >
                            {loading ? '저장 중...' : `저장 (${selectedDays.length}개)`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
