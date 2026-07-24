# TanStack Query + 공통 API 인프라 의사결정 기록

> 이슈 #9 작업 과정에서 내린 기술적 의사결정과 그 근거를 기록한다.

---

## 1. 왜 이 작업을 시작했는가

ResuFit은 백엔드 API에서 사용자별 데이터(이력서 분석 결과, 분석 목록 등)를 가져와 화면에 보여주는 서비스다. 데이터 페칭, 캐싱, 서버/클라이언트 상태 동기화를 체계적으로 처리할 인프라가 필요했다.

`docs/data-fetching-strategy.md`에서 전체 데이터 페칭 전략을 먼저 수립한 뒤, 이번 이슈에서는 그 전략의 **기반 인프라**를 구현했다.

---

## 2. 의사결정 목록

### 2-1. fetch + TanStack Query (Axios 제외)

**결정:** Axios를 사용하지 않고 Web API `fetch` + TanStack Query만 사용한다.

**근거:**

Next.js는 `fetch` 중심으로 설계되어 있다. 서버 컴포넌트, Route Handler, Middleware 모두 네이티브 `fetch`를 지원하며, Next.js 팀도 공식적으로 Axios 대신 `fetch` 사용을 권장한다.

> "Migrate to native `fetch`."
> — [Next.js GitHub Discussion #89260](https://github.com/vercel/next.js/discussions/89260)

Axios가 과거에 유용했던 이유(인터셉터, 자동 JSON 파싱, 타임아웃)는 현재 대체 수단이 존재한다:

| Axios 기능                     | 현재 대체                          |
| ------------------------------ | ---------------------------------- |
| 인터셉터 (토큰 주입, 401 갱신) | BFF 쿠키 변환 + Middleware refresh |
| 자동 JSON 파싱                 | `res.json()`                       |
| 타임아웃                       | `AbortSignal.timeout()`            |
| 요청/응답 변환                 | `parseResponse()` 헬퍼             |

ResuFit은 BFF 패턴으로 토큰을 httpOnly 쿠키에 저장하므로, 클라이언트가 토큰을 직접 다룰 일이 없다. Axios 인터셉터가 해줄 일 자체가 사라진다.

### 2-2. Next.js Data Cache 미사용

**결정:** `next: { tags }` + `updateTag` 등 Next.js Data Cache를 사용하지 않는다.

**근거:**

Data Cache는 모든 유저에게 동일한 공개 데이터를 서버 공유 캐시에 저장할 때 유용하다. 하지만 ResuFit의 모든 데이터는 사용자별이다:

```
쇼핑몰: A유저 /products → 캐시 → B유저도 동일 상품 목록 (공유 가능)
ResuFit: A유저 /result/abc → A의 분석 결과 → B유저 접근 불가 (공유 불가)
```

서버에 캐싱해봤자 해당 유저만 쓰고 끝나므로 TanStack Query Cache(브라우저 메모리)로 충분하다. Data Cache와 TanStack Query를 함께 쓰면 이중 캐시 무효화(`invalidateQueries` + `updateTag`)가 필요해져 복잡도만 증가한다.

---

### 2-3. QueryClient 서버/클라이언트 분리 전략

**결정:**

- 서버: `React.cache()`로 요청당 1개 QueryClient 생성
- 클라이언트: 모듈 스코프 싱글턴으로 앱 전체에서 1개 재사용

**구현:**

```typescript
// src/lib/getQueryClient.ts
import { QueryClient, environmentManager } from '@tanstack/react-query';
import { cache } from 'react';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}

const getServerQueryClient = cache(() => makeQueryClient());

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (environmentManager.isServer()) return getServerQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
```

**동작 원리:**

**서버 측 — `React.cache()`:**

`React.cache()`는 동일한 서버 렌더링 요청(request) 내에서 함수 호출을 메모이제이션한다. 한 요청에서 `getQueryClient()`를 여러 번 호출해도 같은 QueryClient 인스턴스를 반환한다.

```
요청 A: page.tsx에서 getQueryClient() → 인스턴스 #1
        layout.tsx에서 getQueryClient() → 인스턴스 #1 (같은 요청이므로 동일)

요청 B: page.tsx에서 getQueryClient() → 인스턴스 #2 (다른 요청이므로 새로 생성)
```

이렇게 해야 하는 이유:

- **요청 내 공유**: 여러 서버 컴포넌트에서 prefetch한 데이터가 같은 QueryClient에 저장되어 `dehydrate` 시 모두 포함됨
- **요청 간 격리**: 유저 A의 데이터가 유저 B에게 노출되지 않음

**클라이언트 측 — 모듈 스코프 싱글턴:**

```typescript
let browserQueryClient: QueryClient | undefined;

// 최초 호출 시 생성, 이후 재사용
if (!browserQueryClient) browserQueryClient = makeQueryClient();
```

`useState` 대신 모듈 변수를 쓰는 이유: React가 초기 렌더링 중 Suspense로 컴포넌트를 중단(suspend)하면 state가 버려질 수 있다. 모듈 스코프 변수는 React 생명주기와 무관하게 유지된다.

**TanStack Query 공식 예시와의 차이:**

|           | 공식 예시                       | 우리 구현                              |
| --------- | ------------------------------- | -------------------------------------- |
| 서버      | `makeQueryClient()` 매번 호출   | `React.cache()`로 요청당 1개 보장      |
| 환경 감지 | `environmentManager.isServer()` | `environmentManager.isServer()` (동일) |
| 사용 위치 | Provider에서 1번만 호출 전제    | 여러 서버 컴포넌트에서 호출 가능       |

공식 예시는 `getQueryClient()`를 Provider 한 곳에서만 호출하는 구조라 매번 새로 만들어도 문제없다. 우리는 서버 컴포넌트에서 prefetch용으로 여러 곳에서 호출할 수 있어야 하므로 `React.cache()`로 요청 내 동일 인스턴스를 보장한다.

---

### 2-4. `environmentManager` 사용 (`isServer` 대신)

**결정:** `isServer` 대신 `environmentManager.isServer()`를 사용한다.

**근거:**

`isServer`는 TanStack Query에서 deprecated된 API다. `environmentManager`는 같은 역할을 하되, Chrome 확장이나 VSCode 확장 같은 비표준 환경에서 서버 감지를 오버라이드할 수 있는 공개 API로 도입되었다 ([PR #10199](https://github.com/TanStack/query/pull/10199)).

ResuFit은 일반 웹앱이라 오버라이드할 일은 없지만, deprecated API를 사용하지 않기 위해 `environmentManager`로 적용했다.

```typescript
// deprecated
import { isServer } from '@tanstack/react-query';
if (isServer) { ... }

// 현재 권장
import { environmentManager } from '@tanstack/react-query';
if (environmentManager.isServer()) { ... }
```

---

### 2-5. `staleTime: 60 * 1000` 기본값

**결정:** QueryClient의 기본 `staleTime`을 1분(60초)으로 설정한다.

**근거:**

TanStack Query의 기본 `staleTime`은 0이다. 즉, 데이터를 받자마자 "stale(오래됨)"로 간주하여 화면 포커스 시 재요청한다. SSR 환경에서는 서버에서 prefetch한 데이터가 클라이언트 hydration 직후 즉시 재요청되는 문제가 발생한다.

```
staleTime: 0 (기본값)
서버에서 fetch → HTML 전달 → 클라이언트 hydration → "stale이네?" → 즉시 재요청 (불필요)

staleTime: 60_000 (1분)
서버에서 fetch → HTML 전달 → 클라이언트 hydration → "아직 fresh" → 재요청 안 함
→ 1분 후 탭 전환 등으로 재포커스 시 재요청
```

도메인별로 다른 `staleTime`이 필요하면 `queryOptions`에서 개별 설정한다:

| 데이터         | staleTime | 근거                         |
| -------------- | --------- | ---------------------------- |
| 기본값         | **1분**   | QueryClient defaultOptions   |
| 분석 결과 상세 | 5분       | 재분석 전까지 불변           |
| 분석 목록      | 30초      | 다른 탭에서 삭제/재분석 가능 |

---

### 2-6. 에러 처리 패턴: 단일 클래스 + Register (패턴 C)

**결정:** 다중 클래스 상속(패턴 A)이나 Plain Object(패턴 B) 대신, 단일 에러 클래스 + TanStack Query Register interface(패턴 C)를 채택한다.

**비교했던 3가지 패턴:**

#### 패턴 A: 다중 클래스 상속 (초기 구현 → 폐기)

```typescript
class ApiRequestError extends Error { status: number; ... }
class UnauthorizedError extends ApiRequestError { ... } // 401
class ForbiddenError extends ApiRequestError { ... }    // 403
class NotFoundError extends ApiRequestError { ... }     // 404
```

- 사용: `if (error instanceof UnauthorizedError) { ... }`
- 문제: 클래스 4개는 과도. 401/403/404를 각각 다르게 처리하는 UI가 아직 없음. YAGNI 위반.

#### 패턴 B: Plain Object + Discriminated Union (검토 → 폐기)

```typescript
type ApiError =
  | { type: 'UNAUTHORIZED'; status: 401; message: string }
  | { type: 'FORBIDDEN'; status: 403; message: string }
  | { type: 'NOT_FOUND'; status: 404; message: string }
  | { type: 'UNKNOWN'; status: number; message: string };
```

- 사용: `if (error?.type === 'UNAUTHORIZED') { ... }`
- 문제:
  - **스택 트레이스 손실**: Error가 아닌 객체를 throw하면 에러 발생 위치를 추적할 수 없음
  - **TanStack Query 비권장**: 공식 문서에서 "Error가 아닌 것을 throw하는 것은 좋은 관행이 아니다"라고 명시
  - **Error Boundary 비호환**: Next.js `error.tsx`와 React Error Boundary는 Error 인스턴스를 기대

#### 패턴 C: 단일 클래스 + Register (채택)

```typescript
// src/lib/errors.ts — 클래스 1개
export class ApiRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}
```

```typescript
// src/types/api.ts — Register로 글로벌 에러 타입 등록
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiRequestError;
  }
}
```

- 사용: `if (error?.status === 401) { ... }`

**채택 근거:**

| 기준                | A. 다중 클래스  | B. Plain Object  | **C. 단일 클래스 + Register** |
| ------------------- | --------------- | ---------------- | ----------------------------- |
| 코드량              | 클래스 4개      | 타입 + 팩토리    | **클래스 1개**                |
| 스택 트레이스       | O               | X (손실)         | **O**                         |
| TanStack Query 호환 | instanceof 필요 | 매번 제네릭 명시 | **Register로 자동 추론**      |
| Error Boundary 호환 | O               | X                | **O**                         |
| 분기 방식           | instanceof      | type 필드        | **status 숫자 비교**          |
| 확장성              | 클래스 추가     | union 추가       | **status로 충분**             |

**동작 원리 — Register interface:**

TanStack Query v5는 TypeScript의 declaration merging을 활용한 Register interface를 제공한다. `defaultError`를 선언하면 프로젝트 전체에서 `useQuery`, `useMutation` 등의 `error` 필드가 자동으로 해당 타입으로 추론된다.

```typescript
// Register 선언 전
const { error } = useQuery({ ... });
//      ^? Error | null

// Register 선언 후
const { error } = useQuery({ ... });
//      ^? ApiRequestError | null — 제네릭 명시 없이 자동 추론
//      error.status 접근 가능
```

매번 `useQuery<Data, ApiRequestError>({ ... })`처럼 제네릭을 명시할 필요가 없고, 다른 제네릭(Data 타입 등)의 추론도 깨지지 않는다.

**참고 자료:**

- [TanStack Query v5 TypeScript 문서](https://tanstack.com/query/v5/docs/framework/react/typescript)
- [TanStack Query Register Interface 논의 #7177](https://github.com/TanStack/query/discussions/7177)
- [Typesafe Custom Errors 논의 #8675](https://github.com/TanStack/query/discussions/8675)

---

### 2-7. parseResponse 헬퍼 설계

**결정:** 모든 백엔드 API 응답을 `parseResponse<T>(res)` 하나로 파싱한다.

**구현:**

```typescript
// src/lib/parseResponse.ts
import type { ApiResponse } from '@/types/api';
import { ApiRequestError } from '@/lib/errors';

export async function parseResponse<T>(res: Response): Promise<T> {
  const json = await res.json();

  if (!res.ok) {
    const message = json.message || `API 요청 실패: ${res.status}`;
    throw new ApiRequestError(res.status, message);
  }

  return (json as ApiResponse<T>).data;
}
```

**동작 원리:**

1. `res.json()`으로 JSON 파싱
2. `res.ok`가 false(HTTP 4xx/5xx)면 → 백엔드 응답의 `message`를 사용하여 `ApiRequestError` throw
3. 성공이면 → `{ status, message, data }` 구조에서 `data`만 추출하여 반환

```
성공: { status: 200, message: "OK", data: { id: "abc", ... } }
       → parseResponse<Analysis>(res) → { id: "abc", ... } 반환

실패: { status: 404, message: "리소스를 찾을 수 없습니다." }
       → parseResponse<Analysis>(res) → ApiRequestError(404, "리소스를 찾을 수 없습니다.") throw
       → TanStack Query의 error 필드에 자동 전달
```

**파일명 결정 — `api.ts` → `parseResponse.ts`:**

초기에는 `api.ts`로 생성했으나, 파일 내용이 `parseResponse` 함수 하나뿐이라 파일명이 역할을 드러내지 못했다. `docs/data-fetching-strategy.md`에서 `fetchWithAuth.ts`가 별도로 존재하는 설계이므로, fetch 관련 유틸을 하나로 합칠 이유가 없어 함수명 그대로 `parseResponse.ts`로 변경했다.

---

### 2-8. QueryProvider 구조

**결정:** `src/providers/QueryProvider.tsx`에 'use client' Provider를 만들고, 서버 컴포넌트인 루트 레이아웃에서 import한다.

**구현:**

```tsx
// src/providers/QueryProvider.tsx
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from '@/lib/getQueryClient';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
```

```tsx
// src/app/layout.tsx (서버 컴포넌트)
import { QueryProvider } from '@/providers/QueryProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="font-sans">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

**동작 원리:**

```
서버 컴포넌트 (layout.tsx)
  └── 클라이언트 컴포넌트 (QueryProvider)  ← 'use client' 경계
        └── QueryClientProvider (Context 제공)
              └── children (서버/클라이언트 컴포넌트 혼합)
```

- `QueryClientProvider`는 내부적으로 `useContext`를 사용하므로 클라이언트 컴포넌트여야 한다
- 루트 레이아웃은 서버 컴포넌트로 유지하고, `QueryProvider`만 'use client'로 분리
- `children`은 서버 컴포넌트를 포함할 수 있다 — 클라이언트 컴포넌트가 children prop으로 서버 컴포넌트를 받는 것은 허용됨
- `ReactQueryDevtools`는 개발 환경에서만 자동으로 활성화됨 (프로덕션 빌드에서 제거)

---

### 2-9. next.config.ts fetch 로깅

**결정:** 개발 환경에서 fetch 요청의 전체 URL을 로깅한다.

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  reactCompiler: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};
```

**근거:** 서버 컴포넌트에서의 fetch 호출은 브라우저 네트워크 탭에 나타나지 않아 디버깅이 어렵다. `fullUrl: true`를 설정하면 개발 서버 터미널에 fetch URL이 출력되어 어떤 API가 호출되는지 확인할 수 있다.

---

### 2-10. .env.example 파일명

**결정:** `.env.local.example`이 아닌 `.env.example`로 생성한다.

**근거:** 프로젝트의 `.gitignore`가 `.env*` 패턴을 무시하되 `!.env.example`만 예외로 허용한다. `.env.local.example`은 `.env*` 패턴에 매칭되어 git에 추가할 수 없다.

```gitignore
.env*
!.env.example  # 이 파일만 git 추적 허용
```

---

## 3. 생성된 파일 요약

| 파일                              | 역할                                           |
| --------------------------------- | ---------------------------------------------- |
| `src/lib/getQueryClient.ts`       | 서버/클라이언트 QueryClient 생성 분리          |
| `src/providers/QueryProvider.tsx` | QueryClientProvider + DevTools 래퍼            |
| `src/types/api.ts`                | 공통 API 응답 타입 + Register 글로벌 에러 타입 |
| `src/lib/errors.ts`               | ApiRequestError 단일 에러 클래스               |
| `src/lib/parseResponse.ts`        | 공통 응답 파싱 헬퍼                            |
| `.env.example`                    | 환경 변수 예시 (BACKEND_URL)                   |
| `next.config.ts`                  | fetch 로깅 설정 추가                           |
| `src/app/layout.tsx`              | QueryProvider 루트 통합                        |
