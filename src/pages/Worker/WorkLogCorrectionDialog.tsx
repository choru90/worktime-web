import { FormEvent, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import apiClient from '../../lib/apiClient';
import { WorkLog } from '../../types/worklog';

export function localDateTime(value: string): string {
    const date = new Date(value);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export const WorkLogCorrectionDialog = ({ log, onClose, onSaved, onConflict }: {
    log: WorkLog; onClose: () => void; onSaved: () => void; onConflict: () => void;
}) => {
    const [start, setStart] = useState(() => localDateTime(log.clockInAt));
    const [end, setEnd] = useState(() => localDateTime(log.clockOutAt ?? new Date().toISOString()));
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [stale, setStale] = useState(false);
    const pending = useRef(false);
    const dialog = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        dialog.current?.querySelector<HTMLInputElement>('input')?.focus();
        return () => previous?.focus();
    }, []);
    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (pending.current || stale) return;
        const from = new Date(start), to = new Date(end);
        if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || to <= from) {
            setError('퇴근 시간은 출근 시간 이후여야 합니다.'); return;
        }
        if (to.getTime() > Date.now()) { setError('미래의 퇴근 시간은 입력할 수 없습니다.'); return; }
        if (!reason.trim()) { setError('정정 사유를 입력해주세요.'); return; }
        pending.current = true; setSaving(true); setError('');
        try {
            await apiClient.post(`/worklogs/my/${log.id}/corrections`, {
                clockInAt: from.toISOString(), clockOutAt: to.toISOString(), reason: reason.trim(),
                expectedCorrectionCount: log.correctionCount ?? 0, expectedStatus: log.status,
            });
            onSaved();
        } catch (cause) {
            if (axios.isAxiosError(cause) && cause.response?.status === 409) {
                setStale(true); setError('기록이 변경되었거나 다른 근무와 겹칩니다. 입력은 유지됩니다. 닫은 뒤 최신 기록을 확인해주세요.'); onConflict();
            } else {
                setError(axios.isAxiosError(cause) ? cause.response?.data?.message ?? '정정하지 못했습니다. 입력을 확인하고 다시 시도해주세요.' : '정정하지 못했습니다. 다시 시도해주세요.');
            }
        } finally { pending.current = false; setSaving(false); }
    };
    return <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="correction-title" className="bg-white rounded-lg p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto" onKeyDown={event => {
            if (event.key === 'Escape' && !pending.current) onClose();
            if (event.key === 'Tab') {
                const focusable = Array.from(dialog.current?.querySelectorAll<HTMLElement>('input:not(:disabled), textarea:not(:disabled), button:not(:disabled)') ?? []);
                const first = focusable[0], last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
            }
        }}>
            <h2 id="correction-title" className="text-xl font-semibold">근무 시간 정정</h2>
            <p className="my-3 text-sm text-gray-600">정정 후 승인 대기로 제출됩니다. 사장님이 승인하면 급여에 반영됩니다. 입력 시간은 기기의 현지 시간입니다.</p>
            {log.rejectionReason && <p className="my-3 text-red-700">반려 사유: {log.rejectionReason}</p>}
            <form onSubmit={submit} className="space-y-4">
                <label className="block">출근 일시<input className="block border rounded p-2 w-full" type="datetime-local" step="1" required value={start} onChange={event => setStart(event.target.value)} disabled={saving} /></label>
                <label className="block">퇴근 일시<input className="block border rounded p-2 w-full" type="datetime-local" step="1" required value={end} onChange={event => setEnd(event.target.value)} disabled={saving} /></label>
                <div><label htmlFor="correction-reason" className="block">정정 사유</label><textarea id="correction-reason" className="block border rounded p-2 w-full" required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} disabled={saving} /></div>
                {error && <p role="alert" className="text-red-700">{error}</p>}
                <div className="flex justify-end gap-3"><button type="button" onClick={onClose} disabled={saving} className="border rounded px-4 py-2">닫기</button><button type="submit" disabled={saving || stale} className="bg-gray-900 text-white rounded px-4 py-2 disabled:opacity-50">{saving ? '제출 중…' : '정정 제출'}</button></div>
            </form>
        </div>
    </div>;
};
