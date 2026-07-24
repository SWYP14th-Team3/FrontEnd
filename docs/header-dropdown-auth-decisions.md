# 헤더 유저 드롭다운 메뉴 + 로그인/회원가입 모달 의사결정 기록

> 이슈 #40 작업 과정에서 내린 기술적 의사결정과 그 근거를 기록한다. 헤더의 드롭다운 메뉴, 소셜 로그인 모달, 약관 동의 모달, 로그아웃/탈퇴 확인 팝업의 구현 방식과 동작 흐름을 포함한다.

---

## 1. 해결해야 할 문제

#39에서 구현한 헤더의 기본 구조(Logo + NavTabs + AuthSection)에 다음 기능들을 추가해야 했다:

- **비로그인 상태:** "로그인" 버튼 클릭 → 소셜 로그인 모달 → OAuth 인증 → 약관 동의 → 로그인 완료
- **로그인 상태:** 아바타+유저명 클릭 → 드롭다운 메뉴 → 로그아웃/탈퇴하기

핵심 과제는 팝업 기반 OAuth 흐름, 약관 동의 시점, 로그아웃 시 캐시 처리, MSW 개발 환경 호환이었다.

---

## 2. 전체 동작 흐름

### 2-1. 로그인 흐름

```
헤더 "로그인" 버튼 클릭
  → LoginModal (overlay.open)
  → Google/Kakao 소셜 버튼 클릭
  → [프로덕션] window.open()으로 OAuth 팝업
    → OAuth 제공자 인증 → /auth/callback?provider=google&code=xxx
    → OAuthCallbackClient: postSocialLogin() → BFF Route Handler → 쿠키 설정
    → window.opener.postMessage({ type: 'OAUTH_SUCCESS' }) → 팝업 닫힘
  → [MSW] postSocialLogin({ code: 'mock-code', provider }) 즉시 호출
  → LoginModal에서 postMessage 수신 (프로덕션) 또는 onSuccess 콜백 (MSW)
  → localStorage에 'terms_agreed' 확인
    → 있음: invalidateQueries → 모달 닫기 → 로그인 완료
    → 없음: SignupModal 표시 → 약관 동의 → localStorage 저장 → 모달 닫기
```

### 2-2. 로그아웃 흐름

```
아바타+유저명 클릭 → UserDropdown 표시
  → "로그아웃" 클릭 → LogoutConfirmModal (overlay.open)
  → "로그아웃" 버튼 클릭
  → useLogout() → POST /api/auth/logout (BFF Route Handler)
    → 백엔드에 로그아웃 요청 (fire-and-forget)
    → 쿠키 삭제 (clearAuthCookies)
  → setQueryData(null) + removeQueries → 캐시 완전 제거
  → localStorage.removeItem('terms_agreed')
  → 헤더 즉시 비로그인 UI로 전환
```

### 2-3. 탈퇴 흐름

```
아바타+유저명 클릭 → UserDropdown 표시
  → "탈퇴하기" 클릭 → WithdrawConfirmModal (overlay.open)
  → 체크박스 동의 → "떠날래요" 버튼 활성화
  → 클릭 시 console.warn (탈퇴 API 미구현 — 백엔드 API 확정 후 연동)
```

---

## 3. 의사결정 목록

### 3-1. 소셜 로그인을 팝업(window.open) 방식으로 구현

**결정:** OAuth 인증 시 페이지 리다이렉트 대신 팝업(`window.open`)을 사용한다.

**근거:**

`header-auth-decisions.md`의 2-4에서 결정한 사항의 구체적 구현이다.

| 방식             | 폼 데이터 보존 | 파일(PDF) 보존 | 인터랙션    |
| ---------------- | :------------: | :------------: | ----------- |
| OAuth 리다이렉트 |       X        |       X        | 페이지 이탈 |
| 팝업 로그인      |       O        |       O        | 페이지 유지 |

메인 페이지에서 이력서 PDF, 공고 URL 입력 중에 로그인이 필요한 시나리오가 존재한다. 팝업을 사용하면 메인 페이지 state가 보존된다.

**팝업-부모 통신:**

