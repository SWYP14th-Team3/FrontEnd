# MSW 세팅 및 Mock 핸들러 의사결정 기록

> 이슈 #20 작업 과정에서 내린 기술적 의사결정과 그 근거를 기록한다.

---

## 1. 왜 이 작업을 시작했는가

이슈 #19에서 API 타입 정의, Zod 스키마, API 함수가 완성되었다. 하지만 백엔드 API가 아직 배포되지 않아 프론트엔드 페이지 개발을 시작할 수 없었다. API 함수를 호출하면 catch-all 프록시가 존재하지 않는 백엔드로 요청을 보내고, 네트워크 에러가 발생한다.

이 상태에서 페이지 개발을 진행하려면 두 가지 선택지가 있었다:

| 방법          | 설명                                               | 문제                                                        |
| ------------- | -------------------------------------------------- | ----------------------------------------------------------- |
| 하드코딩 mock | 컴포넌트에서 API 호출 대신 더미 데이터를 직접 사용 | 나중에 API 연동 시 코드를 다시 써야 함. mock 제거 누락 위험 |
| **MSW**       | 서비스 워커가 fetch를 가로채서 mock 응답 반환      | API 함수 코드 변경 없이 실제 호출 흐름 그대로 동작          |

MSW를 선택한 핵심 이유는 **기존 API 함수 코드를 한 줄도 바꾸지 않는다**는 점이다. `getAnalysis(1)`을 호출하면 `fetch('/api/analyses/1')`이 실행되고, MSW가 이 요청을 가로채서 mock 응답을 반환한다. 컴포넌트 입장에서는 실제 백엔드와 통신하는 것과 동일하다. 백엔드가 준비되면 MSW를 끄기만 하면 된다.

---

## 2. 의사결정 목록

### 2-1. MSW가 가로채는 경로: `/api/...` (BFF 프록시 경로)

**결정:** MSW 핸들러는 클라이언트 API 함수가 호출하는 상대 경로(`/api/...`)를 가로챈다.

**동작 흐름 (MSW 활성화 시):**

```
컴포넌트 → API 함수 → fetch('/api/analyses/1')
                          ↓
                    MSW 서비스 워커가 가로챔
                          ↓
                    mock 응답 반환 { status: 200, message: '...', data: {...} }
                          ↓
                    parseResponse(res, analysisResultSchema)
                          ↓
                    Zod schema.parse(data) → 검증 통과 → 컴포넌트에 데이터 전달
```

**동작 흐름 (MSW 비활성화 시 — 실제 백엔드):**

```
컴포넌트 → API 함수 → fetch('/api/analyses/1')
                          ↓
                    Next.js catch-all Route Handler
                          ↓
                    fetchWithAuth → 백엔드 서버
                          ↓
                    실제 응답 반환
                          ↓
                    parseResponse(res, analysisResultSchema)
                          ↓
                    Zod schema.parse(data) → 검증 통과 → 컴포넌트에 데이터 전달
```

컴포넌트와 API 함수 코드는 두 경우 모두 동일하다. MSW는 `fetch` 수준에서 가로채므로 그 위 레이어는 차이를 모른다.

**검토했던 대안:**

| 방법                                               | 설명                                    | 문제                                                                |
| -------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| 백엔드 URL 가로채기 (`http://backend.com/api/...`) | MSW가 백엔드 절대 URL을 가로챔          | 클라이언트 fetch는 상대 경로(`/api/...`)를 사용하므로 매칭되지 않음 |
| catch-all 프록시를 mock으로 교체                   | Route Handler 코드를 조건부로 mock 반환 | 서버 코드에 mock 로직이 침투. 제거 시 실수 위험                     |
| **상대 경로 가로채기 (`/api/...`)**                | MSW가 브라우저에서 fetch를 가로챔       | catch-all 프록시에 도달하기 전에 응답 반환. 서버 코드 변경 없음     |

---

### 2-2. 브라우저 전용 mock (서버 사이드 mock 제외)

