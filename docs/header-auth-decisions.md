# 전역 헤더 인증 상태 관리 의사결정 기록

> 전역 헤더 구현 시 서버 컴포넌트 vs 클라이언트 컴포넌트 선택, 로그인 상태 판단 방식, OAuth 흐름에 대한 기술적 의사결정과 그 근거를 기록한다.

---

## 1. 해결해야 할 문제

전역 헤더는 로그인 여부에 따라 UI가 분기된다:

- **비로그인:** "로그인" 버튼 표시
- **로그인:** 프로필 아바타 + 유저명 표시, 드롭다운 메뉴(로그아웃/탈퇴)

이 프로젝트는 accessToken을 **httpOnly 쿠키**에 저장하기 때문에, 클라이언트 JavaScript에서 `document.cookie`로 토큰을 읽을 수 없다. 따라서 "프론트엔드가 로그인 여부를 어떻게 아는가"가 핵심 의사결정 포인트였다.

---

## 2. 의사결정 목록

### 2-1. 헤더를 클라이언트 컴포넌트로 구현

**결정:** 서버 컴포넌트가 아닌 클라이언트 컴포넌트(`'use client'`)로 헤더를 구현한다.

**검토한 선택지:**

| 방식                    | 로그인 판단                       | 로그인/로그아웃 반영            | 초기 flash        |
| ----------------------- | --------------------------------- | ------------------------------- | ----------------- |
| **서버 컴포넌트**       | `cookies().has('access_token')`   | `router.refresh()` 필요         | 없음              |
| **클라이언트 컴포넌트** | React Query로 `/api/auth/me` 호출 | `invalidateQueries()` 즉시 반영 | 스켈레톤 (수십ms) |

**클라이언트 컴포넌트를 선택한 근거:**

1. **팝업 OAuth와의 호환성**
   - 메인 페이지에서 이력서 PDF, 공고 URL 등을 입력하다가 로그인하는 시나리오가 있다
   - 이때 OAuth 리다이렉트를 하면 작성 중인 폼 데이터(특히 파일)가 소실된다
   - 팝업 로그인(`window.open`)을 사용하면 메인 페이지가 유지된다
   - 팝업 완료 후 `postMessage` → `invalidateQueries()`로 헤더를 즉시 갱신해야 한다
   - 서버 컴포넌트는 `router.refresh()`로 갱신해야 하는데, 이 경우 서버 왕복 동안 아무 피드백 없이 기존 UI가 유지되어 어색하다

2. **인터랙션 피드백**
   - 로그아웃 클릭 시: 즉시 버튼 disabled + 스피너 → 완료 후 UI 전환 → 실패 시 복원
   - 서버 컴포넌트에서는 이런 중간 상태 표현이 불가하다 (`router.refresh()`는 요청-응답이 한 번에 교체됨)

3. **서버 컴포넌트 비율이 낮음**
   - Nav 탭: `usePathname()` 필수 → 클라이언트
   - 프로필 드롭다운: `useState` + `onClick` → 클라이언트
   - 유저명 표시: API 호출 결과 필요 → 클라이언트
   - 서버 컴포넌트가 담당하는 건 `cookies().has()` 한 줄뿐이라 이점이 적다

4. **Layout 재렌더링 제한**
   - Next.js 공식 문서 경고: "Layout은 네비게이션 시 다시 렌더링되지 않으므로, Layout에서 인증 체크를 하면 라우트 변경 시 세션이 재확인되지 않는다"
   - 헤더가 layout.tsx에 위치하는 만큼, 서버 컴포넌트로 만들면 클라이언트 네비게이션 시 인증 상태가 갱신되지 않을 수 있다

**감수하는 트레이드오프:**

- 초기 로드 시 유저 영역에 스켈레톤이 수십ms 표시됨 (API 응답 후 확정)
- 비로그인 유저도 `/api/auth/me` 요청 1회 발생 (401 즉시 반환, `retry: false`)

**`router.refresh()`에 대한 참고:**

`router.refresh()` 자체가 나쁜 것은 아니다. 서버 액션 후 목록 갱신 등에는 적합하다. 다만 헤더 로그인/로그아웃처럼 **즉각적인 피드백이 기대되는 인터랙션**에서는 중간 상태를 보여줄 수 없어 UX가 어색할 수 있다.

`router.refresh()`는 클라이언트 React state(useState 등)를 보존한다. 이는 Next.js 공식 문서에 명시되어 있다:

> "The client will merge the updated React Server Component payload without losing unaffected client-side React (e.g. useState) or browser state (e.g. scroll position)."

---

### 2-2. has-session 힌트 쿠키를 사용하지 않음

**결정:** 별도의 has-session 쿠키(httpOnly=false) 없이, React Query의 `/api/auth/me` 호출 결과로만 로그인 상태를 판단한다.

**has-session 쿠키란:**

httpOnly 쿠키는 클라이언트 JS에서 읽을 수 없으므로, 로그인 시 `has-session=1`이라는 일반 쿠키(httpOnly=false)를 함께 세팅하여 `document.cookie`로 빠르게 로그인 여부를 판단하는 패턴이다.

**사용하지 않는 근거:**

1. **어차피 API 호출이 필요하다**
   - has-session은 "로그인 여부"만 알려줌
   - 헤더에 유저 **이름**을 표시해야 하므로, 로그인 상태라면 결국 `/api/auth/me`를 호출해야 함
   - has-session이 절약해주는 것은 비로그인 유저의 401 요청 1회뿐

