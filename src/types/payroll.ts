export interface PayrollSummary {
    workerId: string;
    workerName: string;
    totalWorkMinutes: number;
    totalWorkHours: number;
    totalAmount: number;
}

export interface PayrollFilter {
    year: number;
    month: number;
    workerId?: string;
}

export interface WorkerPayrollDetail {
    workerId: string;
    workerName: string;
    year: number;
    month: number;
    totalWorkMinutes: number;
    totalWorkHours: number;
    totalAmount: number;
    dailyDetails: DailyDetail[];
}

export interface DailyDetail {
    date: string;
    workMinutes: number;
    workHours: number;
    hourlyWage: number;
    amount: number;
}
