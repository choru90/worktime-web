import { useState } from 'react';

interface AuthState {
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
}

export const useAuth = (): AuthState => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return localStorage.getItem('isAuthenticated') === 'true';
    });

    const login = () => {
        localStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('isAuthenticated');
        setIsAuthenticated(false);
    };

    return { isAuthenticated, login, logout };
};
