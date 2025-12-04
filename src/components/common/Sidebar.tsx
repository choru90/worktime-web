import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps { }

const ownerMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/workers', label: 'Workers', icon: '👥' },
    { path: '/schedule', label: 'Schedule', icon: '📅' },
    { path: '/worklogs', label: 'Work Logs', icon: '⏰' },
    { path: '/payroll', label: 'Payroll', icon: '💰' },
];

const workerMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/schedule', label: 'My Schedule', icon: '📅' },
    { path: '/worklogs', label: 'My Work Logs', icon: '⏰' },
    { path: '/payroll', label: 'My Payroll', icon: '💰' },
];

export const Sidebar = ({ }: SidebarProps) => {
    const { user } = useAuth();

    const menuItems = user?.role === 'OWNER' ? ownerMenuItems : workerMenuItems;

    return (
        <aside className="w-64 bg-gray-800 text-white min-h-screen p-4">
            <nav className="space-y-2">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`
                        }
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};
