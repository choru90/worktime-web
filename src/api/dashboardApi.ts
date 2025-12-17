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

export interface ActionTarget {
    type: string;
    id: string;
    deepLink?: string;
}

export interface ActionItem {
    id: string;
    type: string; // 'PENDING_SCHEDULE_APPROVAL', 'MISSING_CHECKIN', 'MISSING_CHECKOUT'
    title: string;
    message: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    target: ActionTarget;
    createdAt: string;
    isDismissible: boolean;
}

export interface ActionListResponse {
    items: ActionItem[];
    totalCount: number;
}

export interface WorkerInfo {
    workerId: string;
    name: string;
    pictureUrl?: string;
}

export interface WorkerStats {
    completedShifts: number;
    totalWorkMinutes: number;
    accruedWage: number;
}

export interface TopWorkerItem {
    rank: number;
    worker: WorkerInfo;
    stats: WorkerStats;
    badges: string[]; // 'TOP_WAGE', 'TOP_MINUTES' etc.
}

export interface DateRangeDto {
    from: string;
    to: string;
    days: number;
}

export interface TopWorkersResponse {
    timezone: string;
    range: DateRangeDto;
    items: TopWorkerItem[];
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
