# ResuFit AI Agent Harness Configuration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Claude Code가 ResuFit 프로젝트를 이해하고 일관된 코드를 생성할 수 있도록 CLAUDE.md, Agent Team, Rules, Skills로 구성된 하네스를 구축한다.

**Architecture:** CLAUDE.md를 진입점으로, `.claude/agents/`에 Generate-Validate 패턴의 3인 에이전트 팀(planner → frontend → reviewer)을 정의한다. `.claude/rules/`에 프로젝트 규칙을, `.claude/skills/`에 반복 작업 자동화 스킬을 배치한다.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, pnpm, cva + clsx + tailwind-merge

## Global Constraints

- 패키지 매니저: pnpm only (npm, yarn 금지)
- Node.js: 24 LTS
- Next.js: 16.2.9 (App Router 전용, Pages Router 금지)
- React: 19.2.4 + React Compiler 활성화
- Tailwind CSS: v4 (@tailwindcss/postcss)
- 경로 alias: `@/*` → `./src/*`
- Prettier: printWidth 120, singleQuote, trailingComma all, endOfLine lf
- ESLint: eslint-config-next (core-web-vitals + typescript) + eslint-config-prettier
- Git Hook: Husky + lint-staged (커밋 시 자동 린트/포매팅)
- 브랜치: `{접두사}/{뤼이도 티켓 ID}` (예: `chore/14-22-FE-하네스-구성`)
- 커밋: `{타입}: {작업 내용}` (예: `chore: CLAUDE.md 작성`)

## 도메인 컨텍스트 (ResuFit)

- **서비스**: JD(채용공고) 맞춤 AI 이력서 분석 서비스
- **핵심 기능**: 이력서 PDF + 채용공고 업로드 → AI가 이력서와 공고 간 핏/갭 분석 → 이력서 위에 주석으로 시각화
- **차별점**: (1) 원본 공고 기반 대조 (2) 핏/갭을 이력서 위에 가시적으로 보여주는 UX (3) 섬세한 프롬프트 설계
- **방향성**: '공고와 이력서의 핏한 정도를 신뢰성 있게 보여준다'에 초점. AI 인터뷰 기능은 제외.

---

### Task 1: CLAUDE.md 작성

**Files:**

- Modify: `CLAUDE.md` (현재 `@AGENTS.md` 한 줄만 있음)

**Interfaces:**

- Produces: 프로젝트 진입점 문서. 모든 에이전트와 rules가 이 문서를 참조한다.

- [ ] **Step 1: CLAUDE.md 내용 작성**

`CLAUDE.md`를 아래 내용으로 교체한다. 기존 `@AGENTS.md` 참조는 유지한다.

```markdown
@AGENTS.md

# ResuFit — JD 맞춤 AI 이력서 분석 서비스

## 프로젝트 개요

ResuFit은 채용공고(JD)와 이력서를 AI로 대조 분석하여, 이력서의 어떤 부분이 공고와 핏(fit)하고 어떤 부분에 갭(gap)이 있는지를 이력서 위에 시각적으로 보여주는 서비스입니다.

### 핵심 가치

- 원본 공고를 기반으로 한 신뢰성 있는 대조 분석
- 핏/갭을 이력서 위에 주석으로 가시적으로 보여주는 UX
- 섬세한 프롬프트 설계를 통한 분석 품질

### 도메인 용어

| 용어                    | 설명                                        |
| ----------------------- | ------------------------------------------- |
| JD (Job Description)    | 채용공고. 회사가 올린 원본 텍스트           |
| 이력서 (Resume)         | 사용자가 업로드하는 PDF 이력서              |
| 핏 (Fit)                | 이력서 항목이 JD 요구사항과 일치하는 부분   |
| 갭 (Gap)                | JD가 요구하지만 이력서에 없거나 부족한 부분 |
| 어노테이션 (Annotation) | 이력서 위에 핏/갭을 표시하는 시각적 주석    |

## 기술 스택

| 항목          | 선택                                    |
| ------------- | --------------------------------------- |
| 프레임워크    | Next.js 16 (App Router)                 |
| 언어          | TypeScript (strict mode)                |
| 패키지 매니저 | pnpm                                    |
| 스타일링      | Tailwind CSS v4 + cn() + cva            |
| 코드 품질     | ESLint + Prettier + Husky + lint-staged |
| React         | 19 + React Compiler                     |
| 번들러        | Turbopack (dev)                         |

## 주요 명령어

| 명령어              | 설명                  |
| ------------------- | --------------------- |
| `pnpm dev`          | 개발 서버 (Turbopack) |
| `pnpm build`        | 프로덕션 빌드         |
| `pnpm lint`         | ESLint 검사           |
| `pnpm format`       | Prettier 전체 포매팅  |
| `pnpm format:check` | Prettier 검사 (CI용)  |

## 디렉토리 구조
```

