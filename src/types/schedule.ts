export interface Schedule {
    id: string;
    workerId: string;
    workerName: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'REQUESTED_BY_WORKER' | 'REQUESTED_BY_OWNER' | 'CONFIRMED' | 'REJECTED';
    requestedBy?: 'WORKER' | 'OWNER';
    memo?: string | null;
}

export interface ScheduleFilter {
    fromDate: string;
    toDate: string;
    workerId?: string;
    status?: string;
}

export interface ScheduleCreateRequest {
    workerId: string;
    date: string;
    startTime: string;
    endTime: string;
    memo?: string;
}
