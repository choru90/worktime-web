import { useAuth } from '../hooks/useAuth';

interface HeaderProps { }

export const Header = ({ }: HeaderProps) => {
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    return (
        <header className="bg-blue-600 text-white h-16 flex items-center justify-between px-6 shadow-md">
            <h1 className="text-xl font-bold">Worktime - 아르바이트 관리</h1>
            <button
                onClick={handleLogout}
                className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition-colors"
            >
                로그아웃
            </button>
        </header>
    );
};
