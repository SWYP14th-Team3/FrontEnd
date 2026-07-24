# OAuth 인증 플로우 구현 문서

## 개요

카카오/구글 소셜 로그인을 BFF(Backend For Frontend) 패턴으로 구현했다.
핵심 원칙은 **토큰이 브라우저 JS에 노출되지 않는 것**이다. OAuth 인가 코드(code)만 클라이언트에서 다루고, 실제 토큰 교환과 저장은 서버(Route Handler)에서 처리한다.

## 전체 흐름

```
사용자
  → 카카오/구글 로그인 버튼 클릭
  → OAuth 제공자 인증 페이지 (카카오/구글)
  → 인증 성공
  → /auth/callback?code=xxx&provider=kakao 리다이렉트
  → OAuthCallbackClient (클라이언트 컴포넌트)
    → POST /api/auth/session (Next.js Route Handler)
      → POST /api/auth/oauth/{provider}/login (백엔드 API)
      → JWT(accessToken, refreshToken) 수신
      → httpOnly 쿠키로 변환 (setAuthCookies)
    → 성공 시 / 로 이동
```

## 아키텍처: 왜 BFF 패턴인가

일반적인 SPA에서는 클라이언트가 직접 백엔드에 토큰을 요청하고, 받은 토큰을 localStorage에 저장한다. 이 방식은 XSS 공격에 취약하다 — 악성 스크립트가 localStorage의 토큰을 탈취할 수 있다.

BFF 패턴에서는 Next.js Route Handler가 중간 서버 역할을 한다:

```
[클라이언트] --code만 전달--> [Route Handler] --code 전달--> [백엔드]
                                    ↑
                              토큰을 httpOnly 쿠키로 변환
                              (브라우저 JS 접근 불가)
```

- 클라이언트는 `code`만 다루고, 토큰을 직접 보지 못한다
- 토큰은 httpOnly 쿠키에 저장되어 XSS로 탈취 불가
- 이후 API 요청 시 쿠키가 자동으로 포함됨

## 파일 구조

```
src/
├── api/auth/                                    # API 레이어 (관심사 분리)
│   ├── types.ts                                 # 요청/응답 타입 정의
│   ├── index.ts                                 # fetch 함수 (순수 함수)
│   └── queries.ts                               # TanStack Query 훅
├── app/auth/callback/
│   ├── page.tsx                                 # 서버 컴포넌트 (Suspense 래핑)
│   └── _components/
│       └── OAuthCallbackClient.tsx               # 클라이언트 컴포넌트 (UI + 훅 호출)
├── app/api/auth/
│   ├── session/route.ts                         # 토큰 교환 Route Handler
│   └── logout/route.ts                          # 로그아웃 Route Handler
└── lib/                                         # 기존 인증 인프라 (#10에서 구현)
    ├── cookies.ts                               # setAuthCookies / clearAuthCookies
    ├── jwt.ts                                   # JWT 디코딩, 만료 확인
    └── fetchWithAuth.ts                         # 서버 측 인증 fetch wrapper
```

## 파일별 역할과 코드 흐름

### 1단계: 콜백 진입 — `page.tsx` (서버 컴포넌트)

```tsx
// src/app/auth/callback/page.tsx
export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={로딩UI}>
      <OAuthCallbackClient />
    </Suspense>
  );
}
```

**역할**: Suspense 경계를 제공하는 서버 컴포넌트.

**왜 서버 컴포넌트인가**: 페이지 자체는 클라이언트 로직이 없다. Suspense 래핑만 담당하고, 실제 로직은 클라이언트 컴포넌트에 위임한다. 이렇게 하면 페이지 셸이 서버에서 미리 렌더링되어 초기 로딩이 빠르다.

**왜 Suspense가 필요한가**: `OAuthCallbackClient`가 `useSearchParams()`를 사용하는데, Next.js에서 이 훅은 Suspense boundary 안에서만 동작한다. Suspense 없이 사용하면 빌드 에러가 발생한다.

---

### 2단계: 토큰 교환 트리거 — `OAuthCallbackClient.tsx` (클라이언트 컴포넌트)

```tsx
// src/app/auth/callback/_components/OAuthCallbackClient.tsx
'use client';

export function OAuthCallbackClient() {
  const { mutate: loginCallback, isError } = useSocialLoginCallback({
    onSuccess: () => router.replace('/'),
  });

  useEffect(() => {
    if (!code || !provider || hasCalled.current) return;
    hasCalled.current = true;
    loginCallback({ provider, code });
  }, [code, provider, loginCallback]);
}
```

