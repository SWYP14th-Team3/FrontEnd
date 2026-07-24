# ResuFit 데이터 페칭 + 캐싱 + 인증 전략

> Next.js 16 App Router 기반, fetch + TanStack Query + BFF 아키텍처

---

## 1. 의사결정 요약

### 백엔드 협의 결과

| 항목           | 결정             |
| -------------- | ---------------- |
| 토큰 전달 방식 | 응답 바디에 JSON |
| OAuth 콜백     | 프론트에서 받음  |
| OAuth 종류     | 카카오 + 구글    |

### 기술 스택

| 도구               | 사용 여부  | 근거                                                                                   |
| ------------------ | ---------- | -------------------------------------------------------------------------------------- |
| `fetch` (Web API)  | **사용**   | Next.js가 fetch 중심 설계. 서버 컴포넌트, Route Handler, Middleware 모두 네이티브 지원 |
| TanStack Query     | **사용**   | prefetch hydration, mutation, 캐시 무효화, Suspense 통합                               |
| Axios              | **불필요** | BFF로 토큰을 쿠키 변환 → 인터셉터 필요 없음. fetch wrapper로 충분                      |
| Next.js Data Cache | **불필요** | 모든 데이터가 사용자별. 공유할 공개 데이터 없음                                        |
| `use cache`        | **불필요** | 사용자별 데이터 + 재분석으로 변경 가능 → TanStack Query와 이중화되어 복잡도만 증가     |
| 낙관적 업데이트    | **불필요** | 찜/좋아요 같은 빈번한 토글 인터랙션 없음. 모든 mutation이 로딩 UI 동반                 |

### Axios를 사용하지 않는 이유

Next.js 공식 문서는 `fetch`만 사용하며 Axios를 언급하지 않습니다. Next.js 팀의 공식 입장:

