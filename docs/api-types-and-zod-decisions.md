# API 타입 정의 + Zod 스키마 검증 의사결정 기록

> 이슈 #19 작업 과정에서 내린 기술적 의사결정과 그 근거를 기록한다.

---

## 1. 왜 이 작업을 시작했는가

백엔드 API 명세(`docs/api-spec.md`)가 확정되었고, 프론트에서 이 명세에 맞는 타입 정의와 API 호출 함수가 필요했다. 기존에는 공통 인프라(`ApiResponse<T>`, `parseResponse`, `fetchWithAuth`)만 있고, 도메인별 타입과 API 함수는 없었다.

작업 중 두 가지 추가 결정을 내렸다:

1. 기존 인증 Route Handler에서 발견한 버그 2건을 함께 수정
2. Zod를 도입하여 API 응답을 런타임에 검증

---

## 2. 의사결정 목록

### 2-1. 도메인별 폴더 구조 (`src/api/{도메인}/`)

**결정:** `src/types/`와 `src/lib/api/`에 분산하지 않고, `src/api/{도메인}/` 아래에 관련 파일을 모아둔다.

**구조:**

```
src/api/
├── auth/
│   ├── schema.ts    # Zod 스키마 (백엔드 응답 구조 정의)
│   ├── types.ts     # 타입 (스키마에서 추출 + 요청 타입)
│   ├── api.ts       # API 함수 (fetch + 스키마 검증)
│   └── queries.ts   # TanStack Query 훅
├── analysis/
│   ├── schema.ts
│   ├── types.ts
│   └── api.ts
```

**근거:**

초기에는 타입을 `src/types/auth.ts`, API 함수를 `src/lib/api/auth.ts`에 두려 했다. 하지만 이 구조는 하나의 도메인과 관련된 파일이 3곳(`types/`, `lib/api/`, `api/queries`)에 흩어진다. 파일 하나를 수정하면 다른 디렉토리의 파일도 찾아가야 한다.

도메인별 폴더 구조의 장점:

- **함께 변경되는 파일이 함께 있다**: API 스펙이 바뀌면 schema → types → api를 순서대로 수정하는데, 같은 폴더 안에서 끝난다
- **import 경로가 짧다**: `from './schema'`, `from './types'` (상대 경로)
- **기존 패턴 확장**: `src/api/auth/`에 이미 `queries.ts`가 있었으므로 이 패턴을 따라간 것

참고: `src/types/api.ts`의 공통 타입(`ApiResponse<T>`, `PaginatedResponse<T>`, Register)은 프로젝트 전역에서 사용하므로 `src/types/`에 남겨뒀다.

---

### 2-2. Zod 도입 결정

**결정:** Zod v4를 도입하여 백엔드 API 응답을 런타임에 검증한다.

**근거:**

TypeScript의 타입은 컴파일 타임에만 존재한다. 런타임에서 `as ApiResponse<T>`는 아무것도 검증하지 않는다:

```typescript
// 기존 코드 — 런타임 검증 없음
const data = (json as ApiResponse<T>).data;
// 백엔드가 { analysisResultId: "1" } (string)을 보내도 통과
// → 컴포넌트에서 analysisResultId + 1 = "11" 버그 발생
```

실제로 이번 작업 중 기존 session Route Handler에서 `backendData.accessToken`으로 읽는 버그를 발견했다. 백엔드 응답은 `backendData.data.accessToken` 구조인데, TypeScript가 이를 잡지 못했다. Zod가 있었다면 런타임에서 즉시 발견되었을 것이다.

**왜 지금인가:**

- 백엔드 통합 초기라 응답 스펙 불일치가 가장 많이 발생하는 시점
- 타입을 막 정의했으므로 스키마로 전환하는 비용이 가장 낮음
- 도메인 폴더 구조가 잡혀있어 `schema.ts` 추가가 자연스러움

**번들 사이즈:**

Zod v4는 ~13KB gzip. 전체 번들에서 무시 가능한 수준이다.

---

### 2-3. 스키마에서 타입 추출 (Single Source of Truth)

**결정:** 타입을 수동으로 정의하지 않고, Zod 스키마에서 `z.infer<>`로 추출한다.

**구현:**

```typescript
// schema.ts — 유일한 진실 원천
export const analysisResultSchema = z.object({
  analysisResultId: z.number(),
  companyName: z.string().nullable(),
  // ...
});

// types.ts — 스키마에서 타입 자동 추출
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
// → { analysisResultId: number; companyName: string | null; ... }
```