2. **자동 refresh 체인이 없다**
   - sail-mate 프로젝트에서 has-session이 필수였던 이유: axios interceptor가 401 → 자동 `/auth/refresh` → 또 실패, 총 2회 불필요한 요청
   - 우리 프로젝트는 catch-all 프록시에 자동 refresh 로직이 없음. 401이면 그대로 반환하고 끝
   - 토큰 갱신은 proxy.ts(미들웨어)가 페이지 접근 시점에 선제적으로 처리
   - 따라서 비로그인 유저의 비용은 401 요청 1회 (retry: false로 즉시 종료)

3. **관리 복잡도 증가**
   - setAuthCookies / clearAuthCookies에서 has-session도 동기화해야 함
   - 만료 시간 관리, 로그아웃 시 삭제 등 쿠키 하나 추가에 따른 유지보수 비용

---

### 2-3. useUser() 훅 설계

**결정:** 기존 `meOptions()` (src/api/auth/queries.ts)를 래핑한 `useUser()` 훅으로 인증 상태를 관리한다.

```tsx
// src/hooks/useUser.ts
export function useUser() {
  const { data, isLoading } = useQuery({
    ...meOptions(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: data ?? null,
    isLoggedIn: !!data,
    isLoading,
  };
}
```

**설계 근거:**

- `retry: false`: 비로그인 시 401을 받으면 재시도 없이 즉시 비로그인 처리
- `staleTime: 5분`: 매 렌더마다 API 호출하지 않음. 5분간 캐시된 결과 사용
- `invalidateQueries()`: 로그인/로그아웃 시 캐시를 무효화하면 자동으로 re-fetch → 헤더 즉시 반영
- 별도 Context/Provider 불필요: React Query 캐시가 전역 상태 역할을 수행

---

### 2-4. 팝업 OAuth 로그인 방식 채택

**결정:** OAuth 로그인 시 리다이렉트 대신 팝업(`window.open`)으로 처리한다.

**근거:**

메인 페이지에서 이력서 PDF 업로드, 공고 URL 입력 등 폼 작성 중에 로그인이 필요한 시나리오가 존재한다.

| 방식                     |   폼 데이터 보존   |   파일(PDF) 보존    |
| ------------------------ | :----------------: | :-----------------: |
| OAuth 리다이렉트         |  ❌ (페이지 이탈)  |         ❌          |
| sessionStorage 임시 저장 | ⚠️ (텍스트만 가능) | ❌ (파일 저장 불가) |
| 팝업 로그인              |  ✅ (페이지 유지)  |         ✅          |

**팝업 로그인 흐름:**

```
1. 메인 페이지에서 로그인 클릭 → window.open()으로 OAuth 팝업
2. 팝업에서 OAuth 완료 → /auth/callback에서 토큰을 httpOnly 쿠키에 저장
3. 팝업이 window.opener.postMessage({ type: 'OAUTH_SUCCESS' }) 전달 후 닫힘
4. 메인 페이지가 message 수신 → invalidateQueries('me') 호출
5. useUser() re-fetch → 헤더 즉시 갱신, 폼 데이터 보존
```

---

## 3. 조사 과정에서 확인한 사항

### router.refresh()와 클라이언트 state 보존

Next.js 공식 문서(`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md`)에 따르면, `router.refresh()`는 서버 컴포넌트만 다시 렌더링하고 클라이언트 컴포넌트의 `useState` 및 브라우저 state(스크롤 등)는 보존한다. 따라서 서버 컴포넌트 헤더 + `router.refresh()` 조합도 폼 데이터를 날리지는 않는다.

그럼에도 클라이언트 컴포넌트를 선택한 이유는 위 2-1에서 기술한 인터랙션 피드백과 서버 컴포넌트 비율 문제 때문이다.

### sail-mate 프로젝트 참고

동일 팀원이 이전에 참여한 sail-mate 프로젝트에서는 `has-session` 힌트 쿠키 + 클라이언트 컴포넌트 패턴을 사용했다. has-session이 필수였던 이유는 axios interceptor가 401 시 자동으로 `/auth/refresh`를 호출하는 체인이 있었기 때문이다. 우리 프로젝트는 이 체인이 없으므로(미들웨어에서 선제적 refresh) has-session 없이도 비용이 낮다.

### Next.js 공식 인증 가이드

Next.js 공식 문서와 WorkOS 2026 가이드는 서버 컴포넌트 + DAL(Data Access Layer) 패턴을 권장한다. 이 패턴은 서버에서 `cookies()`로 직접 인증을 확인하고 조건부 렌더링하는 방식이다. 서버 중심으로 인증을 처리하는 일반적인 케이스에 적합하지만, 팝업 OAuth + 즉각적 인터랙션 피드백이 필요한 우리 케이스에서는 클라이언트 컴포넌트가 더 적합하다고 판단했다.

---

## 4. 참고 자료

- [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication)
- [WorkOS Next.js Auth Guide 2026](https://workos.com/blog/nextjs-app-router-authentication-guide-2026)
- [Next.js useRouter API - router.refresh()](https://nextjs.org/docs/app/api-reference/functions/use-router)
- [우리가 인증을 대하는 자세 (Feat Nextjs & serverComponent)](https://velog.io/@minsu8834/%EC%9A%B0%EB%A6%AC%EA%B0%80-%EC%9D%B8%EC%A6%9D%EC%9D%84-%EB%8C%80%ED%95%98%EB%8A%94-%EC%9E%90%EC%84%B8.-Feat-Nextjs-serverComponent)
- [Next.js 전환 과정 - 인증 및 토큰 처리하기 (SK플래닛)](https://jayoon-kong.github.io/nextjs-authentication/)
- Figma: https://www.figma.com/design/xgD4SfjRHaYzBGKroiTd1k/design-system-ex?node-id=17-65627
