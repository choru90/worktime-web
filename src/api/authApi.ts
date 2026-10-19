import apiClient from '../lib/apiClient';

/**
 * Owner 회원가입 요청 타입
 */
export interface OwnerSignUpRequest {
    email: string;
    password: string;
    name: string;
    businessName?: string;
}

/**
 * 로그인 응답 타입
 */
export interface LoginResponse {
    accessToken: string;
    tokenType: string;
    userId: string;
    role: 'OWNER' | 'WORKER';
    ownerId?: string;
    workerId?: string;
}

/**
 * 인증 관련 API
 */
export const authApi = {
    /**
     * Owner 회원가입
     */
    signUpWorker: (request: { email: string; password: string; inviteCode: string }) => apiClient.post<LoginResponse>('/auth/workers/signup', request),
    signUpOwner: (request: OwnerSignUpRequest) => {
        return apiClient.post<LoginResponse>('/auth/owners/signup', request);
    },

    /**
     * 로그인
     */
    login: (email: string, password: string) => {
        return apiClient.post<LoginResponse>('/auth/login', { email, password });
    },
};
