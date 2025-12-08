import { Worker } from '../../types/worker';
import { PayrollFilter } from '../../types/payroll';

interface PayrollFilterBarProps {
    filter: PayrollFilter;
    onChange: (next: PayrollFilter) => void;
    workers: Worker[];
}

export const PayrollFilterBar = ({
    filter,
    onChange,
    workers,
}: PayrollFilterBarProps) => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        연도
                    </label>
                    <select
                        value={filter.year}
                        onChange={(e) =>
                            onChange({ ...filter, year: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        {years.map((year) => (
                            <option key={year} value={year}>
                                {year}년
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        월
                    </label>
                    <select
                        value={filter.month}
                        onChange={(e) =>
                            onChange({ ...filter, month: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        {months.map((month) => (
                            <option key={month} value={month}>
                                {month}월
                            </option>
                        ))}
                    </select>
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
            </div>
        </div>
    );
};
