import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { DashboardSummarySection } from './sections/DashboardSummarySection';
import { DashboardTodaySchedulesSection } from './sections/DashboardTodaySchedulesSection';
import { DashboardAttendanceSection } from './sections/DashboardAttendanceSection';
import { DashboardPendingApprovalsSection } from './sections/DashboardPendingApprovalsSection';
import { WorkerDashboard } from './WorkerDashboard';
import { useAuth } from '../../hooks/useAuth';

export const DashboardPage = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    // YYYY-MM-DD format
    const dateParam = searchParams.get('date');
    const today = new Date().toISOString().split('T')[0];
    const currentDate = dateParam || today;

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchParams({ date: e.target.value });
    };

    // Worker용 대시보드
    if (user?.role === 'WORKER') {
        return (
            <PageContainer title="대시보드">
                <WorkerDashboard />
            </PageContainer>
        );
    }

    // Owner용 대시보드
    return (
        <PageContainer title="대시보드">
            {/* Header / Filter */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm">
                    <label className="text-sm font-medium text-gray-700">기준 날짜:</label>
                    <input
                        type="date"
                        value={currentDate}
                        onChange={handleDateChange}
                        className="border-gray-300 rounded-md shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm"
                    />
                </div>
            </div>

            {/* Main Layout - Grid */}
            <div className="flex flex-col gap-6">

                {/* 1. Top Section: Summary (전체 너비로 확장) */}
                <DashboardSummarySection date={currentDate} />

                {/* 2. Middle Section: Attendance & Schedules */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DashboardAttendanceSection date={currentDate} />
                    <div id="today-schedules">
                        <DashboardTodaySchedulesSection date={currentDate} />
                    </div>
                </div>

                {/* 3. Bottom Section: Pending Approvals (신규 추가) */}
                <div id="dashboard-actions">
                    <DashboardPendingApprovalsSection date={currentDate} />
                </div>
            </div>
        </PageContainer>
    );
};

