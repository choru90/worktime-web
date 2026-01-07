import { useState } from 'react';
import { Schedule } from '../../types/schedule';
import { RegularShift, DAY_OF_WEEK_LABELS } from '../../types/store';
import apiClient from '../../lib/apiClient';

interface CalendarShift {
    id: string;
    workerName: string;
    workerId: string;
    startTime: string;
    endTime: string;
    type: 'regular' | 'schedule';
    status?: string;
}

interface ShiftDetailModalProps {
    shift: CalendarShift;
    date: Date;
    schedules: Schedule[];
    regularShifts: RegularShift[];
    onClose: () => void;
    onUpdated: () => void;
    onDeleteRegularShift: (shiftId: string) => Promise<void>;
}

export const ShiftDetailModal = ({
    shift,
    date,
    schedules,
    regularShifts,
    onClose,
    onUpdated,
    onDeleteRegularShift
}: ShiftDetailModalProps) => {
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editStartTime, setEditStartTime] = useState(shift.startTime);
    const [editEndTime, setEditEndTime] = useState(shift.endTime);

    const isRegularShift = shift.type === 'regular';

    // 실제 ID 추출 (regular- 접두사 제거)
    const actualId = isRegularShift
        ? shift.id.replace('regular-', '')
        : shift.id;

    const regularShift = isRegularShift
        ? regularShifts.find(s => s.id === actualId)
        : null;

    const schedule = !isRegularShift
        ? schedules.find(s => s.id === actualId)
        : null;

    const handleDeleteRegularShift = async () => {
        if (!window.confirm('이 고정 근무를 삭제하시겠습니까?\n해당 요일의 모든 고정 근무가 비활성화됩니다.')) return;

        try {
            setLoading(true);
            await onDeleteRegularShift(actualId);
            onUpdated();
            onClose();
        } catch (error) {
            console.error('Failed to delete shift:', error);
            alert('삭제에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSchedule = async () => {
        try {
            setLoading(true);

            const [startHour, startMinute] = editStartTime.split(':').map(Number);
            const [endHour, endMinute] = editEndTime.split(':').map(Number);

            const startDate = new Date(date);
            startDate.setHours(startHour, startMinute, 0, 0);

            const endDate = new Date(date);
            endDate.setHours(endHour, endMinute, 0, 0);

            // 종료 시간이 시작 시간보다 빠르면 에러 (하루 넘어가는 경우 처리 안 함 - 사용자 요구사항 단순 수정)
            if (endDate <= startDate) {
                alert('종료 시간은 시작 시간보다 이후여야 합니다.');
                setLoading(false);
                return;
            }

            const request = {
                startAtUtc: startDate.toISOString(),
                endAtUtc: endDate.toISOString(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };

            await apiClient.patch(`/schedules/${actualId}`, request);

            onUpdated();
            setIsEditing(false);
            onClose();
            alert('수정되었습니다.');
        } catch (error) {
            console.error('Failed to update schedule:', error);
            alert('수정에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSchedule = async () => {
        if (!window.confirm('이 스케줄을 삭제하시겠습니까?')) return;

        try {
            setLoading(true);
            await apiClient.post(`/schedules/${actualId}/cancel`);
            onUpdated();
            onClose();
        } catch (error) {
            console.error('Failed to delete schedule:', error);
            alert('삭제에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d: Date) => {
        return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            {isRegularShift && <span>📌</span>}
                            {shift.workerName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {formatDate(date)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    {/* 근무 유형 */}
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${isRegularShift
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                            }`}>
                            {isRegularShift ? '고정 근무' : '스케줄'}
                        </span>
                        {schedule?.status && (
                            <span className={`px-2 py-1 text-xs rounded ${schedule.status === 'CONFIRMED'
                                ? 'bg-green-100 text-green-800'
                                : schedule.status === 'REJECTED' || schedule.status === 'CANCELLED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {schedule.status === 'CONFIRMED' ? '확정'
                                    : schedule.status === 'REJECTED' ? '거절'
                                        : schedule.status === 'CANCELLED' ? '취소됨'
                                            : '대기중'}
                            </span>
                        )}
                    </div>

                    {/* 근무 시간 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">근무 시간</div>
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="time"
                                    value={editStartTime}
                                    onChange={(e) => setEditStartTime(e.target.value)}
                                    className="p-1 border rounded"
                                />
                                <span>-</span>
                                <input
                                    type="time"
                                    value={editEndTime}
                                    onChange={(e) => setEditEndTime(e.target.value)}
                                    className="p-1 border rounded"
                                />
                            </div>
                        ) : (
                            <div className="text-xl font-semibold">
                                {shift.startTime} - {shift.endTime}
                            </div>
                        )}
                    </div>

                    {/* 고정 근무 추가 정보 */}
                    {regularShift && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="text-sm text-gray-500 mb-1">반복 요일</div>
                            <div className="font-medium">
                                매주 {DAY_OF_WEEK_LABELS[regularShift.dayOfWeek]}
                            </div>
                            {regularShift.shiftName && (
                                <div className="text-sm text-gray-600 mt-1">
                                    {regularShift.shiftName}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 버튼 */}
                <div className="flex justify-end gap-2 mt-6">
                    {/* 스케줄 삭제 버튼 */}
                    {/* 스케줄 수정/삭제 버튼 */}
                    {!isRegularShift && schedule?.status !== 'CANCELLED' && (
                        <>
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleUpdateSchedule}
                                        disabled={loading}
                                        className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50"
                                    >
                                        저장
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        disabled={loading}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                                    >
                                        취소
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                    >
                                        수정
                                    </button>
                                    <button
                                        onClick={handleDeleteSchedule}
                                        disabled={loading}
                                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                    >
                                        삭제
                                    </button>
                                </>
                            )}
                        </>
                    )}
                    {/* 고정 근무 삭제 버튼 */}
                    {isRegularShift && (
                        <button
                            onClick={handleDeleteRegularShift}
                            disabled={loading}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        >
                            고정 근무 삭제
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};
