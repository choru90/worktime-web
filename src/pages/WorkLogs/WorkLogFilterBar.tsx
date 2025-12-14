import { Worker } from '../../types/worker';
import { WorkLogFilter } from '../../types/worklog';

interface WorkLogFilterBarProps {
    filter: WorkLogFilter;
    onChange: (next: WorkLogFilter) => void;
    workers: Worker[];
}

export const WorkLogFilterBar = ({
    filter,
    onChange,
    workers,
}: WorkLogFilterBarProps) => {
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
                        <option value="ONGOING">근무중</option>
                        <option value="COMPLETED">검수대기</option>
                        <option value="CONFIRMED">확정</option>
                        <option value="REJECTED">반려</option>
                        <option value="NO_SHOW">미출근</option>
                        <option value="MANUAL_ADJUSTED">수동조정</option>
                    </select>
                </div>
            </div>
        </div>
    );
};
