import { useAuth } from '../../hooks/useAuth';
import { NavLink } from 'react-router-dom';

const menuItems = [
    { path: '/dashboard', label: '대시보드', icon: '📊' },
    { path: '/store/settings', label: '영업장 설정', icon: '🏪' },
    { path: '/workers', label: '계약 관리', icon: '👥' },
    { path: '/schedule', label: '스케줄 관리', icon: '📅' },
    { path: '/worklogs', label: '출결 관리', icon: '⏰' },
    { path: '/payroll', label: '급여 관리', icon: '💰' },
];

export const Sidebar = () => {
    const { user } = useAuth();
    const items = user?.role === 'WORKER' ? [
        {path:'/dashboard',label:'출퇴근',icon:'⏰'},
        {path:'/my/worklogs',label:'근무 기록',icon:'📋'},
        {path:'/my/schedules',label:'나의 일정',icon:'📅'},
        {path:'/my/payroll',label:'예상 급여',icon:'💰'},
    ] : menuItems;
    return (
        <aside className="w-full md:w-64 md:shrink-0 bg-white border-r border-gray-200 md:min-h-screen">
            {/* 로고 영역 */}
            <div className="hidden md:flex h-16 items-center px-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="font-semibold text-gray-900">Worktime</span>
                </div>
            </div>

            {/* 네비게이션 */}
            <nav className="p-2 md:p-4 flex overflow-x-auto md:block md:space-y-1">
                {items.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex shrink-0 items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`
                        }
                    >
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};
