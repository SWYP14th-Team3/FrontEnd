# TanStack Query + 공통 API 인프라 세팅 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** TanStack Query 세팅과 공통 API 인프라(타입, 에러 클래스, parseResponse 헬퍼)를 구성하여 데이터 페칭 기반을 완성한다.

**Architecture:** 서버/클라이언트 QueryClient를 분리하고(서버: React.cache() 요청당 1개, 클라이언트: 싱글턴), QueryClientProvider 래퍼로 앱 전체에 주입한다. 공통 API 응답 타입과 에러 클래스를 정의하고, parseResponse 헬퍼로 응답 파싱을 표준화한다.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, TanStack Query v5, pnpm

## Global Constraints

- Next.js 16 App Router — Pages Router 사용 금지
- TypeScript strict mode
- pnpm 패키지 매니저
- React Compiler 활성화 — useMemo/useCallback/React.memo 수동 사용 금지
- 함수 선언문 사용 (화살표 함수 X)
- named export 사용 (page.tsx 제외)
- 경로 alias `@/` 사용
- barrel export (index.ts) 사용 금지
- Axios 사용하지 않음 — fetch + TanStack Query만 사용

---

### Task 1: TanStack Query 패키지 설치 + 공통 API 타입 + 에러 클래스 + parseResponse 헬퍼 + QueryClient + QueryProvider + 루트 레이아웃 통합 + env + next.config

**Files:**

- Modify: `package.json` (pnpm add로 자동 변경)
- Create: `src/types/api.ts`
- Create: `src/lib/errors.ts`
- Create: `src/lib/api.ts`
- Create: `src/lib/getQueryClient.ts`
- Create: `src/providers/QueryProvider.tsx`
- Modify: `src/app/layout.tsx`
- Create: `.env.local.example`
- Modify: `next.config.ts`

**Interfaces:**

- Consumes: 없음 (첫 번째 태스크)
- Produces:
  - `ApiResponse<T>` type: `{ status: number; message: string; data: T }`
  - `ApiError` type: `{ status: number; message: string }`
  - `ApiRequestError` class: `extends Error`, `status: number`, `message: string`
  - `UnauthorizedError` class: `extends ApiRequestError`, status 고정 401
  - `parseResponse<T>(res: Response): Promise<T>` — 공통 응답에서 data 추출
  - `getQueryClient(): QueryClient` — 서버/클라이언트 분리된 QueryClient 반환
  - `QueryProvider` component: QueryClientProvider + ReactQueryDevtools 래퍼

- [ ] **Step 1: TanStack Query 패키지 설치**

```bash
cd /Users/rak/swyp14th-team3
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

- [ ] **Step 2: 공통 API 응답 타입 생성**

`src/types/api.ts` 파일을 생성한다:

```typescript
export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T;
};

export type ApiError = {
  status: number;
  message: string;
};
```

- [ ] **Step 3: 커스텀 에러 클래스 생성**

`src/lib/errors.ts` 파일을 생성한다:

```typescript
export class ApiRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

export class UnauthorizedError extends ApiRequestError {
  constructor(message = '인증이 필요합니다.') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiRequestError {
  constructor(message = '접근 권한이 없습니다.') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiRequestError {
  constructor(message = '리소스를 찾을 수 없습니다.') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}
```

- [ ] **Step 4: parseResponse 헬퍼 생성**

`src/lib/api.ts` 파일을 생성한다:

```typescript
import type { ApiResponse } from '@/types/api';
import { ApiRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '@/lib/errors';

export async function parseResponse<T>(res: Response): Promise<T> {
  const json = await res.json();

  if (!res.ok) {
    const message = json.message || `API 요청 실패: ${res.status}`;

    switch (res.status) {
      case 401:
        throw new UnauthorizedError(message);
      case 403:
        throw new ForbiddenError(message);
      case 404:
        throw new NotFoundError(message);
      default:
        throw new ApiRequestError(res.status, message);
    }
  }

  return (json as ApiResponse<T>).data;
}
```

- [ ] **Step 5: getQueryClient 생성**

`src/lib/getQueryClient.ts` 파일을 생성한다:

```typescript
import { QueryClient, isServer } from '@tanstack/react-query';
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
  if (isServer) return getServerQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
```

- [ ] **Step 6: QueryProvider 생성**

`src/providers/QueryProvider.tsx` 파일을 생성한다:

```tsx
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

- [ ] **Step 7: 루트 레이아웃에 QueryProvider 통합**

`src/app/layout.tsx`를 다음과 같이 수정한다:

```tsx
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="font-sans">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 8: .env.local.example 생성**

`.env.local.example` 파일을 생성한다:

```
# 백엔드 API 서버 URL
BACKEND_URL=http://localhost:8080
```

- [ ] **Step 9: next.config.ts에 fetch 로깅 옵션 추가**

`next.config.ts`를 다음과 같이 수정한다:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
```

- [ ] **Step 10: 빌드 및 린트 검증**

```bash
cd /Users/rak/swyp14th-team3
pnpm build
pnpm lint
```

Expected: 에러 없이 통과

- [ ] **Step 11: 커밋**

```bash
cd /Users/rak/swyp14th-team3
git add src/types/api.ts src/lib/errors.ts src/lib/api.ts src/lib/getQueryClient.ts src/providers/QueryProvider.tsx src/app/layout.tsx .env.local.example next.config.ts package.json pnpm-lock.yaml
git commit -m "chore: TanStack Query + 공통 API 인프라 세팅"
```
