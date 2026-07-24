# 에러 핸들링 공통 컴포넌트 & 루트 Providers 구성

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** sail-mate의 ErrorBoundary/SuspenseBoundary 코드를 이 프로젝트에 가져오고, 루트 Providers를 정리한다.

**Architecture:** ErrorBoundary(class component)와 SuspenseBoundary(함수 컴포넌트)를 `src/components/common/` 아래에 배치한다. 루트 Providers 조합을 `src/providers/index.tsx`에 만들어 `layout.tsx`를 깔끔하게 유지한다. AuthModalProvider는 아직 미구현이므로 QueryProvider만 포함한다.

**Tech Stack:** React 19, Next.js 16 (App Router), TypeScript

## Global Constraints

- Next.js 16 App Router — `page.tsx`, `layout.tsx`는 항상 서버 컴포넌트
- `'use client'`는 클라이언트 기능이 필요한 컴포넌트에만 선언
- 컴포넌트 파일명: PascalCase, 함수 선언문 사용
- named export 사용 (페이지 파일 제외)
- 경로 alias `@/` 사용
- barrel export (`index.ts`) 사용하지 않음 — 직접 파일 경로로 import
- Prettier (printWidth: 120, singleQuote: true) + ESLint 자동 적용

## 파일 구조

```
src/
├── components/
│   └── common/
│       ├── ErrorBoundary.tsx          # ErrorBoundary class component ('use client')
│       └── SuspenseBoundary.tsx       # Suspense + ErrorBoundary 조합 ('use client')
├── providers/
│   ├── QueryProvider.tsx              # 기존 파일 (수정 없음)
│   └── index.tsx                      # 루트 Providers 조합 ('use client')
└── app/
    └── layout.tsx                     # Providers import 변경
```

## 사용 규칙 (참고)

| 상황          | 감싸는 것        | 이유                                      |
| ------------- | ---------------- | ----------------------------------------- |
| prefetch 있음 | ErrorBoundary만  | 로딩 없음 (이미 데이터 있음), 에러만 대비 |
| prefetch 없음 | SuspenseBoundary | 로딩 + 에러 둘 다 필요                    |
| API 호출 없음 | 불필요           | 에러 날 일 없음                           |

---

### Task 1: ErrorBoundary 컴포넌트

**Files:**

- Create: `src/components/common/ErrorBoundary.tsx`

**Interfaces:**

- Consumes: 없음
- Produces:
  - `ErrorBoundary` (named export) — class component
  - `ErrorBoundaryProps` (named export type)
    - `children: ReactNode`
    - `fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode)`
    - `onError?: (error: Error, errorInfo: ErrorInfo) => void`
    - `onReset?: () => void`
    - `resetKeys?: unknown[]`

- [ ] **Step 1: ErrorBoundary 컴포넌트 생성**

`src/components/common/ErrorBoundary.tsx` 파일을 생성한다. sail-mate의 ErrorBoundary와 동일한 구현이되, 이 프로젝트 컨벤션에 맞게 타입을 같은 파일에 선언한다.

```tsx
'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

export type ErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: unknown[];
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);

    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 ErrorBoundary caught an error');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    const { error } = this.state;

    if (error == null || resetKeys == null) {
      return;
    }

    const hasResetKeysChanged =
      prevProps.resetKeys == null ||
      resetKeys.length !== prevProps.resetKeys.length ||
      resetKeys.some((key, index) => !Object.is(key, prevProps.resetKeys![index]));

    if (hasResetKeysChanged) {
      this.reset();
    }
  }

  reset = (): void => {
    this.props.onReset?.();
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error != null) {
      if (typeof fallback === 'function') {
        return fallback(error, this.reset);
      }
      return fallback;
    }

    return children;
  }
}
```

- [ ] **Step 2: 빌드 확인**

Run: `pnpm build`
Expected: 빌드 성공 (ErrorBoundary는 아직 어디서도 import하지 않으므로 tree-shaking 됨)

- [ ] **Step 3: 커밋**

```bash
git add src/components/common/ErrorBoundary.tsx
git commit -m "feat: ErrorBoundary 공통 컴포넌트 추가"
```

---

### Task 2: SuspenseBoundary 컴포넌트

**Files:**

- Create: `src/components/common/SuspenseBoundary.tsx`

**Interfaces:**

- Consumes: `ErrorBoundary` from `@/components/common/ErrorBoundary`
- Produces:
  - `SuspenseBoundary` (named export) — 함수 컴포넌트
  - `SuspenseBoundaryProps` (named export type)
    - `children: ReactNode`
    - `pendingFallback: ReactNode`
    - `errorFallback: ReactNode | ((error: Error, reset: () => void) => ReactNode)`
    - `onError?: (error: Error, errorInfo: ErrorInfo) => void`
    - `onReset?: () => void`
    - `resetKeys?: unknown[]`

- [ ] **Step 1: SuspenseBoundary 컴포넌트 생성**

`src/components/common/SuspenseBoundary.tsx` 파일을 생성한다.

```tsx
'use client';

import { Suspense, type ErrorInfo, type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export type SuspenseBoundaryProps = {
  children: ReactNode;
  pendingFallback: ReactNode;
  errorFallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: unknown[];
};

export function SuspenseBoundary({
  children,
  pendingFallback,
  errorFallback,
  onError,
  onReset,
  resetKeys,
}: SuspenseBoundaryProps) {
  return (
    <ErrorBoundary fallback={errorFallback} onError={onError} onReset={onReset} resetKeys={resetKeys}>
      <Suspense fallback={pendingFallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `pnpm build`
Expected: 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add src/components/common/SuspenseBoundary.tsx
git commit -m "feat: SuspenseBoundary 공통 컴포넌트 추가"
```

---

### Task 3: 루트 Providers 조합 + layout.tsx 연결

**Files:**

- Create: `src/providers/index.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**

- Consumes: `QueryProvider` from `@/providers/QueryProvider`
- Produces: `Providers` (named export) — children을 받아 QueryProvider로 감싸는 컴포넌트

- [ ] **Step 1: Providers 조합 컴포넌트 생성**

`src/providers/index.tsx` 파일을 생성한다. 현재는 QueryProvider만 포함하고, 추후 AuthModalProvider 등을 추가할 수 있는 구조로 만든다.

```tsx
'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from '@/providers/QueryProvider';

export function Providers({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
```

- [ ] **Step 2: layout.tsx에서 Providers 사용**

`src/app/layout.tsx`를 수정한다. 기존 `QueryProvider` 직접 import를 `Providers`로 교체한다.

```tsx
import './globals.css';
import { Providers } from '@/providers';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: 빌드 확인**

Run: `pnpm build`
Expected: 빌드 성공. `Providers`가 `QueryProvider`를 감싸고 있으므로 기존과 동일하게 동작

- [ ] **Step 4: 커밋**

```bash
git add src/providers/index.tsx src/app/layout.tsx
git commit -m "feat: 루트 Providers 조합 구성 및 layout.tsx 연결"
```
