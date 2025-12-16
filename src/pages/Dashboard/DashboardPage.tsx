import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { DashboardSummarySection } from './sections/DashboardSummarySection';
import { DashboardActionsSection } from './sections/DashboardActionsSection';
import { DashboardTodaySchedulesSection } from './sections/DashboardTodaySchedulesSection';
import { DashboardAttendanceSection } from './sections/DashboardAttendanceSection';
import { DashboardTopWorkersSection } from './sections/DashboardTopWorkersSection';

export const DashboardPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // YYYY-MM-DD format
    const dateParam = searchParams.get('date');
    const today = new Date().toISOString().split('T')[0];
    const currentDate = dateParam || today;

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchParams({ date: e.target.value });
    };

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
                        className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>
            </div>

            {/* Main Layout - Grid */}
            <div className="flex flex-col gap-6">

                {/* 1. Top Section: Actions & Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <DashboardSummarySection date={currentDate} />
                    </div>
                    <div className="lg:col-span-1" id="dashboard-actions">
                        <DashboardActionsSection date={currentDate} />
                    </div>
                </div>

                {/* 2. Middle Section: Attendance & Schedules */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DashboardAttendanceSection date={currentDate} />
                    <div id="today-schedules">
                        <DashboardTodaySchedulesSection date={currentDate} />
                    </div>
                </div>

                {/* 3. Bottom Section: Top Workers */}
                <div className="grid grid-cols-1">
                    <DashboardTopWorkersSection date={currentDate} />
                </div>
            </div>
        </PageContainer>
    );
};
