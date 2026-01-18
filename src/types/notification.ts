// 알림 타입 정의
export interface Notification {
    id: string;
    type: 'SCHEDULE_PROPOSED' | 'SCHEDULE_CONFIRMED' | 'SCHEDULE_REJECTED' | 'SCHEDULE_CANCELED';
    title: string;
    message: string;
    referenceId: string | null;
    isRead: boolean;
    createdAt: string;
}

export interface NotificationListResponse {
    notifications: Notification[];
    unreadCount: number;
}
