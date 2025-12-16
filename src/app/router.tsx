import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/Login/LoginPage';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { WorkersPage } from '../pages/Workers/WorkersPage';
import { WorkerDetailPage } from '../pages/Workers/WorkerDetailPage';
import { SchedulePage } from '../pages/Schedule/SchedulePage';
import { WorkLogsPage } from '../pages/WorkLogs/WorkLogsPage';
import { MyWorkLogsPage } from '../pages/WorkLogs/MyWorkLogsPage';
import { PayrollPage } from '../pages/Payroll/PayrollPage';
import { WorkerPayrollDetailPage } from '../pages/Payroll/WorkerPayrollDetailPage';
import { MyPayrollPage } from '../pages/Payroll/MyPayrollPage';
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
        path: '/my/worklogs',
        element: (
            <PrivateRoute>
                <MainLayout>
                    <MyWorkLogsPage />
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
        path: '/payroll/workers/:workerId',
        element: (
            <PrivateRoute>
                <MainLayout>
                    <WorkerPayrollDetailPage />
                </MainLayout>
            </PrivateRoute>
        ),
    },
    {
        path: '/my/payroll',
        element: (
            <PrivateRoute>
                <MainLayout>
                    <MyPayrollPage />
                </MainLayout>
            </PrivateRoute>
        ),
    },
    {
        path: '/my/payroll',
        element: (
            <PrivateRoute>
                <MainLayout>
                    <MyPayrollPage />
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
]);

