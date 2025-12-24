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
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);

    const fetchWorkerData = async () => {
        if (!workerId) return;

        try {
            setLoading(true);
            const [workerRes, contractsRes] = await Promise.all([
                apiClient.get<Worker>(`/workers/${workerId}`),
                apiClient.get<WageContract[]>(`/workers/${workerId}/wage-contracts`),
            ]);
            setWorker(workerRes.data);
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
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="text-gray-700 hover:text-gray-900 font-medium"
                    >
                        수정
                    </button>
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
                            {worker.currentHourlyWage
                                ? `${worker.currentHourlyWage.toLocaleString()}원`
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
                <WageContractList contracts={contracts} />
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
            )}
        </PageContainer>
    );
};

