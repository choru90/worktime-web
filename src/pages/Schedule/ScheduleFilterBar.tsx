import { Worker } from '../../types/worker';
import { ScheduleFilter } from '../../types/schedule';

interface ScheduleFilterBarProps {
    filter: ScheduleFilter;
    onChange: (next: ScheduleFilter) => void;
    workers: Worker[];
}

export const ScheduleFilterBar = ({
    filter,
    onChange,
    workers,
}: ScheduleFilterBarProps) => {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        시작일
                    </label>
                    <input
                        type="date"
                        value={filter.fromDate}
                        onChange={(e) => onChange({ ...filter, fromDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        종료일
                    </label>
                    <input
                        type="date"
                        value={filter.toDate}
                        onChange={(e) => onChange({ ...filter, toDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        알바생
                    </label>
                    <select
                        value={filter.workerId || ''}
                        onChange={(e) =>
                            onChange({
                                ...filter,
                                workerId: e.target.value || undefined,
                            })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        <option value="">전체</option>
                        {workers.map((worker) => (
                            <option key={worker.id} value={worker.id}>
                                {worker.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        상태
                    </label>
                    <select
                        value={filter.status || ''}
                        onChange={(e) =>
                            onChange({
                                ...filter,
                                status: e.target.value || undefined,
                            })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        <option value="">전체</option>
                        <option value="REQUESTED_BY_WORKER">알바 요청</option>
                        <option value="REQUESTED_BY_OWNER">사장 제안</option>
                        <option value="CONFIRMED">확정</option>
                        <option value="REJECTED">거절</option>
                    </select>
                </div>
            </div>
        </div>
    );
};
