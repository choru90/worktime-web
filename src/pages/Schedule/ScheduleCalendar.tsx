import { useState } from 'react';
import { Schedule } from '../../types/schedule';
import { RegularShift } from '../../types/store';
import { MonthlyCalendar } from './MonthlyCalendar';
import { WeeklyCalendar } from './WeeklyCalendar';

interface CalendarShift {
    id: string;
    workerName: string;
    workerId: string;
    startTime: string;
    endTime: string;
    type: 'regular' | 'schedule';
    status?: string;
}

interface ScheduleCalendarProps {
    schedules: Schedule[];
    regularShifts?: RegularShift[];
    onDateClick?: (date: Date) => void;
    onShiftClick?: (shift: CalendarShift, date: Date) => void;
    onSyncMonth?: (year: number, month: number) => void;
    onMonthChange?: (year: number, month: number) => void;
}

export const ScheduleCalendar = ({
    schedules,
    regularShifts = [],
    onDateClick,
    onShiftClick,
    onSyncMonth,
    onMonthChange
}: ScheduleCalendarProps) => {
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

    // MonthlyCalendar에 필요한 Props
    const commonProps = {
        schedules,
        regularShifts,
        onDateClick,
        onShiftClick,
        viewMode,
        onViewModeChange: setViewMode,
    };

    if (viewMode === 'week') {
        return <WeeklyCalendar {...commonProps} />;
    }

    return (
        <MonthlyCalendar
            {...commonProps}
            onSyncMonth={onSyncMonth}
            onMonthChange={onMonthChange}
        />
    );
};
