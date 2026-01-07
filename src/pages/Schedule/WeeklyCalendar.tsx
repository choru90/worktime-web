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

export interface WeeklyCalendarProps {
    schedules: Schedule[];
    regularShifts?: RegularShift[];
    onDateClick?: (date: Date) => void;
    onShiftClick?: (shift: CalendarShift, date: Date) => void;
    viewMode: 'month' | 'week';
    onViewModeChange: (mode: 'month' | 'week') => void;
}

// JS Date의 getDay()를 DayOfWeek로 변환
const getDayOfWeekFromDate = (date: Date): DayOfWeek => {
    const dayMap: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return dayMap[date.getDay()];
};

// 시간 슬롯 (00:00 ~ 23:00)
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const WeeklyCalendar = ({
    schedules,
    regularShifts = [],
    onDateClick,
    onShiftClick,
    viewMode,
    onViewModeChange
}: WeeklyCalendarProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    // 이번 주의 시작일(일요일)과 날짜들 계산
    const weekDays = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // 일요일로 이동

        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            days.push(date);
        }
        return days;
    }, [currentDate]);

    // 이전 주 이동
    const goToPreviousWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    // 다음 주 이동
    const goToNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    // 오늘로 이동
    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // 모든 근무자 ID 수집 및 색상 맵핑
    const allWorkerIds = useMemo(() => {
        const scheduleWorkerIds = schedules.map(s => s.workerId);
        const regularShiftWorkerIds = regularShifts.map(s => s.workerId);
        return [...new Set([...scheduleWorkerIds, ...regularShiftWorkerIds])];
    }, [schedules, regularShifts]);

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
        return map;
    }, [regularShifts]);

    // 날짜별 스케줄 맵핑
    const schedulesByDate = useMemo(() => {
        const map: Record<string, CalendarShift[]> = {};
        schedules.forEach(schedule => {
            const dateKey = schedule.date; // YYYY-MM-DD
            if (!map[dateKey]) map[dateKey] = [];
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
        return map;
    }, [schedules]);

    // 날짜별로 표시할 시프트(고정+추가) 가져오기
    const getShiftsForDate = (date: Date): CalendarShift[] => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;
        const dayOfWeek = getDayOfWeekFromDate(date);

        const regularShiftsForDay = regularShiftsByDay[dayOfWeek].map(shift => ({
            id: `regular-${shift.id}`,
            workerName: shift.workerName,
            workerId: shift.workerId,
            startTime: shift.startTime.substring(0, 5),
            endTime: shift.endTime.substring(0, 5),
            type: 'regular' as const,
        }));

        const additionalSchedules = schedulesByDate[dateKey] || [];
        return [...regularShiftsForDay, ...additionalSchedules];
    };

    // 시간 문자열(HH:mm)을 분(minutes)으로 변환
    const getMinutesFromTime = (time: string) => {
        const [hour, minute] = time.split(':').map(Number);
        return hour * 60 + minute;
    };

    // 스케줄 레이아웃 계산 함수
    const calculateLayout = (shifts: CalendarShift[]) => {
        // 1. 시작 시간 순 정렬
        const sortedShifts = [...shifts].sort((a, b) =>
            getMinutesFromTime(a.startTime) - getMinutesFromTime(b.startTime)
        );

        // 2. 컬럼 할당 로직
        const columns: { endTime: number }[] = [];
        const result = sortedShifts.map(shift => {
            const startMinutes = getMinutesFromTime(shift.startTime);
            const endMinutes = getMinutesFromTime(shift.endTime);

            // 들어갈 수 있는 첫 번째 컬럼 찾기
            let colIndex = columns.findIndex(col => col.endTime <= startMinutes);

            if (colIndex === -1) {
                // 들어갈 곳이 없으면 새 컬럼 추가
                colIndex = columns.length;
                columns.push({ endTime: endMinutes });
            } else {
                // 해당 컬럼 업데이트
                columns[colIndex].endTime = endMinutes;
            }

            return {
                shift,
                colIndex,
                startMinutes,
                endMinutes
            };
        });

        const totalCols = columns.length;
        const widthPercent = 100 / (totalCols || 1);

        return result.map(({ shift, colIndex, startMinutes, endMinutes }) => {
            const colors = workerColorMap[shift.workerId];
            const colorClass = shift.type === 'regular'
                ? colors?.regular
                : colors?.schedule;

            const top = startMinutes;
            const height = endMinutes - startMinutes;

            return {
                ...shift,
                colorClass,
                style: {
                    top: `${top}px`,
                    height: `${height}px`,
                    width: `${widthPercent}%`,
                    left: `${colIndex * widthPercent}%`,
                }
            };
        });
    };

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[800px]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        {weekDays[0].getFullYear()}년 {weekDays[0].getMonth() + 1}월
                        {weekDays[0].getMonth() !== weekDays[6].getMonth() &&
                            ` - ${weekDays[6].getMonth() + 1}월`}
                    </h2>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={goToPreviousWeek}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={goToNextWeek}
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

            {/* Calendar Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto relative">
                <div className="flex min-h-[1440px]"> {/* 24 hours * 60px */}

                    {/* Time Column (Left Axis) */}
                    <div className="w-16 flex-shrink-0 border-r border-gray-100 bg-white sticky left-0 z-10">
                        <div className="h-10 border-b border-gray-100"></div> {/* Header Spacer */}
                        {HOURS.map(hour => (
                            <div key={hour} className="h-[60px] border-b border-gray-50 text-xs text-gray-500 text-right pr-2 pt-1 relative">
                                {String(hour).padStart(2, '0')}:00
                            </div>
                        ))}
                    </div>

                    {/* Days Columns */}
                    <div className="flex-1 flex">
                        {weekDays.map((date, index) => {
                            const isToday = new Date().toDateString() === date.toDateString();
                            const shifts = getShiftsForDate(date);
                            const layoutedShifts = calculateLayout(shifts);

                            return (
                                <div key={index} className="flex-1 flex flex-col border-r border-gray-100 min-w-[120px]">
                                    {/* Column Header */}
                                    <div className={`h-10 flex items-center justify-center border-b border-gray-100 sticky top-0 bg-white z-10 ${isToday ? 'bg-blue-50' : ''
                                        }`}>
                                        <div className={`text-center ${date.getDay() === 0 ? 'text-red-500' :
                                            date.getDay() === 6 ? 'text-blue-500' : 'text-gray-700'
                                            }`}>
                                            <span className="text-xs font-medium mr-1">{dayNames[date.getDay()]}</span>
                                            <span className={`text-sm font-bold ${isToday ? 'px-2 py-0.5 bg-blue-500 text-white rounded-full' : ''}`}>
                                                {date.getDate()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Timeline Grid */}
                                    <div className="relative flex-1" onClick={() => onDateClick?.(date)}>
                                        {/* Grid Lines */}
                                        {HOURS.map(hour => (
                                            <div key={hour} className="h-[60px] border-b border-gray-50"></div>
                                        ))}

                                        {/* Shifts */}
                                        {layoutedShifts.map(item => {
                                            const isUnconfirmed = item.type === 'schedule' && item.status !== 'CONFIRMED';

                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onShiftClick?.(item, date);
                                                    }}
                                                    style={item.style}
                                                    className={`absolute rounded border p-1 text-xs overflow-hidden cursor-pointer hover:opacity-80 transition-opacity flex flex-col justify-center ${item.colorClass} shadow-sm z-0 ${isUnconfirmed ? 'border-dashed opacity-75' : ''
                                                        }`}
                                                >
                                                    <div className="font-bold truncate flex items-center gap-1">
                                                        {isUnconfirmed && <span>⏳</span>}
                                                        {item.workerName}
                                                    </div>
                                                    <div className="truncate opacity-90">{item.startTime}-{item.endTime}</div>
                                                </div>
                                            );
                                        })}

                                        {/* Current Time Indicator (if today) */}
                                        {isToday && (
                                            <div
                                                className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
                                                style={{ top: `${new Date().getHours() * 60 + new Date().getMinutes()}px` }}
                                            >
                                                <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
