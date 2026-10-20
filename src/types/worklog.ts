export interface WorkLog {
    id: string;
    workerId: string;
    workerName: string;
    scheduleId: string | null;
    clockInAt: string;
    clockOutAt: string | null;
    status: 'ONGOING' | 'COMPLETED' | 'CONFIRMED' | 'REJECTED' | 'NO_SHOW' | 'MANUAL_ADJUSTED';
    durationMinutes: number | null;
    createdAt: string;
    updatedAt: string;
    correctionCount?: number;
    correctionReason?: string | null;
    rejectionReason?: string | null;
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

