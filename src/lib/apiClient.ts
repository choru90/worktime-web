import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - JWT 토큰 자동 추가
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - 401/403 에러 처리
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // 401 Unauthorized 또는 403 Forbidden
        if (error.response?.status === 401 || error.response?.status === 403) {
            // 토큰이 만료되었거나 유효하지 않거나 권한이 없는 경우
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');

            // 현재 경로가 /login이 아닌 경우에만 리다이렉트
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
