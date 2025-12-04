import { createContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../lib/apiClient';

interface User {
    userId: string;
    workerId?: string;
    role: 'OWNER' | 'WORKER';
    email?: string;
}

interface LoginResponse {
    accessToken: string;
    tokenType: string;
    userId: string;
    workerId?: string;
    role: 'OWNER' | 'WORKER';
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // 초기화: localStorage에서 토큰과 사용자 정보 복원
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Failed to parse saved user:', error);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<void> => {
        try {
            const response = await apiClient.post<LoginResponse>('/auth/login', {
                email,
                password,
            });

            const { accessToken, userId, workerId, role } = response.data;

            // 토큰 저장
            localStorage.setItem('accessToken', accessToken);

            // 사용자 정보 저장
            const userData: User = {
                userId,
                workerId,
                role,
                email,
            };

            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            setIsAuthenticated(true);
        } catch (error: any) {
            console.error('Login failed:', error);
            throw new Error(
                error.response?.data?.message || '로그인에 실패했습니다.'
            );
        }
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                user,
                login,
                logout,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