**역할**: URL에서 `code`와 `provider`를 추출하고, 마운트 시 토큰 교환을 자동 실행.

**왜 `useEffect`인가**: 콜백 페이지는 사용자 액션(버튼 클릭) 없이 진입 즉시 토큰 교환을 해야 한다. `useMutation`의 `mutate()`는 수동 호출이 필요하므로, `useEffect`로 마운트 시 자동 트리거한다.

**왜 `useRef`로 중복 방지하는가**: React StrictMode에서 개발 모드 시 컴포넌트가 두 번 마운트된다. `useRef`로 첫 호출만 허용하여 같은 `code`로 중복 요청하는 것을 방지한다.

**왜 `useState` 없이 `isError`를 쓰는가**: `useMutation`이 내부적으로 `isPending`, `isError`, `isSuccess` 등의 상태를 관리한다. 별도 `useState`로 에러 상태를 만들면 상태가 이중으로 존재하게 되므로, `useMutation`의 상태를 그대로 활용한다.

---

### 3단계: API 레이어 — `api/auth/` (관심사 분리)

#### `types.ts` — 타입 정의

```tsx
// src/api/auth/types.ts
export type SocialLoginRequest = {
  provider: 'kakao' | 'google';
  code: string;
};
```

**역할**: 요청/응답의 타입만 정의한다. 로직 없음.

#### `index.ts` — fetch 함수

```tsx
// src/api/auth/index.ts
export async function postSocialLogin(body: SocialLoginRequest): Promise<SocialLoginResponse> {
  const res = await fetch('/api/auth/session', { ... });
  return parseResponse<SocialLoginResponse>(res);
}
```

**역할**: Route Handler에 대한 fetch 호출. 순수 함수로, UI 로직을 모른다.

**왜 컴포넌트에서 분리했는가**: 컴포넌트에 `fetch()` + `response.json()` + 에러 처리 코드가 직접 있으면 지저분해진다. fetch 로직을 순수 함수로 분리하면 테스트도 쉽고, 여러 곳에서 재사용할 수 있다.

**`parseResponse`의 역할**: 응답을 `ApiResponse<T>` 형태(`{ status, message, data }`)로 파싱하고, `!res.ok`이면 `ApiRequestError`를 throw한다. 덕분에 fetch 함수에서 매번 에러 처리를 반복하지 않아도 된다.

#### `queries.ts` — TanStack Query 훅

```tsx
// src/api/auth/queries.ts
export function useSocialLoginCallback(options?) {
  return useMutation({
    mutationFn: postSocialLogin,
    ...options,
  });
}
```

**역할**: fetch 함수를 `useMutation`으로 래핑. `onSuccess`, `onError` 등은 컴포넌트에서 주입한다.

**왜 이 레이어가 필요한가**: TanStack Query가 제공하는 자동 상태 관리(`isPending`, `isError`), 에러 재시도, 캐시 무효화 등을 활용하기 위함이다. fetch 함수를 직접 호출하면 이런 기능을 수동으로 구현해야 한다.

**`authKeys` 팩토리**: 쿼리 키를 체계적으로 관리한다. 나중에 인증 관련 캐시를 무효화할 때 `authKeys.all`로 한 번에 처리할 수 있다.

---

### 4단계: 토큰 교환 — `session/route.ts` (Route Handler)

```tsx
// src/app/api/auth/session/route.ts
export async function POST(request: Request) {
  // 1. body에서 code, provider 추출 + 검증
  // 2. 백엔드에 토큰 교환 요청
  const backendResponse = await fetch(`${backendUrl}/api/auth/oauth/${provider}/login`, {
    body: JSON.stringify({ authorizationCode: code }),
  });
  // 3. 받은 토큰을 쿠키로 변환
  const cookieStore = await cookies();
  setAuthCookies(cookieStore, accessToken, refreshToken);
}
```

**역할**: BFF의 핵심. 클라이언트에서 받은 `code`를 백엔드에 전달하고, 돌아온 JWT를 httpOnly 쿠키로 변환한다.

**왜 Route Handler에서 하는가**: `.claude/rules/auth.md` 규칙에 따라, 토큰→쿠키 변환은 `api/auth/` 하위 전용 Route Handler에서만 수행한다. catch-all 프록시(`api/[...path]`)에 인증 로직을 넣지 않는 것이 Next.js 권장 패턴이다.

