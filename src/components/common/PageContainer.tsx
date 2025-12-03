import { ReactNode } from 'react';

interface PageContainerProps {
    children: ReactNode;
    title?: string;
}

export const PageContainer = ({ children, title }: PageContainerProps) => {
    return (
        <div className="p-6">
            {title && <h2 className="text-2xl font-bold mb-4 text-gray-800">{title}</h2>}
            <div className="bg-white rounded-lg shadow p-6">
                {children}
            </div>
        </div>
    );
};