**근거:**

수동 타입과 스키마를 따로 관리하면 둘이 어긋날 수 있다:

```typescript
// 수동 관리의 위험성
// schema.ts에서 필드를 nullable로 바꿨는데
companyName: z.string().nullable();

// types.ts를 깜빡하고 안 바꿈
companyName: string; // null이 아닌 string → 런타임에 null이 오면 깨짐
```

`z.infer<>`를 쓰면 스키마 하나만 수정하면 타입이 자동으로 따라온다. 동기화 실수가 구조적으로 불가능하다.

**요청 타입은 예외:**

우리가 보내는 데이터(Request)는 스키마 없이 순수 `type`으로 정의했다:

```typescript
export type ReanalyzeRequest = {
  resumeCurrentText: string;
};
```

이유: 요청 데이터는 우리 코드가 만든다. TypeScript 컴파일러가 타입을 체크하므로 런타임 검증이 불필요하다. 검증이 필요한 건 **외부에서 들어오는 데이터**(백엔드 응답, 사용자 입력)뿐이다.

---

### 2-4. `parse()` 사용, queryFn 안에서 검증 (TkDodo 권장 패턴)

**결정:** API 응답 검증에는 `parse()`를 사용하고, dev/prod 환경 분기 없이 항상 검증한다.

**검토했던 3가지 방식:**

| 방식                    | 설명                                 | 채택  |
| ----------------------- | ------------------------------------ | ----- |
| A. `safeParse` + 로깅만 | 검증 실패해도 데이터 반환, 콘솔 경고 | X     |
| B. `parse` dev에서만    | 개발 환경만 검증, 프로덕션은 통과    | X     |
| **C. `parse` 항상**     | 모든 환경에서 검증, 실패 시 throw    | **O** |

**근거:**

TanStack Query 메인테이너 TkDodo의 권장 패턴:

> "queryFn 안에서 parse하라. 실패하면 ZodError를 throw해서 React Query가 자동으로 error state로 전환한다."

방식 C를 채택한 이유:

1. **프로덕션에서도 스펙 불일치가 발생한다**: 백엔드 배포 타이밍 차이, 필드 누락, 타입 변경 등. dev에서만 검증하면 정작 문제가 터지는 프로덕션에서 `undefined` 참조로 컴포넌트가 깨진다.

2. **parse() 실패 = 네트워크 에러와 동일하게 처리**: ZodError가 throw되면 TanStack Query의 `error` 필드에 들어가고, `error.tsx` Error Boundary가 처리한다. 별도 에러 처리 로직이 불필요하다.

3. **성능 영향 없음**: Zod `parse`는 JSON 객체 1개 기준 < 1ms. API 응답 대기 시간(수백 ms)에 비하면 무시 가능하다.

**`safeParse()`는 폼 입력 검증용:**

```typescript
// API 응답 → parse() (실패 = 시스템 에러)
return schema.parse(data);

// 폼 입력 → safeParse() (실패 = 사용자에게 에러 메시지 표시)
const result = formSchema.safeParse(formData);
if (!result.success) setErrors(result.error.format());
```

Zod 공식 문서가 `safeParse`를 강조하는 맥락은 사용자 입력 검증이다. API 응답처럼 시스템 에러로 처리할 경우에는 `parse()`가 적합하다.

**참고 자료:**

