---
description: 파일 및 디렉토리 구조 규칙
globs: ['src/**/*']
---

# 파일/디렉토리 구조 규칙

## 디렉토리 역할

| 디렉토리                    | 역할                        | 예시                                    |
| --------------------------- | --------------------------- | --------------------------------------- |
| `src/app/`                  | 라우팅, 페이지, 레이아웃    | `page.tsx`, `layout.tsx`, `loading.tsx` |
| `src/components/ui/`        | 도메인 비종속 기본 UI       | `Button.tsx`, `Input.tsx`, `Modal.tsx`  |
| `src/components/common/`    | 도메인 비종속 조합 컴포넌트 | `Header.tsx`, `Footer.tsx`              |
| `src/components/{feature}/` | 특정 기능 전용 컴포넌트     | `components/resume/ResumeViewer.tsx`    |
| `src/lib/`                  | 유틸리티, API 클라이언트    | `utils.ts`, `api.ts`                    |
| `src/hooks/`                | 커스텀 훅                   | `useAuth.ts`, `useResume.ts`            |
| `src/types/`                | 공유 타입 정의              | `resume.ts`, `job.ts`                   |
| `src/constants/`            | 상수 값                     | `routes.ts`, `config.ts`                |

## 페이지 디렉토리 구조

```
src/app/
├── layout.tsx # 루트 레이아웃
├── page.tsx # 홈 (/)
├── globals.css # Tailwind 글로벌 스타일
└── {route}/
├── page.tsx # 페이지 컴포넌트
├── layout.tsx # 중첩 레이아웃 (필요 시)
├── loading.tsx # 로딩 UI (필요 시)
├── error.tsx # 에러 UI (필요 시)
└── _components/ # 이 페이지 전용 컴포넌트
```

## 규칙

- 페이지 전용 컴포넌트는 해당 라우트의 `_components/` 디렉토리에 둔다.
- 2개 이상의 페이지에서 사용되는 컴포넌트는 `src/components/`로 이동한다.
- 하나의 파일에 하나의 컴포넌트만 export한다 (유틸 함수 제외).
- barrel export (`index.ts`)는 사용하지 않는다 — 직접 파일 경로로 import한다.
