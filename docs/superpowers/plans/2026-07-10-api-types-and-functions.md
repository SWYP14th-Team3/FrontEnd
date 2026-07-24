# API 타입 정의 + API 함수 구현 Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 백엔드 API 명세(`docs/api-spec.md`) 기반으로 요청/응답 타입과 엔드포인트별 fetch 함수를 구현한다.

**Architecture:** 타입은 `src/types/`에 도메인별 분리 (auth, analysis). API 함수는 `src/lib/api/`에 도메인별 분리. 클라이언트 API 함수는 `/api/...` 상대경로로 catch-all 프록시 경유, 서버 prefetch는 기존 `fetchWithAuth` + `parseResponse` 직접 사용. Mutation용 API 함수만 이 작업 범위에 포함.

**Tech Stack:** TypeScript, Next.js 16 App Router, fetch Web API, `parseResponse<T>()`, `fetchWithAuth()`

## Global Constraints

- `docs/api-spec.md`의 Response Body 테이블과 Example JSON이 정확한 백엔드 스펙. 임의 필드 추가/변경 금지.
- 기존 `ApiResponse<T>` 구조를 확장하는 방향으로 작업.
- `fetchWithAuth`는 `server-only` — 클라이언트 API 함수에서 import 금지.
- 네이밍: 타입은 PascalCase, 함수는 camelCase, 상수는 UPPER_SNAKE_CASE.
- `@/` 경로 alias 사용.
- 함수 선언문 사용 (화살표 함수 X).
- named export 사용.

---

## File Structure

| 파일                                | 역할                                                 | 액션   |
| ----------------------------------- | ---------------------------------------------------- | ------ |
| `src/app/api/auth/session/route.ts` | OAuth 세션 Route Handler (응답 파싱 버그 수정)       | Modify |
| `src/app/api/auth/logout/route.ts`  | 로그아웃 Route Handler (refreshToken 바디 누락 수정) | Modify |
| `src/types/api.ts`                  | 공통 API 타입 (PaginatedResponse 추가)               | Modify |
| `src/types/auth.ts`                 | 인증 도메인 타입                                     | Create |
| `src/types/analysis.ts`             | 분석 도메인 타입                                     | Create |
| `src/lib/api/auth.ts`               | 인증 API 함수 (클라이언트용)                         | Create |
| `src/lib/api/analysis.ts`           | 분석 API 함수 (클라이언트용)                         | Create |

---

### Task 0: 기존 인증 Route Handler 버그 수정

**Files:**

- Modify: `src/app/api/auth/session/route.ts`
- Modify: `src/app/api/auth/logout/route.ts`

**Interfaces:**

- Consumes: `REFRESH_TOKEN_KEY` from `@/lib/cookies`

#### 0-A: 세션 Route Handler — 응답 파싱 수정

현재 코드는 `backendData.accessToken`으로 최상위에서 토큰을 읽지만, 백엔드 응답은 `{ status, message, data: { accessToken, refreshToken, ... } }` 구조이므로 `backendData.data`에서 읽어야 한다.

- [ ] **Step 1: `src/app/api/auth/session/route.ts` 수정**

`backendData` 파싱 부분을 수정한다. 기존 코드:

```typescript
const backendData = await backendResponse.json();

if (!backendData?.accessToken || !backendData?.refreshToken) {
  return Response.json({ status: 500, message: '인증 토큰을 받지 못했습니다.', data: null }, { status: 500 });
}

const { accessToken, refreshToken } = backendData as {
  accessToken: string;
  refreshToken: string;
};
```

수정 후:

```typescript
const backendData = await backendResponse.json();
const data = backendData?.data;

if (!data?.accessToken || !data?.refreshToken) {
  return Response.json({ status: 500, message: '인증 토큰을 받지 못했습니다.', data: null }, { status: 500 });
}

const { accessToken, refreshToken } = data as {
  accessToken: string;
  refreshToken: string;
};
```

#### 0-B: 로그아웃 Route Handler — refreshToken 바디 추가

현재 코드는 로그아웃 시 Authorization 헤더만 보내고 바디를 보내지 않지만, API 명세에 따르면 `{ refreshToken }` 바디가 필수이다.

