# MSW 세팅 및 Mock 핸들러 구현 플랜

## Context

백엔드 API가 아직 준비되지 않은 상태에서 프론트엔드 개발을 병행하기 위해 MSW(Mock Service Worker)를 도입한다. 이슈 #19에서 완성된 API 타입/스키마/함수 인프라 위에 mock 레이어를 얹어, 실제 API 호출 흐름(클라이언트 → `/api/...` → BFF 프록시)을 그대로 가로채는 방식으로 구현한다.

## 핵심 결정 사항

### MSW 가로채기 경로: `/api/...` (BFF 프록시 경로)

클라이언트 API 함수들은 모두 상대 경로 `/api/...`로 fetch한다. MSW는 이 경로를 브라우저 측에서 가로채므로, catch-all 프록시(`src/app/api/[...path]/route.ts`)에 도달하기 전에 mock 응답을 반환한다. 서버 측(SSR) mock은 이번 스코프에서 제외한다 — 클라이언트 컴포넌트 개발에 집중.

### 응답 형식

모든 mock 응답은 `{ status: number, message: string, data: T }` 래퍼를 사용한다. `parseResponse`가 `.data`를 추출하고 Zod 스키마로 검증하므로, mock 데이터는 반드시 해당 스키마의 `parse()`를 통과해야 한다.

### BFF 전용 핸들러

`/api/auth/session`과 `/api/auth/logout`은 catch-all을 거치지 않는 별도 Route Handler다. 이들의 응답 data는 `{ success: boolean }` 형태이며, 각각 `socialLoginResponseSchema`, `logoutResponseSchema`를 통과해야 한다.

### MSW 공식 문서 기반 주의사항

- **`worker.start()`는 반드시 await** — 서비스 워커 등록이 비동기이므로, await 없이 앱을 렌더링하면 초기 요청이 인터셉트되지 않는 레이스 컨디션 발생
- **`waitUntilReady: true`(기본값) 유지** — 워커 준비 전 fetch 요청을 자동 지연. false로 바꾸는 것은 공식적으로 비권장
- **URL 매칭에 쿼리 파라미터를 넣지 말 것** — `GET /api/analyses?page=0` → 핸들러는 `/api/analyses`로만 매칭, 쿼리는 resolver 내부에서 `new URL(request.url).searchParams`로 접근
- **`HttpResponse.json()` 사용** — MSW v2 공식 API. `new Response()` 대신 사용
- **`--save` 플래그** — `npx msw init public/ --save` 시 `package.json`에 `"msw": { "workerDirectory": "./public" }` 자동 추가, 버전 업그레이드 시 워커 파일 자동 갱신
- **`public/mockServiceWorker.js`는 git 커밋 대상** — 팀 공유를 위해 커밋 필수 (공식 권장)

---

## 구현 단계

### 1단계: MSW 설치 및 초기 세팅

**파일:** (신규 생성)

```
pnpm add -D msw
npx msw init public/ --save
```

- `msw` 패키지를 devDependency로 설치
- `public/mockServiceWorker.js` 생성 (서비스 워커 파일)
- `.gitignore`에 `mockServiceWorker.js` 추가 불필요 — 커밋해야 함

### 2단계: Mock 데이터 생성

**파일:** `src/mocks/data/` (신규)

