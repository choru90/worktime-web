import apiClient from '../lib/apiClient';

export interface DashboardParams {
    date?: string;
}

export interface ActionParams {
    date?: string;
    limit?: number;
    types?: string[];
}

export interface TopWorkersParams {
    from?: string;
    to?: string;
    limit?: number;
    sort?: 'WAGE_DESC' | 'MINUTES_DESC' | 'SHIFTS_DESC';
}

export interface TodayKpi {
    scheduledCount: number;
    checkedInCount: number;
    notCheckedInCount: number;
    notCheckedOutCount: number;
    totalWorkMinutes: number;
}

export interface MonthKpi {
    accruedWage: number;
    forecastWage: number;
}

export interface DashboardSummaryResponse {
    date: string;
    timezone: string;
    today: TodayKpi;
    month: MonthKpi;
    actionNeededCount: number;
}

export interface TodayScheduleItem {
    id: string;
    workerName: string;
    workerId: string;
    startTime: string; // HH:mm or ISO
    endTime: string;   // HH:mm or ISO
    status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'ABSENT' | 'LATE';
    flags: ('LATE' | 'NEEDS_CHECKIN' | 'NEEDS_CHECKOUT')[];
}

export interface TodayScheduleListResponse {
    items: TodayScheduleItem[];
}

export interface AttendanceCounts {
    scheduledCount: number;
    checkedInCount: number;
    notCheckedInCount: number;
    notCheckedOutCount: number;
}

export interface AttendanceExceptionItem {
    type: 'SCHEDULE_EXISTS_BUT_NO_CHECKIN' | 'CHECKIN_EXISTS_BUT_NO_CHECKOUT' | 'LOG_EXISTS_BUT_NO_SCHEDULE';
    scheduleId?: string;
    workLogId?: string;
    workerId: string;
    workerName: string;
    scheduledStartAt?: string;
    scheduledEndAt?: string;
    checkedInAt?: string;
    checkedOutAt?: string;
}

export interface AttendanceSummaryResponse {
    date: string;
    summary: AttendanceCounts;
    exceptions: AttendanceExceptionItem[];
}

export const dashboardApi = {
    getSummary: (date?: string) => {
        return apiClient.get('/owner/dashboard/summary', { params: { date } });
    },

    getTodaySchedules: (date?: string) => {
        // TODO: Update endpoint when available or reuse schedule API
        // Currently using placeholder or assuming an endpoint similar to summary
        return apiClient.get('/owner/dashboard/schedules', { params: { date } });
    },

    getAttendance: (date?: string) => {
        return apiClient.get('/owner/dashboard/attendance', { params: { date } });
    },

    getActions: (params: ActionParams) => {
        return apiClient.get('/owner/dashboard/actions', { params });
    },

    getTopWorkers: (params: TopWorkersParams) => {
        return apiClient.get('/owner/dashboard/top-workers', { params });
    },
};
