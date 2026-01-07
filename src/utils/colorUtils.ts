
// 색상 배열 (알바생별 고유 색상 배정용) - 확장된 팔레트
export const WORKER_COLORS = [
    'bg-red-100 text-red-800 border-red-200',
    'bg-orange-100 text-orange-800 border-orange-200',
    'bg-amber-100 text-amber-800 border-amber-200',
    'bg-lime-100 text-lime-800 border-lime-200',
    'bg-emerald-100 text-emerald-800 border-emerald-200',
    'bg-cyan-100 text-cyan-800 border-cyan-200',
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-violet-100 text-violet-800 border-violet-200',
    'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    'bg-rose-100 text-rose-800 border-rose-200',
];

// 고정 근무용 색상 (더 진한 색)
export const REGULAR_SHIFT_COLORS = [
    'bg-red-200 text-red-900 border-red-300',
    'bg-orange-200 text-orange-900 border-orange-300',
    'bg-amber-200 text-amber-900 border-amber-300',
    'bg-lime-200 text-lime-900 border-lime-300',
    'bg-emerald-200 text-emerald-900 border-emerald-300',
    'bg-cyan-200 text-cyan-900 border-cyan-300',
    'bg-blue-200 text-blue-900 border-blue-300',
    'bg-violet-200 text-violet-900 border-violet-300',
    'bg-fuchsia-200 text-fuchsia-900 border-fuchsia-300',
    'bg-rose-200 text-rose-900 border-rose-300',
];

// 문자열 해시 함수
const getHashIndex = (str: string, max: number) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) % max;
};

// Worker ID에 따른 색상 반환
export const getWorkerColor = (workerId: string) => {
    if (!workerId) {
        return {
            schedule: WORKER_COLORS[0],
            regular: REGULAR_SHIFT_COLORS[0]
        };
    }
    const index = getHashIndex(workerId, WORKER_COLORS.length);
    return {
        schedule: WORKER_COLORS[index],
        regular: REGULAR_SHIFT_COLORS[index]
    };
};