| 파일                         | 내용                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/mocks/data/user.ts`     | mock User 객체 (userSchema 통과)                                                                |
| `src/mocks/data/analysis.ts` | mock AnalysisResult, AnalysisListItem, requirements, evaluations 등 (모든 analysis 스키마 통과) |

- `docs/api-spec.md`의 Example JSON을 기반으로 mock 데이터 작성
- 각 데이터가 대응하는 Zod 스키마의 `parse()`를 통과하는지 확인
- 여러 시나리오를 커버하는 다양한 mock 데이터 (예: 분석 결과 2~3개, 각기 다른 overallLevel)

### 3단계: Mock 핸들러 구현

**파일:** `src/mocks/handlers/` (신규)

| 파일                             | 핸들러                                                                |
| -------------------------------- | --------------------------------------------------------------------- |
| `src/mocks/handlers/auth.ts`     | POST `/api/auth/session`, POST `/api/auth/logout`, GET `/api/auth/me` |
| `src/mocks/handlers/analysis.ts` | POST/GET/PATCH/DELETE `/api/analyses...` (8개 엔드포인트)             |
| `src/mocks/handlers/index.ts`    | 모든 핸들러를 합쳐서 export                                           |

**인증 핸들러 (3개):**

| 메서드 | 경로                | 응답 data           |
| ------ | ------------------- | ------------------- |
| POST   | `/api/auth/session` | `{ success: true }` |
| POST   | `/api/auth/logout`  | `{ success: true }` |
| GET    | `/api/auth/me`      | mock User 객체      |

**분석 핸들러 (8개):**

| 메서드 | 경로                             | 응답 data                                                                |
| ------ | -------------------------------- | ------------------------------------------------------------------------ |
| POST   | `/api/analyses`                  | mock AnalysisResult (전체)                                               |
| GET    | `/api/analyses/:id`              | mock AnalysisResult (전체)                                               |
| GET    | `/api/analyses`                  | mock PaginatedAnalysisList                                               |
| PATCH  | `/api/analyses/:id/resume`       | `{ analysisResultId, resumeCurrentText, updatedAt }`                     |
| POST   | `/api/analyses/:id/reanalyze`    | mock ReanalyzeResponse (reanalysisRequirementSchema 사용)                |
| PATCH  | `/api/analyses/:id/save`         | `{ analysisResultId, saved, resumeCurrentText, lastSavedAt, updatedAt }` |
| DELETE | `/api/analyses/:id`              | `{ analysisResultId, deleted, deletedAt }`                               |
| PATCH  | `/api/analyses/:id/satisfaction` | `{ analysisResultId, satisfaction, updatedAt }`                          |

**핸들러 패턴 예시:**

```ts
http.get('/api/analyses/:id', ({ params }) => {
  return HttpResponse.json({
    status: 200,
    message: '분석 결과 조회 성공',
    data: mockAnalysisResult,
  });
});
```

### 4단계: MSW 브라우저 워커 설정

**파일:** `src/mocks/browser.ts` (신규)

```ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

### 5단계: 개발 환경 연동

**파일:** `src/mocks/init.ts` (신규)

```ts
export async function initMocks() {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MSW_ENABLED === 'true') {
    const { worker } = await import('./browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}
```

**파일:** `src/providers/MSWProvider.tsx` (신규, `'use client'`)

- `useEffect`에서 `initMocks()` 호출
- 초기화 완료 전까지 children 렌더링 지연 (Zod 검증 에러 방지)
- `NEXT_PUBLIC_MSW_ENABLED` 환경변수로 on/off 제어

**파일:** `src/providers/Providers.tsx` (수정)

- `MSWProvider`를 최외곽에 추가 (QueryProvider보다 바깥)

**파일:** `.env.development` (신규 또는 수정)

```
NEXT_PUBLIC_MSW_ENABLED=true
```

### 6단계: 에러 응답 핸들러 (선택)

일부 핸들러에 에러 케이스도 추가할 수 있지만, 초기에는 성공 응답만 구현하고, 필요 시 확장한다.

---

## 파일 구조 요약

```
src/mocks/
├── browser.ts              # setupWorker
├── init.ts                 # initMocks (동적 import + env 체크)
├── handlers/
│   ├── index.ts            # 모든 핸들러 합침
│   ├── auth.ts             # 인증 관련 3개
│   └── analysis.ts         # 분석 관련 8개
└── data/
    ├── user.ts             # mock User
    └── analysis.ts         # mock Analysis 데이터
```

## 수정되는 기존 파일

| 파일                          | 변경 내용                |
| ----------------------------- | ------------------------ |
| `src/providers/Providers.tsx` | `MSWProvider` 추가       |
| `package.json`                | `msw` devDependency 추가 |

## 검증 방법

1. `pnpm dev` 실행 후 브라우저 콘솔에 `[MSW] Mocking enabled.` 메시지 확인
2. 브라우저에서 `/api/auth/me` 등을 직접 fetch하여 mock 응답 확인
3. 기존 API 함수 (`getMe()`, `getAnalysis()` 등) 호출 시 Zod 검증 통과 확인
4. `NEXT_PUBLIC_MSW_ENABLED=false`로 변경 시 MSW 비활성화 확인