**결정:** MSW는 브라우저(`setupWorker`)에서만 동작시킨다. 서버 사이드(`setupServer`)는 이번 스코프에서 제외한다.

**근거:**

현재 프론트엔드 개발의 핵심은 클라이언트 컴포넌트 개발이다:

- TanStack Query의 `useSuspenseQuery` → 클라이언트에서 fetch 실행
- 이벤트 핸들러에서 mutation 호출 → 클라이언트에서 fetch 실행
- 서버 컴포넌트에서의 prefetch는 아직 구현 예정 단계

서버 사이드 mock까지 설정하면 `instrumentation.ts` 생성, `setupServer` 설정 등 추가 작업이 필요하다. 현재 필요한 것은 클라이언트 개발 지원이므로, 서버 사이드는 실제 백엔드 연동 시점에 필요하면 추가한다.

---

### 2-3. 환경변수 기반 on/off (`NEXT_PUBLIC_MSW_ENABLED`)

**결정:** `process.env.NODE_ENV === 'development'` 대신 별도 환경변수 `NEXT_PUBLIC_MSW_ENABLED`로 MSW 활성화를 제어한다.

**구현:**

```typescript
// src/mocks/init.ts
export async function initMocks() {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MSW_ENABLED === 'true') {
    const { worker } = await import('./browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}
```

**검토했던 방식:**

| 방법                          | 설명                            | 문제                                    |
| ----------------------------- | ------------------------------- | --------------------------------------- |
| `NODE_ENV === 'development'`  | dev 환경이면 항상 MSW 활성화    | 백엔드 연동 테스트 시 MSW를 끌 수 없음  |
| **`NEXT_PUBLIC_MSW_ENABLED`** | 명시적으로 `true`일 때만 활성화 | dev에서도 끌 수 있고, 기본값은 비활성화 |

**이점:**

- 백엔드가 부분적으로 준비되면 MSW를 끄고 실제 API로 테스트 가능
- 팀원마다 로컬에서 다른 설정 사용 가능 (`.env.development`는 `.gitignore` 대상)
- `NEXT_PUBLIC_` 접두사로 브라우저에서 접근 가능 (Next.js 규칙)

---

### 2-4. MSWProvider의 children 렌더링 지연

**결정:** MSW 서비스 워커 초기화가 완료될 때까지 앱의 children 렌더링을 지연한다.

**구현:**

```tsx
// src/providers/MSWProvider.tsx
export function MSWProvider({ children }: MSWProviderProps) {
  const shouldMock = process.env.NEXT_PUBLIC_MSW_ENABLED === 'true';
  const [ready, setReady] = useState(!shouldMock);

  useEffect(() => {
    if (!shouldMock) return;

    import('@/mocks/init').then(({ initMocks }) => {
      initMocks().then(() => setReady(true));
    });
  }, [shouldMock]);

  if (!ready) return null; // 초기화 완료 전까지 아무것도 렌더링하지 않음

  return <>{children}</>;
}
```

**근거:**

MSW 공식 문서에서 `worker.start()`는 반드시 `await` 해야 한다고 권장한다. 서비스 워커 등록은 비동기이므로, 등록이 완료되기 전에 컴포넌트가 fetch를 실행하면 MSW가 가로채지 못한다. 이 경우:

1. TanStack Query가 `useEffect`에서 즉시 fetch 실행
2. MSW 서비스 워커가 아직 등록 안 됨
3. 요청이 실제 catch-all 프록시로 전달
4. 백엔드가 없으므로 네트워크 에러 발생
5. 이후 MSW 등록 완료되지만, 이미 실패한 요청은 복구되지 않음

`return null`로 빈 화면이 잠깐 보이지만, 서비스 워커 등록은 일반적으로 100ms 미만이다. 프로덕션에서는 `shouldMock`이 `false`이므로 `useState(!shouldMock)`에 의해 초기 렌더링부터 `ready`가 `true`다 — 지연 없음.

**초기 구현에서 발견한 lint 에러:**

