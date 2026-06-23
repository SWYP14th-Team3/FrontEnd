---
name: create-page
description: Next.js App Router 페이지를 생성합니다. 라우트 경로를 인자로 받아 page.tsx, layout.tsx(선택), loading.tsx(선택)를 scaffolding합니다. 사용 시: "/create-page {route}" (예: "/create-page resume/upload")
---

# Create Page

App Router 페이지를 생성하는 스킬입니다.

## 입력

인자로 라우트 경로를 받습니다. 예: `resume/upload` → `src/app/resume/upload/page.tsx`

## 실행 절차

1. **라우트 경로 파싱**: 인자에서 라우트 경로를 추출한다.
2. **디렉토리 생성**: `src/app/{route}/` 디렉토리를 생성한다.
3. **page.tsx 생성**: 아래 템플릿으로 페이지 파일을 생성한다.
4. **추가 파일**: 사용자가 요청한 경우 layout.tsx, loading.tsx, error.tsx도 생성한다.
5. **린트 확인**: `pnpm lint`를 실행하여 에러가 없는지 확인한다.

## page.tsx 템플릿

```tsx
export default function {PageName}Page() {
  return (
    <main>
      <h1>{PageTitle}</h1>
    </main>
  );
}
```

- `{PageName}`: 라우트 경로의 마지막 세그먼트를 PascalCase로 변환 (예: `resume/upload` → `Upload`)
- `{PageTitle}`: 라우트 경로의 마지막 세그먼트를 사람이 읽을 수 있는 형태로 변환

## layout.tsx 템플릿 (요청 시)

```tsx
export default function {PageName}Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
```

## loading.tsx 템플릿 (요청 시)

```tsx
export default function {PageName}Loading() {
  return <div>Loading...</div>;
}
```

## error.tsx 템플릿 (요청 시)

```tsx
'use client';

export default function {PageName}Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

## 규칙

- `.claude/rules/architecture.md`의 App Router 규칙을 따른다.
- `.claude/rules/file-structure.md`의 디렉토리 구조를 따른다.
- 페이지 컴포넌트는 `export default` 사용.
- 페이지 전용 컴포넌트가 필요하면 `_components/` 디렉토리에 생성한다.
