// src/types/worker.ts
export interface Worker {
    id: string;
    name: string;
    phoneNumber: string;
    active: boolean;
    currentHourlyWage?: number;
    hasAccount?: boolean;
    userEmail?: string;
}

export interface WageContract {
    id: string;
    workerId: string;
    hourlyWage: number;
    startDate: string;
    endDate: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface WorkerCreateRequest {
    name: string;
    phoneNumber: string;
}

export interface WorkerUpdateRequest {
    name: string;
    phoneNumber: string;
}

export interface WageContractCreateRequest {
    hourlyWage: number;
    startDate: string;
    endDate?: string | null;
}
