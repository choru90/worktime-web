import React from 'react';

interface LoadingProps {
    className?: string;
    message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ className = '', message = '로딩 중...' }) => {
    return (
        <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900 mb-3"></div>
            <p className="text-gray-500 text-sm">{message}</p>
        </div>
    );
};

