import { useState, useEffect } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { ScheduleFilterBar } from './ScheduleFilterBar';
import { ScheduleList } from './ScheduleList';
import { ScheduleCalendar } from './ScheduleCalendar';
import { ScheduleForm } from './ScheduleForm';
import { WorkLogEntryModal } from './WorkLogEntryModal';
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
    const [selectedScheduleForWorkLog, setSelectedScheduleForWorkLog] = useState<Schedule | null>(null);
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

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
            let rawSchedules: any[];
            if (Array.isArray(response.data)) {
                rawSchedules = response.data;
            } else if (response.data?.schedules && Array.isArray(response.data.schedules)) {
                // ScheduleListResponse 형식: { schedules: [...], totalCount: n }
                rawSchedules = response.data.schedules;
            } else if (response.data?.content && Array.isArray(response.data.content)) {
                // 페이징된 응답의 경우
                rawSchedules = response.data.content;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                rawSchedules = response.data.data;
            } else {
                console.warn('Unexpected API response format:', response.data);
                rawSchedules = [];
            }

            // startAtUtc, endAtUtc를 date, startTime, endTime으로 변환
            const schedulesData: Schedule[] = rawSchedules.map((s: any) => {
                let date = s.date || '';
                let startTime = s.startTime || '';
                let endTime = s.endTime || '';

                // UTC 시간 필드가 있으면 변환
                if (s.startAtUtc && !date) {
                    const startDate = new Date(s.startAtUtc);
                    date = startDate.toISOString().split('T')[0];
                    startTime = startDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
                }
                if (s.endAtUtc && !endTime) {
                    const endDate = new Date(s.endAtUtc);
                    endTime = endDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
                }

                return {
                    ...s,
                    date,
                    startTime,
                    endTime,
                };
            });

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

    const handleWriteWorkLog = (schedule: Schedule) => {
        setSelectedScheduleForWorkLog(schedule);
    };

    const handleWorkLogSubmitted = () => {
        setSelectedScheduleForWorkLog(null);
        fetchSchedules();
        alert('근무 기록이 저장되었습니다.');
    };

    return (
        <PageContainer title="근무 스케줄 관리">
            <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <p className="text-gray-600">총 {schedules.length}개</p>
                    {/* 뷰 모드 전환 버튼 */}
                    <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'calendar'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            캘린더
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'list'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            리스트
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gray-900 hover:bg-gray-800 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                    + 스케줄 제안
                </button>
            </div>

            {/* 리스트 뷰일 때만 필터 표시 */}
            {viewMode === 'list' && (
                <ScheduleFilterBar
                    filter={filter}
                    onChange={setFilter}
                    workers={workers}
                />
            )}

            {/* 캘린더 또는 리스트 뷰 */}
            {viewMode === 'calendar' ? (
                <ScheduleCalendar
                    schedules={schedules}
                />
            ) : (
                <ScheduleList
                    schedules={schedules}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onWriteWorkLog={handleWriteWorkLog}
                    isLoading={loading}
                    isWorker={!isOwner}
                />
            )}

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

            {/* 근무 기록 작성 모달 (알바생용) */}
            {selectedScheduleForWorkLog && (
                <WorkLogEntryModal
                    scheduleId={selectedScheduleForWorkLog.id}
                    scheduledDate={selectedScheduleForWorkLog.date || ''}
                    scheduledStartTime={selectedScheduleForWorkLog.startTime || ''}
                    scheduledEndTime={selectedScheduleForWorkLog.endTime || ''}
                    onSubmit={handleWorkLogSubmitted}
                    onCancel={() => setSelectedScheduleForWorkLog(null)}
                />
            )}
        </PageContainer>
    );
};
