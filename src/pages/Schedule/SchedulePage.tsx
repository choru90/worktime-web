import { useState, useEffect } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { ScheduleFilterBar } from './ScheduleFilterBar';
import { ScheduleList } from './ScheduleList';
import { ScheduleForm } from './ScheduleForm';
import apiClient from '../../lib/apiClient';
import { Schedule, ScheduleFilter } from '../../types/schedule';
import { Worker } from '../../types/worker';
import { useAuth } from '../../hooks/useAuth';

export const SchedulePage = () => {
    const { user } = useAuth();
    const isOwner = user?.role === 'OWNER';

    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // 초기 날짜 범위: 오늘 기준 ±7일
    const getInitialDateRange = () => {
        const today = new Date();
        const fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 7);
        const toDate = new Date(today);
        toDate.setDate(today.getDate() + 7);

        return {
            fromDate: fromDate.toISOString().split('T')[0],
            toDate: toDate.toISOString().split('T')[0],
        };
    };

    const [filter, setFilter] = useState<ScheduleFilter>(getInitialDateRange());

    const fetchSchedules = async () => {
        try {
            setLoading(true);

            // 백엔드 파라미터 형식에 맞게 변환 (OffsetDateTime)
            const params: any = {};

            if (filter.fromDate) {
                params.from = `${filter.fromDate}T00:00:00+09:00`;
            }
            if (filter.toDate) {
                params.to = `${filter.toDate}T23:59:59+09:00`;
            }

            if (filter.workerId) {
                params.workerId = filter.workerId;
            }
            if (filter.status) {
                params.status = filter.status;
            }

            // 사용자 역할에 따라 다른 API 호출
            const endpoint = isOwner ? '/schedules' : '/worker/schedules';
            const response = await apiClient.get<any>(endpoint, {
                params,
            });

            console.log('API Response:', response.data);

            // API 응답 형식에 따라 데이터 추출
            let schedulesData: Schedule[];
            if (Array.isArray(response.data)) {
                schedulesData = response.data;
            } else if (response.data?.schedules && Array.isArray(response.data.schedules)) {
                // ScheduleListResponse 형식: { schedules: [...], totalCount: n }
                schedulesData = response.data.schedules;
            } else if (response.data?.content && Array.isArray(response.data.content)) {
                // 페이징된 응답의 경우
                schedulesData = response.data.content;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                schedulesData = response.data.data;
            } else {
                console.warn('Unexpected API response format:', response.data);
                schedulesData = [];
            }

            setSchedules(schedulesData);
        } catch (error) {
            console.error('Failed to fetch schedules:', error);
            alert('스케줄 목록을 불러오는데 실패했습니다.');
            setSchedules([]); // 에러 발생 시 빈 배열로 설정
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkers = async () => {
        try {
            const response = await apiClient.get<Worker[]>('/workers');
            setWorkers(response.data);
        } catch (error) {
            console.error('Failed to fetch workers:', error);
        }
    };

    useEffect(() => {
        fetchWorkers();
    }, []);

    useEffect(() => {
        fetchSchedules();
    }, [filter]);

    const handleApprove = async (scheduleId: string) => {
        if (!window.confirm('이 스케줄을 승인하시겠습니까?')) {
            return;
        }

        try {
            // 역할에 따라 다른 API 호출
            const endpoint = isOwner
                ? `/schedules/${scheduleId}/confirm`
                : `/worker/schedules/${scheduleId}/confirm`;
            await apiClient.post(endpoint);
            fetchSchedules();
        } catch (error) {
            console.error('Failed to approve schedule:', error);
            alert('스케줄 승인에 실패했습니다.');
        }
    };

    const handleReject = async (scheduleId: string) => {
        if (!window.confirm('이 스케줄을 거절하시겠습니까?')) {
            return;
        }

        try {
            // 역할에 따라 다른 API 호출
            const endpoint = isOwner
                ? `/schedules/${scheduleId}/reject`
                : `/worker/schedules/${scheduleId}/reject`;
            await apiClient.post(endpoint);
            fetchSchedules();
        } catch (error) {
            console.error('Failed to reject schedule:', error);
            alert('스케줄 거절에 실패했습니다.');
        }
    };

    const handleScheduleCreated = () => {
        setShowCreateModal(false);
        fetchSchedules();
    };

    return (
        <PageContainer title="근무 스케줄 관리">
            <div className="mb-4 flex justify-between items-center">
                <p className="text-gray-600">총 {schedules.length}개</p>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gray-900 hover:bg-gray-800 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                    + 스케줄 제안
                </button>
            </div>

            <ScheduleFilterBar
                filter={filter}
                onChange={setFilter}
                workers={workers}
            />

            <ScheduleList
                schedules={schedules}
                onApprove={handleApprove}
                onReject={handleReject}
                isLoading={loading}
            />

            {/* 스케줄 제안 모달 */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">스케줄 제안 생성</h3>
                        <ScheduleForm
                            workers={workers}
                            onSubmit={handleScheduleCreated}
                            onCancel={() => setShowCreateModal(false)}
                        />
                    </div>
                </div>
            )}
        </PageContainer>
    );
};
