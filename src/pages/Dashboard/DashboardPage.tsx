import { PageContainer } from '../../components/common/PageContainer';

export const DashboardPage = () => {
    return (
        <PageContainer title="대시보드">
            <div className="text-center py-12">
                <h3 className="text-xl text-gray-600">대시보드 입니다</h3>
                <p className="text-gray-500 mt-4">
                    여기에 통계 및 요약 정보가 표시됩니다.
                </p>
            </div>
        </PageContainer>
    );
};
