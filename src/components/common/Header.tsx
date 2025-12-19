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
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
            <h1 className="text-lg font-semibold text-gray-900">아르바이트 관리</h1>

            <div className="flex items-center gap-4">
                {user && (
                    <div className="flex items-center gap-3">
                        <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                            {getRoleLabel(user.role)}
                        </span>
                        {user.email && (
                            <span className="text-sm text-gray-600">{user.email}</span>
                        )}
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="bg-gray-900 hover:bg-gray-800 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                    로그아웃
                </button>
            </div>
        </header>
    );
};

