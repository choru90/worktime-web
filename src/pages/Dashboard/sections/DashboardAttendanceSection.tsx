import React, { useEffect, useState } from 'react';
import { dashboardApi, AttendanceSummaryResponse, AttendanceExceptionItem } from '../../../api/dashboardApi';
import { Loading } from '../../../components/common/Loading';
import { ErrorState } from '../../../components/common/ErrorState';
import { useNavigate } from 'react-router-dom';

interface Props {
    date: string;
}

export const DashboardAttendanceSection: React.FC<Props> = ({ date }) => {
    const [data, setData] = useState<AttendanceSummaryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await dashboardApi.getAttendance(date);
            setData(response.data);
        } catch (err) {
            console.error('Failed to fetch attendance summary', err);
            setError('출퇴근 현황을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [date]);

    const handleExceptionClick = (item: AttendanceExceptionItem) => {
        if (item.scheduleId) {
            // TODO: Navigate to schedule detail or attendance page with focus
            // console.log('Navigate to schedule', item.scheduleId);
            // navigate(`/schedule/${item.scheduleId}`); // If route exists
            navigate('/schedule'); // Fallback
        } else {
            // navigate to attendance page
            navigate(`/owner/attendance?date=${date}`);
        }
    };

    if (loading) return (
        <div className="bg-white rounded-lg shadow p-6 h-64 flex items-center justify-center">
            <Loading message="출퇴근 현황 로딩중..." />
        </div>
    );

    if (error) return (
        <div className="bg-white rounded-lg shadow p-6 h-64">
            <ErrorState message={error} onRetry={fetchData} />
        </div>
    );

    if (!data) return null;

    const { summary, exceptions } = data;

    return (
        <div className="bg-white rounded-lg shadow flex flex-col h-full">
            <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">출퇴근 현황</h2>

                {/* KPI Summary Row */}
                <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs">예정</span>
                        <span className="text-lg font-bold text-gray-800">{summary.scheduledCount}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs text-emerald-600">출근</span>
                        <span className="text-lg font-bold text-emerald-600">{summary.checkedInCount}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs text-red-500">미출근</span>
                        <span className="text-lg font-bold text-red-500">{summary.notCheckedInCount}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs text-orange-500">미퇴근</span>
                        <span className="text-lg font-bold text-orange-500">{summary.notCheckedOutCount}</span>
                    </div>
                </div>
            </div>

            {/* Exception List */}
            <div className="flex-1 p-2 overflow-y-auto max-h-[300px]">
                {exceptions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-gray-400">
                        <span className="text-2xl mb-2">✅</span>
                        <p className="text-sm">문제 케이스가 없어요</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {exceptions.map((item, index) => (
                            <div
                                key={index}
                                onClick={() => handleExceptionClick(item)}
                                className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Badge */}
                                    <div className="flex-shrink-0">
                                        {item.type === 'SCHEDULE_EXISTS_BUT_NO_CHECKIN' && (
                                            <span className="px-2 py-1 rounded text-xs font-bold bg-white text-red-600 border border-red-200 shadow-sm">
                                                출근 미체크
                                            </span>
                                        )}
                                        {item.type === 'CHECKIN_EXISTS_BUT_NO_CHECKOUT' && (
                                            <span className="px-2 py-1 rounded text-xs font-bold bg-white text-orange-600 border border-orange-200 shadow-sm">
                                                퇴근 미체크
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">{item.workerName}</span>
                                        <span className="text-xs text-gray-500">
                                            {item.type === 'SCHEDULE_EXISTS_BUT_NO_CHECKIN'
                                                ? `${item.scheduledStartAt?.substring(11, 16)} 출근 예정`
                                                : `${item.checkedInAt?.substring(11, 16)} 출근함`
                                            }
                                        </span>
                                    </div>
                                </div>

                                {/* Arrow icon */}
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
