import { ReactNode } from 'react';

interface PageContainerProps {
    children: ReactNode;
    title?: string;
}

export const PageContainer = ({ children, title }: PageContainerProps) => {
    return (
        <div className="flex-1 bg-gray-50 p-6 overflow-auto">
            {title && <h2 className="text-xl font-semibold mb-6 text-gray-900">{title}</h2>}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {children}
            </div>
        </div>
    );
};

