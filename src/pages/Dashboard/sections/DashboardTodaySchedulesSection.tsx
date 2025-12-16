import React from 'react';

interface Props {
    date: string;
}

export const DashboardTodaySchedulesSection: React.FC<Props> = ({ date }) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Today's Schedule ({date})</h2>
            <div className="h-32 bg-gray-50 rounded flex items-center justify-center text-gray-400">
                Schedules Placeholder
            </div>
        </div>
    );
};
