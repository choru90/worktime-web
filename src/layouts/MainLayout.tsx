import { ReactNode } from 'react';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';

interface MainLayoutProps {
    children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="flex">
                <Sidebar />
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
};
