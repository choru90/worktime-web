import { WorkLog } from '../../types/worklog';

interface WorkLogListProps {
    workLogs: WorkLog[];
    onConfirm: (id: string) => void;
    onReject: (id: string) => void;
    isLoading?: boolean;
}

export const WorkLogList = ({
    workLogs,
    onConfirm,
    onReject,
    isLoading,
}: WorkLogListProps) => {
    const formatTime = (isoString: string | null) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatWorkTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}시간 ${mins}분`;
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<
            string,
            { label: string; className: string }
        > = {
            ONGOING: {
                label: '근무중',
                className: 'bg-blue-100 text-blue-800',
            },
            COMPLETED: {
                label: '검수대기',
                className: 'bg-yellow-100 text-yellow-800',
            },
            CONFIRMED: {
                label: '확정',
                className: 'bg-green-100 text-green-800',
            },
            REJECTED: {
                label: '반려',
                className: 'bg-red-100 text-red-800',
            },
            NO_SHOW: {
                label: '미출근',
                className: 'bg-gray-100 text-gray-800',
            },
            MANUAL_ADJUSTED: {
                label: '수동조정',
                className: 'bg-purple-100 text-purple-800',
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

    const canConfirmOrReject = (status: string) => {
        return status === 'COMPLETED';
    };

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <div className="text-xl text-gray-500">Loading...</div>
            </div>
        );
    }

    if (workLogs.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                해당 조건의 출퇴근 기록이 없습니다.
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
                            알바생
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            출근 시간
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            퇴근 시간
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            총 근무 시간
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            상태
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            액션
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {workLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{log.date}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                    {log.workerName}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                    {formatTime(log.startAt)}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                    {formatTime(log.endAt)}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                    {formatWorkTime(log.workMinutes)}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(log.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                {canConfirmOrReject(log.status) ? (
                                    <>
                                        <button
                                            onClick={() => onConfirm(log.id)}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            확정
                                        </button>
                                        <button
                                            onClick={() => onReject(log.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            반려
                                        </button>
                                    </>
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
