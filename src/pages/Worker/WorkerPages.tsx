import { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../lib/apiClient';
import { WorkLog } from '../../types/worklog';
interface Schedule { id: string; startAtUtc: string; endAtUtc: string; status: string; }
import { WorkerPayrollDetail } from '../../types/payroll';
import { WorkerPayrollDailyTable } from '../Payroll/WorkerPayrollDailyTable';

export const WorkerPages = ({ view }: { view: 'worklogs' | 'schedules' | 'payroll' }) => {
    const { user } = useAuth();
    const { workerId: selectedWorker } = useParams();
    const [search] = useSearchParams();
    const now = new Date();
    const [month, setMonth] = useState(() => `${search.get('year') || now.getFullYear()}-${String(search.get('month') || now.getMonth() + 1).padStart(2, '0')}`);
    const [logs, setLogs] = useState<WorkLog[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [payroll, setPayroll] = useState<WorkerPayrollDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const workerId = selectedWorker || user?.workerId;
    const permitted = selectedWorker ? user?.role === 'OWNER' : user?.role === 'WORKER';
    useEffect(() => {
        if (!permitted || !workerId || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return;
        let cancelled = false;
        async function load() {
            setLoading(true); setError(''); setPayroll(null); setLogs([]); setSchedules([]);
            const [year, m] = month.split('-').map(Number);
            const from = `${month}-01`;
            const to = `${month}-${new Date(Date.UTC(year, m, 0)).getUTCDate()}`;
            try {
                if (view === 'worklogs') {
                    const response = await apiClient.get<WorkLog[]>('/worklogs/my', { params: { fromDate: from, toDate: to } });
                    if (!cancelled) setLogs(response.data);
                } else if (view === 'schedules') {
                    const response = await apiClient.get<{ schedules: Schedule[] }>('/worker/schedules', { params: { from: `${from}T00:00:00Z`, to: new Date(Date.UTC(year, m, 1)).toISOString() } });
                    if (!cancelled) setSchedules(response.data.schedules);
                } else {
                    const response = await apiClient.get<WorkerPayrollDetail>(`/payroll/workers/${workerId}/monthly`, { params: { year, month: m } });
                    if (!cancelled) setPayroll(response.data);
                }
            } catch { if (!cancelled) setError('조회하지 못했습니다. 연결과 접근 권한을 확인하고 다시 시도해주세요.'); }
            finally { if (!cancelled) setLoading(false); }
        }
        void load();
        return () => { cancelled = true; };
    }, [month, permitted, workerId, view]);
    if (!permitted) return <Navigate to="/dashboard" replace />;
    return <section className="p-4 sm:p-6 space-y-5 min-w-0">
        <h1 className="text-2xl font-semibold">{view === 'worklogs' ? '나의 근무 기록' : view === 'schedules' ? '나의 일정' : '예상 급여 상세'}</h1>
        <label className="block">조회 월 <input aria-label="조회 월" type="month" className="border rounded p-2" value={month} onChange={e => setMonth(e.target.value)} /></label>
        {loading && <p role="status">불러오는 중…</p>}
        {error && <p role="alert" className="text-red-700">{error}</p>}
        {view === 'worklogs' && !loading && !error && <div className="space-y-3">{logs.length === 0 && <p>근무 기록이 없습니다.</p>}{logs.map(log => <article key={log.id} className="bg-white rounded p-4"><p>{new Date(log.clockInAt).toLocaleString('ko-KR')} → {log.clockOutAt ? new Date(log.clockOutAt).toLocaleString('ko-KR') : '진행 중'}</p><p>{({ ONGOING: '근무 중', COMPLETED: '승인 대기', CONFIRMED: '승인 완료', REJECTED: '반려' } as Record<string, string>)[log.status] || log.status} · {log.durationMinutes ?? 0}분</p></article>)}</div>}
        {view === 'schedules' && !loading && !error && <div className="space-y-3">{schedules.length === 0 && <p>일정이 없습니다.</p>}{schedules.map(s => <article key={s.id} className="bg-white rounded p-4"><p>{new Date(s.startAtUtc).toLocaleString('ko-KR')} → {new Date(s.endAtUtc).toLocaleString('ko-KR')}</p><p>{s.status}</p></article>)}</div>}
        {view === 'payroll' && <><p>승인된 기록의 예상 금액입니다. 세금·보험·법정 가산수당 및 실제 지급액은 포함하지 않습니다.</p>{payroll && <><h2 className="text-xl">{payroll.workerName} · {Number(payroll.totalAmount).toLocaleString()}원</h2><WorkerPayrollDailyTable items={payroll.dailyDetails} /></>}</>}
    </section>;
};
