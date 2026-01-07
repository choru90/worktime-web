import { useState, useMemo } from 'react';
import { Schedule } from '../../types/schedule';
import { RegularShift, DayOfWeek } from '../../types/store';
import { getWorkerColor } from '../../utils/colorUtils';

interface CalendarShift {
    id: string;
    workerName: string;
    workerId: string;
    startTime: string;
    endTime: string;
    type: 'regular' | 'schedule';
    status?: string;
}

export interface MonthlyCalendarProps {
    schedules: Schedule[];
    regularShifts?: RegularShift[];
    onDateClick?: (date: Date) => void;
    onShiftClick?: (shift: CalendarShift, date: Date) => void;
    onSyncMonth?: (year: number, month: number) => void;
    onMonthChange?: (year: number, month: number) => void;
    viewMode: 'month' | 'week';
    onViewModeChange: (mode: 'month' | 'week') => void;
}

// JS Date의 getDay()를 DayOfWeek로 변환
const getDayOfWeekFromDate = (date: Date): DayOfWeek => {
    const dayMap: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return dayMap[date.getDay()];
};

export const MonthlyCalendar = ({
    schedules,
    regularShifts = [],
    onDateClick,
    onShiftClick,
    onSyncMonth,
    onMonthChange,
    viewMode,
    onViewModeChange
}: MonthlyCalendarProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    // 현재 월의 캘린더 날짜 계산
    const calendarDays = useMemo((): Date[] => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days: Date[] = [];

        // 이전 달의 날짜들 (첫 주 채우기)
        const firstDayOfWeek = firstDay.getDay();
        for (let i = firstDayOfWeek; i > 0; i--) {
            days.push(new Date(year, month, 1 - i));
        }

        // 현재 달의 날짜들
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        // 다음 달의 날짜들 (마지막 주 채우기)
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push(new Date(year, month + 1, i));
        }

        return days;
    }, [currentDate]);

    // 모든 근무자 ID 수집 (스케줄 + 고정근무)
    const allWorkerIds = useMemo(() => {
        const scheduleWorkerIds = schedules.map(s => s.workerId);
        const regularShiftWorkerIds = regularShifts.map(s => s.workerId);
        return [...new Set([...scheduleWorkerIds, ...regularShiftWorkerIds])];
    }, [schedules, regularShifts]);

    // Worker별 색상 맵핑 (ID 해시 기반)
    const workerColorMap = useMemo(() => {
        const colorMap: Record<string, { schedule: string; regular: string }> = {};
        allWorkerIds.forEach((workerId) => {
            colorMap[workerId] = getWorkerColor(workerId);
        });
        return colorMap;
    }, [allWorkerIds]);

    // 요일별 고정 근무 맵핑
    const regularShiftsByDay = useMemo(() => {
        const map: Record<DayOfWeek, RegularShift[]> = {
            SUNDAY: [], MONDAY: [], TUESDAY: [], WEDNESDAY: [],
            THURSDAY: [], FRIDAY: [], SATURDAY: []
        };
        regularShifts.forEach(shift => {
            if (shift.active) {
                map[shift.dayOfWeek].push(shift);
            }
        });
        // 시간순 정렬
        Object.keys(map).forEach(day => {
            map[day as DayOfWeek].sort((a, b) => a.startTime.localeCompare(b.startTime));
        });
        return map;
    }, [regularShifts]);

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
                workerId: schedule.workerId,
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

    // 특정 날짜의 모든 시프트 (고정 근무 + 스케줄) 가져오기
    const getShiftsForDate = (date: Date): CalendarShift[] => {
        // 로컬 시간대 기준으로 dateKey 생성 (UTC가 아닌 로컬)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;
        const dayOfWeek = getDayOfWeekFromDate(date);

        // 해당 요일의 고정 근무
        const regularShiftsForDay = regularShiftsByDay[dayOfWeek].map(shift => ({
            id: `regular-${shift.id}`,
            workerName: shift.workerName,
            workerId: shift.workerId,
            startTime: shift.startTime.substring(0, 5),
            endTime: shift.endTime.substring(0, 5),
            type: 'regular' as const,
        }));

        // 해당 날짜의 추가 스케줄
        const additionalSchedules = schedulesByDate[dateKey] || [];

        // 합치고 시간순 정렬
        return [...regularShiftsForDay, ...additionalSchedules].sort((a, b) =>
            a.startTime.localeCompare(b.startTime)
        );
    };

    const goToPreviousMonth = () => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        setCurrentDate(newDate);
        onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1);
    };

    const goToNextMonth = () => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        setCurrentDate(newDate);
        onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1);
    };

    const goToToday = () => {
        const newDate = new Date();
        setCurrentDate(newDate);
        onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1);
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
                    {onSyncMonth && (
                        <button
                            onClick={() => onSyncMonth(currentDate.getFullYear(), currentDate.getMonth() + 1)}
                            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                        >
                            🔄 고정 일정 불러오기
                        </button>
                    )}
                    <button
                        onClick={goToToday}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        오늘
                    </button>
                    <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => onViewModeChange('month')}
                            className={`px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'month'
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            월별
                        </button>
                        <button
                            onClick={() => onViewModeChange('week')}
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
                        const dayShifts = getShiftsForDate(date);
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
                                        const colors = workerColorMap[shift.workerId];
                                        const colorClass = shift.type === 'regular'
                                            ? colors?.regular
                                            : colors?.schedule;

                                        return (
                                            <div
                                                key={shift.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onShiftClick?.(shift, date);
                                                }}
                                                className={`text-xs px-1.5 py-1 rounded border truncate hover:opacity-80 transition-opacity cursor-pointer ${colorClass}`}
                                            >
                                                {shift.type === 'regular' && (
                                                    <span className="mr-1">📌</span>
                                                )}
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
                <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                    <span className="font-medium">범례:</span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-blue-200 rounded border border-blue-300"></span>
                        📌 고정근무
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-blue-100 rounded border border-blue-200"></span>
                        추가스케줄
                    </span>
                    <span className="mx-2">|</span>
                    {allWorkerIds.slice(0, 4).map((workerId) => {
                        const schedule = schedules.find(s => s.workerId === workerId);
                        const shift = regularShifts.find(s => s.workerId === workerId);
                        const name = schedule?.workerName || shift?.workerName;
                        if (!name) return null;
                        const colors = workerColorMap[workerId];
                        return (
                            <span
                                key={workerId}
                                className={`px-2 py-0.5 rounded border ${colors?.schedule}`}
                            >
                                {name}
                            </span>
                        );
                    })}
                    {allWorkerIds.length > 4 && (
                        <span className="text-gray-500">
                            외 {allWorkerIds.length - 4}명
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
