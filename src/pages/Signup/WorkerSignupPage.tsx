import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

interface LoginResponse {
    accessToken: string;
    userId: string;
    role: string;
    workerId?: string;
}

export const WorkerSignupPage = () => {
    const [formData, setFormData] = useState({
        inviteCode: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.inviteCode.trim()) {
            setError('초대 코드를 입력해주세요.');
            return;
        }
        if (!formData.email.trim()) {
            setError('이메일을 입력해주세요.');
            return;
        }
        if (formData.password.length < 6) {
            setError('비밀번호는 6자 이상이어야 합니다.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            setLoading(true);
            const response = await apiClient.post<LoginResponse>('/auth/workers/signup', {
                inviteCode: formData.inviteCode.toUpperCase(),
                email: formData.email,
                password: formData.password,
            });

            // Save token and user info directly
            const { accessToken, userId, role, workerId } = response.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('user', JSON.stringify({
                userId,
                role,
                workerId,
                email: formData.email,
            }));

            // Redirect to dashboard and reload to refresh auth state
            window.location.href = '/dashboard';
        } catch (error: any) {
            console.error('Signup failed:', error);
            const message = error.response?.data?.message || '회원가입에 실패했습니다.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">알바생 회원가입</h1>
                    <p className="text-gray-600 mt-2">
                        사장님께 받은 초대 코드로 계정을 생성하세요
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                초대 코드
                            </label>
                            <input
                                type="text"
                                name="inviteCode"
                                value={formData.inviteCode}
                                onChange={handleChange}
                                placeholder="ABC123"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-center text-xl tracking-widest uppercase"
                                maxLength={10}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                이메일
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="email@example.com"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                비밀번호
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="6자 이상"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                비밀번호 확인
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="비밀번호 재입력"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-400"
                        >
                            {loading ? '가입 중...' : '회원가입'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            이미 계정이 있으신가요?{' '}
                            <Link to="/login" className="text-gray-900 font-semibold hover:underline">
                                로그인
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <Link to="/signup" className="text-gray-500 hover:text-gray-700 text-sm">
                        사장님이신가요? 사장님 회원가입
                    </Link>
                </div>
            </div>
        </div>
    );
};