처음에는 `useState(false)`로 시작하고 `useEffect` 내부에서 `!shouldMock`일 때도 `setReady(true)`를 호출했다. 이 패턴은 `react-hooks/set-state-in-effect` 린트 규칙에 걸렸다. `useState(!shouldMock)`으로 변경하여 MSW가 불필요한 경우 effect 자체를 실행하지 않도록 수정했다.

---

### 2-5. MSWProvider의 위치: QueryProvider 바깥

**결정:** `Providers.tsx`에서 MSWProvider가 QueryProvider를 감싸는 구조로 배치한다.

**구현:**

```tsx
// src/providers/Providers.tsx
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MSWProvider>
      {' '}
      {/* 1. MSW 초기화 완료 대기 */}
      <QueryProvider>
        {' '}
        {/* 2. 그 후 TanStack Query 활성화 */}
        {children}
      </QueryProvider>
    </MSWProvider>
  );
}
```

**근거:**

React 컴포넌트 트리에서 바깥 Provider가 먼저 마운트된다. MSWProvider가 바깥에 있으면:

1. MSWProvider가 마운트 → MSW 초기화 시작
2. 초기화 완료 전까지 `return null` → QueryProvider와 children이 마운트되지 않음
3. MSW 준비 완료 → `ready = true` → children 렌더링 시작
4. QueryProvider가 마운트 → 쿼리가 실행 → fetch 발생 → MSW가 가로챔

만약 QueryProvider가 바깥이면, TanStack Query가 먼저 활성화되어 MSW 초기화 전에 fetch를 시도할 수 있다.

---

### 2-6. mock 데이터에 Zod 스키마 타입 적용

**결정:** mock 데이터 객체에 `z.infer<typeof schema>` 타입을 명시한다.

**구현:**

```typescript
// src/mocks/data/analysis.ts
import type { z } from 'zod';
import type { analysisResultSchema } from '@/api/analysis/schema';

type MockAnalysisResult = z.infer<typeof analysisResultSchema>;

export const mockAnalysisResult: MockAnalysisResult = {
  analysisResultId: 1,
  companyName: '테크스타트업 주식회사',
  // ... 모든 필드
};
```

**근거:**

mock 데이터의 목적은 Zod 스키마 검증을 통과하는 것이다. API 함수에서 `parseResponse(res, analysisResultSchema)`가 호출되면 `analysisResultSchema.parse(data)`가 실행된다. mock 데이터에 필드가 누락되거나 타입이 다르면 `ZodError`가 발생한다.

`z.infer<typeof schema>`를 타입으로 사용하면 TypeScript 컴파일 시점에 필드 누락을 잡을 수 있다. 런타임에서 Zod가 잡기 전에 IDE에서 빨간 밑줄로 알려준다.

**검토했던 대안:**

| 방법                          | 설명                                                         | 문제                                                                     |
| ----------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| 타입 없이 plain object        | `export const mockUser = { ... }`                            | 필드 누락을 컴파일 타임에 잡지 못함                                      |
| `types.ts`에서 타입 import    | `import type { AnalysisResult } from '@/api/analysis/types'` | 동일한 효과지만 한 단계 간접 참조. `types.ts`도 결국 `z.infer`에서 온 것 |
| **스키마에서 직접 타입 추출** | `z.infer<typeof schema>`                                     | 스키마와 mock 데이터의 동기화가 가장 직접적                              |

`types.ts`에서 import하는 것도 동일한 결과를 준다 (`AnalysisResult = z.infer<typeof analysisResultSchema>`). 하지만 mock 데이터의 존재 이유가 스키마 검증 통과이므로, 스키마에서 직접 타입을 추출하는 것이 의도가 더 명확하다.

---

### 2-7. 모든 핸들러의 응답 래퍼: `{ status, message, data }`

**결정:** 모든 MSW 핸들러는 `{ status: number, message: string, data: T }` 래퍼로 응답한다.

**구현:**

