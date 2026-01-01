import { Schedule } from '../../types/schedule';

interface ScheduleListProps {
    schedules: Schedule[];
    onApprove: (scheduleId: string) => void;
    onReject: (scheduleId: string) => void;
    onWriteWorkLog?: (schedule: Schedule) => void;  // 알바생 근무 기록 작성
    isLoading?: boolean;
    isWorker?: boolean;  // 알바생 여부
}

export const ScheduleList = ({
    schedules,
    onApprove,
    onReject,
    onWriteWorkLog,
    isLoading,
    isWorker = false,
}: ScheduleListProps) => {
    const getStatusBadge = (status: string) => {
        const statusConfig: Record<
            string,
            { label: string; className: string }
        > = {
            REQUESTED_BY_WORKER: {
                label: '알바 요청',
                className: 'bg-yellow-100 text-yellow-800',
            },
            PROPOSED_BY_OWNER: {
                label: '사장 제안',
                className: 'bg-blue-100 text-blue-800',
            },
            REQUESTED_BY_OWNER: {
                label: '사장 제안',
                className: 'bg-blue-100 text-blue-800',
            },
            CONFIRMED: {
                label: '확정',
                className: 'bg-green-100 text-green-800',
            },
            REJECTED: {
                label: '거절',
                className: 'bg-red-100 text-red-800',
            },
            CANCELED: {
                label: '취소',
                className: 'bg-gray-100 text-gray-800',
            },
        };

        const config = statusConfig[status] || {
            label: status,
            className: 'bg-gray-100 text-gray-800',
        };

        return (
            <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}
            >
                {config.label}
            </span>
        );
    };

    const canApproveOrReject = (status: string) => {
        return status === 'REQUESTED_BY_WORKER' || status === 'REQUESTED_BY_OWNER' || status === 'PROPOSED_BY_OWNER';
    };

    const canWriteWorkLog = (status: string) => {
        return status === 'CONFIRMED' && isWorker && onWriteWorkLog;
    };

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <div className="text-xl text-gray-500">Loading...</div>
            </div>
        );
    }

    // schedules가 배열이 아닌 경우 처리
    const scheduleArray = Array.isArray(schedules) ? schedules : [];

    if (scheduleArray.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                해당 조건의 스케줄이 없습니다.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            날짜
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            시간
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            알바생
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            상태
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            요청 주체
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            메모
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            액션
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {scheduleArray.map((schedule) => (
                        <tr key={schedule.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{schedule.date}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                    {schedule.startTime} ~ {schedule.endTime}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                    {schedule.workerName}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(schedule.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                    {schedule.requestedBy || '-'}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                    {schedule.memo || '-'}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                {canApproveOrReject(schedule.status) ? (
                                    <>
                                        <button
                                            onClick={() => onApprove(schedule.id)}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            승인
                                        </button>
                                        <button
                                            onClick={() => onReject(schedule.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            거절
                                        </button>
                                    </>
                                ) : canWriteWorkLog(schedule.status) ? (
                                    <button
                                        onClick={() => onWriteWorkLog!(schedule)}
                                        className="px-3 py-1 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition-colors"
                                    >
                                        근무 기록 작성
                                    </button>
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
