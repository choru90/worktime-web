import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { WorkerForm } from './WorkerForm';
import { WageContractList } from './WageContractList';
import { WageContractForm } from './WageContractForm';
import { InviteCodeSection } from './InviteCodeSection';
import apiClient from '../../lib/apiClient';
import { Worker, WageContract, WorkerUpdateRequest } from '../../types/worker';

export const WorkerDetailPage = () => {
    const { workerId } = useParams<{ workerId: string }>();
    const navigate = useNavigate();
    const [worker, setWorker] = useState<Worker | null>(null);
    const [contracts, setContracts] = useState<WageContract[]>([]);
    const [currentWage, setCurrentWage] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showResignModal, setShowResignModal] = useState(false);
    const [resignDate, setResignDate] = useState('');

    const fetchWorkerData = async () => {
        if (!workerId) return;

        try {
            setLoading(true);
            const [workerDetailRes, contractsRes] = await Promise.all([
                apiClient.get<any>(`/workers/${workerId}`),
                apiClient.get<WageContract[]>(`/workers/${workerId}/wage-contracts`),
            ]);

            // WorkerDetailResponse 구조: { worker: WorkerResponse, currentWage, wageHistory }
            setWorker(workerDetailRes.data.worker);
            setCurrentWage(workerDetailRes.data.currentWage?.hourlyWage || null);
            setContracts(contractsRes.data);
        } catch (error) {
            console.error('Failed to fetch worker data:', error);
            alert('알바생 정보를 불러오는데 실패했습니다.');
            navigate('/workers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkerData();
    }, [workerId]);

    const handleUpdate = async (values: WorkerUpdateRequest) => {
        if (!workerId) return;

        try {
            await apiClient.put(`/workers/${workerId}`, values);
            setShowEditModal(false);
            fetchWorkerData();
        } catch (error) {
            console.error('Failed to update worker:', error);
            throw new Error('알바생 정보 수정에 실패했습니다.');
        }
    };

    const handleContractCreated = () => {
        fetchWorkerData();
    };

    const handleResignClick = () => {
        setResignDate(new Date().toISOString().split('T')[0]);
        setShowResignModal(true);
    };

    const handleResign = async () => {
        if (!workerId || !resignDate) return;

        if (!window.confirm('퇴사 처리 시 복구할 수 없습니다. 계속하시겠습니까?')) {
            return;
        }

        try {
            await apiClient.post(`/workers/${workerId}/resign`, null, {
                params: { resignDate }
            });
            alert('퇴사 처리가 완료되었습니다.');
            setShowResignModal(false);
            fetchWorkerData();
        } catch (error: any) {
            console.error('Failed to resign worker:', error);
            const message = error.response?.data?.message || '퇴사 처리에 실패했습니다.';
            alert(message);
        }
    };

    if (loading) {
        return (
            <PageContainer title="알바생 상세">
                <div className="text-center py-12">Loading...</div>
            </PageContainer>
        );
    }

    if (!worker) {
        return (
            <PageContainer title="알바생 상세">
                <div className="text-center py-12 text-gray-500">
                    알바생 정보를 찾을 수 없습니다.
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer title="알바생 상세">
            {/* 알바생 기본 정보 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">기본 정보</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="text-gray-700 hover:text-gray-900 font-medium"
                        >
                            수정
                        </button>
                        {worker.active && (
                            <button
                                onClick={handleResignClick}
                                className="text-red-600 hover:text-red-800 font-medium"
                            >
                                퇴사 처리
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-500">이름</label>
                        <p className="text-base font-medium">{worker.name}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500">연락처</label>
                        <p className="text-base font-medium">{worker.phoneNumber}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500">이메일</label>
                        <p className="text-base font-medium">
                            {worker.userEmail || <span className="text-gray-400">미가입</span>}
                        </p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500">상태</label>
                        <p className="text-base font-medium">
                            <span
                                className={`px-2 py-1 text-xs rounded-full ${worker.active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}
                            >
                                {worker.active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                        </p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500">현재 시급</label>
                        <p className="text-base font-medium">
                            {currentWage
                                ? `${currentWage.toLocaleString()}원`
                                : '-'}
                        </p>
                    </div>
                </div>
            </div>

            {/* 알바생 계정 연결 */}
            <div className="mb-6">
                <InviteCodeSection
                    workerId={workerId!}
                    hasAccount={worker.hasAccount ?? false}
                />
            </div>

            {/* 시급 계약 섹션 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">시급 계약 내역</h3>
                <WageContractList
                    contracts={contracts}
                    workerId={workerId!}
                />
            </div>

            {/* 새 시급 계약 추가 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">새 시급 계약 추가</h3>
                <WageContractForm
                    workerId={workerId!}
                    onCreated={handleContractCreated}
                />
            </div>

            {/* 수정 모달 */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">알바생 정보 수정</h3>
                        <WorkerForm
                            mode="edit"
                            initialValues={{
                                name: worker.name,
                                phoneNumber: worker.phoneNumber,
                            }}
                            onSubmit={handleUpdate}
                            onCancel={() => setShowEditModal(false)}
                        />
                    </div>
                </div>
            )
            }

            {/* 퇴사 처리 모달 */}
            {showResignModal && worker && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">퇴사 처리</h3>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                알바생: <strong>{worker.name}</strong>
                            </p>
                            <p className="text-sm text-red-600 mb-4">
                                ⚠️ 퇴사 처리 시 복구할 수 없습니다
                            </p>

                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                퇴사일
                            </label>
                            <input
                                type="date"
                                value={resignDate}
                                onChange={(e) => setResignDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                퇴사일은 오늘 이전이어야 합니다
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowResignModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleResign}
                                disabled={!resignDate}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
                            >
                                퇴사 처리
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageContainer>
    );
};

