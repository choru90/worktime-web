import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../lib/apiClient';
import axios from 'axios';
import { WorkLogCorrectionDialog } from './WorkLogCorrectionDialog';
import { WorkLog } from '../../types/worklog';
interface Schedule { id: string; startAtUtc: string; endAtUtc: string; status: string; }
import { WorkerPayrollDetail } from '../../types/payroll';
import { WorkerPayrollDailyTable } from '../Payroll/WorkerPayrollDailyTable';

export const WorkerPages = ({ view }: { view: 'worklogs' | 'schedules' | 'payroll' }) => {
    const { user } = useAuth();
    const { workerId: selectedWorker } = useParams();
    const [search, setSearch] = useSearchParams();
    const now = new Date();
    const [month, setMonth] = useState(() => `${search.get('year') || now.getUTCFullYear()}-${String(search.get('month') || now.getUTCMonth() + 1).padStart(2, '0')}`);
    const [revision, setRevision] = useState(0);
    const [active, setActive] = useState(false);
    const [editing, setEditing] = useState<WorkLog | null>(null);
    const [notice, setNotice] = useState('');
    const [action, setAction] = useState<string | null>(null);
    const pending = useRef(false);
    const [logs, setLogs] = useState<WorkLog[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [payroll, setPayroll] = useState<WorkerPayrollDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const workerId = selectedWorker || user?.workerId;
    const permitted = selectedWorker ? user?.role === 'OWNER' : user?.role === 'WORKER';
    useEffect(() => { setError(''); setNotice(''); }, [month, view]);
    useEffect(() => {
        if (!permitted || !workerId || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return;
        let cancelled = false;
        async function load() {
            setLoading(true); setPayroll(null); setLogs([]); setSchedules([]);
            const [year, m] = month.split('-').map(Number);
            const from = `${month}-01`;
            const to = `${month}-${new Date(Date.UTC(year, m, 0)).getUTCDate()}`;
            try {
                if (user?.role === 'WORKER') {
                    const profile = await apiClient.get<{ active: boolean }>('/workers/my');
                    if (!cancelled) setActive(profile.data.active);
                }
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
    }, [month, permitted, workerId, view, revision, user?.role]);
    const selectMonth = (value: string) => {
        setMonth(value);
        if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
            const [year, selectedMonth] = value.split('-');
            const next = new URLSearchParams(search);
            next.set('year', year); next.set('month', String(Number(selectedMonth)));
            setSearch(next, { replace: true });
        }
    };
    const respond = async (id: string, decision: 'confirm' | 'reject') => {
        if (pending.current || !active) return;
        pending.current = true; setAction(id); setError(''); setNotice('');
        try {
            await apiClient.post(`/worker/schedules/${id}/${decision}`);
            setNotice(decision === 'confirm' ? '일정을 승인했습니다.' : '일정을 거절했습니다.');
        } catch (cause) {
            setError(axios.isAxiosError(cause) ? cause.response?.data?.message ?? '일정이 변경되었거나 처리하지 못했습니다. 최신 일정을 확인해주세요.' : '일정을 처리하지 못했습니다. 다시 시도해주세요.');
        } finally { pending.current = false; setAction(null); setRevision(value => value + 1); }
    };
    if (!permitted) return <Navigate to="/dashboard" replace />;
    return <section className="p-4 sm:p-6 space-y-5 min-w-0">
        <h1 className="text-2xl font-semibold">{view === 'worklogs' ? '나의 근무 기록' : view === 'schedules' ? '나의 일정' : '예상 급여 상세'}</h1>
        <label className="block">조회 월 (UTC 출근일 기준) <input aria-label="조회 월" type="month" className="border rounded p-2" value={month} onChange={e => selectMonth(e.target.value)} /></label>
        {notice && <p role="status" className="text-green-800">{notice}</p>}
        {user?.role === 'WORKER' && !loading && !active && <p className="rounded bg-gray-100 p-3">퇴사한 직원은 과거 기록과 급여를 조회할 수 있습니다. 근무 기록과 일정 변경은 제한됩니다.</p>}
        {loading && <p role="status">불러오는 중…</p>}
        {error && <p role="alert" className="text-red-700">{error}</p>}
        {view === 'worklogs' && !loading && <div className="space-y-3">{logs.length === 0 && !error && <p>근무 기록이 없습니다.</p>}{logs.map(log => <article key={log.id} data-testid={`worklog-${log.id}`} className="bg-white rounded p-4 space-y-2">
            <p>{new Date(log.clockInAt).toLocaleString('ko-KR')} → {log.clockOutAt ? new Date(log.clockOutAt).toLocaleString('ko-KR') : '진행 중'}</p>
            <p>{({ ONGOING: '근무 중', COMPLETED: '승인 대기', CONFIRMED: '승인 완료', REJECTED: '반려' } as Record<string, string>)[log.status] || log.status} · {log.durationMinutes ?? 0}분</p>
            {log.rejectionReason && <p className="text-red-700">반려 사유: {log.rejectionReason}</p>}
            {log.correctionReason && <p>정정 {log.correctionCount ?? 0}회 · {log.correctionReason}</p>}
            {active && ['ONGOING', 'COMPLETED', 'REJECTED'].includes(log.status) && <button className="border rounded px-3 py-2" onClick={() => { setNotice(''); setEditing(log); }}>{log.status === 'REJECTED' ? '정정하여 재제출' : '시간 정정'}</button>}
        </article>)}</div>}
        {view === 'schedules' && !loading && <div className="space-y-3">{schedules.length === 0 && !error && <p>일정이 없습니다.</p>}{schedules.map(s => <article key={s.id} data-testid={`schedule-${s.id}`} className="bg-white rounded p-4 space-y-3">
            <p>{new Date(s.startAtUtc).toLocaleString('ko-KR')} → {new Date(s.endAtUtc).toLocaleString('ko-KR')}</p><p>{s.status}</p>
            {active && s.status === 'PROPOSED_BY_OWNER' && <div className="flex gap-3"><button disabled={action !== null} onClick={() => respond(s.id, 'confirm')} className="bg-gray-900 text-white rounded px-4 py-2">{action === s.id ? '처리 중…' : '일정 승인'}</button><button disabled={action !== null} onClick={() => respond(s.id, 'reject')} className="border rounded px-4 py-2">일정 거절</button></div>}
        </article>)}</div>}
        {editing && <WorkLogCorrectionDialog log={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setNotice('정정하여 승인 대기로 제출했습니다.'); setRevision(value => value + 1); }} onConflict={() => setRevision(value => value + 1)} />}
        {view === 'payroll' && <><p>출근일의 UTC 월에 전체 귀속되는 승인 기록의 예상 금액입니다. 세금·보험·법정 가산수당 및 실제 지급액은 포함하지 않습니다.</p>{payroll && <><h2 className="text-xl">{payroll.workerName} · {Number(payroll.totalAmount).toLocaleString()}원</h2><WorkerPayrollDailyTable items={payroll.dailyDetails} /></>}</>}
    </section>;
};
