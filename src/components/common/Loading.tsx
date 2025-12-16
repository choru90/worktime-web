import React from 'react';

interface LoadingProps {
    className?: string;
    message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ className = '', message = 'Loading...' }) => {
    return (
        <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-gray-500 text-sm">{message}</p>
        </div>
    );
};
