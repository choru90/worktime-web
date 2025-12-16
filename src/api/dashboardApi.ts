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
