import { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import { Notification, NotificationListResponse } from '../types/notification';

/**
 * 알림 목록 조회 Hook
 */
export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get<NotificationListResponse>('/notifications');
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // 알림을 읽음 처리
    const markAsRead = async (id: string) => {
        try {
            await apiClient.post(`/notifications/${id}/read`);
            // 로컬 상태 업데이트
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === id ? { ...notif, isRead: true } : notif
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    // 모든 알림을 읽음 처리
    const markAllAsRead = async () => {
        try {
            await apiClient.post('/notifications/read-all');
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, isRead: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    // 컴포넌트 마운트 시 자동 조회
    useEffect(() => {
        fetchNotifications();
    }, []);

    return {
        notifications,
        unreadCount,
        loading,
        refresh: fetchNotifications,
        markAsRead,
        markAllAsRead
    };
};
