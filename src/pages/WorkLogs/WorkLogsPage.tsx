import { useState, useEffect } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { WorkLogFilterBar } from './WorkLogFilterBar';
import { WorkLogList } from './WorkLogList';
import { RejectReasonModal } from './RejectReasonModal';
import apiClient from '../../lib/apiClient';
import { WorkLog, WorkLogFilter } from '../../types/worklog';
import { Worker } from '../../types/worker';
import { useAuth } from '../../hooks/useAuth';
import { Navigate, useSearchParams } from 'react-router-dom';

export const WorkLogsPage = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const queryDate = searchParams.get('date');
    const queryStatus = searchParams.get('status');

    // 알바생은 /my/worklogs로 리다이렉트
    if (user?.role === 'WORKER') {
        return <Navigate to="/my/worklogs" replace />;
    }

    const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [rejectModal, setRejectModal] = useState<{
        open: boolean;
        workLogId?: string;
    }>({ open: false });

    // 초기 날짜 범위: 오늘 기준 ±7일, 상태: COMPLETED (검수 대기)
    const getInitialFilter = () => {
        if (queryDate) {
            return {
                fromDate: queryDate,
                toDate: queryDate,
                status: queryStatus || '',
            };
        }

        const today = new Date();
        const todayString = today.toISOString().split('T')[0];

        return {
            fromDate: todayString,
            toDate: todayString,
            status: '',
        };
    };

    const [filter, setFilter] = useState<WorkLogFilter>(getInitialFilter());

    const fetchWorkLogs = async () => {
        try {
            setLoading(true);
            const params: any = {
                from: new Date(filter.fromDate + 'T00:00:00+09:00').toISOString(),
                to: new Date(filter.toDate + 'T23:59:59+09:00').toISOString(),
            };

            if (filter.workerId) {
                params.workerId = filter.workerId;
            }
            if (filter.status) {
                params.status = filter.status;
            }

            const response = await apiClient.get<WorkLog[]>('/work-logs', { params });
            setWorkLogs(response.data);
        } catch (error) {
            console.error('Failed to fetch work logs:', error);
            alert('출퇴근 기록을 불러오는데 실패했습니다.');
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
        fetchWorkLogs();
    }, [filter]);

    const handleConfirm = async (workLogId: string) => {
        if (!window.confirm('이 출퇴근 기록을 확정하시겠습니까?')) {
            return;
        }

        try {
            await apiClient.post(`/work-logs/${workLogId}/confirm`);
            fetchWorkLogs();
        } catch (error) {
            console.error('Failed to confirm work log:', error);
            alert('출퇴근 기록 확정에 실패했습니다.');
        }
    };

    const handleRejectClick = (workLogId: string) => {
        setRejectModal({ open: true, workLogId });
    };

    const handleRejectSubmit = async (reason: string) => {
        if (!rejectModal.workLogId) return;

        try {
            await apiClient.post(`/work-logs/${rejectModal.workLogId}/reject`, {
                reason,
            });
            setRejectModal({ open: false });
            fetchWorkLogs();
        } catch (error) {
            console.error('Failed to reject work log:', error);
            alert('출퇴근 기록 반려에 실패했습니다.');
        }
    };

    return (
        <PageContainer title="출퇴근 기록 검수">
            <div className="mb-4 flex justify-between items-center">
                <p className="text-gray-600">총 {workLogs.length}개</p>
            </div>

            <WorkLogFilterBar
                filter={filter}
                onChange={setFilter}
                workers={workers}
            />

            <WorkLogList
                workLogs={workLogs}
                onConfirm={handleConfirm}
                onReject={handleRejectClick}
                isLoading={loading}
                isOwner={true}
            />

            <RejectReasonModal
                open={rejectModal.open}
                onClose={() => setRejectModal({ open: false })}
                onSubmit={handleRejectSubmit}
            />
        </PageContainer>
    );
};