- 팝업 완료 시: `window.opener.postMessage({ type: 'OAUTH_SUCCESS' }, origin)` → `window.close()`
- 부모(LoginModal): `window.addEventListener('message', handler)` → origin 검증 → 후속 처리
- 팝업이 아닌 직접 접근 시: 기존 `router.replace('/')` 폴백 유지

### 3-2. OAuth state 파라미터와 provider 파라미터를 분리

**결정:** `state`는 CSRF 방어용으로만 사용하고, `provider`는 redirect_uri의 쿼리 파라미터로 전달한다.

**검토한 선택지:**

| 방식                                                  | 장점      | 단점                            |
| ----------------------------------------------------- | --------- | ------------------------------- |
| `state=google` (provider 겸용)                        | 구현 단순 | CSRF 방어 불가, OAuth 표준 위반 |
| `state=csrf_token`, redirect_uri에 `?provider=google` | 표준 준수 | redirect_uri 등록 시 주의 필요  |

**provider를 redirect_uri에 포함하는 방식을 선택한 근거:**

- `state`는 RFC 6749에서 CSRF 토큰 용도로 정의됨
- `provider`를 `state`에 넣으면 CSRF 방어를 위해 별도 메커니즘이 필요
- redirect_uri에 `?provider=google`을 포함하면 콜백 페이지에서 `searchParams.get('provider')`로 깔끔하게 추출 가능

**구현:**

```typescript
// LoginModal.tsx — OAuth URL 구성
const redirectUri = encodeURIComponent(`${REDIRECT_URI}?provider=${provider}`);

// OAuthCallbackClient.tsx — provider 추출
const provider = searchParams.get('provider') as 'kakao' | 'google' | null;
```

### 3-3. 약관 동의를 OAuth 인증 후에 처리 (localStorage 임시 방식)

**결정:** OAuth 인증을 먼저 수행하고, 약관 미동의 유저에게만 SignupModal을 표시한다. 동의 여부는 `localStorage`에 저장한다.

**검토한 선택지:**

| 시점                   | 장점                      | 단점                                  |
| ---------------------- | ------------------------- | ------------------------------------- |
| OAuth 전 약관 동의     | 구현 단순                 | 기존 유저도 매번 동의, 법적 효력 약함 |
| **OAuth 후 약관 동의** | 업계 표준, 기존 유저 스킵 | 신규/기존 구분 필요                   |

**OAuth 후를 선택한 근거:**

카카오, 네이버, 토스 등 거의 모든 서비스가 OAuth 인증 → 신규 유저 → 약관 동의 순서를 사용한다. 인증 완료 후 실제 사용자를 식별한 상태에서 동의를 받는 것이 법적 효력이 명확하다.

**현재 한계 (localStorage 임시 방식):**

백엔드에 `isNewUser` 또는 `termsAgreedAt` 필드가 없어서 프론트 localStorage로 대체했다. 한계점:

- 브라우저/기기 변경 시 동의 기록 사라짐
- 로그아웃 시 `localStorage.removeItem('terms_agreed')`로 초기화 → 재로그인 시 다시 동의

**향후 개선 (백엔드 협업 시):**

1. OAuth 응답에 `isNewUser: boolean` 추가
2. User에 `termsAgreedAt: timestamp` 필드 추가
3. `POST /api/users/terms-agree` 엔드포인트 추가
4. localStorage 체크를 API 응답 체크로 교체

### 3-4. 로그아웃 시 캐시 처리: setQueryData(null) + removeQueries

**결정:** `invalidateQueries` 대신 `setQueryData(null)` + `removeQueries`를 사용한다.

**검토한 선택지:**

| 방식                                       | 동작                  | 문제                                                    |
| ------------------------------------------ | --------------------- | ------------------------------------------------------- |
| `invalidateQueries`                        | re-fetch 트리거       | 에러(401) 시 이전 캐시 데이터 유지 → 로그인 상태 유지됨 |
| `removeQueries`                            | 쿼리 제거             | 제거만으로는 data가 즉시 null이 되지 않을 수 있음       |
| **`setQueryData(null)` + `removeQueries`** | 즉시 null → 쿼리 제거 | 없음                                                    |