> "Migrate to native `fetch`. If you rely heavily on Axios Interceptors, you can use them, but you'll need to wrap your calls in `unstable_cache`."
> — [Next.js GitHub Discussion #89260](https://github.com/vercel/next.js/discussions/89260)

Axios가 과거에 유용했던 이유와 현재 대체:

| Axios 기능                     | 현재 대체                          |
| ------------------------------ | ---------------------------------- |
| 인터셉터 (토큰 주입, 401 갱신) | BFF 쿠키 변환 + Middleware refresh |
| 자동 JSON 파싱                 | `res.json()`                       |
| 타임아웃                       | `AbortSignal.timeout()`            |
| 요청/응답 변환                 | fetch wrapper 함수                 |

BFF로 토큰을 httpOnly 쿠키에 저장하면 브라우저가 쿠키를 자동 전송하고, 서버에서 `cookies()`로 읽으므로 클라이언트가 토큰을 직접 다룰 일이 없습니다. Axios 인터셉터가 해줄 일 자체가 사라집니다.

### Data Cache를 사용하지 않는 이유

Data Cache(`next: { tags }` + `updateTag`)는 **모든 유저에게 동일한 공개 데이터**를 서버 공유 캐시에 저장할 때 유용합니다:

```
쇼핑몰 예시:
A 유저: /products → fetch → Data Cache에 저장
B 유저: /products → Data Cache에서 바로 응답 (백엔드 호출 안 함)
→ 같은 상품 목록이니까 공유 가능

ResuFit:
A 유저: /result/abc → A의 분석 결과
B 유저: /result/abc → 접근 불가 (A의 데이터)
→ 공유할 데이터가 없음
```

모든 데이터가 사용자별이라 서버에 캐싱해봤자 그 유저만 쓰고 끝입니다. TanStack Query Cache(브라우저 메모리)에서만 관리하면 충분합니다.

Data Cache를 사용하지 않으므로 **이중 캐시 무효화**(`invalidateQueries` + `updateTag`)도 불필요합니다. TanStack Query 무효화만으로 충분합니다.

---

## 2. 인증 아키텍처

### 핵심: BFF 변환 (바디 토큰 → httpOnly 쿠키)

백엔드가 토큰을 응답 바디(JSON)로 전달하므로, **Route Handler에서 httpOnly 쿠키로 변환**합니다. 변환 이후 모든 흐름은 쿠키 기반으로 동작합니다.

토큰을 localStorage에 저장하지 않는 이유:

- XSS에 토큰이 노출됨
- 서버 컴포넌트에서 localStorage에 접근 불가 → SSR 장점을 잃음
- Middleware에서 refresh 불가 → Axios 인터셉터가 필요해짐

### OAuth 로그인 흐름

```
1. 유저가 "카카오로 계속하기" 클릭
2. 카카오 로그인 페이지로 이동
3. 카카오 → /auth/callback?code=xxx (프론트 페이지)
4. 콜백 페이지가 code를 Route Handler에 전달
5. Route Handler가 백엔드에 code 전송
6. 백엔드가 { accessToken, refreshToken } JSON 응답
7. Route Handler가 httpOnly 쿠키로 변환 + 200 응답
8. 콜백 페이지가 메인으로 이동
```

### OAuth 콜백 구현

```typescript
// src/app/auth/callback/page.tsx (클라이언트)
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = searchParams.get('code');
    const provider = searchParams.get('provider'); // 'kakao' | 'google'
    if (!code) return;

    fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, provider }),
    }).then((res) => {
      if (res.ok) router.replace('/');
      // 실패 처리
    });
  }, [searchParams, router]);

  return <p>로그인 중...</p>;
}
```

```typescript
// src/app/api/auth/session/route.ts (Route Handler)
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL!;

export async function POST(request: Request) {
  const { code, provider } = await request.json();

  // 백엔드에 인가 코드 전송 → 토큰 수신
  const res = await fetch(`${BACKEND_URL}/auth/${provider}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    return Response.json({ error: '로그인 실패' }, { status: 401 });
  }

  const { accessToken, refreshToken } = await res.json();

  // httpOnly 쿠키로 변환
  const cookieStore = await cookies();

  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1시간 (백엔드 만료 시간에 맞춤)
  });

  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14, // 14일
  });

  return Response.json({ success: true });
}
```

### 토큰 갱신: Middleware(Proxy)에서 처리

Next.js 공식 문서 권장 패턴입니다. 모든 요청이 Middleware를 거치므로, 여기서 토큰을 갱신하면 서버 컴포넌트와 Route Handler는 항상 유효한 토큰을 봅니다.

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // 토큰이 없으면 공개 페이지는 통과, 보호 페이지는 리다이렉트
  if (!accessToken && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // JWT 만료 확인 → 만료 임박 시 refresh
  if (accessToken && isExpiringSoon(accessToken) && refreshToken) {
    const res = await fetch(`${process.env.BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (res.ok) {
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await res.json();

      const response = NextResponse.next();
      response.cookies.set('access_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60,
      });
      if (newRefreshToken) {
        response.cookies.set('refresh_token', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 14,
        });
      }
      return response;
    }

    // refresh 실패 → 쿠키 삭제 + 로그인 페이지로
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    return response;
  }

  return NextResponse.next();
}

function isProtectedRoute(pathname: string) {
  const protectedRoutes = ['/result', '/history'];
  return protectedRoutes.some((route) => pathname.startsWith(route));
}

