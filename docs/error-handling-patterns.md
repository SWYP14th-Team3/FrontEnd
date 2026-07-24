# API 에러 처리 패턴 비교

> TanStack Query v5 + Next.js 16 App Router 환경에서의 커스텀 에러 처리 3가지 접근 비교

---

## 1. 공식 문서의 에러 처리 철학

### TanStack Query v5

TanStack Query는 `queryFn`에서 throw된 에러를 `error` 필드로 노출한다.

**핵심 원칙:** "Error가 아닌 것을 throw하는 것은 좋은 관행이 아니다" ([공식 문서](https://tanstack.com/query/v5/docs/framework/react/typescript))

```typescript
// TanStack Query가 권장하는 패턴: Error 서브클래스 + type narrowing
const { error } = useQuery({ queryKey: ['groups'], queryFn: fetchGroups });
//      ^? Error | null (기본 타입)

// 또는 Register로 글로벌 에러 타입 지정
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: MyCustomError; // 모든 useQuery에서 자동 추론
  }
}
```

기본 `error` 타입은 `Error`이며, 두 가지 방법으로 커스텀 타입을 사용할 수 있다:

1. **Register interface** (권장): 글로벌 설정, 매번 제네릭 명시 불필요
2. **제네릭 명시**: `useQuery<Data, MyError>(...)` — 다른 제네릭 추론이 깨져서 비권장

### Next.js 16 App Router

Next.js는 에러를 **Expected errors**와 **Uncaught exceptions** 두 범주로 나눈다.

**Expected errors (예상된 에러):**

```typescript
// Server Function — throw 대신 return value로 처리
'use server';
export async function createPost(prevState: any, formData: FormData) {
  const res = await fetch('https://api.example.com/posts', {
    method: 'POST',
    body: { title: formData.get('title') },
  });

  if (!res.ok) {
    return { message: 'Failed to create post' }; // throw하지 않음
  }
}

// Server Component — 조건부 렌더링
export default async function Page() {
  const res = await fetch('https://...');
  if (!res.ok) return 'There was an error.';
  // ...
}

// 404 — notFound() 함수 사용
import { notFound } from 'next/navigation';
if (!post) notFound(); // not-found.tsx가 렌더링됨
```

**Uncaught exceptions (예상치 못한 에러):**

```typescript
// error.tsx — Error Boundary로 캐치
// error 파라미터는 항상 Error & { digest?: string } 타입
'use client';
export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => unstable_retry()}>Try again</button>
    </div>
  );
}
```

> Next.js의 `error.tsx`는 `Error & { digest?: string }`만 받는다. 커스텀 에러 클래스를 사용해도 `error.message`와 `error.digest`만 접근 가능하며, 커스텀 필드(status 등)는 서버→클라이언트 직렬화 과정에서 소실될 수 있다.

### React

React의 Error Boundary(`getDerivedStateFromError`, `componentDidCatch`)는 렌더링 중 발생하는 에러만 캐치한다. 커스텀 에러 클래스에 대한 별도 패턴은 제시하지 않으며, 기본 `Error` 인스턴스 처리만 다룬다. `react-error-boundary` 패키지 사용을 권장한다.

---

## 2. 세 가지 패턴 비교

### 패턴 A: 다중 클래스 상속 (현재 구현)

```typescript
// src/lib/errors.ts
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

```typescript
// src/lib/api.ts — throw 시 클래스 분기
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

```typescript
// 사용 — instanceof로 분기
const { error } = useQuery({ ... });

if (error instanceof UnauthorizedError) {
  router.push('/login');
} else if (error instanceof NotFoundError) {
  // 404 UI
}
```

**동작 원리:**

1. `parseResponse`에서 HTTP 상태 코드별로 다른 클래스를 throw
2. TanStack Query가 이를 캐치하여 `error` 필드에 저장
3. 소비 측에서 `instanceof`로 런타임 타입 체크 후 분기

### 패턴 B: Plain Object + Discriminated Union

```typescript
// src/lib/errors.ts
export type ApiError =
  | { type: 'UNAUTHORIZED'; status: 401; message: string }
  | { type: 'FORBIDDEN'; status: 403; message: string }
  | { type: 'NOT_FOUND'; status: 404; message: string }
  | { type: 'SERVER_ERROR'; status: 500; message: string }
  | { type: 'UNKNOWN'; status: number; message: string };

export function createApiError(status: number, message: string): ApiError {
  switch (status) {
    case 401:
      return { type: 'UNAUTHORIZED', status, message };
    case 403:
      return { type: 'FORBIDDEN', status, message };
    case 404:
      return { type: 'NOT_FOUND', status, message };
    case 500:
      return { type: 'SERVER_ERROR', status, message };
    default:
      return { type: 'UNKNOWN', status, message };
  }
}
```

```typescript
// src/lib/api.ts — plain object를 throw
export async function parseResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) {
    const message = json.message || `API 요청 실패: ${res.status}`;
    throw createApiError(res.status, message); // Error가 아닌 객체를 throw
  }
  return (json as ApiResponse<T>).data;
}
```

```typescript
// 사용 — type 필드로 분기 (exhaustiveness checking 가능)
// useQuery의 error 타입을 제네릭으로 명시해야 함
const { error } = useQuery<Data, ApiError>({ ... });

if (error?.type === 'UNAUTHORIZED') {
  // TypeScript가 status: 401로 자동 축소
  router.push('/login');
}
```

**동작 원리:**

1. `parseResponse`에서 plain object를 throw
2. TanStack Query가 이를 캐치하여 `error` 필드에 저장
3. 소비 측에서 `type` 필드로 discriminated union 분기 (TypeScript 타입 축소)

> 주의: Error가 아닌 객체를 throw하면 **스택 트레이스가 생성되지 않는다**. 디버깅 시 에러 발생 위치를 추적할 수 없다.

### 패턴 C: 단일 클래스 + Register (권장)

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
import type { ApiRequestError } from '@/lib/errors';

export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T;
};

export type ApiError = {
  status: number;
  message: string;
};

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiRequestError;
  }
}
```

```typescript
// src/lib/api.ts — 단일 클래스만 throw
export async function parseResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) {
    const message = json.message || `API 요청 실패: ${res.status}`;
    throw new ApiRequestError(res.status, message);
  }
  return (json as ApiResponse<T>).data;
}
```

```typescript
// 사용 — error가 자동으로 ApiRequestError 타입
const { error } = useQuery({ queryKey: ['analysis', id], queryFn: ... });
//      ^? ApiRequestError | null — 제네릭 명시 불필요