**`cookies()` await**: Next.js 16에서 `cookies()`는 비동기 함수다. `await` 없이 호출하면 런타임 에러가 발생한다.

**`setAuthCookies()`의 동작**:

- `access_token`: `sameSite: 'lax'`, `httpOnly: true`, JWT exp 기반 만료
- `refresh_token`: `sameSite: 'strict'`, `httpOnly: true`, JWT exp 기반 만료
- `sameSite` 차이: access_token은 일반 네비게이션에서도 전송(lax), refresh_token은 같은 사이트 요청에서만 전송(strict)하여 보안 강화

**응답 포맷**: `{ status, message, data }` 형태의 `ApiResponse<T>`로 통일. 클라이언트의 `parseResponse`가 이 포맷에서 `.data`를 추출한다.

---

### 5단계: 로그아웃 — `logout/route.ts` (Route Handler)

```tsx
// src/app/api/auth/logout/route.ts
export async function POST() {
  const cookieStore = await cookies();
  clearAuthCookies(cookieStore);
}
```

**역할**: `access_token`, `refresh_token` 쿠키를 삭제한다.

---

## 인증 후 요청 흐름 (이후 단계)

로그인 완료 후, 인증이 필요한 API 요청은 다음과 같이 처리된다:

```
[클라이언트 컴포넌트]
  → fetch('/api/some-endpoint')     # 쿠키 자동 포함
  → [catch-all 프록시: api/[...path]/route.ts]
    → request.cookies에서 access_token 읽기
    → Authorization: Bearer {token} 헤더 부착
    → 백엔드에 전달

[서버 컴포넌트]
  → fetchWithAuth('/some-endpoint') # cookies()에서 토큰 읽기
    → Authorization 헤더 부착
    → 백엔드 직접 호출

[Proxy: proxy.ts]
  → 보호 라우트 접근 시 토큰 존재/만료 확인
  → 만료 임박 시 자동 refresh
  → 토큰 없으면 / 로 리다이렉트
```

## ERD 연관

이 인증 플로우는 ERD의 `USER` 테이블과 연관된다:

```
POST /api/auth/oauth/{provider}/login (백엔드)
  → provider(KAKAO/GOOGLE)와 인가 코드로 OAuth 제공자에서 사용자 정보 조회
  → USER 테이블에 신규 생성 또는 기존 사용자 조회
  → JWT 발급하여 반환
```

| USER 필드     | 값의 출처                                     |
| ------------- | --------------------------------------------- |
| `provider`    | 콜백 URL의 `provider` 파라미터 (kakao/google) |
| `provider_id` | 백엔드가 OAuth 제공자에서 수신                |
| `email`       | 백엔드가 OAuth 제공자에서 수신                |
| `name`        | 백엔드가 OAuth 제공자에서 수신                |

## 의존성 맵

```
OAuthCallbackClient.tsx
  └── useSocialLoginCallback()        ← api/auth/queries.ts
       └── postSocialLogin()          ← api/auth/index.ts
            └── parseResponse()       ← lib/parseResponse.ts
                 └── fetch('/api/auth/session')
                      └── session/route.ts (Route Handler)
                           ├── setAuthCookies()  ← lib/cookies.ts
                           │    └── getExpirationDate()  ← lib/jwt.ts
                           └── fetch(백엔드 /api/auth/oauth/{provider}/login)
```

## 보안 고려사항

### 적용된 것

- httpOnly 쿠키: 브라우저 JS에서 토큰 접근 불가 (XSS 방어)
- sameSite 설정: CSRF 부분 방어
- secure 플래그: 프로덕션에서 HTTPS만 허용
- JWT exp 기반 동적 만료: 고정 maxAge보다 정확
- 백엔드 에러 상세 비노출: 클라이언트에 내부 정보 유출 방지
- 중복 호출 방지: useRef로 StrictMode 더블 마운트 대응

### 추후 적용 필요

- **state 파라미터 (CSRF 방어)**: 로그인 시작 페이지에서 랜덤 state 생성 → 콜백에서 검증. 로그인 시작 페이지 구현 시 함께 적용
- **PKCE**: OAuth 2.1 권장. 로그인 시작 페이지에서 code_verifier/code_challenge 생성 필요
