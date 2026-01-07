import { useState } from 'react';
import apiClient from '../../lib/apiClient';
import { Worker } from '../../types/worker';

interface AddScheduleModalProps {
    date: Date;
    workers: Worker[];
    onClose: () => void;
    onCreated: () => void;
}

export const AddScheduleModal = ({ date, workers, onClose, onCreated }: AddScheduleModalProps) => {
    const [workerId, setWorkerId] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('18:00');
    const [memo, setMemo] = useState('');
    const [loading, setLoading] = useState(false);

    const formatDate = (d: Date) => {
        return d.toISOString().split('T')[0];
    };

    const formatDisplayDate = (d: Date) => {
        return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!workerId) {
            alert('알바생을 선택해주세요.');
            return;
        }

        try {
            setLoading(true);
            // 날짜 형식 변환 (YYYY-MM-DD)
            const dateStr = formatDate(date);

            // ISO 8601 형식으로 변환 (KST 가정 +09:00)
            const startAtUtc = `${dateStr}T${startTime}:00+09:00`;
            const endAtUtc = `${dateStr}T${endTime}:00+09:00`;

            await apiClient.post(`/workers/${workerId}/schedules`, {
                workerId,
                startAtUtc,
                endAtUtc,
                timezone: 'Asia/Seoul',
                requestType: 'OWNER_PROPOSAL',
                // memo 필드는 ScheduleCreateRequest에 없음 -> 삭제하거나 별도 처리 필요. 
                // ScheduleCreateRequest.kt를 보니 memo 필드가 없음. 백엔드에서 안 받으면 보내도 무시되거나 에러?
                // 백엔드 DTO(ScheduleCreateRequest)에 memo가 없으므로 보내지 않음.
            });
            onCreated();
        } catch (error: any) {
            console.error('Failed to create schedule:', error);
            if (error.response?.status === 409) {
                alert('해당 시간에 이미 등록된 스케줄이 있습니다.\n기존 스케줄을 확인해주세요.');
            } else {
                alert(error.response?.data?.message || '스케줄 생성에 실패했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-semibold">스케줄 추가</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {formatDisplayDate(date)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 알바생 선택 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            알바생 *
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

                    {/* 시간 */}
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

                    {/* 메모 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            메모 (선택)
                        </label>
                        <textarea
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            placeholder="예: 대타 근무, 이벤트 지원 등"
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
