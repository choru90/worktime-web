import { useState, FormEvent } from 'react';

interface RejectReasonModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
}

export const RejectReasonModal = ({
    open,
    onClose,
    onSubmit,
}: RejectReasonModalProps) => {
    const [reason, setReason] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!reason.trim()) {
            alert('반려 사유를 입력해주세요.');
            return;
        }

        onSubmit(reason);
        setReason('');
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">출퇴근 기록 반려</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            반려 사유 *
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            rows={4}
                            placeholder="반려 사유를 입력해주세요 (예: 출근 시간이 맞지 않음)"
                            required
                        />
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                setReason('');
                                onClose();
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                            반려 확정
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
