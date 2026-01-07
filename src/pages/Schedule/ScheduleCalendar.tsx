import { useState, useMemo } from 'react';
import { Schedule } from '../../types/schedule';

interface CalendarShift {
    id: string;
    workerName: string;
    startTime: string;
    endTime: string;
    type: 'regular' | 'schedule';
    status?: string;
}

interface ScheduleCalendarProps {
    schedules: Schedule[];
    onDateClick?: (date: Date) => void;
    onShiftClick?: (shift: CalendarShift) => void;
}

// 색상 배열 (알바별 고유 색상 배정용)
const WORKER_COLORS = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-green-100 text-green-800 border-green-200',
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-orange-100 text-orange-800 border-orange-200',
    'bg-pink-100 text-pink-800 border-pink-200',
    'bg-teal-100 text-teal-800 border-teal-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-yellow-100 text-yellow-800 border-yellow-200',
];

export const ScheduleCalendar = ({ schedules, onDateClick, onShiftClick }: ScheduleCalendarProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

    // 현재 월의 캘린더 날짜 계산
    const calendarDays = useMemo((): Date[] => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // 달력에 표시할 날짜 배열 (이전 달/다음 달 날짜 포함)
        const days: Date[] = [];

        // 이전 달의 날짜들 (첫 주 채우기)
        const firstDayOfWeek = firstDay.getDay(); // 0 (일) ~ 6 (토)
        for (let i = firstDayOfWeek; i > 0; i--) {
            days.push(new Date(year, month, 1 - i));
        }

        // 현재 달의 날짜들
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        // 다음 달의 날짜들 (마지막 주 채우기)
        const remainingDays = 42 - days.length; // 6주 표시
        for (let i = 1; i <= remainingDays; i++) {
            days.push(new Date(year, month + 1, i));
        }

        return days;
    }, [currentDate]);

    // Worker별 색상 맵핑
    const workerColorMap = useMemo(() => {
        const uniqueWorkers = [...new Set(schedules.map(s => s.workerId))];
        const colorMap: Record<string, string> = {};
        uniqueWorkers.forEach((workerId, index) => {
            colorMap[workerId] = WORKER_COLORS[index % WORKER_COLORS.length];
        });
        return colorMap;
    }, [schedules]);

    // 날짜별 스케줄 그룹핑
    const schedulesByDate = useMemo(() => {
        const map: Record<string, CalendarShift[]> = {};

        schedules.forEach(schedule => {
            const dateKey = schedule.date;
            if (!map[dateKey]) {
                map[dateKey] = [];
            }
            map[dateKey].push({
                id: schedule.id,
                workerName: schedule.workerName,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                type: 'schedule',
                status: schedule.status,
            });
        });

        // 시간순 정렬
        Object.keys(map).forEach(date => {
            map[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
        });

        return map;
    }, [schedules]);

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const formatDateKey = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === currentDate.getMonth();
    };

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                    </h2>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={goToPreviousMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={goToNextMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToToday}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        오늘
                    </button>
                    <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'month'
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            월별
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'week'
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            주별
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
                {/* Day Names Header */}
                <div className="grid grid-cols-7 mb-2">
                    {dayNames.map((day, index) => (
                        <div
                            key={day}
                            className={`text-center text-sm font-medium py-2 ${index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
                                }`}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((date, index) => {
                        const dateKey = formatDateKey(date);
                        const dayShifts = schedulesByDate[dateKey] || [];
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                        return (
                            <div
                                key={index}
                                onClick={() => onDateClick?.(date)}
                                className={`min-h-[120px] p-2 border rounded-lg cursor-pointer transition-colors ${isCurrentMonth(date)
                                    ? isWeekend
                                        ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                    : 'bg-gray-100 border-gray-100 opacity-50'
                                    } ${isToday(date) ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                            >
                                {/* Date Number */}
                                <div className={`text-sm font-medium mb-1 ${date.getDay() === 0 ? 'text-red-500' :
                                    date.getDay() === 6 ? 'text-blue-500' :
                                        'text-gray-700'
                                    }`}>
                                    {date.getDate()}
                                </div>

                                {/* Shifts */}
                                <div className="space-y-1">
                                    {dayShifts.slice(0, 3).map((shift) => {
                                        const schedule = schedules.find(s => s.id === shift.id);
                                        const colorClass = schedule ? workerColorMap[schedule.workerId] : WORKER_COLORS[0];

                                        return (
                                            <div
                                                key={shift.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onShiftClick?.(shift);
                                                }}
                                                className={`text-xs px-1.5 py-1 rounded border truncate hover:opacity-80 transition-opacity ${colorClass}`}
                                            >
                                                <span className="font-medium">{shift.workerName}</span>
                                                <span className="ml-1 opacity-75">
                                                    {shift.startTime}-{shift.endTime}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {dayShifts.length > 3 && (
                                        <div className="text-xs text-gray-500 text-center">
                                            +{dayShifts.length - 3}개 더
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-medium">근무자:</span>
                    {Object.entries(workerColorMap).slice(0, 5).map(([workerId, colorClass]) => {
                        const worker = schedules.find(s => s.workerId === workerId);
                        if (!worker) return null;
                        return (
                            <span
                                key={workerId}
                                className={`px-2 py-0.5 rounded border ${colorClass}`}
                            >
                                {worker.workerName}
                            </span>
                        );
                    })}
                    {Object.keys(workerColorMap).length > 5 && (
                        <span className="text-gray-500">
                            외 {Object.keys(workerColorMap).length - 5}명
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