- [ ] **Step 2: `src/app/api/auth/logout/route.ts` 수정**

기존 코드:

```typescript
if (accessToken) {
  const backendUrl = process.env.BACKEND_URL;
  if (backendUrl) {
    await fetch(`${backendUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch((error) => {
      console.error('[Logout] 백엔드 로그아웃 요청 실패:', error);
    });
  }
}
```

수정 후:

```typescript
if (accessToken) {
  const backendUrl = process.env.BACKEND_URL;
  if (backendUrl) {
    const refreshToken = cookieStore.get(REFRESH_TOKEN_KEY)?.value;
    await fetch(`${backendUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    }).catch((error) => {
      console.error('[Logout] 백엔드 로그아웃 요청 실패:', error);
    });
  }
}
```

import에 `REFRESH_TOKEN_KEY` 추가 필요:

```typescript
import { clearAuthCookies, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/lib/cookies';
```

- [ ] **Step 3: 빌드 검증**

Run: `pnpm build`
Expected: 에러 없이 통과

- [ ] **Step 4: 커밋**

```bash
git add src/app/api/auth/session/route.ts src/app/api/auth/logout/route.ts
git commit -m "fix: 인증 Route Handler 버그 수정 (응답 파싱 + refreshToken 바디)"
```

---

### Task 1: 공통 API 타입 보강 (`src/types/api.ts`)

**Files:**

- Modify: `src/types/api.ts`

**Interfaces:**

- Produces: `PaginatedResponse<T>` — Task 3, Task 5에서 사용

- [ ] **Step 1: `PaginatedResponse<T>` 타입 추가**

`src/types/api.ts`에 아래 타입을 추가한다. 기존 코드는 변경하지 않는다.

```typescript
export type PaginatedResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};
```

API 명세 `GET /analyses` 응답의 `data` 필드 구조와 정확히 일치:

- `content` — 분석 결과 배열
- `page` — 0부터 시작하는 페이지 번호
- `size` — 한 페이지당 항목 수
- `totalElements` — 전체 항목 수
- `totalPages` — 전체 페이지 수
- `last` — 마지막 페이지 여부

- [ ] **Step 2: 빌드 검증**

Run: `pnpm build`
Expected: 에러 없이 통과

- [ ] **Step 3: 커밋**

```bash
git add src/types/api.ts
git commit -m "feat: PaginatedResponse<T> 공통 타입 추가"
```

---

### Task 2: 인증 도메인 타입 (`src/types/auth.ts`)

**Files:**

- Create: `src/types/auth.ts`

**Interfaces:**

- Produces: `OAuthProvider`, `OAuthProviderEnum`, `User`, `LoginRequest`, `LoginResponse`, `LogoutRequest`, `MeResponse`, `ReissueRequest`, `ReissueResponse` — Task 4에서 사용

- [ ] **Step 1: `src/types/auth.ts` 생성**

`docs/api-spec.md` 섹션 1 (인증) 기반으로 타입을 정의한다.

```typescript
/** OAuth 로그인 제공자 (URL path parameter용, 소문자) */
export type OAuthProvider = 'kakao' | 'google';

/** 백엔드 응답의 provider 필드 (대문자 enum) */
export type OAuthProviderEnum = 'GOOGLE' | 'KAKAO';

/** 사용자 정보 — GET /auth/me 응답 및 로그인 응답의 user 필드 */
export type User = {
  id: number;
  email: string | null;
  name: string | null;
  provider: OAuthProviderEnum;
};

/** POST /auth/oauth/{provider}/login 요청 바디 */
export type LoginRequest = {
  authorizationCode: string;
};

/** POST /auth/oauth/{provider}/login 응답 data */
export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
};

/** POST /auth/logout 요청 바디 */
export type LogoutRequest = {
  refreshToken: string;
};

/** GET /auth/me 응답 data */
export type MeResponse = User;

/** POST /auth/reissue 요청 바디 */
export type ReissueRequest = {
  refreshToken: string;
};

/** POST /auth/reissue 응답 data */
export type ReissueResponse = {
  accessToken: string;
  tokenType: string;
};
```

- [ ] **Step 2: 빌드 검증**

Run: `pnpm build`
Expected: 에러 없이 통과 (아직 아무 곳에서도 import하지 않으므로 tree-shaken됨)

- [ ] **Step 3: 커밋**

```bash
git add src/types/auth.ts
git commit -m "feat: 인증 도메인 타입 정의 (auth.ts)"
```

---

### Task 3: 분석 도메인 타입 (`src/types/analysis.ts`)

**Files:**

- Create: `src/types/analysis.ts`

**Interfaces:**

- Consumes: `PaginatedResponse<T>` from Task 1
- Produces: 분석 관련 모든 타입 — Task 5에서 사용

- [ ] **Step 1: `src/types/analysis.ts` 생성**

`docs/api-spec.md` 섹션 2~6 기반으로 타입을 정의한다.

```typescript
// ── Enum 타입 ──────────────────────────────────────────

/** 전체 적합도 등급 */
export type OverallLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/** 요건 매칭 상태 */
export type MatchStatus = 'CONFIRMED' | 'NEEDS_IMPROVEMENT' | 'MISSING';

/** 공고 요건 카테고리 */
export type RequirementCategory = '자격요건' | '업무역량' | '도메인' | '우대사항';

/** 공고 입력 방식 */
export type JobInputType = 'URL' | 'TEXT';

/** 만족도 값 (응답) */
export type Satisfaction = 'LIKE' | 'DISLIKE' | null;

/** 만족도 요청 값 — 'NULL' 문자열로 선택 취소 */
export type SatisfactionRequestValue = 'LIKE' | 'DISLIKE' | 'NULL';

// ── 중첩 엔티티 ────────────────────────────────────────

/** 요건별 평가 */
export type Evaluation = {
  evaluationId: number;
  matchStatus: MatchStatus;
  resumeEvidence: string | null;
  feedback: string | null;
  revisionSuggestion: string | null;
};

/** 공고 요건 (전체 필드 — 최초 분석/상세 조회용) */
export type Requirement = {
  requirementId: number;
  category: RequirementCategory;
  title: string;
  description: string | null;
  sourceText: string | null;
  evaluation: Evaluation;
};

/** 공고 요건 (재분석용 — description, sourceText 미포함) */
export type ReanalysisRequirement = {
  requirementId: number;
  category: RequirementCategory;
  title: string;
  evaluation: Evaluation;
};

// ── 분석 결과 ──────────────────────────────────────────

/** POST /analyses 응답 data & GET /analyses/{id} 응답 data */
export type AnalysisResult = {
  analysisResultId: number;
  companyName: string | null;
  positionTitle: string | null;
  overallLevel: OverallLevel;
  redCount: number;
  yellowCount: number;
  greenCount: number;
  retryCount: number;
  remainingRetryCount: number;
  satisfaction: Satisfaction;
  jobInputType: JobInputType;
  jobUrl: string | null;
  jobPostingRaw: string;
  resumeOriginalText: string;
  resumeCurrentText: string;
  createdAt: string;
  updatedAt: string;
  lastSavedAt: string | null;
  requirements: Requirement[];
};

/** GET /analyses 목록 아이템 (상세 필드 없음) */
export type AnalysisListItem = {
  analysisResultId: number;
  companyName: string | null;
  positionTitle: string | null;
  overallLevel: OverallLevel;
  redCount: number;
  yellowCount: number;
  greenCount: number;
  retryCount: number;
  remainingRetryCount: number;
  createdAt: string;
  updatedAt: string;
  lastSavedAt: string | null;
};

// ── 요청/응답 타입 ─────────────────────────────────────

/** GET /analyses 쿼리 파라미터 */
export type AnalysesParams = {
  page?: number;
  size?: number;
  companyName?: string;
};

/** PATCH /analyses/{id}/resume 요청 바디 */
export type AutoSaveResumeRequest = {
  resumeCurrentText: string;
};

/** PATCH /analyses/{id}/resume 응답 data */
export type AutoSaveResumeResponse = {
  analysisResultId: number;
  resumeCurrentText: string;
  updatedAt: string;
};

/** POST /analyses/{id}/reanalyze 요청 바디 */
export type ReanalyzeRequest = {
  resumeCurrentText: string;
};

/** POST /analyses/{id}/reanalyze 응답 data */
export type ReanalyzeResponse = {
  analysisResultId: number;
  overallLevel: OverallLevel;
  redCount: number;
  yellowCount: number;
  greenCount: number;
  retryCount: number;
  remainingRetryCount: number;
  resumeCurrentText: string;
  updatedAt: string;
  requirements: ReanalysisRequirement[];
};

/** PATCH /analyses/{id}/save 요청 바디 */
export type SaveAnalysisRequest = {
  resumeCurrentText: string;
};

/** PATCH /analyses/{id}/save 응답 data */
export type SaveAnalysisResponse = {
  analysisResultId: number;
  saved: boolean;
  resumeCurrentText: string;
  lastSavedAt: string;
  updatedAt: string;
};

/** DELETE /analyses/{id} 응답 data */
export type DeleteAnalysisResponse = {
  analysisResultId: number;
  deleted: boolean;
  deletedAt: string;
};

/** PATCH /analyses/{id}/satisfaction 요청 바디 */
export type UpdateSatisfactionRequest = {
  satisfaction: SatisfactionRequestValue;
};

/** PATCH /analyses/{id}/satisfaction 응답 data */
export type UpdateSatisfactionResponse = {
  analysisResultId: number;
  satisfaction: Satisfaction;
  updatedAt: string;
};
```

- [ ] **Step 2: 빌드 검증**

Run: `pnpm build`
Expected: 에러 없이 통과

- [ ] **Step 3: 커밋**

```bash
git add src/types/analysis.ts
git commit -m "feat: 분석 도메인 타입 정의 (analysis.ts)"
```

---

### Task 4: 인증 API 함수 (`src/lib/api/auth.ts`)

**Files:**

- Create: `src/lib/api/auth.ts`

**Interfaces:**

- Consumes: `MeResponse` from `@/types/auth` (Task 2), `parseResponse` from `@/lib/parseResponse`

**설계 결정:**

- OAuth 로그인(`/api/auth/session`)과 로그아웃(`/api/auth/logout`)은 이미 전용 Route Handler가 존재하므로 API 함수를 별도로 만들지 않는다.
- `getMe()`만 클라이언트 API 함수로 제공 — 클라이언트 컴포넌트에서 사용자 정보 조회 시 사용.
- `reissue`는 `proxy.ts`에서만 사용하는 서버 전용 로직이므로 이 파일에 포함하지 않는다.

- [ ] **Step 1: `src/lib/api/` 디렉토리 및 `auth.ts` 생성**

```typescript
import { parseResponse } from '@/lib/parseResponse';
import type { MeResponse } from '@/types/auth';

/** GET /auth/me — 로그인 사용자 정보 조회 (catch-all 프록시 경유) */
export async function getMe(): Promise<MeResponse> {
  const res = await fetch('/api/auth/me');
  return parseResponse<MeResponse>(res);
}
```

- [ ] **Step 2: 빌드 검증**

Run: `pnpm build`
Expected: 에러 없이 통과

- [ ] **Step 3: 커밋**

```bash
git add src/lib/api/auth.ts
git commit -m "feat: 인증 API 함수 구현 (getMe)"
```

---

### Task 5: 분석 API 함수 (`src/lib/api/analysis.ts`)

**Files:**

- Create: `src/lib/api/analysis.ts`

**Interfaces:**

- Consumes:
  - `parseResponse` from `@/lib/parseResponse`
  - `PaginatedResponse<T>` from `@/types/api` (Task 1)
  - `AnalysisResult`, `AnalysisListItem`, `AnalysesParams`, `AutoSaveResumeRequest`, `AutoSaveResumeResponse`, `ReanalyzeRequest`, `ReanalyzeResponse`, `SaveAnalysisRequest`, `SaveAnalysisResponse`, `DeleteAnalysisResponse`, `UpdateSatisfactionRequest`, `UpdateSatisfactionResponse` from `@/types/analysis` (Task 3)

**설계 결정:**

- 모든 함수는 클라이언트 컴포넌트에서 사용하는 함수 (catch-all 프록시 `/api/...` 경유).
- 서버 컴포넌트의 prefetch는 `fetchWithAuth` + `parseResponse`를 직접 사용한다 (TanStack Query 통합 시 결정).
- `createAnalysis`는 `multipart/form-data`이므로 `FormData`를 직접 전달하고, `Content-Type`을 명시하지 않는다 (브라우저가 boundary를 자동 설정).

- [ ] **Step 1: `src/lib/api/analysis.ts` 생성**

```typescript
import { parseResponse } from '@/lib/parseResponse';
import type { PaginatedResponse } from '@/types/api';
import type {
  AnalysisListItem,
  AnalysisResult,
  AnalysesParams,
  AutoSaveResumeRequest,
  AutoSaveResumeResponse,
  DeleteAnalysisResponse,
  ReanalyzeRequest,
  ReanalyzeResponse,
  SaveAnalysisRequest,
  SaveAnalysisResponse,
  UpdateSatisfactionRequest,
  UpdateSatisfactionResponse,
} from '@/types/analysis';

/** POST /analyses — 이력서 + 공고 분석 생성 (multipart/form-data) */
export async function createAnalysis(formData: FormData): Promise<AnalysisResult> {
  const res = await fetch('/api/analyses', {
    method: 'POST',
    body: formData,
  });
  return parseResponse<AnalysisResult>(res);
}

/** GET /analyses/{id} — 분석 결과 상세 조회 */
export async function getAnalysis(id: number): Promise<AnalysisResult> {
  const res = await fetch(`/api/analyses/${id}`);
  return parseResponse<AnalysisResult>(res);
}

/** GET /analyses — 분석 결과 목록 조회 / 회사명 검색 */
export async function getAnalyses(params: AnalysesParams = {}): Promise<PaginatedResponse<AnalysisListItem>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.size !== undefined) searchParams.set('size', String(params.size));
  if (params.companyName) searchParams.set('companyName', params.companyName);

  const query = searchParams.toString();
  const url = query ? `/api/analyses?${query}` : '/api/analyses';

  const res = await fetch(url);
  return parseResponse<PaginatedResponse<AnalysisListItem>>(res);
}

/** PATCH /analyses/{id}/resume — 이력서 편집본 자동저장 */
export async function autoSaveResume(id: number, body: AutoSaveResumeRequest): Promise<AutoSaveResumeResponse> {
  const res = await fetch(`/api/analyses/${id}/resume`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseResponse<AutoSaveResumeResponse>(res);
}

/** POST /analyses/{id}/reanalyze — 이력서 재분석 */
export async function reanalyze(id: number, body: ReanalyzeRequest): Promise<ReanalyzeResponse> {
  const res = await fetch(`/api/analyses/${id}/reanalyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseResponse<ReanalyzeResponse>(res);
}

/** PATCH /analyses/{id}/save — 분석 결과 최종 저장 */
export async function saveAnalysis(id: number, body: SaveAnalysisRequest): Promise<SaveAnalysisResponse> {
  const res = await fetch(`/api/analyses/${id}/save`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseResponse<SaveAnalysisResponse>(res);
}

/** DELETE /analyses/{id} — 분석 결과 삭제 */
export async function deleteAnalysis(id: number): Promise<DeleteAnalysisResponse> {
  const res = await fetch(`/api/analyses/${id}`, {
    method: 'DELETE',
  });
  return parseResponse<DeleteAnalysisResponse>(res);
}

/** PATCH /analyses/{id}/satisfaction — 분석 만족도 저장 */
export async function updateSatisfaction(
  id: number,
  body: UpdateSatisfactionRequest,
): Promise<UpdateSatisfactionResponse> {
  const res = await fetch(`/api/analyses/${id}/satisfaction`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseResponse<UpdateSatisfactionResponse>(res);
}
```

- [ ] **Step 2: 빌드 검증**

Run: `pnpm build`
Expected: 에러 없이 통과

- [ ] **Step 3: 린트 검증**

Run: `pnpm lint`
Expected: 에러 없이 통과

- [ ] **Step 4: 커밋**

```bash
git add src/lib/api/analysis.ts
git commit -m "feat: 분석 API 함수 구현 (CRUD + 재분석 + 만족도)"
```