src/
├── app/ # App Router 페이지 및 레이아웃
│ ├── layout.tsx # 루트 레이아웃
│ ├── page.tsx # 홈 페이지
│ ├── globals.css # 글로벌 스타일 (Tailwind)
│ └── (routes)/ # 라우트 그룹
├── components/ # 공유 컴포넌트
│ ├── ui/ # 기본 UI 컴포넌트 (Button, Input 등)
│ └── common/ # 도메인 비종속 공통 컴포넌트
├── lib/ # 유틸리티, 헬퍼
│ └── utils.ts # cn() 유틸
├── hooks/ # 커스텀 훅
├── types/ # 공유 타입 정의
├── constants/ # 상수
└── styles/ # 추가 스타일 (필요 시)

```

## 컨벤션

### 브랜치
```

{접두사}/{뤼이도 티켓 ID}

```
접두사: `feat/`, `fix/`, `chore/`, `refactor/`

### 커밋
```

{타입}: {작업 내용}

```
타입: `feat`, `fix`, `chore`, `refactor`, `style`, `docs`, `test`

### 코딩 규칙
- 컴포넌트: PascalCase (`LoginForm.tsx`)
- 훅: camelCase, `use` 접두사 (`useAuth.ts`)
- 유틸: camelCase (`formatDate.ts`)
- 타입/인터페이스: PascalCase, `Props` 접미사 (`ButtonProps`)
- 상수: UPPER_SNAKE_CASE
- 경로 alias: `@/` 사용 (`import { cn } from '@/lib/utils'`)
- 스타일링: Tailwind + cn() 조합, 조건부 스타일은 cva 사용
- 서버 컴포넌트가 기본, 클라이언트가 필요할 때만 `'use client'`
- `docs/initial-setup.md`에 상세 컨벤션 문서화
```

- [ ] **Step 2: CLAUDE.md 파일 교체**

`CLAUDE.md` 파일을 Step 1의 내용으로 교체한다.

- [ ] **Step 3: 린트 확인**

Run: `cd /Users/rak/swyp14th-team3 && pnpm format:check`
Expected: CLAUDE.md가 Prettier 대상이므로 포매팅 확인. 필요 시 `pnpm format` 실행.

- [ ] **Step 4: 커밋**

```bash
git add CLAUDE.md
git commit -m "chore: CLAUDE.md 프로젝트 하네스 진입점 작성"
```

---

### Task 2: Rules 작성 (.claude/rules/)

**Files:**

- Create: `.claude/rules/architecture.md`
- Create: `.claude/rules/coding-conventions.md`
- Create: `.claude/rules/file-structure.md`

**Interfaces:**

- Consumes: CLAUDE.md (Task 1)
- Produces: 에이전트들이 코드 생성 시 자동으로 참조하는 규칙 파일들

- [ ] **Step 1: .claude/rules/ 디렉토리 생성**

```bash
mkdir -p .claude/rules
```

- [ ] **Step 2: architecture.md 작성**

`.claude/rules/architecture.md`:

```markdown
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
```

- [ ] **Step 3: coding-conventions.md 작성**

`.claude/rules/coding-conventions.md`:

````markdown
---
description: 네이밍, 스타일링, 타입 등 코딩 컨벤션
globs: ['src/**/*.ts', 'src/**/*.tsx']
---

# 코딩 컨벤션

## 네이밍

- 컴포넌트 파일/함수: PascalCase (`LoginForm.tsx`, `function LoginForm()`)
- 훅 파일/함수: camelCase, `use` 접두사 (`useAuth.ts`, `function useAuth()`)
- 유틸 파일/함수: camelCase (`formatDate.ts`, `function formatDate()`)
- 타입/인터페이스: PascalCase, Props 접미사 (`ButtonProps`, `UserData`)
- 상수: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `API_BASE_URL`)
- CSS 클래스: Tailwind 유틸리티만 사용 (커스텀 CSS 클래스 지양)

