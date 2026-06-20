import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/Login/LoginPage';
import { SignupPage } from '../pages/Signup/SignupPage';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { WorkersPage } from '../pages/Workers/WorkersPage';
import { WorkerDetailPage } from '../pages/Workers/WorkerDetailPage';
import { SchedulePage } from '../pages/Schedule/SchedulePage';
import { WorkLogsPage } from '../pages/WorkLogs/WorkLogsPage';
import { PayrollPage } from '../pages/Payroll/PayrollPage';
import { StoreSettingsPage } from '../pages/Store/StoreSettingsPage';
import { MainLayout } from '../layouts/MainLayout';
import { PrivateRoute, PublicRoute } from './PrivateRoute';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
    },
    {
        path: '/login',
        element: (
            <PublicRoute>
                <LoginPage />
            </PublicRoute>
        ),
    },
    {
        path: '/signup',
        element: (
            <PublicRoute>
                <SignupPage />
            </PublicRoute>
        ),
    },
    {
        path: '/dashboard',
        element: (
            <PrivateRoute>
                <MainLayout>
                    <DashboardPage />
                </MainLayout>
            </PrivateRoute>
        ),
    },
    {
        path: '/workers',
        element: (
            <PrivateRoute>
                <MainLayout>
                    <WorkersPage />
                </MainLayout>
            </PrivateRoute>
        ),
    },
    {
        path: '/workers/:workerId',
        element: (
            <PrivateRoute>
                <MainLayout>
                    <WorkerDetailPage />
                </MainLayout>
            </PrivateRoute>
        ),
    },
    {
        path: '/schedule',
        element: (
            <PrivateRoute>
                <MainLayout>
                    <SchedulePage />
                </MainLayout>
            </PrivateRoute>
        ),
    },
    {
        path: '/worklogs',
        element: (
            <PrivateRoute>
                <MainLayout>
                    <WorkLogsPage />
                </MainLayout>
            </PrivateRoute>
        ),
    },
    {
        path: '/payroll',
        element: (
            <PrivateRoute>
                <MainLayout>
                    <PayrollPage />
                </MainLayout>
            </PrivateRoute>
        ),
    },
    {
        path: '/owner/dashboard',
        element: (
            <PrivateRoute>
                <MainLayout>
                    <DashboardPage />
                </MainLayout>
            </PrivateRoute>
        ),
    },
    {
        path: '/store/settings',
        element: (
            <PrivateRoute>
                <MainLayout>
                    <StoreSettingsPage />
                </MainLayout>
            </PrivateRoute>
        ),
    },
]);

