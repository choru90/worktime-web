export interface WorkLog {
    id: string;
    workerId: string;
    workerName: string;
    date: string;
    startAt: string;
    endAt: string | null;
    workMinutes: number;
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'CONFIRMED' | 'REJECTED';
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