function isExpiringSoon(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    // 만료 5분 전부터 갱신
    return Date.now() > exp - 5 * 60 * 1000;
  } catch {
    return true;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 각 레이어의 역할

```
Middleware (Proxy)
  → 모든 요청의 관문
  → 쿠키에서 토큰 확인 → 만료 시 refresh → 새 쿠키 설정
  → 비인증 시 리다이렉트

서버 컴포넌트
  → 페이지 로드 시 데이터 읽기
  → cookies()로 토큰 읽기 → 백엔드 직접 호출
  → Middleware에서 이미 갱신했으므로 항상 유효한 토큰

Route Handler
  → 클라이언트 mutation 전용 프록시
  → cookies()로 토큰 읽기 → 백엔드에 Authorization 헤더로 전달
  → 쿠키 → 헤더 변환 역할만

클라이언트 컴포넌트
  → UI + TanStack Query mutation
  → fetch('/api/...') 호출 시 브라우저가 쿠키 자동 포함
  → 토큰을 직접 다루지 않음
```

| 레이어        | 토큰 접근 방법       | 하는 일                             |
| ------------- | -------------------- | ----------------------------------- |
| Middleware    | `request.cookies`    | 만료 확인 → refresh → 새 쿠키 설정  |
| 서버 컴포넌트 | `cookies()`          | 토큰 읽기 → 백엔드 GET 호출         |
| Route Handler | `cookies()`          | 토큰 읽기 → 백엔드 POST/DELETE 전달 |
| 클라이언트    | 접근 불가 (httpOnly) | fetch('/api/...') → 쿠키 자동 포함  |

---

## 3. 데이터 페칭 레이어 구조

### 공통 API 응답 형식 (백엔드 확정)

```typescript
// 성공 응답
{
  "status": 200,
  "message": "OK",
  "data": {}
}

// 에러 응답
{
  "status": 404,
  "message": "리소스를 찾을 수 없습니다."
}
```

```typescript
// src/types/api.ts
type ApiResponse<T> = {
  status: number;
  message: string;
  data: T;
};

type ApiError = {
  status: number;
  message: string;
};
```

### 3-1. API 함수 레이어 (`src/api/{도메인}/index.ts`)

서버용과 클라이언트용 함수를 분리합니다. 공통 응답에서 `data`를 추출하는 헬퍼를 사용합니다.

```typescript
// src/lib/api.ts — 공통 응답 파싱
import type { ApiResponse } from '@/types/api';

export async function parseResponse<T>(res: Response): Promise<T> {
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || `API 요청 실패: ${res.status}`);
  }

  return (json as ApiResponse<T>).data;
}
```

```typescript
// src/api/analysis/index.ts
import { parseResponse } from '@/lib/api';

const BACKEND_URL = process.env.BACKEND_URL!;

// ── 서버 전용 — 서버 컴포넌트에서 백엔드 직접 호출 ──
export async function fetchAnalysisResult(id: string, token: string) {
  const res = await fetch(`${BACKEND_URL}/api/analysis/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(res);
}

export async function fetchAnalysisList(params: { page?: number; q?: string }, token: string) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.q) searchParams.set('q', params.q);

  const res = await fetch(`${BACKEND_URL}/api/analysis?${searchParams}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(res);
}

// ── 클라이언트 전용 — Route Handler 경유 (쿠키 자동 전송) ──
export async function deleteAnalysis(id: string) {
  const res = await fetch(`/api/analysis/${id}`, { method: 'DELETE' });
  return parseResponse(res);
}

export async function reanalyze(id: string, body: { resumeText: string }) {
  const res = await fetch(`/api/analysis/${id}/reanalyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseResponse(res);
}

export async function saveAnalysis(id: string) {
  const res = await fetch(`/api/analysis/${id}/save`, { method: 'POST' });
  return parseResponse(res);
}
```

### 3-2. Query 정의 레이어 (`src/api/{도메인}/queries.ts`)

queryKey 팩토리, queryOptions, mutation 훅을 정의합니다.

```typescript
// src/api/analysis/queries.ts
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAnalysisResult, fetchAnalysisList, deleteAnalysis, reanalyze, saveAnalysis } from './index';

