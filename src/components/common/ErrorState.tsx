import React from 'react';

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
    className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
    message = 'Something went wrong',
    onRetry,
    className = ''
}) => {
    return (
        <div className={`flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-lg ${className}`}>
            <div className="text-red-500 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <p className="text-red-600 font-medium mb-3">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-md hover:bg-red-50 text-sm font-medium transition-colors"
                >
                    Try Again
                </button>
            )}
        </div>
    );
};
