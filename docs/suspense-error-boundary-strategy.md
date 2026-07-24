# Suspense / ErrorBoundary / SuspenseBoundary 전략

> React 19 + Next.js 16 App Router 환경에서의 비동기 상태 처리 전략

---

## 1. 왜 이 구조인가

### 문제: 컴포넌트 안에 로딩/에러 분기가 쌓인다

```tsx
// ❌ 안티패턴 — 컴포넌트가 3가지 상태를 모두 처리
function AnalysisResult({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useQuery({ ... });

  if (isLoading) return <Skeleton />;
  if (isError) return <p>{error.message}</p>;

  // 여기서부터 진짜 로직
  return <div>{data.title}</div>;
}
```

문제점:

- 모든 컴포넌트에 동일한 분기가 반복됨
- 컴포넌트가 "데이터가 있을 때의 렌더링"에 집중하지 못함
- 에러/로딩 UI가 컴포넌트마다 다르게 구현되어 일관성 없음

### 해결: 선언적 경계로 위임

```tsx
// ✅ 컴포넌트는 성공 상태만 렌더
function AnalysisResult({ id }: { id: string }) {
  const { data } = useSuspenseQuery({ ... });
  return <div>{data.title}</div>;
}

// 로딩/에러는 부모가 선언적으로 처리
<SuspenseBoundary
  pendingFallback={<Skeleton />}
  errorFallback={(error, reset) => <ErrorFallback error={error} onRetry={reset} />}
>
  <AnalysisResult id={id} />
</SuspenseBoundary>
```

---

## 2. 세 가지 도구의 동작 원리

### Suspense — 로딩 경계

React의 Suspense는 **자식이 던진 Promise를 캐치**하여 pending 상태를 처리한다.

```
컴포넌트 렌더링 시도
  → useSuspenseQuery가 데이터 없으면 Promise를 throw
  → 가장 가까운 Suspense가 캐치
  → fallback UI 표시
  → Promise resolve되면 컴포넌트 재렌더링 (데이터 있는 상태)
```

**핵심:** Suspense는 `try/catch`가 아니라 **Promise throw를 감지하는 메커니즘**이다. `useState`나 `useEffect`로 구현하는 로딩 처리와 근본적으로 다르다.

#### 서버 vs 클라이언트에서의 Suspense

| 환경       | 동작                                                                         | 용도                     |
| ---------- | ---------------------------------------------------------------------------- | ------------------------ |
| 서버 (SSR) | HTML 스트리밍 경계. fallback HTML을 먼저 보내고, 자식이 준비되면 교체        | TTFB 개선, 점진적 렌더링 |
| 클라이언트 | Promise throw를 캐치. `useSuspenseQuery` 등의 클라이언트 측 데이터 페칭 연동 | 로딩 UI 표시             |

`'use client'` 컴포넌트 안의 Suspense도 SSR 시 서버에서 렌더링되므로 **양쪽 모두 동작**한다.

### ErrorBoundary — 에러 경계

React의 ErrorBoundary는 **자식의 렌더링 에러를 캐치**하여 fallback UI를 표시한다.

```
컴포넌트 렌더링 시도
  → 렌더링 중 Error throw 발생
  → getDerivedStateFromError()로 에러 상태 저장
  → componentDidCatch()로 로깅/리포팅
  → fallback UI 렌더링
  → reset() 호출 시 에러 상태 초기화 → 자식 재렌더링 시도
```

**우리 구현의 추가 기능:**

| 기능                 | 설명                                                                      |
| -------------------- | ------------------------------------------------------------------------- |
| `fallback` 함수 형태 | `(error, reset) => ReactNode` — 에러 정보 + 재시도 버튼 가능              |
| `resetKeys`          | 특정 값이 바뀌면 자동으로 에러 상태 리셋 (예: `[userId]`가 바뀌면 재시도) |
| `onError` 콜백       | Sentry 등 외부 에러 리포팅 연동                                           |
| `onReset` 콜백       | 리셋 시 추가 정리 작업                                                    |

**왜 class component인가:**
React는 `getDerivedStateFromError`와 `componentDidCatch`를 class component에서만 지원한다. 함수형 Error Boundary API는 아직 제공되지 않는다.

**`'use client'`가 필요한 이유:**
class component는 `setState`, 생명주기 메서드를 사용하므로 클라이언트 컴포넌트여야 한다. 서버 컴포넌트에서 import하여 사용하는 것은 정상적인 패턴이다.

### SuspenseBoundary — Suspense + ErrorBoundary 조합

```tsx
// SuspenseBoundary 내부 구조
<ErrorBoundary fallback={errorFallback}>
  <Suspense fallback={pendingFallback}>{children}</Suspense>
</ErrorBoundary>
```

**배치 순서가 중요하다:**

```
ErrorBoundary (바깥)
  └── Suspense (안쪽)
      └── children
```

