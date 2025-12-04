import { useAuth } from '../../hooks/useAuth';

interface HeaderProps { }

export const Header = ({ }: HeaderProps) => {
    const { logout, user } = useAuth();

    const handleLogout = () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            logout();
        }
    };

    const getRoleLabel = (role: string) => {
        return role === 'OWNER' ? '사장님' : '알바생';
    };

    return (
        <header className="bg-blue-600 text-white h-16 flex items-center justify-between px-6 shadow-md">
            <h1 className="text-xl font-bold">Worktime - 아르바이트 관리</h1>

            <div className="flex items-center gap-4">
                {user && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm bg-blue-700 px-3 py-1 rounded-full">
                            {getRoleLabel(user.role)}
                        </span>
                        {user.email && (
                            <span className="text-sm">{user.email}</span>
                        )}
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition-colors"
                >
                    로그아웃
                </button>
            </div>
        </header>
    );
};
