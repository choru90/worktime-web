// src/types/worker.ts
export interface Worker {
    id: string;
    name: string;
    phoneNumber: string;
    active: boolean;
    currentHourlyWage?: number;
}

export interface WageContract {
    id: string;
    hourlyWage: number;
    effectiveFrom: string;
    effectiveTo: string | null;
    isCurrent: boolean;
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
    effectiveFrom: string;
}