- `Suspense`가 Promise를 캐치 → `pendingFallback` 표시
- Promise reject 또는 렌더링 에러 → `ErrorBoundary`가 캐치 → `errorFallback` 표시
- ErrorBoundary가 안쪽이면 Suspense fallback 자체의 에러를 캐치하지 못한다

**`'use client'`가 필요한 이유:**
`useSuspenseQuery`가 던지는 Promise는 **클라이언트에서** 발생한다. 이를 잡는 Suspense도 클라이언트에 있어야 한다. `'use client'`를 빼면 서버 컴포넌트의 Suspense가 되어 클라이언트 측 Promise를 잡지 못한다. 단, `'use client'` 컴포넌트도 SSR 시 서버에서 렌더링되므로 서버 스트리밍도 정상 동작한다.

---

## 3. 사용 규칙

### 판단 기준

```
데이터를 가져오는가?
├── 아니오 → 경계 불필요
└── 예 → 서버에서 prefetch하는가?
    ├── 예 → ErrorBoundary만 (로딩 없음, 에러만 대비)
    └── 아니오 → SuspenseBoundary (로딩 + 에러 둘 다)
```

| 상황                                        | 사용할 것          | 이유                                                                         |
| ------------------------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| prefetch 있음 (서버에서 데이터 미리 fetch)  | `ErrorBoundary`    | 데이터가 이미 hydrate되어 로딩이 발생하지 않음. 네트워크 에러 등 예외만 대비 |
| prefetch 없음 (클라이언트에서 데이터 fetch) | `SuspenseBoundary` | `useSuspenseQuery`가 Promise를 throw하므로 Suspense 필요. 에러도 대비        |
| API 호출 없음                               | 불필요             | 에러가 발생할 수 없음                                                        |

### 왜 prefetch 유무로 나누는가

**prefetch 있는 경우:**

```tsx
// page.tsx (서버 컴포넌트)
const queryClient = getQueryClient();
await queryClient.prefetchQuery(analysisQueries.detail(id, token));

return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <ErrorBoundary fallback={<ErrorFallback />}>
      <AnalysisResult id={id} />
    </ErrorBoundary>
  </HydrationBoundary>
);
```

서버에서 이미 데이터를 fetch하여 TanStack Query Cache에 주입했으므로, 클라이언트에서 `useSuspenseQuery`를 호출하면 캐시 히트 → Promise를 throw하지 않음 → Suspense가 필요 없음.

**prefetch 없는 경우:**

```tsx
// page.tsx (서버 컴포넌트)
return (
  <SuspenseBoundary
    pendingFallback={<Skeleton />}
    errorFallback={(error, reset) => <ErrorFallback error={error} onRetry={reset} />}
  >
    <UserProfile /> {/* useSuspenseQuery로 클라이언트에서 직접 fetch */}
  </SuspenseBoundary>
);
```

서버에서 데이터를 미리 가져오지 않았으므로, 클라이언트에서 `useSuspenseQuery`가 Promise를 throw → Suspense가 필요.

### 경계를 어디에 배치하는가

**섹션 단위로 감싸서 에러를 격리한다:**

```tsx
// ❌ 페이지 전체를 하나의 경계로 감싸면 — 한 섹션 에러가 전체를 깨뜨림
<ErrorBoundary fallback={<ErrorFallback />}>
  <Header />
  <JdPanel />
  <ResumePanel />
  <FeedbackSection />
</ErrorBoundary>

// ✅ 섹션별로 감싸면 — JdPanel 에러가 ResumePanel에 영향 안 줌
<ErrorBoundary fallback={<JdErrorFallback />}>
  <JdPanel />
</ErrorBoundary>
<ErrorBoundary fallback={<ResumeErrorFallback />}>
  <ResumePanel />
</ErrorBoundary>
<ErrorBoundary fallback={<FeedbackErrorFallback />}>
  <FeedbackSection />
</ErrorBoundary>
```

---

## 4. ResuFit 페이지별 적용 예시

### 메인 페이지 (`/`)

인증 체크를 위해 `cookies()` Promise를 Suspense 안에서 처리한다. API 에러가 아니라 인증 분기이므로 React의 `Suspense`만 사용.

```tsx
export default function HomePage() {
  const cookieStore = cookies(); // await하지 않음

  return (
    <main>
      <HeroSection /> {/* 즉시 렌더 */}
      <Suspense fallback={<MainFormSkeleton />}>
        <MainForm cookiePromise={cookieStore} /> {/* 인증 체크 후 streaming */}
      </Suspense>
    </main>
  );
}
```

### 분석 결과 페이지 (`/result/[id]`) — prefetch 있음

서버에서 `prefetchQuery`로 데이터를 미리 가져오므로 `ErrorBoundary`만 사용.

```tsx
export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = (await cookies()).get('access_token')?.value;

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(analysisQueries.detail(id, token));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ResultHeader analysisId={id} />
      <AiDisclaimer />
      <ErrorBoundary
        fallback={(error, reset) => <ErrorFallback message="분석 결과를 불러올 수 없습니다" onRetry={reset} />}
      >
        <AnalysisPanels analysisId={id} />
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
```

