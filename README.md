# Worktime Web

아르바이트 관리 서비스(Worktime)의 프론트엔드 애플리케이션입니다.

## 📋 프로젝트 소개

Worktime Web은 React + TypeScript + Vite 기반으로 구축된 웹 애플리케이션으로, 사장님과 알바생이 효율적으로 근무 스케줄, 출퇴근 기록, 급여를 관리할 수 있는 서비스입니다.

## 🚀 기술 스택

- **Framework**: React 18.2.0
- **Language**: TypeScript 5.2.2
- **Build Tool**: Vite 5.0.8
- **Routing**: React Router DOM 6.20.0
- **Styling**: TailwindCSS 3.3.6
- **Package Manager**: npm

## 📁 프로젝트 구조

```
worktime-web/
├── public/                 # 정적 파일
│   └── vite.svg
├── src/
│   ├── app/               # 앱 설정 및 라우팅
│   │   ├── App.tsx        # 메인 앱 컴포넌트
│   │   ├── router.tsx     # 라우트 정의
│   │   ├── PrivateRoute.tsx  # 인증 보호 라우트
│   │   └── index.css      # 전역 스타일
│   │
│   ├── layouts/           # 레이아웃 컴포넌트
│   │   └── MainLayout.tsx # Header + Sidebar 레이아웃
│   │
│   ├── components/        # 공통 컴포넌트
│   │   └── common/
│   │       ├── Header.tsx      # 헤더
│   │       ├── Sidebar.tsx     # 사이드바
│   │       └── PageContainer.tsx  # 페이지 래퍼
│   │
│   ├── pages/             # 페이지 컴포넌트
│   │   ├── Login/
│   │   │   └── LoginPage.tsx    # 로그인
│   │   ├── Dashboard/
│   │   │   └── DashboardPage.tsx  # 대시보드
│   │   ├── Workers/
│   │   │   └── WorkersPage.tsx   # 알바생 관리
│   │   ├── Schedule/
│   │   │   └── SchedulePage.tsx  # 스케줄 관리
│   │   ├── WorkLogs/
│   │   │   └── WorkLogsPage.tsx  # 근무 기록
│   │   └── Payroll/
│   │       └── PayrollPage.tsx   # 급여 관리
│   │
│   ├── hooks/             # Custom Hooks
│   │   └── useAuth.ts     # 인증 훅
│   │
│   └── main.tsx           # 엔트리 포인트
│
├── index.html             # HTML 템플릿
├── package.json           # 프로젝트 의존성
├── vite.config.ts         # Vite 설정
├── tsconfig.json          # TypeScript 설정
├── tailwind.config.js     # TailwindCSS 설정
└── postcss.config.js      # PostCSS 설정
```

## 🎯 주요 기능

### 현재 구현된 기능 (EPIC 1)

- ✅ 프로젝트 기본 구조 및 설정
- ✅ 공통 레이아웃 (Header + Sidebar)
- ✅ 라우팅 설정
- ✅ Mock 인증 시스템
- ✅ 6개 페이지 골격

### 페이지 목록

| 경로 | 설명 | 인증 필요 |
|------|------|----------|
| `/login` | 로그인 페이지 | ✗ |
| `/dashboard` | 대시보드 | ✓ |
| `/workers` | 알바생 관리 | ✓ |
| `/schedule` | 스케줄 관리 | ✓ |
| `/worklogs` | 근무 기록 | ✓ |
| `/payroll` | 급여 관리 | ✓ |

## 🛠️ 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

서버가 http://localhost:3000 에서 실행됩니다.

### 3. 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

### 4. 프로덕션 미리보기

```bash
npm run preview
```

## 🔐 인증 시스템

현재는 Mock 인증을 사용하며, localStorage에 인증 상태를 저장합니다.

**로그인 방법:**
1. `/login` 페이지에서 이메일과 비밀번호 입력 (임의 값)
2. 로그인 버튼 클릭
3. 자동으로 `/dashboard`로 리다이렉트

**로그아웃:**
- Header의 로그아웃 버튼 클릭

> **Note:** 실제 백엔드 API 연동은 추후 EPIC에서 구현 예정입니다.

## 🎨 스타일 가이드

### TailwindCSS 색상 테마

- **Primary**: Blue (`bg-blue-600`, `hover:bg-blue-700`)
- **Sidebar**: Dark Gray (`bg-gray-800`)
- **Background**: Light Gray (`bg-gray-100`)
- **Card**: White (`bg-white`)

### 주요 스타일 패턴

- Shadow: `shadow`, `shadow-md`, `shadow-xl`
- Rounded: `rounded-lg`
- Padding: `p-4`, `p-6`
- Transitions: `transition-colors`

## 📦 사용된 주요 라이브러리

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| react | ^18.2.0 | UI 프레임워크 |
| react-router-dom | ^6.20.0 | 라우팅 |
| typescript | ^5.2.2 | 타입 안전성 |
| vite | ^5.0.8 | 빌드 도구 |
| tailwindcss | ^3.3.6 | 스타일링 |

## 🚧 향후 계획

- [ ] 실제 백엔드 API 연동
- [ ] Workers 페이지 테이블 구현
- [ ] Dashboard 통계 위젯
- [ ] Schedule CRUD 기능
- [ ] WorkLogs 기록 기능
- [ ] Payroll 계산 및 조회
- [ ] 반응형 디자인 개선

## 📝 개발 가이드

### 새 페이지 추가

1. `src/pages/[PageName]/` 폴더 생성
2. `[PageName]Page.tsx` 컴포넌트 생성
3. `src/app/router.tsx`에 라우트 추가

### 새 공통 컴포넌트 추가

1. `src/components/common/` 폴더에 컴포넌트 생성
2. 필요한 페이지에서 import하여 사용

## 🔗 관련 프로젝트

- **Backend**: [worktime](../worktime) - Spring Boot + Kotlin 백엔드

## 📄 라이선스

MIT

## 👥 개발자

- Backend & Frontend Developer