- [TkDodo — Type-safe React Query](https://tkdodo.eu/blog/type-safe-react-query)
- [Zod 공식 문서 — Basics (parse vs safeParse)](https://zod.dev/basics)

---

### 2-5. `parseResponse`에 optional 스키마 파라미터

**결정:** 기존 `parseResponse<T>(res)` 시그니처에 optional 스키마 파라미터를 추가한다.

**구현:**

```typescript
// src/lib/parseResponse.ts
export async function parseResponse<T>(res: Response, schema?: z.ZodType<T>): Promise<T> {
  const json = await res.json();

  if (!res.ok) {
    const message = json.message || `API 요청 실패: ${res.status}`;
    throw new ApiRequestError(res.status, message);
  }

  const data = (json as ApiResponse<T>).data;

  if (schema) {
    return schema.parse(data); // Zod 검증
  }

  return data; // 기존 동작 유지
}
```

**동작 원리:**

1단계 — HTTP 에러 체크:

```
res.ok = false → ApiRequestError throw
                → TanStack Query error 필드에 저장
                → error.tsx 또는 ErrorBoundary가 처리
```

2단계 — 공통 응답 구조에서 data 추출:

```
{ status: 200, message: "OK", data: { ... } }
                                      ↑ 이 부분만 추출
```

3단계 — Zod 스키마 검증 (선택적):

```
schema 있으면 → schema.parse(data) → 성공: 타입 보장된 data 반환
                                    → 실패: ZodError throw
schema 없으면 → data 그대로 반환 (하위 호환)
```

**하위 호환성:**

`schema` 파라미터가 optional이라 기존에 스키마 없이 호출하던 코드가 깨지지 않는다:

```typescript
// 기존 코드 — 여전히 동작
parseResponse<SomeType>(res);

// 새 코드 — 런타임 검증 추가
parseResponse(res, someSchema);
// T는 스키마에서 자동 추론되므로 제네릭 명시 불필요
```

**근거:**

별도 `parseResponseWithSchema` 함수를 만드는 방법도 있었지만, 두 함수의 로직이 "스키마 검증 한 줄"만 다르다. 하나의 함수에 optional 파라미터를 추가하는 것이 DRY하고 호출부도 깔끔하다.

---

### 2-6. 응답만 검증, 요청은 검증하지 않는다 (시스템 경계 원칙)

**결정:** Zod 검증은 외부 데이터가 앱에 들어오는 시스템 경계에서만 수행한다.

```
┌──────────────────────────────────────────────────┐
│                   우리 앱 (신뢰 영역)              │
│                                                    │
│  컴포넌트 → API 함수 → parseResponse               │
│      ↑         ↑           ↑                       │
│  TypeScript   TypeScript   Zod 검증 ← 시스템 경계  │
│  컴파일 체크   컴파일 체크   (런타임)                │
│                                                    │
└────────────────────────────────────────────────────┘
         ↕                        ↕
    사용자 입력               백엔드 응답
    (Zod safeParse)          (Zod parse)
```

| 경계              | 예시                          | 검증 방법                         |
| ----------------- | ----------------------------- | --------------------------------- |
| 백엔드 응답       | `parseResponse(res, schema)`  | `schema.parse()`                  |
| 사용자 입력       | 폼 submit (파일, URL, 텍스트) | `schema.safeParse()` (향후)       |
| URL 파라미터      | searchParams, params          | `schema.parse()` (향후)           |
| 내부 함수 간 전달 | 컴포넌트 → 컴포넌트           | TypeScript만 (런타임 검증 불필요) |

**근거:**

내부 코드 사이의 데이터 전달에 Zod를 쓰면 모든 함수 호출마다 `parse()`를 하게 된다. 이는 과도한 방어적 프로그래밍이다. TypeScript 컴파일러가 내부 타입 불일치를 잡아주므로 런타임 검증은 시스템 경계에서만 하면 충분하다.

---

### 2-7. 재분석 응답 스키마 분리 (`requirementSchema` vs `reanalysisRequirementSchema`)

**결정:** 재분석 응답용 요건 스키마를 별도로 정의한다.

**구현:**

```typescript
// 최초 분석 / 상세 조회 — 전체 필드
export const requirementSchema = z.object({
  requirementId: z.number(),
  category: requirementCategorySchema,
  title: z.string(),
  description: z.string().nullable(), // ← 있음
  sourceText: z.string().nullable(), // ← 있음
  evaluation: evaluationSchema,
});

// 재분석 — description, sourceText 없음
export const reanalysisRequirementSchema = z.object({
  requirementId: z.number(),
  category: requirementCategorySchema,
  title: z.string(),
  evaluation: evaluationSchema,
  // description, sourceText 없음
});
```

**근거:**

API 스펙 비고:

> requirements에 `description`, `sourceText`는 포함되지 않음 (요건은 변경 없으므로)

재분석은 기존 공고 요건을 그대로 두고 이력서 매칭 평가만 재수행한다. 요건 자체의 설명(`description`, `sourceText`)은 변하지 않으므로 백엔드가 이 필드를 응답에 포함하지 않는다.

하나의 스키마에 `.optional()`로 처리할 수도 있었지만, 그러면 최초 분석 응답에서 `description`이 누락되어도 검증을 통과해버린다. 스키마를 분리하면 각 엔드포인트의 정확한 응답 구조를 강제할 수 있다.

---

### 2-8. satisfaction 필드의 요청/응답 비대칭 처리

**결정:** 요청값(`SatisfactionRequestValue`)과 응답값(`Satisfaction`)을 별도 타입으로 분리한다.

**구현:**

```typescript
// 응답 — null은 실제 null
export const satisfactionSchema = z.enum(['LIKE', 'DISLIKE']).nullable();
// 타입: 'LIKE' | 'DISLIKE' | null

// 요청 — "NULL"은 문자열
export const satisfactionRequestValueSchema = z.enum(['LIKE', 'DISLIKE', 'NULL']);
// 타입: 'LIKE' | 'DISLIKE' | 'NULL'
```

**근거:**

API 스펙 비고:

> 선택 취소 시 문자열 `"NULL"`을 보내면 응답에서는 `null`로 반환

백엔드가 요청과 응답에서 서로 다른 규칙을 사용한다:

- 요청: JSON에서 `null`은 키 자체를 생략할 수 있어 모호하므로 문자열 `"NULL"`로 명시
- 응답: 실제 JSON `null`을 반환

하나의 타입으로 합치면 이 비대칭이 드러나지 않는다. 분리하면 요청 시 `"NULL"` 문자열을 보내야 한다는 것이 타입 시스템에서 강제된다.

---

### 2-9. API 함수의 클라이언트 전용 설계

**결정:** `src/api/{도메인}/api.ts`의 API 함수는 클라이언트 경로(`/api/...`)만 호출한다. 서버 prefetch는 `fetchWithAuth`를 직접 사용한다.

**구현:**

```typescript
// src/api/analysis/api.ts — 클라이언트 API 함수
export async function getAnalysis(id: number): Promise<AnalysisResult> {
  const res = await fetch(`/api/analyses/${id}`);
  //                       ↑ 상대 경로 → catch-all 프록시 경유
  return parseResponse(res, analysisResultSchema);
}
```

**서버 prefetch (향후 구현 시):**

```typescript
// 서버 컴포넌트에서 직접 fetchWithAuth 사용
const res = await fetchWithAuth(`/api/analyses/${id}`);
const data = await parseResponse(res, analysisResultSchema);
queryClient.setQueryData(['analysis', 'detail', id], data);
```

**근거:**

`fetchWithAuth`는 `import 'server-only'`가 선언되어 있다. 같은 파일에서 `fetchWithAuth`를 import하면 그 파일 전체가 서버 전용이 되어 클라이언트 컴포넌트에서 import할 수 없다.

해결 방법은 여러 가지였다:

| 방법                                   | 문제                                 |
| -------------------------------------- | ------------------------------------ |
| 환경 감지 (`typeof window`)            | 서버/클라이언트 분기 로직이 복잡     |
| 동적 import (`await import()`)         | 코드가 지저분하고 번들 최적화에 불리 |
| 서버/클라이언트 파일 분리              | 파일이 2배로 늘어남                  |
| **클라이언트 전용 + 서버는 직접 호출** | 단순하고 명확                        |

API 함수는 TanStack Query의 `queryFn`에서 호출되는데, 이는 주로 클라이언트 환경(refetch, mutation)이다. 서버 prefetch는 빈도가 낮고 서버 컴포넌트에서 직접 `fetchWithAuth`를 호출하는 것이 더 명시적이다.

---

### 2-10. BFF 패턴에서의 클라이언트 API 함수 — 토큰을 다루지 않는다

**결정:** 클라이언트 API 함수는 Authorization 헤더나 토큰을 직접 다루지 않는다.

**동작 흐름:**

```
클라이언트 API 함수              catch-all 프록시              백엔드
fetch('/api/analyses/1')  →  fetchWithAuth(path)      →  GET /api/analyses/1
쿠키 자동 전송 (브라우저)     쿠키에서 토큰 읽기              Authorization: Bearer ...
                              → 헤더에 토큰 주입
```

1. 클라이언트 API 함수가 `/api/analyses/1`을 호출
2. 브라우저가 httpOnly 쿠키를 자동으로 요청에 포함
3. Next.js catch-all Route Handler(`src/app/api/[...path]/route.ts`)가 요청을 받음
4. `fetchWithAuth`가 쿠키에서 access_token을 읽어 `Authorization: Bearer` 헤더를 추가
5. 백엔드에 인증된 요청을 전달

이것이 BFF 패턴의 핵심이다. 클라이언트는 토큰의 존재조차 모른다.

**`postLogout()`이 바디 없이 호출하는 이유:**

```typescript
export async function postLogout(): Promise<LogoutResponse> {
  const res = await fetch('/api/auth/logout', { method: 'POST' });
  // refreshToken을 바디로 보내지 않음 — 쿠키에 있으므로
  return parseResponse(res, logoutResponseSchema);
}
```

로그아웃 Route Handler가 서버에서 쿠키로 refreshToken을 직접 읽기 때문이다:

```typescript
// src/app/api/auth/logout/route.ts
const refreshToken = cookieStore.get(REFRESH_TOKEN_KEY)?.value;
await fetch(`${backendUrl}/api/auth/logout`, {
  body: JSON.stringify({ refreshToken }), // 서버가 쿠키에서 읽어서 백엔드에 전달
});
```

`.claude/rules/auth.md`의 규칙:

> 클라이언트 컴포넌트: `fetch('/api/...')`로 catch-all Route Handler 경유. **토큰을 직접 다루지 않는다.**

---

### 2-11. 기존 `index.ts` → `api.ts` 리네이밍

**결정:** 기존 `src/api/auth/index.ts`를 `api.ts`로 통합하고 삭제한다.

**근거:**

프로젝트 규칙(`.claude/rules/file-structure.md`):

> barrel export (`index.ts`)는 사용하지 않는다 — 직접 파일 경로로 import한다.

기존 `index.ts`는 barrel export는 아니었지만 (API 함수만 포함), 파일명이 역할을 드러내지 못했다. `api.ts`로 변경하면:

- `from '@/api/auth/api'` → API 함수임이 명확
- 같은 폴더의 `schema.ts`, `types.ts`, `queries.ts`와 네이밍이 일관됨
- `index.ts`와의 혼동 방지 (barrel export로 오해할 여지 없음)

---

## 3. 발견한 기존 버그와 수정

### 3-1. session Route Handler — 응답 파싱 구조 불일치

**파일:** `src/app/api/auth/session/route.ts`

**문제:** 백엔드 응답이 `{ status, message, data: { accessToken, refreshToken, ... } }` 구조인데, 코드가 `backendData.accessToken`으로 최상위에서 읽고 있었다.

```typescript
// Before — backendData.accessToken은 undefined
const backendData = await backendResponse.json();
if (!backendData?.accessToken || !backendData?.refreshToken) { ... }

// After — data 중첩 구조 반영
const backendData = await backendResponse.json();
const data = backendData?.data;
if (!data?.accessToken || !data?.refreshToken) { ... }
```

**영향:** 백엔드가 스펙대로 응답하면 로그인이 무조건 실패했을 것 (500 응답).

### 3-2. logout Route Handler — refreshToken 바디 누락

**파일:** `src/app/api/auth/logout/route.ts`

**문제:** API 스펙에 따르면 로그아웃 시 `{ refreshToken }` 바디가 필수인데, Authorization 헤더만 보내고 있었다.

```typescript
// Before — 바디 없음
await fetch(`${backendUrl}/api/auth/logout`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
});

// After — refreshToken 바디 + Content-Type 추가
const refreshToken = cookieStore.get(REFRESH_TOKEN_KEY)?.value;
await fetch(`${backendUrl}/api/auth/logout`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ refreshToken }),
});
```

**영향:** 로그아웃 시 서버 측 refresh token 무효화가 되지 않아 토큰 재발급이 가능한 보안 이슈.

---

## 4. 생성/수정된 파일 요약

| 파일                                | 역할                                          | 액션    |
| ----------------------------------- | --------------------------------------------- | ------- |
| `src/app/api/auth/session/route.ts` | 세션 Route Handler 응답 파싱 수정             | Modify  |
| `src/app/api/auth/logout/route.ts`  | 로그아웃 Route Handler refreshToken 바디 추가 | Modify  |
| `src/types/api.ts`                  | `PaginatedResponse<T>` 추가                   | Modify  |
| `src/lib/parseResponse.ts`          | optional Zod 스키마 파라미터 추가             | Modify  |
| `src/api/auth/schema.ts`            | 인증 도메인 Zod 스키마                        | Create  |
| `src/api/auth/types.ts`             | z.infer 기반 타입 + 요청 타입                 | Rewrite |
| `src/api/auth/api.ts`               | 인증 API 함수 (기존 index.ts 통합)            | Create  |
| `src/api/auth/queries.ts`           | import 경로 변경 (index → api)                | Modify  |
| `src/api/auth/index.ts`             | 삭제 (api.ts로 통합)                          | Delete  |
| `src/api/analysis/schema.ts`        | 분석 도메인 Zod 스키마                        | Create  |
| `src/api/analysis/types.ts`         | z.infer 기반 타입 + 요청 타입                 | Create  |
| `src/api/analysis/api.ts`           | 분석 API 함수 8개                             | Create  |
| `package.json`                      | Zod v4 의존성 추가                            | Modify  |
