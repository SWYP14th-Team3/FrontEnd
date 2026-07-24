# TanStack Query 훅 의사결정 기록

> 이슈 #21 작업 과정에서 내린 기술적 의사결정과 그 근거를 기록한다.

---

## 1. 왜 이 작업을 시작했는가

이슈 #19에서 API 타입과 함수를 구현했고, 이슈 #9에서 TanStack Query 인프라(QueryClient, QueryProvider, parseResponse)를 세팅했다. 하지만 실제로 컴포넌트에서 API를 호출하려면 **TanStack Query로 래핑한 훅**이 필요하다.

이번 이슈에서는:

1. 읽기 전용 데이터에 대한 `queryOptions` 함수 (서버 prefetch + 클라이언트 useQuery 공유)
2. 쓰기 작업에 대한 `useMutation` 훅 (캐시 무효화 정책 포함)
3. 기존 인증 훅의 에러 타입 수정 (Register interface 일치)

을 구현했다.

---

## 2. 의사결정 목록

### 2-1. 파일 위치: `src/api/{도메인}/queries.ts` (이슈 제안 위치와 다름)

**결정:** 이슈에서 제안한 `src/hooks/useAuth.ts`, `src/lib/queryKeys.ts` 대신 기존 패턴인 `src/api/{도메인}/queries.ts`를 유지한다.

**이슈 제안 구조:**

```
src/lib/queryKeys.ts        # 모든 도메인의 쿼리 키
src/hooks/useAuth.ts        # 인증 훅
src/hooks/useAnalysis.ts    # 분석 훅
```

**채택한 구조:**

```
src/api/auth/queries.ts      # 인증 키 + 훅
src/api/analysis/queries.ts  # 분석 키 + 훅
```

**근거:**

이슈 #11에서 이미 `src/api/auth/queries.ts`에 `authKeys`, `useSocialLoginCallback`, `useLogout`이 구현되어 있었다. 이슈 #19의 의사결정 문서(`docs/api-types-and-zod-decisions.md` 2-1)에서 도메인별 폴더 구조를 채택한 근거가 있다:

> 함께 변경되는 파일이 함께 있다: API 스펙이 바뀌면 schema → types → api → queries를 순서대로 수정하는데, 같은 폴더 안에서 끝난다.

쿼리 키를 `src/lib/queryKeys.ts`에 모으면 키와 queryFn이 분리되어, 키를 수정할 때 다른 디렉토리의 queries.ts도 함께 수정해야 한다. 도메인별 폴더에 두면 키 ↔ queryFn ↔ 캐시 무효화가 한 파일에서 완결된다.

---

### 2-2. `queryOptions()` API 사용 (v5 권장 패턴)

**결정:** 읽기 쿼리에 `queryOptions()` 래퍼 함수를 사용한다.

**구현:**

```typescript
import { queryOptions } from '@tanstack/react-query';

export function analysisDetailOptions(id: number) {
  return queryOptions({
    queryKey: analysisKeys.detail(id),
    queryFn: () => getAnalysis(id),
    staleTime: 5 * 60 * 1000,
  });
}
```

**동작 원리:**

`queryOptions()`는 런타임에서는 전달받은 객체를 그대로 반환하는 identity 함수다. 실제 가치는 TypeScript 타입 레벨에 있다:

```
queryOptions({ queryKey, queryFn })
  → queryKey에 queryFn의 반환 타입을 "태깅"
  → queryClient.getQueryData(options.queryKey) 시 반환 타입 자동 추론
  → useQuery(options) 시 data 타입 자동 추론
```

이것이 중요한 이유는 **서버 prefetch와 클라이언트 소비에서 동일한 옵션 객체를 공유**할 수 있기 때문이다:

```typescript
// 서버 컴포넌트 — prefetch
const queryClient = getQueryClient();
await queryClient.prefetchQuery(analysisDetailOptions(id));
//                               ↑ 같은 옵션 객체

// 클라이언트 컴포넌트 — 소비
const { data } = useQuery(analysisDetailOptions(id));
//                         ↑ 같은 옵션 객체 → queryKey, queryFn, staleTime 모두 동일 보장
```

`queryOptions`를 쓰지 않으면 서버와 클라이언트에서 queryKey를 각각 수동으로 작성하게 되고, 둘이 어긋나면 prefetch한 데이터를 클라이언트가 찾지 못한다:

```typescript
// queryOptions 없이 — 키가 어긋날 위험
await queryClient.prefetchQuery({
  queryKey: ['analysis', 'detail', id], // ← 여기서 오타나면?
  queryFn: () => getAnalysis(id),
});

const { data } = useQuery({
  queryKey: ['analysis', 'detail', id], // ← 일치해야 하는데 보장 없음
  queryFn: () => getAnalysis(id),
});
```