**이 조합을 선택한 근거:**

React Query는 `invalidateQueries` 후 re-fetch에서 에러가 발생해도 이전 캐시 데이터를 `data` 필드에 유지한다. `useUser` 훅이 `data`를 기반으로 로그인 상태를 판단하므로, 로그아웃 후에도 로그인 상태로 보이는 문제가 있었다.

`setQueryData(null)`로 즉시 캐시 데이터를 null로 설정하면 `useUser`가 바로 비로그인 상태를 반환하고, 이후 `removeQueries`로 쿼리 자체를 정리한다.

**추가 조치:**

- `useUser` 훅에 `status === 'success'` 체크 추가: 에러 상태에서 이전 캐시 데이터로 로그인 처리되는 것을 이중 방어

```typescript
// useUser.ts
return {
  user: data ?? null,
  isLoggedIn: status === 'success' && !!data, // 에러 시 false
  isLoading,
};
```

### 3-5. MSW 환경에서 소셜 로그인을 mock 즉시 로그인으로 처리

**결정:** `NEXT_PUBLIC_MSW_ENABLED=true`일 때 OAuth 팝업 대신 `postSocialLogin()`을 직접 호출한다.

**근거:**

OAuth는 외부 제공자(카카오/구글) 페이지로 리다이렉트해야 하므로 MSW로 가로챌 수 없다. 개발 환경에서 매번 실제 OAuth 인증을 거치면 개발 속도가 현저히 느려진다.

**구현:**

```typescript
// LoginModal.tsx
const IS_MSW = process.env.NEXT_PUBLIC_MSW_ENABLED === 'true';

const handleSocialLogin = (provider: OAuthProvider) => {
  if (IS_MSW) {
    mockLogin({ code: 'mock-code', provider }); // 즉시 로그인
    return;
  }
  // 프로덕션: OAuth 팝업 열기
  window.open(getOAuthUrl(provider), ...);
};
```

**프로덕션 영향 없음:**

- `IS_MSW`는 빌드 타임에 결정되는 환경변수
- 프로덕션에서는 `NEXT_PUBLIC_MSW_ENABLED` 미설정 → `IS_MSW = false` → OAuth 팝업 실행
- 코드 변경 없이 환경변수만으로 전환

### 3-6. MSW auth 상태를 localStorage로 관리

**결정:** MSW 핸들러에서 로그인/로그아웃 상태를 모듈 변수 대신 `localStorage`에 저장한다.

**검토한 선택지:**

| 방식                         | 핫 리로드 시 | 새로고침 시 |
| ---------------------------- | :----------: | :---------: |
| 모듈 변수 (`let isLoggedIn`) | 리셋 (true)  | 리셋 (true) |
| **localStorage**             |     유지     |    유지     |

**localStorage를 선택한 근거:**

개발 중 핫 리로드가 빈번하게 발생하는데, 모듈 변수는 매번 초기값(`true`)으로 리셋되어 로그아웃 테스트가 불가능했다.

### 3-7. 모달 관리에 overlay-kit 사용, unmount()로 DOM 정리

**결정:** 모든 모달을 `overlay.open()`으로 표시하고, 닫을 때 `close()` + `unmount()`를 호출한다.

**근거:**

- overlay-kit의 `close()`는 `isOpen`을 `false`로 변경하지만 DOM에 컴포넌트가 남아있음
- `unmount()`를 호출해야 DOM에서 완전히 제거됨
- 모달이 닫힌 후에도 메모리에 남는 것을 방지

```typescript
// 모든 모달의 공통 패턴
const handleClose = () => {
  close();
  unmount();
};
```

### 3-8. proxy.ts 토큰 재발급을 body JSON으로 전송

**결정:** `proxy.ts`의 `attemptRefresh`에서 refreshToken을 Cookie 헤더 대신 body JSON으로 전송한다.

**근거:**

백엔드 API 스펙(`POST /api/auth/reissue`)이 body `{ refreshToken: string }`을 기대한다. 기존 코드는 Cookie 헤더로 전송하고 있어 프로덕션에서 토큰 재발급이 실패할 수 있었다.

