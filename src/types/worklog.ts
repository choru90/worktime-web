export interface WorkLog {
    id: string;
    workerId: string;
    workerName: string;
    date: string;
    startAt: string;
    endAt: string | null;
    workMinutes: number;
    status: 'ONGOING' | 'COMPLETED' | 'CONFIRMED' | 'REJECTED' | 'NO_SHOW' | 'MANUAL_ADJUSTED';
}

export interface WorkLogFilter {
    fromDate: string;
    toDate: string;
    workerId?: string;
    status?: string;
}

export interface RejectRequest {
    reason: string;
}
