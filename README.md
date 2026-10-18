# Worktime Web

소규모 매장의 근무 관리 웹이다. React 18, TypeScript 5, Vite 5, TailwindCSS를 사용하며 JWT로 실제 Worktime API와 통신한다.

## 현재 기능

- 사장/직원 가입·로그인·초대 코드 연결
- 역할별 대시보드와 서비스 내 알림
- 매장·고정 근무·직원·시급계약 관리
- 월/주 캘린더와 일정 요청·승인·거절
- 직원 근무시간 수동 입력과 관리자 승인·반려
- 월별 예상 급여와 일별 상세 조회

대체 근무 요청→후보 수락→관리자 최종 승인은 후속 설계 단계다. 네이티브 앱은 포함하지 않는다.

## 설치·실행·검증

```sh
npm ci
npm run dev
```

기본 주소는 localhost:3000이다. Vite가 `/api`를 localhost:8080의 백엔드로 프록시한다. 백엔드를 별도로 실행하고 실제 개발 계정을 만든다. 임의 이메일/비밀번호로 로그인되는 Mock 인증이 아니다.

```sh
npm run build
npm run lint
```

빌드는 TypeScript strict/미사용 변수 검사와 Vite 번들 생성을 포함한다. ESLint는 기본 JavaScript 오류를 검사하며 TypeScript의 미사용 변수 검사는 tsc가 담당한다. React Hooks 의존성과 기존 explicit any 정리는 후속 강화 대상이다. 전용 프런트 테스트/E2E runner는 아직 없다.

`npm run preview`는 빌드 산출물을 확인하는 용도다. 운영 API 라우팅은 개발용 Vite 프록시와 별도로 구성해야 한다.

## 주요 경로와 구조

`src/app/router.tsx`가 페이지와 역할별 이동을 정의한다. `src/lib/apiClient.ts`가 `/api`와 JWT 헤더를 관리한다. `src/pages`는 대시보드·직원·일정·근무기록·급여·매장 화면, `src/types`는 화면 타입이다.

현재 토큰은 localStorage에 보관한다. 권한 제어의 최종 책임은 서버에 있으며 UI 숨김만으로 접근을 제한할 수 없다.

## 출시 전 확인 사항

- 백엔드 소유권 검증과 승인 기록만 급여에 반영하는 정책 보완
- 모바일 화면, 접근성, 로그인부터 월별 급여까지 브라우저 E2E
- 의존성 취약점의 영향과 호환 가능한 업그레이드 검토
- 개발 프록시와 운영 API 라우팅 분리

백엔드 저장소: `choru90/worktime`.
