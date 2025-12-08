import { useState, useEffect } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { ScheduleFilterBar } from './ScheduleFilterBar';
import { ScheduleList } from './ScheduleList';
import { ScheduleForm } from './ScheduleForm';
import apiClient from '../../lib/apiClient';
import { Schedule, ScheduleFilter } from '../../types/schedule';
import { Worker } from '../../types/worker';

export const SchedulePage = () => {
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
            const params: any = {
                fromDate: filter.fromDate,
                toDate: filter.toDate,
            };

            if (filter.workerId) {
                params.workerId = filter.workerId;
            }
            if (filter.status) {
                params.status = filter.status;
            }

            const response = await apiClient.get<Schedule[]>('/schedules', {
                params,
            });
            setSchedules(response.data);
        } catch (error) {
            console.error('Failed to fetch schedules:', error);
            alert('스케줄 목록을 불러오는데 실패했습니다.');
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
            await apiClient.post(`/schedules/${scheduleId}/approve`);
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
            await apiClient.post(`/schedules/${scheduleId}/reject`);
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
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
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