```typescript
http.get('/api/analyses/:id', () => {
  return HttpResponse.json({
    status: 200,
    message: '분석 결과 조회 성공',
    data: mockAnalysisResult, // ← parseResponse가 여기를 추출
  });
});
```

**근거:**

`parseResponse`의 동작을 추적하면 왜 이 래퍼가 필요한지 알 수 있다:

```typescript
// src/lib/parseResponse.ts
export async function parseResponse<T>(res: Response, schema?: z.ZodType<T>): Promise<T> {
  const json = await res.json();

  if (!res.ok) {
    throw new ApiRequestError(res.status, json.message || '...');
    //                                     ↑ json.message 필요
  }

  const data = (json as ApiResponse<T>).data;
  //                                    ↑ json.data 필요

  if (schema) return schema.parse(data);
  return data;
}
```

`parseResponse`는 응답 JSON에서 `.data`를 추출하고, `.message`를 에러 메시지로 사용한다. mock 응답이 이 구조를 따르지 않으면 `data`가 `undefined`가 되고, Zod 검증에서 실패한다.

이 래퍼는 백엔드 API 스펙(`docs/api-spec.md`)의 공통 응답 구조이기도 하다:

```json
{
  "status": 200,
  "message": "분석 결과 조회 성공",
  "data": { ... }
}
```

MSW mock이 백엔드와 동일한 응답 구조를 사용하므로, 나중에 MSW를 끄고 실제 백엔드로 전환할 때 코드 변경이 불필요하다.

**BFF 전용 핸들러의 차이:**

`/api/auth/session`과 `/api/auth/logout`은 catch-all 프록시가 아닌 별도 Route Handler다. 이들의 BFF 응답도 같은 래퍼를 사용하지만, `data`의 구조가 다르다:

```typescript
// BFF Route Handler 응답 (백엔드 응답 아님)
{ status: 200, message: '로그인 성공', data: { success: true } }
```

이는 `socialLoginResponseSchema`와 `logoutResponseSchema`가 `z.object({ success: z.boolean() })`이기 때문이다.

---

### 2-8. `onUnhandledRequest: 'bypass'` 설정

**결정:** MSW 핸들러에 매칭되지 않는 요청은 경고 없이 통과시킨다.

**구현:**

```typescript
await worker.start({ onUnhandledRequest: 'bypass' });
```

**검토했던 옵션:**

| 옵션              | 동작                        | 문제                                                                                 |
| ----------------- | --------------------------- | ------------------------------------------------------------------------------------ |
| `'warn'` (기본값) | 콘솔에 경고 출력, 요청 통과 | Next.js dev 서버의 HMR, 정적 자산, `_next/` 요청마다 경고가 쏟아져 콘솔이 지저분해짐 |
| `'error'`         | 에러 throw, 요청 중단       | 개발 서버 자체가 작동하지 않음                                                       |
| **`'bypass'`**    | 조용히 통과                 | 핸들러 누락을 놓칠 수 있지만, Zod 검증이 잡아줌                                      |

`'bypass'`를 선택한 이유: Next.js 개발 환경에서는 MSW 관할이 아닌 요청이 매우 많다 (HMR 웹소켓, `/_next/static/`, `/_next/image/`, favicon 등). 이들 각각에 대해 경고가 출력되면 실제 API 관련 로그를 찾기 어렵다.

핸들러를 실수로 빠뜨려도 Zod가 잡아준다: mock이 없는 API를 호출하면 catch-all 프록시가 백엔드에 요청을 보내고, 백엔드가 없으면 네트워크 에러 → `parseResponse`에서 `ApiRequestError` throw → TanStack Query `error` 상태 → Error Boundary가 처리.

---

### 2-9. `handlers/index.ts` barrel export 허용

**결정:** 프로젝트 컨벤션에서 barrel export(`index.ts`)를 금지하지만, `src/mocks/handlers/index.ts`는 예외로 허용한다.

**구현:**

```typescript
// src/mocks/handlers/index.ts
import { authHandlers } from './auth';
import { analysisHandlers } from './analysis';

export const handlers = [...authHandlers, ...analysisHandlers];
```

