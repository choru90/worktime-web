// src/pages/Workers/WorkersPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/common/PageContainer';
import { WorkerForm } from './WorkerForm';
import apiClient from '../../lib/apiClient';
import { storeApi } from '../../api/storeApi';
import { Worker, WorkerCreateRequest } from '../../types/worker';
import { Store } from '../../types/store';

export const WorkersPage = () => {
    const [workerList, setWorkerList] = useState<Worker[]>([]);
    const [storeList, setStoreList] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('');
    const navigate = useNavigate();

    const fetchWorkers = async (storeId?: string) => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (storeId) {
                params.storeId = storeId;
            }
            const response = await apiClient.get<Worker[]>('/workers', { params });
            setWorkerList(response.data);
        } catch (error) {
            console.error('Failed to fetch workers:', error);
            alert('알바생 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStoreList = async () => {
        try {
            const storeData = await storeApi.getStores();
            setStoreList(storeData);
        } catch (error) {
            console.error('Failed to fetch stores:', error);
        }
    };

    useEffect(() => {
        fetchStoreList();
        fetchWorkers();
    }, []);

    useEffect(() => {
        fetchWorkers(selectedStoreFilter || undefined);
    }, [selectedStoreFilter]);

    const handleCreate = async (values: WorkerCreateRequest) => {
        try {
            await apiClient.post('/workers', values);
            setShowCreateModal(false);
            fetchWorkers(selectedStoreFilter || undefined);
        } catch (error) {
            console.error('Failed to create worker:', error);
            throw new Error('알바생 추가에 실패했습니다.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) {
            return;
        }

        try {
            await apiClient.delete(`/workers/${id}`);
            fetchWorkers(selectedStoreFilter || undefined);
        } catch (error) {
            console.error('Failed to delete worker:', error);
            alert('알바생 삭제에 실패했습니다.');
        }
    };

    if (loading) {
        return (
            <PageContainer title="알바생 관리">
                <div className="text-center py-12">Loading...</div>
            </PageContainer>
        );
    }

    return (
        <PageContainer title="알바생 관리">
            <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <p className="text-gray-600">총 {workerList.length}명</p>
                    <select
                        value={selectedStoreFilter}
                        onChange={(e) => setSelectedStoreFilter(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    >
                        <option value="">전체 영업장</option>
                        {storeList.map((store) => (
                            <option key={store.id} value={store.id}>
                                {store.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gray-900 hover:bg-gray-800 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                    + 알바생 추가
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                이름
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                연락처
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                소속 영업장
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                상태
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                현재 시급
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                액션
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {workerList.map((worker) => (
                            <tr key={worker.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {worker.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{worker.phoneNumber}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                        {worker.storeName || (
                                            <span className="text-gray-400 italic">미지정</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${worker.active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {worker.active ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {worker.currentHourlyWage
                                            ? `${worker.currentHourlyWage.toLocaleString()}원`
                                            : '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button
                                        onClick={() => navigate(`/workers/${worker.id}`)}
                                        className="text-gray-700 hover:text-gray-900 font-medium"
                                    >
                                        상세보기
                                    </button>
                                    <button
                                        onClick={() => handleDelete(worker.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        삭제
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {workerList.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        등록된 알바생이 없습니다.
                    </div>
                )}
            </div>

            {/* 생성 모달 */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">알바생 추가</h3>
                        <WorkerForm
                            mode="create"
                            storeList={storeList}
                            onSubmit={handleCreate}
                            onCancel={() => setShowCreateModal(false)}
                        />
                    </div>
                </div>
            )}
        </PageContainer>
    );
};
