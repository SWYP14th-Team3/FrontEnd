---
description: BFF 패턴 인증 아키텍처 규칙
globs: ['src/**/*.ts', 'src/**/*.tsx']
---

# 인증 아키텍처 규칙

## BFF 패턴

- 토큰은 httpOnly 쿠키에 저장한다. localStorage/sessionStorage에 저장하지 않는다.
- 백엔드 응답 바디의 토큰을 쿠키로 변환하는 것은 전용 Route Handler(`api/auth/`)에서만 한다.
- catch-all Route Handler(`api/[...path]`)에 인증 로직(토큰→쿠키 변환, 로그아웃)을 넣지 않는다.

## 토큰 접근 방식

- 서버 컴포넌트/Route Handler: `fetchWithAuth()` (`@/lib/fetchWithAuth`)로 백엔드 직접 호출.
- 클라이언트 컴포넌트: `fetch('/api/...')`로 catch-all Route Handler 경유. 토큰을 직접 다루지 않는다.
- Proxy: `request.cookies`로 토큰 읽기. `cookies()` from `next/headers`는 사용 불가.

## Proxy (`src/proxy.ts`)

- Next.js 16에서 middleware는 `proxy.ts`이다. `middleware.ts`를 생성하지 않는다.
- export는 `proxy` 함수 (not `middleware`, not default export).
- 보호 라우트 접근 제어와 토큰 자동 갱신만 담당한다. 데이터 페칭이나 DB 조회를 하지 않는다.
- Proxy는 유일한 인증 방어선이 아니다. 서버 컴포넌트/Route Handler에서도 인증을 확인해야 한다.

## 쿠키 설정

- 쿠키 상수와 헬퍼는 `@/lib/cookies`를 사용한다. 옵션을 하드코딩하지 않는다.
- access_token: `sameSite: 'lax'`
- refresh_token: `sameSite: 'strict'` (서버→서버에서만 사용)
- `expires`는 JWT exp에서 동적 계산한다. 고정 maxAge를 사용하지 않는다.

## server-only 가드

- `jwt.ts`, `cookies.ts`, `fetchWithAuth.ts` 등 토큰을 다루는 서버 유틸에는 반드시 `import 'server-only'`를 선언한다.
- 새로운 인증 관련 유틸을 만들 때도 동일하게 적용한다.

## 인증 관련 파일 위치

| 파일             | 위치                             | 역할                        |
| ---------------- | -------------------------------- | --------------------------- |
| Proxy            | `src/proxy.ts`                   | 토큰 검증 + 자동 갱신       |
| JWT 유틸         | `src/lib/jwt.ts`                 | 디코딩, 만료 확인           |
| 쿠키 헬퍼        | `src/lib/cookies.ts`             | 쿠키 설정/삭제              |
| fetch wrapper    | `src/lib/fetchWithAuth.ts`       | 서버 측 인증 fetch          |
| catch-all 프록시 | `src/app/api/[...path]/route.ts` | 클라이언트→백엔드 프록시    |
| 인증 전용 Route  | `src/app/api/auth/` 하위         | 로그인/로그아웃 (별도 생성) |