**근거:**

barrel export 금지 규칙의 취지는 두 가지다:

1. **tree-shaking 방해**: `import { Button } from '@/components/ui'`처럼 index.ts를 거치면 번들러가 사용하지 않는 export를 제거하기 어렵다
2. **import 경로 추적 어려움**: 실제 파일 위치를 알려면 index.ts를 거쳐가야 한다

`handlers/index.ts`는 이 두 문제에 해당하지 않는다:

- **tree-shaking 무관**: mock 코드는 dev 전용이고, 동적 import(`import('./browser')`)로 로드되므로 프로덕션 번들에 포함되지 않음
- **re-export가 아닌 조합**: 개별 항목을 re-export하는 barrel이 아니라, 두 배열을 하나로 합치는 조합 로직. MSW 공식 문서가 권장하는 패턴
- **소비자가 하나**: `browser.ts`만 이 파일을 import함

만약 이 파일을 삭제하면 `browser.ts`에서 직접 두 핸들러를 import해야 한다:

```typescript
// browser.ts
import { authHandlers } from './handlers/auth';
import { analysisHandlers } from './handlers/analysis';

export const worker = setupWorker(...authHandlers, ...analysisHandlers);
```

이렇게 하면 핸들러 도메인이 추가될 때마다(`resume`, `user` 등) `browser.ts`를 수정해야 한다. 핸들러 조합 책임이 `browser.ts`로 넘어가서 관심사 분리가 깨진다. `handlers/index.ts`에서 조합하면 새 도메인 추가 시 그 파일만 수정하면 된다.

---

### 2-10. mock 데이터의 다양성 설계

**결정:** mock 분석 결과를 2개 이상, 목록 아이템을 3개로 구성하여 다양한 상태를 커버한다.

**구현:**

| mock 데이터                | overallLevel | satisfaction    | jobInputType | 특징                                     |
| -------------------------- | ------------ | --------------- | ------------ | ---------------------------------------- |
| `mockAnalysisResult`       | HIGH         | null (미평가)   | TEXT         | requirements 7개, 4개 카테고리 전부 포함 |
| `mockAnalysisResult2`      | MEDIUM       | LIKE            | URL          | requirements 2개, jobUrl 있음            |
| `mockAnalysisListItems[2]` | LOW          | — (목록에 없음) | —            | companyName이 null                       |

**requirements의 matchStatus 분포:**

| matchStatus       | 개수 | 의미                                |
| ----------------- | ---- | ----------------------------------- |
| CONFIRMED         | 4개  | 이력서가 JD 요구사항을 충족 (green) |
| NEEDS_IMPROVEMENT | 1개  | 있지만 보강 필요 (yellow)           |
| MISSING           | 2개  | 이력서에 없음 (red)                 |

**근거:**

단일 mock 데이터로는 UI의 모든 분기를 테스트할 수 없다:

- `companyName`이 `null`인 경우의 표시 처리
- `satisfaction`이 `null`(미평가) / `'LIKE'` / `'DISLIKE'`인 경우의 UI 분기
- `jobInputType`이 `'URL'`(원본 링크 표시) / `'TEXT'`(텍스트만)인 경우
- `overallLevel`이 `'HIGH'` / `'MEDIUM'` / `'LOW'`인 경우의 색상/아이콘 분기
- 빈 목록 vs 여러 아이템이 있는 목록
- `lastSavedAt`이 `null`(저장 안 함) / 날짜(저장됨)인 경우

목록 아이템 3개는 pagination mock(`page: 0, size: 10, totalPages: 1, last: true`)에서 단일 페이지 시나리오를 자연스럽게 표현한다. 다중 페이지 시나리오가 필요해지면 mock 데이터를 추가하면 된다.

---

## 3. 전체 동작 흐름

### 3-1. 앱 시작 시 MSW 초기화

