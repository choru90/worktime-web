import React from 'react';
import { Loading } from '../../components/common/Loading';

interface Props {
    date: string;
}

export const DashboardActionsSection: React.FC<Props> = ({ date }) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Action Center</h2>
            <div className="h-32 bg-gray-50 rounded flex items-center justify-center text-gray-400">
                Action List Placeholder
            </div>
        </div>
    );
};