## 임포트

- 경로 alias `@/` 사용: `import { cn } from '@/lib/utils'`
- 상대 경로는 같은 디렉토리 내 파일 간에만 사용

## 스타일링

- Tailwind CSS v4 유틸리티 클래스 사용
- 조건부/동적 클래스: `cn()` 함수 사용 (`@/lib/utils`)
- 컴포넌트 variants: `cva()` 사용 (`class-variance-authority`)
- Tailwind 클래스 순서: prettier-plugin-tailwindcss가 자동 정렬

### cn() 사용 예시

```tsx
import { cn } from '@/lib/utils';

function Component({ className, active }: { className?: string; active?: boolean }) {
  return <div className={cn('rounded-lg p-4', active && 'bg-blue-500', className)} />;
}
```
````

### cva() 사용 예시

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva('inline-flex items-center justify-center rounded-md font-medium', {
  variants: {
    variant: {
      default: 'bg-primary text-white',
      outline: 'border border-input bg-transparent',
    },
    size: {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 px-3 text-sm',
      lg: 'h-12 px-6 text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

type ButtonProps = React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

## 컴포넌트 패턴

- 함수 선언문 사용: `function Component()` (화살표 함수 X)
- Props는 인라인 타입 또는 별도 type으로 정의
- `export default` 대신 named export 선호 (페이지 파일 제외)
- 페이지 컴포넌트(`page.tsx`)만 `export default` 사용

## Prettier / ESLint

- printWidth: 120
- singleQuote: true
- trailingComma: all
- tabWidth: 2
- 커밋 시 Husky + lint-staged가 자동으로 린트/포매팅 실행

````

- [ ] **Step 4: file-structure.md 작성**

`.claude/rules/file-structure.md`:

```markdown
---
description: 파일 및 디렉토리 구조 규칙
globs: ["src/**/*"]
---

# 파일/디렉토리 구조 규칙

## 디렉토리 역할

| 디렉토리 | 역할 | 예시 |
|----------|------|------|
| `src/app/` | 라우팅, 페이지, 레이아웃 | `page.tsx`, `layout.tsx`, `loading.tsx` |
| `src/components/ui/` | 도메인 비종속 기본 UI | `Button.tsx`, `Input.tsx`, `Modal.tsx` |
| `src/components/common/` | 도메인 비종속 조합 컴포넌트 | `Header.tsx`, `Footer.tsx` |
| `src/components/{feature}/` | 특정 기능 전용 컴포넌트 | `components/resume/ResumeViewer.tsx` |
| `src/lib/` | 유틸리티, API 클라이언트 | `utils.ts`, `api.ts` |
| `src/hooks/` | 커스텀 훅 | `useAuth.ts`, `useResume.ts` |
| `src/types/` | 공유 타입 정의 | `resume.ts`, `job.ts` |
| `src/constants/` | 상수 값 | `routes.ts`, `config.ts` |

## 페이지 디렉토리 구조

````

src/app/
├── layout.tsx # 루트 레이아웃
├── page.tsx # 홈 (/)
├── globals.css # Tailwind 글로벌 스타일
└── {route}/
├── page.tsx # 페이지 컴포넌트
├── layout.tsx # 중첩 레이아웃 (필요 시)
├── loading.tsx # 로딩 UI (필요 시)
├── error.tsx # 에러 UI (필요 시)
└── \_components/ # 이 페이지 전용 컴포넌트

```

## 규칙
- 페이지 전용 컴포넌트는 해당 라우트의 `_components/` 디렉토리에 둔다.
- 2개 이상의 페이지에서 사용되는 컴포넌트는 `src/components/`로 이동한다.
- 하나의 파일에 하나의 컴포넌트만 export한다 (유틸 함수 제외).
- barrel export (`index.ts`)는 사용하지 않는다 — 직접 파일 경로로 import한다.
```

- [ ] **Step 5: 커밋**

```bash
git add .claude/rules/
git commit -m "chore: .claude/rules/ 프로젝트 규칙 파일 작성"
```

---

### Task 3: Agent Team 구성 (.claude/agents/)

**Files:**

- Create: `.claude/agents/planner.md`
- Create: `.claude/agents/frontend.md`
- Create: `.claude/agents/reviewer.md`

**Interfaces:**

- Consumes: CLAUDE.md (Task 1), Rules (Task 2)
- Produces: `Agent` 도구에서 `subagent_type`으로 호출 가능한 에이전트 정의

- [ ] **Step 1: .claude/agents/ 디렉토리 생성**

```bash
mkdir -p .claude/agents
```

- [ ] **Step 2: planner.md 작성**

`.claude/agents/planner.md`:

```markdown
---
model: opus
---

# Planner — 작업 설계 및 조율 에이전트

## 역할

작업을 분석하고 실행 가능한 단위로 분해하여 frontend 에이전트에게 배분한다. 직접 코드를 작성하지 않는다.

## 핵심 원칙

1. **조율 전용**: 코드 파일을 직접 생성하거나 수정하지 않는다. Edit, Write, NotebookEdit 도구를 사용하지 않는다.
2. **디렉토리 소유권 분리**: 각 작업에 대해 frontend 에이전트가 작업할 디렉토리를 명확히 지정한다. 두 에이전트가 같은 파일을 편집하는 일이 없도록 한다.
3. **의존성 순서**: 작업 간 의존성을 분석하고, 의존성이 없는 작업은 병렬 실행을 지시한다.

## 작업 흐름

### 입력

- 사용자의 기능 요구사항 또는 이슈 설명

### 프로세스

1. **분석**: 요구사항을 읽고 필요한 페이지, 컴포넌트, 유틸리티를 파악한다.
2. **분해**: 각 작업을 frontend 에이전트가 독립적으로 실행할 수 있는 단위로 분해한다.
3. **배분**: 각 작업에 대해 다음을 명시한다:
   - 생성/수정할 파일 경로
   - 구현할 인터페이스 (Props, 함수 시그니처)
   - 의존하는 다른 작업
   - 완료 기준
4. **검증 요청**: frontend 작업 완료 후 reviewer 에이전트에게 검증을 요청한다.

### 출력

- 구조화된 작업 목록 (TaskCreate 활용)
- 각 작업의 파일 소유권 맵

## 프로젝트 컨텍스트

- 이 프로젝트는 ResuFit (JD 맞춤 AI 이력서 분석 서비스)이다.
- Next.js 16 App Router + TypeScript + Tailwind CSS v4를 사용한다.
- `.claude/rules/`의 규칙을 반드시 준수하도록 작업을 설계한다.
- 경로 alias: `@/*` → `./src/*`
```

- [ ] **Step 3: frontend.md 작성**

`.claude/agents/frontend.md`:

````markdown
---
model: sonnet
---

# Frontend — UI 구현 에이전트

## 역할

planner가 배분한 작업을 기반으로 페이지, 컴포넌트, 스타일링을 구현한다.

## 핵심 원칙

1. **배분된 파일만 편집**: planner가 지정한 파일 경로만 생성/수정한다. 범위 밖의 파일은 건드리지 않는다.
2. **규칙 준수**: `.claude/rules/`의 모든 규칙을 따른다.
3. **서버 컴포넌트 우선**: 기본적으로 서버 컴포넌트로 작성하고, 클라이언트 기능이 필요할 때만 `'use client'`를 선언한다.
4. **React Compiler 활용**: `useMemo`, `useCallback`, `React.memo`를 수동으로 사용하지 않는다.

## 구현 패턴

### 컴포넌트 작성

```tsx
// 함수 선언문 + named export
import { cn } from '@/lib/utils';

type ComponentProps = {
  className?: string;
  children: React.ReactNode;
};

export function Component({ className, children }: ComponentProps) {
  return <div className={cn('base-classes', className)}>{children}</div>;
}
```
````

### 페이지 작성

```tsx
// page.tsx는 default export
export default function PageName() {
  return <main>{/* 페이지 내용 */}</main>;
}
```

### 스타일링

- Tailwind CSS v4 유틸리티 클래스 사용
- 조건부 클래스: `cn()` (`@/lib/utils`)
- 컴포넌트 variants: `cva()` (`class-variance-authority`)
- 반응형: Tailwind 브레이크포인트 (`sm:`, `md:`, `lg:`, `xl:`)

## 작업 완료 기준

- planner가 명시한 모든 파일이 생성/수정되었다.
- `pnpm build`가 에러 없이 통과한다.
- `pnpm lint`가 에러 없이 통과한다.
- 작업 완료 후 reviewer에게 검증을 요청한다.

## 프로젝트 컨텍스트

- ResuFit: JD 맞춤 AI 이력서 분석 서비스
- Next.js 16 App Router + TypeScript + Tailwind CSS v4
- 경로 alias: `@/*` → `./src/*`
- cn(): `@/lib/utils` (clsx + tailwind-merge)
- cva(): `class-variance-authority`

````

- [ ] **Step 4: reviewer.md 작성**

`.claude/agents/reviewer.md`:

```markdown
---
model: opus
---

# Reviewer — 코드 검증 에이전트

## 역할
frontend 에이전트가 구현한 코드를 검증한다. 코드 품질, UX, 접근성, 프로젝트 규칙 준수를 확인하고, 문제가 있으면 구체적인 수정 사항을 피드백한다.

## 핵심 원칙
1. **검증 전용**: 코드를 직접 수정하지 않는다. 문제를 발견하면 구체적인 수정 방법을 frontend에게 전달한다.
2. **규칙 기반 판단**: `.claude/rules/`의 규칙을 기준으로 판단한다. 개인적 선호가 아닌 프로젝트 규칙 위반만 지적한다.
3. **구체적 피드백**: "이 부분이 이상합니다"가 아니라 "파일 X의 Y 줄에서 Z 규칙을 위반했습니다. A로 변경하세요"로 피드백한다.

## 검증 체크리스트

### 1. 빌드 & 린트
- [ ] `pnpm build` 에러 없이 통과
- [ ] `pnpm lint` 에러 없이 통과

### 2. 아키텍처 (.claude/rules/architecture.md)
- [ ] App Router 패턴 준수 (page.tsx, layout.tsx 등)
- [ ] 서버/클라이언트 컴포넌트 분리 적절
- [ ] 불필요한 `'use client'` 없음
- [ ] `useMemo`/`useCallback`/`React.memo` 수동 사용 없음 (React Compiler)

### 3. 코딩 컨벤션 (.claude/rules/coding-conventions.md)
- [ ] 네이밍 규칙 준수 (PascalCase 컴포넌트, camelCase 훅/유틸)
- [ ] `@/` 경로 alias 사용
- [ ] cn() + cva() 패턴 올바르게 사용
- [ ] 함수 선언문 사용 (화살표 함수 X)
- [ ] named export 사용 (page.tsx 제외)

### 4. 파일 구조 (.claude/rules/file-structure.md)
- [ ] 파일이 올바른 디렉토리에 위치
- [ ] 페이지 전용 컴포넌트는 `_components/`에 위치
- [ ] barrel export 사용 없음

### 5. 접근성 (a11y)
- [ ] 시맨틱 HTML 사용 (div 남용 없음)
- [ ] 이미지에 alt 속성
- [ ] 버튼/링크에 접근 가능한 텍스트
- [ ] 폼 요소에 label 연결
- [ ] 키보드 내비게이션 가능

### 6. UX
- [ ] 로딩 상태 처리
- [ ] 에러 상태 처리
- [ ] 빈 상태 처리
- [ ] 반응형 레이아웃

## 판정

### PASS
모든 체크리스트 항목을 통과하면 PASS를 선언한다.

### FAIL
하나 이상의 항목이 실패하면 FAIL과 함께 구체적인 수정 사항 목록을 반환한다.
각 수정 사항에는 파일 경로, 문제 설명, 수정 방법을 포함한다.

## 프로젝트 컨텍스트
- ResuFit: JD 맞춤 AI 이력서 분석 서비스
- Next.js 16 App Router + TypeScript + Tailwind CSS v4
- `.claude/rules/` 디렉토리의 규칙이 판단 기준
````

- [ ] **Step 5: 커밋**

```bash
git add .claude/agents/
git commit -m "chore: .claude/agents/ 에이전트 팀 구성 (planner, frontend, reviewer)"
```

---

### Task 4: Skills 작성 (.claude/skills/)

**Files:**

- Create: `.claude/skills/create-page/SKILL.md`
- Create: `.claude/skills/create-component/SKILL.md`

**Interfaces:**

- Consumes: Rules (Task 2), Agent definitions (Task 3)
- Produces: `/create-page`, `/create-component` 스킬로 호출 가능한 자동화 템플릿

- [ ] **Step 1: .claude/skills/ 디렉토리 생성**

```bash
mkdir -p .claude/skills/create-page
mkdir -p .claude/skills/create-component
```

- [ ] **Step 2: create-page SKILL.md 작성**

`.claude/skills/create-page/SKILL.md`:

````markdown
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
````

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

````

- [ ] **Step 3: create-component SKILL.md 작성**

`.claude/skills/create-component/SKILL.md`:

```markdown
---
name: create-component
description: React 컴포넌트를 생성합니다. 컴포넌트 타입(ui/common/feature)과 이름을 인자로 받아 Tailwind + cn() + cva() 패턴의 컴포넌트를 scaffolding합니다. 사용 시: "/create-component {type} {name}" (예: "/create-component ui Button")
---

# Create Component

React 컴포넌트를 생성하는 스킬입니다.

## 입력

인자 형식: `{type} {ComponentName}`
- `type`: `ui` | `common` | `{feature}` (예: `resume`, `job`)
- `ComponentName`: PascalCase 컴포넌트 이름

## 실행 절차

1. **인자 파싱**: type과 ComponentName을 추출한다.
2. **경로 결정**:
   - `ui` → `src/components/ui/{ComponentName}.tsx`
   - `common` → `src/components/common/{ComponentName}.tsx`
   - `{feature}` → `src/components/{feature}/{ComponentName}.tsx`
3. **컴포넌트 파일 생성**: 아래 템플릿으로 생성한다.
4. **린트 확인**: `pnpm lint`를 실행하여 에러가 없는지 확인한다.

## 기본 컴포넌트 템플릿

```tsx
import { cn } from '@/lib/utils';

type {ComponentName}Props = {
  className?: string;
  children?: React.ReactNode;
};

export function {ComponentName}({ className, children }: {ComponentName}Props) {
  return <div className={cn('', className)}>{children}</div>;
}
````

## Variants 컴포넌트 템플릿 (사용자가 variants를 요청한 경우)

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const {componentName}Variants = cva('', {
  variants: {
    variant: {
      default: '',
    },
    size: {
      default: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

type {ComponentName}Props = React.ComponentProps<'div'> & VariantProps<typeof {componentName}Variants>;

export function {ComponentName}({ className, variant, size, ...props }: {ComponentName}Props) {
  return <div className={cn({componentName}Variants({ variant, size }), className)} {...props} />;
}
```

## 규칙

- `.claude/rules/coding-conventions.md`의 컴포넌트 패턴을 따른다.
- 함수 선언문 사용 (`function Component()`, 화살표 함수 X)
- named export 사용 (`export function`, `export default` X)
- `@/` 경로 alias로 import
- Tailwind 클래스만 사용 (인라인 스타일, CSS 모듈 X)

````

- [ ] **Step 4: 커밋**

```bash
git add .claude/skills/
git commit -m "chore: .claude/skills/ 페이지/컴포넌트 생성 스킬 작성"
````

---

### Task 5: 통합 검증

**Files:**

- 검증 대상: Task 1~4에서 생성한 모든 파일

**Interfaces:**

- Consumes: 모든 이전 Task의 산출물

- [ ] **Step 1: 전체 파일 구조 확인**

```bash
find .claude -type f | sort
```

Expected output:

```
.claude/agents/frontend.md
.claude/agents/planner.md
.claude/agents/reviewer.md
.claude/rules/architecture.md
.claude/rules/coding-conventions.md
.claude/rules/file-structure.md
.claude/skills/create-component/SKILL.md
.claude/skills/create-page/SKILL.md
```

- [ ] **Step 2: CLAUDE.md 내용 확인**

CLAUDE.md가 프로젝트 개요, 기술 스택, 디렉토리 구조, 컨벤션을 모두 포함하고 있는지 확인한다.

- [ ] **Step 3: 빌드 검증**

```bash
pnpm build
```

Expected: 빌드 성공 (하네스 파일은 빌드에 영향 없음)

- [ ] **Step 4: 린트 검증**

```bash
pnpm lint
```

Expected: 에러 없음

- [ ] **Step 5: Prettier 검증**

```bash
pnpm format:check
```

Expected: 포매팅 이슈 없음. 있으면 `pnpm format` 실행 후 재커밋.

- [ ] **Step 6: 최종 커밋 (필요 시)**

포매팅 수정이 있었다면:

```bash
git add -A
git commit -m "chore: 하네스 파일 포매팅 수정"
```
