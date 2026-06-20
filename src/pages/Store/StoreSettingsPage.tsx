import { useState, useEffect } from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { storeApi, regularShiftApi } from '../../api/storeApi';
import { Store, RegularShift, DAY_OF_WEEK_SHORT, DayOfWeek } from '../../types/store';
import { Worker } from '../../types/worker';
import apiClient from '../../lib/apiClient';
import { RegularShiftModal } from './RegularShiftModal';
import { getWorkerColor } from '../../utils/colorUtils';

const DAYS_OF_WEEK: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export const StoreSettingsPage = () => {
    const [stores, setStores] = useState<Store[]>([]);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [regularShifts, setRegularShifts] = useState<RegularShift[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateStoreModal, setShowCreateStoreModal] = useState(false);
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [newStoreName, setNewStoreName] = useState('');
    const [newStoreAddress, setNewStoreAddress] = useState('');

    // 초기 데이터 로드
    useEffect(() => {
        fetchStores();
    }, []);

    // 영업장 선택 시 고정 근무 및 소속 Worker 로드
    useEffect(() => {
        if (selectedStore) {
            fetchRegularShifts(selectedStore.id);
            fetchWorkers(selectedStore.id);
        }
    }, [selectedStore]);

    const fetchStores = async () => {
        try {
            setLoading(true);
            const data = await storeApi.getStores();
            setStores(data);
            if (data.length > 0 && !selectedStore) {
                setSelectedStore(data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkers = async (storeId?: string) => {
        try {
            const params: Record<string, string> = {};
            if (storeId) {
                params.storeId = storeId;
            }
            const response = await apiClient.get<Worker[]>('/workers', { params });
            setWorkers(response.data);
        } catch (error) {
            console.error('Failed to fetch workers:', error);
        }
    };

    const fetchRegularShifts = async (storeId: string) => {
        try {
            const data = await regularShiftApi.getRegularShifts(storeId);
            setRegularShifts(data);
        } catch (error) {
            console.error('Failed to fetch regular shifts:', error);
        }
    };

    const handleCreateStore = async () => {
        if (!newStoreName.trim()) {
            alert('영업장 이름을 입력해주세요.');
            return;
        }
        try {
            const newStore = await storeApi.createStore({
                name: newStoreName,
                address: newStoreAddress || undefined,
            });
            setStores([...stores, newStore]);
            setSelectedStore(newStore);
            setShowCreateStoreModal(false);
            setNewStoreName('');
            setNewStoreAddress('');
        } catch (error) {
            console.error('Failed to create store:', error);
            alert('영업장 생성에 실패했습니다.');
        }
    };

    const handleDeleteShift = async (shiftId: string) => {
        if (!window.confirm('이 고정 근무를 삭제하시겠습니까?')) return;
        try {
            await regularShiftApi.deleteRegularShift(shiftId);
            setRegularShifts(regularShifts.filter(s => s.id !== shiftId));
        } catch (error) {
            console.error('Failed to delete shift:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    const handleShiftCreated = () => {
        setShowShiftModal(false);
        if (selectedStore) {
            fetchRegularShifts(selectedStore.id);
        }
    };

    // 요일별로 고정 근무 그룹핑
    const shiftsByDay = DAYS_OF_WEEK.reduce((acc, day) => {
        acc[day] = regularShifts.filter(s => s.dayOfWeek === day);
        return acc;
    }, {} as Record<DayOfWeek, RegularShift[]>);

    return (
        <PageContainer title="영업장 설정">
            {/* 영업장 선택 및 추가 */}
            <div className="mb-6 flex items-center gap-4">
                <select
                    value={selectedStore?.id || ''}
                    onChange={(e) => {
                        const store = stores.find(s => s.id === e.target.value);
                        setSelectedStore(store || null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    {stores.length === 0 && <option value="">영업장을 선택하세요</option>}
                    {stores.map(store => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                </select>
                <button
                    onClick={() => setShowCreateStoreModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    + 영업장 추가
                </button>
            </div>

            {selectedStore ? (
                <>
                    {/* 영업장 정보 */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">{selectedStore.name}</h2>
                        {selectedStore.address && (
                            <p className="text-gray-600">주소: {selectedStore.address}</p>
                        )}
                    </div>

                    {/* 고정 근무 관리 */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">고정 근무 스케줄</h2>
                            <button
                                onClick={() => setShowShiftModal(true)}
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                + 고정 근무 추가
                            </button>
                        </div>

                        {/* 요일별 그리드 */}
                        <div className="grid grid-cols-7 gap-2">
                            {DAYS_OF_WEEK.map(day => (
                                <div
                                    key={day}
                                    className={`border rounded-lg p-3 min-h-[150px] ${day === 'SATURDAY' || day === 'SUNDAY'
                                        ? 'bg-gray-50'
                                        : 'bg-white'
                                        }`}
                                >
                                    <div className={`text-sm font-medium mb-2 ${day === 'SUNDAY' ? 'text-red-500' :
                                        day === 'SATURDAY' ? 'text-blue-500' :
                                            'text-gray-700'
                                        }`}>
                                        {DAY_OF_WEEK_SHORT[day]}
                                    </div>
                                    <div className="space-y-1">
                                        {shiftsByDay[day].map(shift => (
                                            <div
                                                key={shift.id}
                                                className={`text-xs p-2 rounded border group relative ${getWorkerColor(shift.workerId).regular}`}
                                            >
                                                <div className="font-medium">{shift.workerName}</div>
                                                <div className="opacity-75">
                                                    {shift.startTime.substring(0, 5)}-{shift.endTime.substring(0, 5)}
                                                </div>
                                                {shift.shiftName && (
                                                    <div className="text-blue-600">{shift.shiftName}</div>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteShift(shift.id)}
                                                    className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    {loading ? '로딩 중...' : '영업장을 먼저 생성해주세요.'}
                </div>
            )}

            {/* 영업장 생성 모달 */}
            {showCreateStoreModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">새 영업장 추가</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    영업장 이름 *
                                </label>
                                <input
                                    type="text"
                                    value={newStoreName}
                                    onChange={(e) => setNewStoreName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="예: 카페 본점"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    주소
                                </label>
                                <input
                                    type="text"
                                    value={newStoreAddress}
                                    onChange={(e) => setNewStoreAddress(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="예: 서울시 강남구 ..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowCreateStoreModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleCreateStore}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                생성
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 고정 근무 추가 모달 */}
            {showShiftModal && selectedStore && (
                <RegularShiftModal
                    storeId={selectedStore.id}
                    workers={workers}
                    onClose={() => setShowShiftModal(false)}
                    onCreated={handleShiftCreated}
                />
            )}
        </PageContainer>
    );
};