```
1. Next.js 서버 시작 (pnpm dev)
2. 브라우저가 페이지 로드
3. React 트리 렌더링 시작
4. Providers → MSWProvider 마운트
5. MSWProvider의 useEffect 실행
   └─ shouldMock === true?
      ├─ No → 즉시 ready (프로덕션 또는 MSW 비활성화)
      └─ Yes → import('@/mocks/init')
               └─ initMocks()
                  └─ import('./browser')  // 동적 import
                     └─ worker.start({ onUnhandledRequest: 'bypass' })
                        └─ 서비스 워커 등록 완료
                           └─ setReady(true)
6. ready === true → children 렌더링 시작
7. QueryProvider 마운트 → 쿼리 실행 → fetch 발생 → MSW 가로챔
```

### 3-2. API 호출 시 mock 응답 흐름

```
컴포넌트                    API 함수                      MSW                    parseResponse
   │                          │                            │                          │
   │  useSuspenseQuery()      │                            │                          │
   │─────────────────────────▶│                            │                          │
   │                          │  fetch('/api/analyses/1')  │                          │
   │                          │───────────────────────────▶│                          │
   │                          │                            │  URL 매칭               │
   │                          │                            │  /api/analyses/:id       │
   │                          │                            │                          │
   │                          │  HttpResponse.json({       │                          │
   │                          │    status: 200,            │                          │
   │                          │    message: '...',         │                          │
   │                          │    data: mockAnalysisResult│                          │
   │                          │  })                        │                          │
   │                          │◀───────────────────────────│                          │
   │                          │                            │                          │
   │                          │  parseResponse(res, analysisResultSchema)             │
   │                          │──────────────────────────────────────────────────────▶│
   │                          │                            │         res.json()       │
   │                          │                            │         → json.data 추출  │
   │                          │                            │         → schema.parse()  │
   │                          │                            │         → 검증 통과       │
   │                          │◀──────────────────────────────────────────────────────│
   │  data: AnalysisResult    │                            │                          │
   │◀─────────────────────────│                            │                          │
```

### 3-3. MSW 비활성화 시 (실제 백엔드 전환)

```bash
# .env.development
NEXT_PUBLIC_MSW_ENABLED=false
```

1. MSWProvider에서 `shouldMock === false` → `useState(!shouldMock)` = `useState(true)` → 즉시 ready
2. 서비스 워커 등록하지 않음
3. fetch가 그대로 Next.js 서버로 전달
4. catch-all 프록시 → fetchWithAuth → 실제 백엔드

**코드 변경 없이** 환경변수 하나로 전환된다.

---

## 4. 생성/수정된 파일 요약

| 파일                             | 역할                                             | 액션   |
| -------------------------------- | ------------------------------------------------ | ------ |
| `package.json`                   | msw devDependency + workerDirectory 설정         | Modify |
| `pnpm-lock.yaml`                 | msw 의존성 트리                                  | Modify |
| `public/mockServiceWorker.js`    | MSW 서비스 워커 스크립트 (자동 생성)             | Create |
| `eslint.config.mjs`              | mockServiceWorker.js eslint ignore 추가          | Modify |
| `src/mocks/data/user.ts`         | mock User 데이터                                 | Create |
| `src/mocks/data/analysis.ts`     | mock 분석 데이터 전체 (7개 export)               | Create |
| `src/mocks/handlers/auth.ts`     | 인증 mock 핸들러 3개                             | Create |
| `src/mocks/handlers/analysis.ts` | 분석 mock 핸들러 8개                             | Create |
| `src/mocks/handlers/index.ts`    | 핸들러 조합                                      | Create |
| `src/mocks/browser.ts`           | setupWorker                                      | Create |
| `src/mocks/init.ts`              | initMocks (환경변수 + 브라우저 가드)             | Create |
| `src/providers/MSWProvider.tsx`  | MSW 초기화 Provider                              | Create |
| `src/providers/Providers.tsx`    | MSWProvider 추가 (QueryProvider 바깥)            | Modify |
| `.env.development`               | `NEXT_PUBLIC_MSW_ENABLED=true` (.gitignore 대상) | Create |
