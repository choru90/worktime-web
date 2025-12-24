import { useState } from 'react';
import apiClient from '../../lib/apiClient';

interface InviteCodeResponse {
    inviteCode: string;
    expiresAt: string;
    workerName: string;
}

interface InviteCodeSectionProps {
    workerId: string;
    hasAccount: boolean;
}

export const InviteCodeSection = ({ workerId, hasAccount }: InviteCodeSectionProps) => {
    const [inviteCode, setInviteCode] = useState<InviteCodeResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateInviteCode = async () => {
        try {
            setLoading(true);
            const response = await apiClient.post<InviteCodeResponse>(`/workers/${workerId}/invite`);
            setInviteCode(response.data);
        } catch (error: any) {
            console.error('Failed to generate invite code:', error);
            const message = error.response?.data?.message || '초대 코드 생성에 실패했습니다.';
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (inviteCode) {
            await navigator.clipboard.writeText(inviteCode.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatExpiry = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (hasAccount) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                    <span className="text-green-600 text-lg">✓</span>
                    <span className="text-gray-700 font-medium">계정 연결 완료</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                    이 알바생은 이미 계정이 연결되어 있습니다.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">알바생 계정 연결</h3>

            {!inviteCode ? (
                <div>
                    <p className="text-gray-600 mb-4">
                        알바생이 직접 출퇴근 기록을 할 수 있도록 계정을 연결하세요.
                        초대 코드를 생성하여 알바생에게 전달해주세요.
                    </p>
                    <button
                        onClick={generateInviteCode}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors disabled:bg-gray-400"
                    >
                        {loading ? '생성 중...' : '초대 코드 생성'}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-600 mb-2">초대 코드</p>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-bold tracking-widest text-blue-800">
                                {inviteCode.inviteCode}
                            </span>
                            <button
                                onClick={copyToClipboard}
                                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            >
                                {copied ? '복사됨!' : '복사'}
                            </button>
                        </div>
                        <p className="text-xs text-blue-500 mt-2">
                            만료: {formatExpiry(inviteCode.expiresAt)}
                        </p>
                    </div>

                    <div className="text-sm text-gray-600">
                        <p className="font-medium mb-1">사용 방법:</p>
                        <ol className="list-decimal list-inside space-y-1 text-gray-500">
                            <li>알바생에게 위 초대 코드를 전달하세요</li>
                            <li>알바생은 회원가입 페이지에서 초대 코드를 입력합니다</li>
                            <li>회원가입 완료 후 출퇴근 기록이 가능합니다</li>
                        </ol>
                    </div>

                    <button
                        onClick={generateInviteCode}
                        disabled={loading}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                        새 코드 생성
                    </button>
                </div>
            )}
        </div>
    );
};