// ── queryKey 팩토리 ──────────────────────────────────
// 계층적 구조로 그룹 무효화를 지원합니다.
//
// 전체 무효화: invalidateQueries({ queryKey: analysisKeys.all })
//   → ['analysis', 'detail', ...], ['analysis', 'list', ...] 모두 무효화
// 개별 무효화: invalidateQueries({ queryKey: analysisKeys.detail('abc') })
//   → ['analysis', 'detail', 'abc']만 무효화

export const analysisKeys = {
  all: ['analysis'] as const,
  detail: (id: string) => [...analysisKeys.all, 'detail', id] as const,
  list: (params?: { page?: number; q?: string }) => [...analysisKeys.all, 'list', params ?? {}] as const,
};

// ── queryOptions ─────────────────────────────────────
// 서버 prefetch와 클라이언트 useQuery에서 동일한 옵션을 공유합니다.

export const analysisQueries = {
  detail: (id: string, token?: string) =>
    queryOptions({
      queryKey: analysisKeys.detail(id),
      queryFn: () => fetchAnalysisResult(id, token!),
      staleTime: 5 * 60 * 1000, // 5분 — 재분석 전까지 불변
    }),

  list: (params: { page?: number; q?: string } = {}, token?: string) =>
    queryOptions({
      queryKey: analysisKeys.list(params),
      queryFn: () => fetchAnalysisList(params, token!),
      staleTime: 30 * 1000, // 30초 — 목록은 비교적 자주 변할 수 있음
    }),
};

// ── mutation 훅 ──────────────────────────────────────
// 캐시 무효화(데이터 동기화)와 UI 부수효과(토스트 등)를 분리합니다.
// 훅: 캐시 무효화 담당 (항상 실행)
// 컴포넌트: UI 콜백 담당 (options.onSuccess로 주입)

export function useDeleteAnalysis(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAnalysis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analysisKeys.list() });
      options?.onSuccess?.();
    },
  });
}

export function useReanalyze(analysisId: string, options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { resumeText: string }) => reanalyze(analysisId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: analysisKeys.detail(analysisId),
      });
      options?.onSuccess?.();
    },
  });
}

export function useSaveAnalysis(analysisId: string, options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: () => saveAnalysis(analysisId),
    onSuccess: () => {
      options?.onSuccess?.();
    },
  });
}
```

### 3-3. 서버 컴포넌트 (prefetch + hydration)

서버에서 데이터를 미리 가져와 TanStack Query Cache에 주입합니다.

```typescript
// src/app/result/[id]/page.tsx
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/getQueryClient';
import { analysisQueries } from '@/api/analysis/queries';

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const token = (await cookies()).get('access_token')?.value;

  if (!token) redirect('/');

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(analysisQueries.detail(id, token));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BackButton />
      <ResultHeader analysisId={id} />
      <Suspense fallback={<PanelSkeleton />}>
        <AnalysisPanels analysisId={id} />
      </Suspense>
    </HydrationBoundary>
  );
}
```

### 3-4. 클라이언트 컴포넌트 (소비)

서버에서 hydrate된 캐시를 소비하거나 mutation을 실행합니다.

```typescript
// prefetch된 데이터 소비 — Suspense와 통합
'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { analysisQueries } from '@/api/analysis/queries';

export function AnalysisPanels({ analysisId }: { analysisId: string }) {
  const { data } = useSuspenseQuery(analysisQueries.detail(analysisId));

  return (
    <MatchingController matchMap={data.matchMap}>
      <JdPanel data={data.jdAnalysis} />
      <ResumePanel data={data.resumeAnalysis} />
    </MatchingController>
  );
}
```

```typescript
// mutation — 콜백 분리 패턴
'use client';

import { useSaveAnalysis } from '@/api/analysis/queries';