### 인증 필요 + prefetch 없는 영역 — SuspenseBoundary

유저별 데이터를 클라이언트에서 직접 fetch하는 경우.

```tsx
export default function SomePage() {
  return (
    <SuspenseBoundary
      pendingFallback={<ProfileSkeleton />}
      errorFallback={(error, reset) => <ErrorFallback message="프로필을 불러올 수 없습니다" onRetry={reset} />}
      resetKeys={[userId]}
    >
      <UserProfile />
    </SuspenseBoundary>
  );
}
```

---

## 5. useSuspenseQuery vs useQuery

### 왜 useSuspenseQuery를 쓰는가

|               | `useQuery`                 | `useSuspenseQuery`   |
| ------------- | -------------------------- | -------------------- |
| 로딩 처리     | `isLoading` 분기 직접 작성 | Suspense에 위임      |
| 에러 처리     | `isError` 분기 직접 작성   | ErrorBoundary에 위임 |
| data 타입     | `T \| undefined`           | `T` (항상 존재)      |
| 컴포넌트 역할 | 3가지 상태 모두 처리       | 성공 상태만 렌더     |

`useSuspenseQuery`를 쓰면 `data`가 `undefined`가 아닌 `T`로 추론되어 옵셔널 체이닝(`data?.field`)이 필요 없다.

### 예외: useQuery가 적절한 경우

**선택적 인증 UI 분기:**

```tsx
// 로그인/비로그인에 따라 다른 UI를 보여줘야 하는 경우
function AuthButton() {
  const { data: user, isError } = useQuery({
    queryKey: ['user'],
    queryFn: fetchCurrentUser,
  });

  if (isError) return <LoginButton />; // 비로그인
  return <ProfileButton user={user} />; // 로그인
}
```

`useSuspenseQuery`를 사용하면 비로그인 시 에러가 `ErrorBoundary`로 전파되어 레이아웃 전체가 깨진다. 비로그인이 "에러"가 아니라 "정상 상태"인 경우에는 `useQuery`가 적절하다.

---

## 6. 의사결정 기록

### 왜 react-error-boundary 대신 직접 구현했는가

| 기준         | react-error-boundary                                | 직접 구현                     |
| ------------ | --------------------------------------------------- | ----------------------------- |
| 번들 크기    | ~2KB                                                | 동일 수준                     |
| 기능         | `useErrorBoundary`, `withErrorBoundary` 등 추가 API | 프로젝트에 필요한 최소 기능만 |
| 의존성       | 외부 패키지 1개 추가                                | 없음                          |
| 커스터마이징 | 패키지 API에 맞춰야 함                              | 자유롭게 수정 가능            |

`react-error-boundary`의 추가 API(`useErrorBoundary`, `withErrorBoundary`)는 현재 프로젝트에서 필요하지 않다. 필요한 기능(fallback, reset, resetKeys, onError)만 직접 구현하여 의존성을 줄였다.

### 왜 SuspenseBoundary를 별도 컴포넌트로 만들었는가

매번 ErrorBoundary + Suspense를 조합하면:

```tsx
// 매번 이렇게 써야 함
<ErrorBoundary fallback={...}>
  <Suspense fallback={...}>
    <Children />
  </Suspense>
</ErrorBoundary>
```

- 배치 순서를 실수할 수 있음 (Suspense가 바깥이면 에러를 못 잡음)
- 반복 코드

SuspenseBoundary로 감싸면 올바른 배치 순서가 보장되고, `pendingFallback`/`errorFallback`으로 의도가 명확해진다.

### 왜 ErrorBoundary와 SuspenseBoundary에 각각 'use client'를 붙였는가

ErrorBoundary는 class component(setState, 생명주기)이므로 `'use client'` 필수. SuspenseBoundary는 내부의 `<Suspense>`가 클라이언트 측 Promise(useSuspenseQuery)를 캐치해야 하므로 `'use client'` 필수.

두 컴포넌트 모두 서버 컴포넌트(page.tsx)에서 import하여 사용 가능하다. `'use client'`는 "서버에서 import 불가"가 아니라 "이 파일부터 클라이언트 번들에 포함"이라는 의미이다.

---

## 7. 파일 위치

| 파일                                         | 역할                          |
| -------------------------------------------- | ----------------------------- |
| `src/components/common/ErrorBoundary.tsx`    | 에러 경계 class component     |
| `src/components/common/SuspenseBoundary.tsx` | Suspense + ErrorBoundary 조합 |

---

## 참고 자료

- [React — Suspense](https://react.dev/reference/react/Suspense)
- [React — Error Boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Next.js — Loading UI and Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [Next.js — Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [TanStack Query — Suspense](https://tanstack.com/query/v5/docs/framework/react/guides/suspense)