if (error?.status === 401) {
  router.push('/login');
} else if (error?.status === 404) {
  // 404 UI
}
```

**동작 원리:**

1. `parseResponse`에서 `ApiRequestError` 하나만 throw
2. TanStack Query가 이를 캐치하여 `error` 필드에 저장
3. Register interface 덕분에 모든 `useQuery`의 `error`가 자동으로 `ApiRequestError` 타입
4. 소비 측에서 `error.status`로 분기 — `instanceof`도 제네릭도 불필요

---

## 3. 장단점 비교표

| 기준                         | A. 다중 클래스 상속   | B. Plain Object       | **C. 단일 클래스 + Register** |
| ---------------------------- | --------------------- | --------------------- | ----------------------------- |
| **코드량**                   | 많음 (클래스 4개)     | 보통 (타입 + 팩토리)  | **적음 (클래스 1개)**         |
| **스택 트레이스**            | O                     | **X (손실)**          | **O**                         |
| **TanStack Query 호환**      | instanceof 필요       | 매번 제네릭 명시 필요 | **Register로 자동 추론**      |
| **Error Boundary 호환**      | O (Error 상속)        | **X (Error 아님)**    | **O (Error 상속)**            |
| **타입 안전성**              | instanceof 후 추론    | discriminated union   | **자동 추론**                 |
| **분기 방식**                | `instanceof`          | `type` 필드           | **`status` 숫자 비교**        |
| **JSON 직렬화**              | 커스텀 필드 소실 가능 | 완벽                  | 커스텀 필드 소실 가능         |
| **Next.js error.tsx**        | message만 접근 가능   | Error가 아니라 문제   | **message만 접근 가능**       |
| **확장 시**                  | 클래스 추가 필요      | union 멤버 추가       | **status로 충분**             |
| **TanStack Query 공식 권장** | 부분 (Error 상속은 O) | **비권장**            | **권장 패턴**                 |

---

## 4. 결론

**패턴 C (단일 클래스 + Register)**를 선택한다.

이유:

1. **TanStack Query 공식 권장**: Register interface는 TanStack Query v5가 글로벌 에러 타입을 위해 제공하는 공식 메커니즘이다
2. **스택 트레이스 보존**: Error를 상속하므로 디버깅 시 에러 발생 위치를 추적할 수 있다
3. **Error Boundary 호환**: Next.js의 `error.tsx`와 React Error Boundary 모두 Error 인스턴스를 기대한다
4. **최소한의 코드**: 클래스 1개 + Register 선언 1줄이면 충분하다
5. **YAGNI**: 401/403/404별로 다른 클래스가 필요한 시점은 아직 오지 않았다. `error.status === 401`로 분기하면 된다

---

## 참고 자료

- [TanStack Query v5 TypeScript 문서](https://tanstack.com/query/v5/docs/framework/react/typescript)
- [TanStack Query Register Interface 논의](https://github.com/TanStack/query/discussions/7177)
- [TanStack Query Typesafe Custom Errors 논의](https://github.com/TanStack/query/discussions/8675)
- [Next.js 16 Error Handling 문서](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [React Error Boundary 문서](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