**검토했던 대안 — 객체 속성 방식:**

```typescript
// 대안: 객체 속성
export const analysisQueries = {
  detail: (id: number) => queryOptions({ ... }),
  list: (params) => queryOptions({ ... }),
};

// 채택: 독립 함수
export function analysisDetailOptions(id: number) { ... }
export function analysisListOptions(params) { ... }
```

독립 함수를 채택한 이유: tree-shaking에 유리하고, 함수 이름이 IDE 자동완성에서 바로 검색된다. 객체 속성은 `analysisQueries.`을 먼저 타이핑해야 하위 속성이 보인다.

**참고 자료:**

- [TanStack Query — queryOptions API](https://tanstack.com/query/latest/docs/framework/react/guides/query-options)
- [TkDodo — The Query Options API](https://tkdodo.eu/blog/the-query-options-api)

---

### 2-3. 쿼리 키 팩토리 계층 구조

**결정:** TkDodo 권장 패턴의 계층적 쿼리 키 팩토리를 사용한다.

**구현:**

```typescript
export const analysisKeys = {
  all: ['analysis'] as const,
  details: () => [...analysisKeys.all, 'detail'] as const,
  detail: (id: number) => [...analysisKeys.details(), id] as const,
  lists: () => [...analysisKeys.all, 'list'] as const,
  list: (params: AnalysesParams = {}) => [...analysisKeys.lists(), params] as const,
};
```

**동작 원리 — 계층적 무효화:**

TanStack Query의 `invalidateQueries`는 queryKey를 **prefix 매칭**한다. 전달한 키가 캐시된 키의 앞부분과 일치하면 무효화된다:

```
캐시에 저장된 키들:
  ['analysis', 'detail', 1]
  ['analysis', 'detail', 2]
  ['analysis', 'list', {}]
  ['analysis', 'list', { companyName: '카카오' }]

invalidateQueries({ queryKey: analysisKeys.all })
  → ['analysis']로 시작하는 모든 키 무효화 (4개 전부)

invalidateQueries({ queryKey: analysisKeys.lists() })
  → ['analysis', 'list']로 시작하는 키만 무효화 (2개)

invalidateQueries({ queryKey: analysisKeys.detail(1) })
  → ['analysis', 'detail', 1] 정확히 일치하는 키만 무효화 (1개)
```

이 계층 구조 덕분에 mutation의 성격에 따라 무효화 범위를 정밀하게 제어할 수 있다:

| mutation  | 무효화 키                     | 효과                               |
| --------- | ----------------------------- | ---------------------------------- |
| 분석 생성 | `lists()`                     | 모든 목록 쿼리 갱신 (새 항목 반영) |
| 재분석    | `detail(id)`                  | 해당 상세만 갱신                   |
| 삭제      | `lists()` + `detail(id)` 제거 | 목록 갱신 + 상세 캐시 정리         |
| 로그인    | `all` (auth 전체)             | 인증 관련 모든 데이터 새로 로드    |

**`details()` / `lists()` 중간 레벨이 필요한 이유:**

중간 레벨이 없으면 "모든 상세 쿼리"를 무효화할 방법이 없다:

```typescript
// 중간 레벨 없는 구조
detail: (id: number) => ['analysis', 'detail', id] as const,

// "모든 상세 쿼리 무효화"를 하려면?
invalidateQueries({ queryKey: ['analysis', 'detail'] })
// → 하드코딩. 키 구조 변경 시 깨짐.

// 중간 레벨 있는 구조
details: () => [...analysisKeys.all, 'detail'] as const,
detail: (id: number) => [...analysisKeys.details(), id] as const,

// 안전하게 무효화
invalidateQueries({ queryKey: analysisKeys.details() })
```

현재는 "모든 상세 무효화"를 사용하지 않지만, 키 팩토리는 한 번 정의하면 프로젝트 전체에서 사용하므로 확장성을 확보해둔다.

**`as const` 어서션의 역할:**

```typescript
// as const 없이
['analysis', 'detail', id]  → 타입: (string | number)[]

// as const로
['analysis', 'detail', id] as const  → 타입: readonly ['analysis', 'detail', number]
```

`as const`가 없으면 `['analysis', 'detail', 1]`과 `['analysis', 'list', {}]`가 같은 타입(`(string | number | object)[]`)이 되어, `getQueryData` 시 반환 타입을 구분할 수 없다. `queryOptions`의 타입 태깅이 무의미해진다.

**참고 자료:**

- [TkDodo — Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys)

---

### 2-4. mutation 훅의 캐시 무효화 + UI 콜백 분리

**결정:** mutation 훅은 캐시 무효화만 담당하고, UI 부수효과(토스트, 라우팅 등)는 호출부에서 주입한다.

**구현:**

```typescript
// 훅 — 캐시 무효화 담당
export function useDeleteAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAnalysis(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: analysisKeys.lists() });
      queryClient.removeQueries({ queryKey: analysisKeys.detail(id) });
    },
  });
}
```

```typescript
// 호출부 — UI 콜백 주입
function DeleteButton({ id }: { id: number }) {
  const { mutate, isPending } = useDeleteAnalysis();

  function handleDelete() {
    mutate(id, {
      onSuccess: () => {
        showToast('삭제되었습니다');
        router.push('/history');
      },
    });
  }

  return <button onClick={handleDelete} disabled={isPending}>삭제</button>;
}
```

**동작 원리 — TanStack Query v5의 onSuccess 실행 순서:**

```
mutate(variables, callbackOptions)
  → mutationFn 실행
  → 성공 시:
    1. 훅 레벨 onSuccess 실행 (캐시 무효화)
    2. mutate() 호출 시 전달한 onSuccess 실행 (UI 콜백)
```

v5에서는 훅 레벨 → 호출부 레벨 순서가 보장된다. 따라서 캐시 무효화가 먼저 실행되고, 그 다음 UI 콜백이 실행된다.

**근거:**

캐시 무효화는 **데이터 정합성**을 위해 반드시 실행되어야 하므로 훅에 고정한다. UI 콜백은 같은 mutation을 사용하는 컴포넌트마다 다를 수 있다:

```
삭제 버튼 (목록 페이지) → 삭제 → 토스트 표시
삭제 버튼 (상세 페이지) → 삭제 → 토스트 + 목록 페이지로 이동
삭제 확인 모달 → 삭제 → 모달 닫기 + 토스트
```

세 곳 모두 같은 `useDeleteAnalysis()`를 쓰지만, 삭제 후 동작은 다르다. UI 콜백을 훅에 하드코딩하면 컴포넌트마다 별도 훅을 만들어야 한다.

---

### 2-5. `useDeleteAnalysis`의 id 전달 방식 — 훅 파라미터 vs mutationFn 파라미터

**결정:** `useDeleteAnalysis`는 id를 훅 파라미터가 아닌 `mutationFn` 파라미터로 받는다.

**비교:**

```typescript
// 방식 A: 훅 파라미터
export function useDeleteAnalysis(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteAnalysis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analysisKeys.lists() });
      queryClient.removeQueries({ queryKey: analysisKeys.detail(id) });
    },
  });
}

// 사용: const { mutate } = useDeleteAnalysis(1);
//       mutate();
```

```typescript
// 방식 B: mutationFn 파라미터 (채택)
export function useDeleteAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAnalysis(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: analysisKeys.lists() });
      queryClient.removeQueries({ queryKey: analysisKeys.detail(id) });
    },
  });
}

// 사용: const { mutate } = useDeleteAnalysis();
//       mutate(1);
```

**채택 근거:**

방식 A는 훅을 호출하는 시점에 id가 확정되어야 한다. 목록 페이지에서 여러 항목의 삭제 버튼이 있을 때 항목마다 훅 인스턴스를 생성해야 한다:

```typescript
// 방식 A — 목록에서 사용하기 어려움
function AnalysisList({ items }) {
  // id마다 훅을 호출할 수 없음 (훅은 조건부/반복 호출 불가)
  const { mutate } = useDeleteAnalysis(???);
}

// 방식 B — 호출 시 id 전달
function AnalysisList({ items }) {
  const { mutate } = useDeleteAnalysis();  // 훅 1번만 호출
  // ...
  <button onClick={() => mutate(item.id)}>삭제</button>
}
```

반면 `useReanalyze(id)`, `useSatisfaction(id)` 같은 훅은 id를 훅 파라미터로 받는다. 이 훅들은 **상세 페이지에서만 사용**되고, 한 번에 하나의 분석 결과만 다루기 때문이다. id가 페이지 진입 시 확정되어 훅 파라미터로 전달하는 것이 자연스럽다.

| 훅                      | id 전달 방식          | 이유                         |
| ----------------------- | --------------------- | ---------------------------- |
| `useDeleteAnalysis`     | `mutationFn` 파라미터 | 목록에서 여러 항목 삭제 가능 |
| `useReanalyze(id)`      | 훅 파라미터           | 상세 페이지 전용, id 고정    |
| `useSatisfaction(id)`   | 훅 파라미터           | 상세 페이지 전용, id 고정    |
| `useAutoSaveResume(id)` | 훅 파라미터           | 편집 페이지 전용, id 고정    |
| `useSaveAnalysis(id)`   | 훅 파라미터           | 편집 페이지 전용, id 고정    |

---

### 2-6. 삭제 시 `removeQueries` 추가 사용

**결정:** `useDeleteAnalysis`에서 `invalidateQueries` + `removeQueries`를 함께 사용한다.

**구현:**

```typescript
onSuccess: (_data, id) => {
  queryClient.invalidateQueries({ queryKey: analysisKeys.lists() });
  queryClient.removeQueries({ queryKey: analysisKeys.detail(id) });
},
```

**`invalidateQueries` vs `removeQueries` 차이:**

```
invalidateQueries({ queryKey: key })
  → 해당 키의 데이터를 "stale" 상태로 마킹
  → 다음 접근 시 백그라운드에서 재요청
  → 캐시에서 데이터가 제거되지 않음

removeQueries({ queryKey: key })
  → 해당 키의 데이터를 캐시에서 완전히 제거
  → 다음 접근 시 로딩 상태부터 시작
```

**왜 삭제 시 `removeQueries`가 필요한가:**

삭제된 분석 결과의 상세 데이터를 캐시에 남겨두면:

1. 사용자가 브라우저 뒤로가기로 `/result/1`에 진입
2. 캐시에 stale 데이터가 남아 있어 잠깐 삭제된 데이터가 보임
3. 백그라운드 재요청 → 404 에러 → 에러 UI 전환

`removeQueries`로 캐시를 즉시 제거하면 뒤로가기 시 바로 로딩 상태 → 404 에러 UI로 깔끔하게 전환된다.

목록은 `invalidateQueries`만 사용한다. 목록 데이터는 여전히 유효하고(삭제된 항목만 빠짐), stale 마킹 후 재요청하면 서버에서 최신 목록을 받아온다.

---

### 2-7. 캐시 무효화가 없는 mutation: `useAutoSaveResume`, `useSaveAnalysis`

**결정:** 자동저장과 최종 저장 mutation에는 캐시 무효화를 하지 않는다.

**구현:**

```typescript
export function useAutoSaveResume(id: number) {
  return useMutation({
    mutationFn: (body: AutoSaveResumeRequest) => autoSaveResume(id, body),
  });
}

export function useSaveAnalysis(id: number) {
  return useMutation({
    mutationFn: (body: SaveAnalysisRequest) => saveAnalysis(id, body),
  });
}
```

`useQueryClient()`를 호출하지 않는다. 캐시를 건드릴 일이 없으므로 불필요한 의존성을 추가하지 않는다.

**근거:**

**자동저장 (`useAutoSaveResume`):**

자동저장은 사용자가 이력서를 편집하는 중에 debounce로 주기적 호출된다. 이때 캐시를 무효화하면:

```
사용자 타이핑 → debounce → autoSave API 호출 → 캐시 무효화 → 백그라운드 재요청
→ 서버에서 방금 저장한 데이터를 다시 받아옴 (불필요)
→ 편집 중인 textarea가 서버 데이터로 덮어써질 위험
```

편집 중인 데이터는 로컬 상태(useState)에 있고, 자동저장은 서버에 백업만 하는 것이다. 캐시 데이터를 갱신할 필요가 없다.

**최종 저장 (`useSaveAnalysis`):**

API 스펙에서 최종 저장 응답은 `{ analysisResultId, saved, resumeCurrentText, lastSavedAt, updatedAt }`이다. 상세 조회 데이터의 일부만 반환한다. 캐시를 무효화해서 상세 전체를 다시 받아올 수도 있지만:

1. 저장 시점에 사용자는 이미 최신 데이터를 보고 있다
2. 저장 후 "저장 완료" 토스트만 표시하면 충분하다
3. 페이지를 벗어났다가 돌아오면 staleTime 만료로 자동 재요청된다

불필요한 네트워크 요청을 줄이기 위해 캐시 무효화를 하지 않는다.

---

### 2-8. staleTime 정책

**결정:** 도메인 특성에 맞게 3단계 staleTime을 적용한다.

| 데이터      | staleTime | 설정 위치                          | 근거                                                 |
| ----------- | --------- | ---------------------------------- | ---------------------------------------------------- |
| 기본값      | **1분**   | `getQueryClient.ts` defaultOptions | SSR hydration 후 즉시 재요청 방지                    |
| 분석 상세   | **5분**   | `analysisDetailOptions`            | 재분석 전까지 불변. 탭 이동 후 돌아와도 재요청 안 함 |
| 분석 목록   | **30초**  | `analysisListOptions`              | 다른 탭에서 삭제/재분석이 일어날 수 있음             |
| 사용자 정보 | **5분**   | `meOptions`                        | 세션 중 거의 변하지 않음                             |

**동작 원리 — staleTime과 재요청 타이밍:**

```
staleTime: 5분인 경우

fetch 시점                                       5분 후
  ↓                                                ↓
  ├──────────── fresh (재요청 안 함) ──────────────┤── stale (재요청 가능) ──→
  │                                                │
  │  탭 전환 후 복귀 → 재요청 안 함                │  탭 전환 후 복귀 → 백그라운드 재요청
  │  컴포넌트 재마운트 → 캐시 데이터 즉시 반환     │  컴포넌트 재마운트 → 캐시 반환 + 재요청
```

staleTime이 0이면 (TanStack Query 기본값):

```
서버에서 prefetch → HTML 전달 → 클라이언트 hydration
  → "stale이네?" → 즉시 백그라운드 재요청 (불필요한 네트워크 비용)
```

1분 기본값을 설정해서 hydration 직후 불필요한 재요청을 방지한다.

---

### 2-9. 기존 auth 훅의 에러 타입 수정 (`Error` → `ApiRequestError`)

**결정:** 기존 `useSocialLoginCallback`, `useLogout` 훅의 `UseMutationOptions` 제네릭에서 에러 타입을 `Error` → `ApiRequestError`로 수정한다.

**Before:**

```typescript
export function useSocialLoginCallback(
  options?: UseMutationOptions<SocialLoginResponse, Error, SocialLoginRequest, unknown>,
) { ... }
```

**After:**

```typescript
export function useSocialLoginCallback(
  options?: UseMutationOptions<SocialLoginResponse, ApiRequestError, SocialLoginRequest>,
) { ... }
```

**근거:**

`src/types/api.ts`에서 Register interface로 `defaultError: ApiRequestError`를 등록했다:

```typescript
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiRequestError;
  }
}
```

이 설정으로 `useMutation`의 에러 타입이 자동으로 `ApiRequestError`로 추론된다. 하지만 `UseMutationOptions`에 `Error`를 명시하면 Register 설정을 덮어써서 타입 불일치가 발생한다:

```typescript
// 훅 내부: useMutation의 error → ApiRequestError (Register 추론)
// options 파라미터: onError(error: Error) → Error (수동 명시)
// → 훅에서 spread하면 타입 충돌
```

`ApiRequestError`로 맞추면 Register와 일관되고, `options.onError`에서도 `error.status`에 접근할 수 있다.

추가로 4번째 제네릭 `unknown` (TContext)도 제거했다. TanStack Query가 기본값으로 `unknown`을 사용하므로 명시할 필요가 없다.

---

## 3. 생성/수정된 파일 요약

| 파일                          | 역할                                                | 액션   |
| ----------------------------- | --------------------------------------------------- | ------ |
| `src/api/auth/queries.ts`     | authKeys.me + meOptions 추가, 에러 타입 수정        | Modify |
| `src/api/analysis/queries.ts` | 쿼리 키 팩토리 + queryOptions 2개 + mutation 훅 6개 | Create |

---

## 4. 컴포넌트에서의 사용 예시

### 서버 prefetch + 클라이언트 소비

```typescript
// src/app/result/[id]/page.tsx (서버 컴포넌트)
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/getQueryClient';
import { analysisDetailOptions } from '@/api/analysis/queries';

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(analysisDetailOptions(Number(id)));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AnalysisDetail id={Number(id)} />
    </HydrationBoundary>
  );
}
```

```typescript
// 클라이언트 컴포넌트
'use client';

import { useQuery } from '@tanstack/react-query';
import { analysisDetailOptions } from '@/api/analysis/queries';

export function AnalysisDetail({ id }: { id: number }) {
  const { data } = useQuery(analysisDetailOptions(id));
  // data는 AnalysisResult 타입으로 자동 추론
  // prefetch된 데이터가 있으므로 로딩 없이 즉시 렌더링
}
```

### Mutation 사용

```typescript
'use client';

import { useDeleteAnalysis } from '@/api/analysis/queries';

export function DeleteButton({ id }: { id: number }) {
  const { mutate, isPending } = useDeleteAnalysis();

  return (
    <button
      onClick={() => mutate(id, {
        onSuccess: () => showToast('삭제되었습니다'),
      })}
      disabled={isPending}
    >
      {isPending ? '삭제 중...' : '삭제'}
    </button>
  );
}
```
