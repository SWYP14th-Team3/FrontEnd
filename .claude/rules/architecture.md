---
description: App Router 아키텍처 및 서버/클라이언트 컴포넌트 규칙
globs: ['src/**/*.ts', 'src/**/*.tsx']
---

# 아키텍처 규칙

## App Router

- Pages Router 사용 금지. App Router만 사용한다.
- 페이지 파일: `src/app/**/page.tsx`
- 레이아웃 파일: `src/app/**/layout.tsx`
- 로딩 UI: `src/app/**/loading.tsx`
- 에러 UI: `src/app/**/error.tsx` ('use client' 필수)
- Not Found: `src/app/**/not-found.tsx`

## 서버 / 클라이언트 컴포넌트

- 모든 컴포넌트는 기본적으로 서버 컴포넌트이다.
- 클라이언트 컴포넌트가 필요한 경우에만 파일 최상단에 `'use client'`를 선언한다.
- 클라이언트가 필요한 경우: useState, useEffect, 이벤트 핸들러, 브라우저 API, 서드파티 클라이언트 라이브러리
- 서버 컴포넌트 안에서 클라이언트 컴포넌트를 import할 수 있지만, 그 반대는 불가하다 (children prop으로 전달).

## React Compiler

- React Compiler가 활성화되어 있다 (`next.config.ts`의 `reactCompiler: true`).
- `useMemo`, `useCallback`, `React.memo`를 수동으로 사용하지 않는다. 컴파일러가 자동 최적화한다.

## 데이터 페칭

- 서버 컴포넌트에서는 `async/await`로 직접 fetch한다.
- 클라이언트 컴포넌트에서는 `use()` 훅 또는 서드파티 라이브러리를 사용한다.

## Next.js 16 주의사항

- 이 프로젝트는 Next.js 16을 사용한다. 학습 데이터와 API가 다를 수 있다.
- 코드 작성 전 `node_modules/next/dist/docs/`의 관련 가이드를 확인한다.
