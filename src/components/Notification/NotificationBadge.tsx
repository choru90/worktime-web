import { Bell } from 'lucide-react';

interface NotificationBadgeProps {
    count: number;
    onClick: () => void;
}

/**
 * 알림 뱃지 컴포넌트
 * 헤더에 표시되는 알림 아이콘 및 읽지 않은 알림 개수 뱃지
 */
export const NotificationBadge = ({ count, onClick }: NotificationBadgeProps) => {
    return (
        <button
            onClick={onClick}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="알림"
        >
            <Bell className="w-6 h-6 text-gray-700" />
            {count > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </button>
    );
};