또한 백엔드 응답이 `{ status, message, data: { accessToken, refreshToken } }` wrapper 구조인데, 기존 코드는 `data.accessToken`으로 직접 접근하여 `undefined`가 되는 문제가 있었다. `json.data?.accessToken`으로 수정했다.

---

## 4. 파일 구조

```
src/
├── app/auth/callback/_components/
│   └── OAuthCallbackClient.tsx         # 수정: 팝업 모드 postMessage 지원
├── components/
│   ├── common/Header/
│   │   ├── AuthSection.tsx             # 수정: 드롭다운 + 모달 통합
│   │   ├── UserDropdown.tsx            # 신규: 드롭다운 메뉴
│   │   ├── LoginModal.tsx              # 신규: 소셜 로그인 모달
│   │   ├── SignupModal.tsx             # 신규: 약관 동의 모달
│   │   ├── LogoutConfirmModal.tsx      # 신규: 로그아웃 확인 팝업
│   │   ├── WithdrawConfirmModal.tsx    # 신규: 탈퇴 확인 팝업
│   │   └── SocialLoginButton.tsx       # 신규: Google/Kakao 버튼
│   └── icon/
│       ├── DoorIcon.tsx                # 신규: 로그아웃 아이콘
│       ├── CancelPresentationIcon.tsx  # 신규: 탈퇴 아이콘
│       ├── CheckIcon.tsx               # 신규: 체크마크 아이콘
│       ├── ChevronRightIcon.tsx        # 신규: > 화살표 아이콘
│       ├── GoogleLogo.tsx              # 신규: 구글 로고
│       └── KakaoLogo.tsx              # 신규: 카카오 로고
├── constants/
│   └── links.ts                        # 신규: 이용약관/개인정보처리방침 URL
├── hooks/
│   └── useUser.ts                      # 수정: status 체크 추가
├── mocks/handlers/
│   └── auth.ts                         # 수정: localStorage 상태 관리
└── proxy.ts                            # 수정: refreshToken body 전송
```

---

## 5. 환경변수

| 환경변수                         | 용도                       | 필요 환경                  |
| -------------------------------- | -------------------------- | -------------------------- |
| `BACKEND_URL`                    | 백엔드 API URL             | 서버 (프로덕션 필수)       |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`   | Google OAuth 클라이언트 ID | 클라이언트 (프로덕션 필수) |
| `NEXT_PUBLIC_KAKAO_CLIENT_ID`    | Kakao OAuth 클라이언트 ID  | 클라이언트 (프로덕션 필수) |
| `NEXT_PUBLIC_OAUTH_REDIRECT_URI` | OAuth 콜백 URL             | 클라이언트 (프로덕션 필수) |
| `NEXT_PUBLIC_MSW_ENABLED`        | MSW 활성화                 | 개발 환경만 (`true`)       |

`NEXT_PUBLIC_*` 변수는 빌드 타임에 클라이언트 번들에 인라인된다. OAuth client ID는 공개값이므로 secret이 아닌 일반 environment variable로 관리한다. `client_secret`은 백엔드에서 관리하며 프론트에는 불필요하다.

---

## 6. 보류 항목

| 항목                | 현재 상태                  | 트리거                              |
| ------------------- | -------------------------- | ----------------------------------- |
| 탈퇴 API 연동       | `console.warn` placeholder | 백엔드 API 확정 시                  |
| `isNewUser` 전환    | localStorage 임시 방식     | 백엔드 `isNewUser` 필드 추가 시     |
| 약관 동의 서버 저장 | localStorage만 사용        | 백엔드 `termsAgreedAt` 필드 추가 시 |

---

## 7. 참고 자료

- [header-auth-decisions.md](./header-auth-decisions.md) — 헤더 클라이언트 컴포넌트 선택 근거, useUser 훅 설계
- [oauth-auth-flow.md](./oauth-auth-flow.md) — OAuth 인증 흐름, BFF 패턴
- [RFC 6749 - OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749) — state 파라미터 용도
- Figma: https://www.figma.com/design/xgD4SfjRHaYzBGKroiTd1k/design-system-ex?node-id=17-65627
