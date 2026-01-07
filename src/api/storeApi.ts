import apiClient from '../lib/apiClient';
import {
    Store,
    StoreCreateRequest,
    StoreUpdateRequest,
    BusinessHours,
    RegularShift,
    RegularShiftCreateRequest
} from '../types/store';

// ===== Store API =====

export const storeApi = {
    // 영업장 목록 조회
    getStores: async (): Promise<Store[]> => {
        const response = await apiClient.get<Store[]>('/stores');
        return response.data;
    },

    // 영업장 생성
    createStore: async (request: StoreCreateRequest): Promise<Store> => {
        const response = await apiClient.post<Store>('/stores', request);
        return response.data;
    },

    // 영업장 상세 조회
    getStore: async (storeId: string): Promise<Store> => {
        const response = await apiClient.get<Store>(`/stores/${storeId}`);
        return response.data;
    },

    // 영업장 수정
    updateStore: async (storeId: string, request: StoreUpdateRequest): Promise<Store> => {
        const response = await apiClient.put<Store>(`/stores/${storeId}`, request);
        return response.data;
    },

    // 영업장 삭제 (비활성화)
    deleteStore: async (storeId: string): Promise<void> => {
        await apiClient.delete(`/stores/${storeId}`);
    },

    // 영업시간 조회
    getBusinessHours: async (storeId: string): Promise<BusinessHours[]> => {
        const response = await apiClient.get<BusinessHours[]>(`/stores/${storeId}/business-hours`);
        return response.data;
    },

    // 영업시간 설정
    setBusinessHours: async (storeId: string, hours: BusinessHours[]): Promise<BusinessHours[]> => {
        const response = await apiClient.put<BusinessHours[]>(`/stores/${storeId}/business-hours`, { hours });
        return response.data;
    },
};

// ===== RegularShift API =====

export const regularShiftApi = {
    // 고정 근무 목록 조회
    getRegularShifts: async (storeId: string, activeOnly: boolean = true): Promise<RegularShift[]> => {
        const response = await apiClient.get<RegularShift[]>(
            `/stores/${storeId}/regular-shifts`,
            { params: { activeOnly } }
        );
        return response.data;
    },

    // 오늘의 고정 근무 조회
    getTodayShifts: async (storeId: string): Promise<RegularShift[]> => {
        const response = await apiClient.get<RegularShift[]>(`/stores/${storeId}/regular-shifts/today`);
        return response.data;
    },

    // 특정 날짜 고정 근무 조회
    getShiftsByDate: async (storeId: string, date: string): Promise<RegularShift[]> => {
        const response = await apiClient.get<RegularShift[]>(`/stores/${storeId}/regular-shifts/date/${date}`);
        return response.data;
    },

    // 고정 근무 생성
    createRegularShift: async (storeId: string, request: RegularShiftCreateRequest): Promise<RegularShift> => {
        const response = await apiClient.post<RegularShift>(`/stores/${storeId}/regular-shifts`, request);
        return response.data;
    },

    // 고정 근무 상세
    getRegularShift: async (shiftId: string): Promise<RegularShift> => {
        const response = await apiClient.get<RegularShift>(`/regular-shifts/${shiftId}`);
        return response.data;
    },

    // 고정 근무 삭제 (비활성화)
    deleteRegularShift: async (shiftId: string): Promise<void> => {
        await apiClient.delete(`/regular-shifts/${shiftId}`);
    },

    // 근로자의 고정 근무 조회
    getWorkerRegularShifts: async (workerId: string): Promise<RegularShift[]> => {
        const response = await apiClient.get<RegularShift[]>(`/workers/${workerId}/regular-shifts`);
        return response.data;
    },
};
