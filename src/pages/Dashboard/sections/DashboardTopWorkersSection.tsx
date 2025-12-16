import React from 'react';

interface Props {
    date: string;
}

export const DashboardTopWorkersSection: React.FC<Props> = ({ date }) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Top Workers (Last 7 Days)</h2>
            <div className="h-40 bg-gray-50 rounded flex items-center justify-center text-gray-400">
                Top Workers Placeholder
            </div>
        </div>
    );
};
