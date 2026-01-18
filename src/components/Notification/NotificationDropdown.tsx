import { useNavigate } from 'react-router-dom';
import { X, Check } from 'lucide-react';
import { Notification } from '../../types/notification';

interface NotificationDropdownProps {
    notifications: Notification[];
    unreadCount: number;
    onClose: () => void;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
}

/**
 * 알림 드롭다운 컴포넌트
 * 알림 목록을 드롭다운 형식으로 표시
 */
export const NotificationDropdown = ({
    notifications,
    unreadCount,
    onClose,
    onMarkAsRead,
    onMarkAllAsRead
}: NotificationDropdownProps) => {
    const navigate = useNavigate();

    const handleNotificationClick = (notification: Notification) => {
        // 읽지 않은 알림이면 읽음 처리
        if (!notification.isRead) {
            onMarkAsRead(notification.id);
        }

        // 참조 ID가 있으면 해당 페이지로 이동
        if (notification.referenceId) {
            if (notification.type === 'SCHEDULE_PROPOSED' ||
                notification.type === 'SCHEDULE_CONFIRMED' ||
                notification.type === 'SCHEDULE_REJECTED') {
                navigate('/worker/schedules');
            }
        }

        onClose();
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;

        return date.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric'
        });
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'SCHEDULE_PROPOSED':
                return '📅';
            case 'SCHEDULE_CONFIRMED':
                return '✅';
            case 'SCHEDULE_REJECTED':
                return '❌';
            case 'SCHEDULE_CANCELED':
                return '🚫';
            default:
                return '📢';
        }
    };

    return (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold">알림</h3>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={onMarkAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            <Check className="w-4 h-4" />
                            모두 읽음
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* 알림 목록 */}
            <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                        알림이 없습니다
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-blue-50' : ''
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-2xl flex-shrink-0">
                                    {getNotificationIcon(notification.type)}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-medium text-gray-900 text-sm">
                                            {notification.title}
                                        </h4>
                                        {!notification.isRead && (
                                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {formatTime(notification.createdAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
