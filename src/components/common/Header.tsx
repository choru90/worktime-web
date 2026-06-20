import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationBadge } from '../Notification/NotificationBadge';
import { NotificationDropdown } from '../Notification/NotificationDropdown';

interface HeaderProps { }

export const Header = ({ }: HeaderProps) => {
    const { logout, user } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications();
    const [showNotifications, setShowNotifications] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            logout();
        }
    };
    const toggleNotifications = () => {
        setShowNotifications(prev => !prev);
    };

    // 드롭다운 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };

        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotifications]);

    // 드롭다운이 열릴 때 알림 새로고침
    useEffect(() => {
        if (showNotifications) {
            refresh();
        }
    }, [showNotifications, refresh]);

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
            <h1 className="text-lg font-semibold text-gray-900">Worktime 사장님용</h1>

            <div className="flex items-center gap-4">
                {user && (
                    <div className="flex items-center gap-3">
                        <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                            사장님
                        </span>
                        {user.email && (
                            <span className="text-sm text-gray-600">{user.email}</span>
                        )}
                    </div>
                )}

                {/* 알림 뱃지 */}
                <div className="relative" ref={dropdownRef}>
                    <NotificationBadge
                        count={unreadCount}
                        onClick={toggleNotifications}
                    />

                    {/* 알림 드롭다운 */}
                    {showNotifications && (
                        <NotificationDropdown
                            notifications={notifications}
                            unreadCount={unreadCount}
                            onClose={() => setShowNotifications(false)}
                            onMarkAsRead={markAsRead}
                            onMarkAllAsRead={markAllAsRead}
                        />
                    )}
                </div>

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