export function SaveButton({ analysisId }: { analysisId: string }) {
  const { mutate, isPending } = useSaveAnalysis(analysisId, {
    onSuccess: () => showToast('저장 완료!'),
  });

  return (
    <button onClick={() => mutate()} disabled={isPending}>
      {isPending ? '저장 중...' : '저장하기'}
    </button>
  );
}
```

---

## 4. 캐싱 전략

### 캐시 레이어

| 캐시                     | 관리 방식                         | 역할                                               |
| ------------------------ | --------------------------------- | -------------------------------------------------- |
| **TanStack Query Cache** | 직접 관리 (staleTime, invalidate) | API 응답 데이터 캐싱                               |
| **Router Cache**         | 자동 동작 (설정 불필요)           | 클라이언트 네비게이션 시 이전 페이지 RSC 결과 캐싱 |

### TanStack Query 캐시 흐름

```
서버 컴포넌트에서:
  fetch → prefetchQuery → dehydrate
                            ↓
                HydrationBoundary로 클라이언트에 전달
                            ↓
클라이언트에서:
  useQuery → TanStack Query Cache에서 꺼냄 (로딩 없음)
           → staleTime 이내면 재요청 안 함
           → 만료되면 백그라운드 재요청
```

서버에서 fetch한 데이터가 직렬화(dehydrate)되어 HTML에 포함되고, 클라이언트에서 hydrate되어 TanStack Query Cache에 주입됩니다. 별도 서버 캐시(Data Cache)에 저장하지 않습니다.

### staleTime 정책

| 데이터         | staleTime | 근거                                                 |
| -------------- | --------- | ---------------------------------------------------- |
| 분석 결과 상세 | **5분**   | 재분석 전까지 불변. 탭 이동 후 돌아와도 재요청 안 함 |
| 분석 목록      | **30초**  | 다른 탭에서 삭제/재분석이 일어날 수 있음             |
| 기본값         | **1분**   | QueryClient defaultOptions                           |

### 캐시 무효화

모든 데이터가 사용자별이므로 **TanStack Query 무효화만** 하면 됩니다:

| 액션              | 무효화 대상               | 이유                            |
| ----------------- | ------------------------- | ------------------------------- |
| 재분석 성공 (4.6) | `analysisKeys.detail(id)` | 해당 결과만 갱신                |
| 저장 성공 (4.7)   | 없음                      | 현재 보고 있는 데이터가 곧 최신 |
| 삭제 성공 (5.3)   | `analysisKeys.list()`     | 목록에서 제거                   |
| OAuth 로그인 성공 | `analysisKeys.all`        | 로그인 후 모든 데이터 새로 로드 |

---

## 5. Suspense 전략

### SuspenseBoundary 사용 기준

| 상황               | 감싸는 것                    | 이유                                               |
| ------------------ | ---------------------------- | -------------------------------------------------- |
| 서버 prefetch 있음 | `ErrorBoundary`만            | 데이터가 이미 hydrate되어 로딩 불필요, 에러만 대비 |
| 서버 prefetch 없음 | `Suspense` + `ErrorBoundary` | 로딩 + 에러 모두 필요                              |

```tsx
// prefetch 있는 영역
<ErrorBoundary fallback={<p>분석 결과를 불러올 수 없습니다</p>}>
  <AnalysisPanels analysisId={id} />
</ErrorBoundary>

// prefetch 없는 영역
<Suspense fallback={<Skeleton />}>
  <ErrorBoundary fallback={<p>오류가 발생했습니다</p>}>
    <SomeClientOnlyData />
  </ErrorBoundary>
</Suspense>
```

### 페이지별 Suspense 배치

```
메인 페이지 (/)
└── <Suspense fallback={<MainFormSkeleton />}>
    └── MainForm (cookiePromise로 인증 분기)

분석 결과 (/result/[id])
├── ResultHeader + FitScoreSummary (즉시 렌더)
└── <Suspense fallback={<PanelSkeleton />}>
    └── AnalysisPanels (서버 prefetch → hydrate)

