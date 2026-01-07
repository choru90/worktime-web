// Store (영업장) 관련 타입 정의

export interface Store {
    id: string;
    name: string;
    address: string | null;
    timezone: string;
    active: boolean;
}

export interface StoreCreateRequest {
    name: string;
    address?: string;
    timezone?: string;
}

export interface StoreUpdateRequest {
    name?: string;
    address?: string;
    timezone?: string;
}

// 영업시간
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface BusinessHours {
    dayOfWeek: DayOfWeek;
    openTime: string; // "HH:mm" 형식
    closeTime: string;
    isClosed: boolean;
}

// 고정 근무
export interface RegularShift {
    id: string;
    storeId: string;
    workerId: string;
    workerName: string;
    dayOfWeek: DayOfWeek;
    startTime: string; // "HH:mm" 형식
    endTime: string;
    shiftName: string | null;
    active: boolean;
    effectiveFrom: string | null; // "YYYY-MM-DD"
    effectiveUntil: string | null;
}

export interface RegularShiftCreateRequest {
    workerId: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    shiftName?: string;
    effectiveFrom?: string;
    effectiveUntil?: string;
}

export interface RegularShiftUpdateRequest {
    workerId?: string;
    startTime?: string;
    endTime?: string;
    shiftName?: string;
    effectiveFrom?: string;
    effectiveUntil?: string;
}

// 요일 표시용 유틸리티
export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
    MONDAY: '월요일',
    TUESDAY: '화요일',
    WEDNESDAY: '수요일',
    THURSDAY: '목요일',
    FRIDAY: '금요일',
    SATURDAY: '토요일',
    SUNDAY: '일요일',
};

export const DAY_OF_WEEK_SHORT: Record<DayOfWeek, string> = {
    MONDAY: '월',
    TUESDAY: '화',
    WEDNESDAY: '수',
    THURSDAY: '목',
    FRIDAY: '금',
    SATURDAY: '토',
    SUNDAY: '일',
};