분석 목록 (/history)
└── 서버에서 직접 렌더 (prefetch → 즉시 HTML)
```

### startTransition으로 Suspense 깜빡임 방지

히스토리 목록에서 검색어/페이지 변경 시 매번 스켈레톤이 노출되는 것을 방지합니다.

```typescript
const [searchQuery, setSearchQuery] = useState('');
const [isPending, startTransition] = useTransition();

function handleSearch(q: string) {
  startTransition(() => {
    setSearchQuery(q);
  });
}

<div className={cn('space-y-4', isPending && 'opacity-50')}>
  <AnalysisList query={searchQuery} />
</div>
```

---

## 6. Route Handler (BFF 프록시)

클라이언트 컴포넌트는 `cookies()`를 사용할 수 없으므로, Route Handler가 **쿠키 → Authorization 헤더 변환**을 담당합니다.

### fetch wrapper

```typescript
// src/lib/fetchWithAuth.ts
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL!;

export async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const token = (await cookies()).get('access_token')?.value;

  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
}
```

Middleware에서 이미 토큰을 갱신하므로 Route Handler에서는 refresh 로직이 불필요합니다.

### Route Handler 예시

```typescript
// src/app/api/analysis/[id]/reanalyze/route.ts
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const res = await fetchWithAuth(`/api/analysis/${id}/reanalyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
```

### Route Handler 목록

| mutation     | Route Handler                       | 성공 시 캐시 무효화       |
| ------------ | ----------------------------------- | ------------------------- |
| 재분석 (4.6) | `POST /api/analysis/[id]/reanalyze` | `analysisKeys.detail(id)` |
| 저장 (4.7)   | `POST /api/analysis/[id]/save`      | 없음                      |
| 삭제 (5.3)   | `DELETE /api/analysis/[id]`         | `analysisKeys.list()`     |

---

## 7. QueryClient 설정

서버와 클라이언트에서 QueryClient의 생명주기가 다릅니다.

```typescript
// src/lib/getQueryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';
import { isServer } from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 기본 1분
      },
    },
  });
}

// 서버: React.cache()로 요청 당 1개 (요청 간 데이터 격리)
const getServerQueryClient = cache(() => makeQueryClient());

// 클라이언트: 싱글턴 (앱 전체에서 1개 재사용)
let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) return getServerQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
```

---

## 8. 분석 요청 흐름 (비동기 방식 전제)

프론트 UX 측면에서 ID 먼저 발급 방식을 백엔드에 제안한 상태입니다.

### 비동기 방식 (권장, 백엔드에 제안 중)

```
"분석하기" 클릭
→ POST /api/analyze (이력서 + 공고)
→ 즉시 { analysisId: "abc" }
→ router.push('/result/abc')
→ /result/abc 진입 → polling으로 상태 확인
  → processing → 로딩 UI (프로그레스바 + 메시지 전환)
  → completed → 결과 렌더링
  → failed → 에러 UI + 메인으로 돌아가기
```

장점:

- URL이 즉시 의미 있음 (`/result/abc`)
- 새로고침/탭 닫기에 안전
- LLM이 오래 걸려도 fetch timeout 위험 없음

### 동기 방식 (백엔드가 선택할 경우)

```
"분석하기" 클릭
→ POST /api/analyze (이력서 + 공고)
→ 3~5초 대기 (LLM 처리 완료까지)
→ { analysisId: "abc", result: {...} }
→ router.push('/result/abc')
```

이 경우 메인 페이지에서 대기 중 로딩 UI를 별도로 처리해야 합니다.

---

## 9. 미결정 사항 (백엔드 추가 확인 필요)

| 항목                          | 현재 상태                    | 확정 시점                 |
| ----------------------------- | ---------------------------- | ------------------------- |
| refresh 엔드포인트 URL        | 미정                         | 백엔드 API 확정 후        |
| 분석 API 동기/비동기          | 비동기 제안 중               | 백엔드 답변 대기          |
| API 응답 스키마 (matchMap 등) | 렌더링 전략 문서의 예시 기준 | 백엔드 API 스키마 확정 후 |
