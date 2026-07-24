# AI 에이전트 하네스 구성 가이드

## 목차

1. [하네스란 무엇인가](#1-하네스란-무엇인가)
2. [왜 하네스가 필요한가](#2-왜-하네스가-필요한가)
3. [전체 구조](#3-전체-구조)
4. [각 구성요소 상세](#4-각-구성요소-상세)
   - [CLAUDE.md](#41-claudemd--진입점)
   - [Rules](#42-rules--자동-적용-규칙)
   - [Agents](#43-agents--에이전트-팀)
   - [Skills](#44-skills--자동화-스킬)
5. [동작 원리](#5-동작-원리)
6. [의사결정 근거](#6-의사결정-근거)
7. [실제 사용법](#7-실제-사용법)

---

## 1. 하네스란 무엇인가

하네스(Harness)는 AI 코딩 에이전트(Claude Code)가 프로젝트의 맥락, 규칙, 컨벤션을 이해하고 일관된 코드를 생성할 수 있도록 구성하는 **프로젝트 수준의 AI 설정 체계**입니다.

사람이 팀에 합류하면 온보딩 문서를 읽고 코드 컨벤션을 익히듯이, AI 에이전트도 프로젝트 맥락을 이해해야 일관된 코드를 생성할 수 있습니다. 하네스는 이 온보딩 과정을 자동화합니다.

### 하네스 없이 작업하면?

```
사용자: "버튼 컴포넌트 만들어줘"
AI: (프로젝트 컨벤션을 모르니까)
    - 화살표 함수? 함수 선언문?
    - export default? named export?
    - CSS Modules? Tailwind? styled-components?
    - 매번 다른 스타일로 생성 → 일관성 붕괴
```

### 하네스를 구성하면?

```
사용자: "버튼 컴포넌트 만들어줘"
AI: (CLAUDE.md + rules를 자동으로 읽고)
    - 함수 선언문 + named export
    - Tailwind + cn() + cva() 패턴
    - src/components/ui/Button.tsx에 생성
    - 항상 동일한 패턴으로 생성
```

---

## 2. 왜 하네스가 필요한가

### 2.1 일관성 문제

AI 에이전트는 매 대화마다 컨텍스트가 초기화됩니다. 어제 "함수 선언문을 쓰세요"라고 말해도 오늘 새 세션에서는 기억하지 못합니다. 하네스는 이 문제를 **파일 기반**으로 해결합니다.

### 2.2 도메인 맥락

ResuFit은 "핏(Fit)", "갭(Gap)", "어노테이션(Annotation)" 같은 도메인 용어를 사용합니다. 하네스 없이는 AI가 이 용어를 모르니 매번 설명해야 합니다.

### 2.3 협업 확장

팀원이 여러 명이면 각자 AI에게 다른 방식으로 지시합니다. 하네스는 `.claude/` 디렉토리에 체크인되어 **모든 팀원의 AI가 동일한 규칙**을 따르게 합니다.

### 2.4 품질 게이트

Generate-Validate 패턴으로 에이전트 팀을 구성하면, 구현 에이전트가 만든 코드를 검증 에이전트가 자동으로 리뷰합니다. 사람이 직접 모든 코드를 리뷰하는 부담을 줄입니다.

---

## 3. 전체 구조

```
프로젝트 루트/
├── CLAUDE.md                          ← AI가 가장 먼저 읽는 진입점
├── AGENTS.md                          ← Next.js 16 주의사항
└── .claude/
    ├── agents/                        ← 에이전트 팀 정의
    │   ├── planner.md                 ← 작업 설계/조율 (Opus)
    │   ├── frontend.md                ← UI 구현 (Sonnet)
    │   └── reviewer.md                ← 코드 검증 (Opus)
    ├── rules/                         ← 자동 적용 규칙
    │   ├── architecture.md            ← App Router, 서버/클라이언트 컴포넌트
    │   ├── coding-conventions.md      ← 네이밍, 스타일링 패턴
    │   └── file-structure.md          ← 디렉토리 구조 규칙
    └── skills/                        ← 반복 작업 자동화
        ├── create-page/SKILL.md       ← 페이지 생성 스킬
        └── create-component/SKILL.md  ← 컴포넌트 생성 스킬
```

### 데이터 흐름

```
새 Claude Code 세션 시작
        │
        ▼
  ① CLAUDE.md 자동 로드
     → 프로젝트 개요, 기술 스택, 컨벤션 파악
        │
        ▼
  ② 사용자가 파일 작업 요청
     → .claude/rules/ 중 globs 매칭되는 규칙 자동 로드
     → 예: src/app/page.tsx 작업 시 architecture.md + coding-conventions.md 활성화
        │
        ▼
  ③ 스킬 호출 시 (선택)
     → /create-page, /create-component 등 템플릿 기반 생성
        │
        ▼
  ④ 에이전트 팀 활용 시 (선택)
     → planner → frontend → reviewer 파이프라인 실행
```

---

## 4. 각 구성요소 상세

### 4.1 CLAUDE.md — 진입점

**파일 위치:** 프로젝트 루트 `/CLAUDE.md`

**동작 원리:** Claude Code는 세션 시작 시 **자동으로** 프로젝트 루트의 `CLAUDE.md`를 읽습니다. 별도의 설정이나 명령 없이, 파일이 존재하기만 하면 됩니다.

**포함 내용:**

| 섹션              | 역할                        | 왜 필요한가                           |
| ----------------- | --------------------------- | ------------------------------------- |
| `@AGENTS.md` 참조 | Next.js 16 주의사항 로드    | 학습 데이터와 다른 API 사용 방지      |
| 프로젝트 개요     | 서비스 설명, 핵심 가치      | AI가 "왜"를 이해해야 적절한 코드 생성 |
| 도메인 용어       | JD, 핏, 갭, 어노테이션      | 변수명/주석에서 일관된 용어 사용      |
| 기술 스택         | 프레임워크, 라이브러리 버전 | 잘못된 API 사용 방지                  |
| 주요 명령어       | pnpm dev, build, lint 등    | 빌드/검증 시 올바른 명령어 사용       |
| 디렉토리 구조     | 각 디렉토리의 역할          | 파일을 올바른 위치에 생성             |
| 컨벤션            | 브랜치, 커밋, 네이밍 규칙   | Git 작업 시 팀 컨벤션 준수            |

**`@AGENTS.md` 문법:**

```markdown
@AGENTS.md
```

이 문법은 Claude Code의 파일 참조 기능입니다. `CLAUDE.md`에 `@파일명`을 적으면 해당 파일의 내용도 함께 로드됩니다. `AGENTS.md`는 Next.js 16이 학습 데이터와 다를 수 있다는 경고를 담고 있으며, Next.js가 자동 생성한 파일입니다.

---

### 4.2 Rules — 자동 적용 규칙

**파일 위치:** `.claude/rules/*.md`

**동작 원리:** 각 규칙 파일에는 YAML frontmatter에 `globs` 패턴이 정의되어 있습니다. 사용자가 특정 파일을 작업할 때, 해당 파일 경로가 globs 패턴과 매칭되면 **자동으로 규칙이 로드**됩니다.

```yaml
---
description: App Router 아키텍처 규칙
globs: ['src/**/*.ts', 'src/**/*.tsx']
---
```

위 예시에서 `src/` 하위의 `.ts`, `.tsx` 파일을 다룰 때 이 규칙이 자동 활성화됩니다.

#### architecture.md

**목적:** App Router 아키텍처와 서버/클라이언트 컴포넌트 분리 규칙

**핵심 규칙과 근거:**

| 규칙                                          | 근거                                                                                                  |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Pages Router 금지, App Router만 사용          | Next.js 16의 권장 방식. 두 라우터를 혼용하면 복잡성 증가                                              |
| 서버 컴포넌트가 기본                          | App Router에서 모든 컴포넌트는 기본적으로 서버 컴포넌트. 클라이언트가 필요할 때만 `'use client'` 선언 |
| useMemo/useCallback/React.memo 수동 사용 금지 | React Compiler가 활성화되어 있으므로 (`next.config.ts`의 `reactCompiler: true`) 자동 최적화됨         |
| 서버에서 async/await으로 직접 fetch           | 서버 컴포넌트는 async 함수로 만들 수 있어 별도 상태 관리 없이 데이터 페칭 가능                        |

**서버 vs 클라이언트 컴포넌트 판단 기준:**

```
이 컴포넌트에 useState, useEffect, onClick, 브라우저 API가 있는가?
├── Yes → 'use client' 선언 (클라이언트 컴포넌트)
└── No  → 그냥 둔다 (서버 컴포넌트)
```

#### coding-conventions.md

**목적:** 네이밍, 스타일링, 컴포넌트 패턴 통일

**핵심 규칙과 근거:**

| 규칙                                      | 근거                                                                                      |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| 함수 선언문 사용 (`function Component()`) | 호이스팅으로 파일 내 순서 무관. 에러 스택에서 이름 명확                                   |
| named export 사용 (page.tsx 제외)         | import 시 이름 고정 → 검색/리팩토링 안전. page.tsx는 Next.js가 `export default` 요구      |
| `cn()` 함수 사용                          | `clsx`(조건부 클래스) + `tailwind-merge`(충돌 해결) 조합. Tailwind 프로젝트의 사실상 표준 |
| `cva()` 사용                              | 컴포넌트 variants(크기, 색상 등)를 타입 안전하게 정의. shadcn/ui와 동일 패턴              |
| `@/` 경로 alias                           | `../../../components/Button` 같은 상대 경로 대신 `@/components/Button`으로 가독성 향상    |

**cn() 동작 원리:**

```tsx
import { cn } from '@/lib/utils';

// cn()은 내부적으로 clsx() → twMerge() 순서로 실행
cn('p-4 bg-red-500', isActive && 'bg-blue-500', className);

// 1단계: clsx() — 조건부 클래스 조합
//   isActive가 true면  → 'p-4 bg-red-500 bg-blue-500 ...'
//   isActive가 false면 → 'p-4 bg-red-500 ...'

// 2단계: twMerge() — Tailwind 클래스 충돌 해결
//   'bg-red-500 bg-blue-500' → 'bg-blue-500' (뒤의 것이 우선)
```

**cva() 동작 원리:**

```tsx
import { cva } from 'class-variance-authority';

// cva()는 variants를 정의하고, 호출 시 해당 variant의 클래스를 반환
const buttonVariants = cva(
  'rounded-md font-medium', // 기본 클래스 (항상 적용)
  {
    variants: {
      variant: {
        default: 'bg-primary text-white',
        outline: 'border bg-transparent',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3 text-sm',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

// 사용: buttonVariants({ variant: 'outline', size: 'sm' })
// 결과: 'rounded-md font-medium border bg-transparent h-8 px-3 text-sm'
```

#### file-structure.md

**목적:** 파일을 올바른 위치에 생성하도록 안내

**핵심 규칙과 근거:**

| 규칙                                                  | 근거                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 페이지 전용 컴포넌트는 `_components/`에               | `_` 접두사는 App Router에서 라우트로 인식하지 않음. 해당 페이지에서만 쓰는 컴포넌트를 가까이 배치 |
| 2개 이상 페이지에서 사용되면 `src/components/`로 이동 | 공유 컴포넌트는 한 곳에서 관리해야 수정 시 누락 방지                                              |
| barrel export (`index.ts`) 금지                       | 트리 쉐이킹 방해, 순환 참조 위험, 번들 크기 증가. 직접 경로 import가 더 명확                      |

---

### 4.3 Agents — 에이전트 팀

**파일 위치:** `.claude/agents/*.md`

**동작 원리:** 각 에이전트 파일은 YAML frontmatter에 `model` 필드가 있으며, Claude Code의 `Agent` 도구에서 `subagent_type`으로 호출할 수 있습니다. 에이전트는 독립된 컨텍스트에서 실행되어 메인 세션의 컨텍스트를 오염시키지 않습니다.

#### Generate-Validate 패턴

우리 에이전트 팀은 **Generate-Validate 패턴**을 따릅니다:

```
planner (설계)
    │
    │  작업 분해 + 파일 소유권 배분
    ▼
frontend (Generate — 생성)
    │
    │  코드 구현
    ▼
reviewer (Validate — 검증)
    │
    ├── PASS → 작업 완료
    └── FAIL → frontend에게 구체적 수정 사항 전달 → frontend가 수정 → 다시 reviewer
```

이 패턴을 선택한 이유:

1. **에러 누적 방지**: 구현 직후 바로 검증하여 잘못된 코드가 쌓이는 것을 방지
2. **역할 분리**: 구현자와 검증자가 분리되면 "자기 코드는 맞다"는 편향을 제거
3. **안정성**: Agent Teams(실험 기능)과 달리 서브에이전트 방식은 안정적으로 동작

#### 에이전트별 상세

**planner.md (Opus)**

```yaml
model: opus # 가장 강력한 모델 — 설계와 판단에 필요
```

- 역할: 작업 분해, 디렉토리 소유권 배분, 의존성 분석
- 제약: **코드를 직접 작성하지 않음** (Edit, Write 도구 사용 금지)
- 왜 코드를 안 쓰나: 조율자가 직접 구현하면 역할 경계가 모호해지고, 소유권 충돌 발생

**frontend.md (Sonnet)**

```yaml
model: sonnet # 구현에 충분한 성능, Opus보다 빠르고 저렴
```

- 역할: 페이지, 컴포넌트, 스타일링 구현
- 제약: planner가 지정한 파일만 편집
- 왜 Sonnet인가: 구현 작업은 명확한 스펙이 주어지면 Sonnet으로 충분. 비용 효율적

**reviewer.md (Opus)**

```yaml
model: opus # 코드 리뷰는 판단력이 필요 → 가장 강력한 모델
```

- 역할: `.claude/rules/` 기반 검증, 접근성/UX 체크
- 제약: **코드를 직접 수정하지 않음** — 구체적 피드백만 전달
- 왜 수정 안 하나: 검증자가 직접 고치면 "고친 코드"에 대한 2차 검증이 필요해짐. 역할 분리 유지
- 체크리스트: 빌드/린트, 아키텍처, 코딩 컨벤션, 파일 구조, 접근성(a11y), UX — 총 6개 카테고리

#### 모델 선택 근거

| 역할     | 모델   | 이유                                                   |
| -------- | ------ | ------------------------------------------------------ |
| planner  | Opus   | 작업 분해는 높은 추론 능력 필요                        |
| frontend | Sonnet | 명확한 스펙의 구현 작업. 빠르고 비용 효율적            |
| reviewer | Opus   | 코드 리뷰는 미묘한 판단 필요 (보안, 접근성, 패턴 위반) |

#### 디렉토리 소유권 분리

에이전트 팀의 핵심 운영 규칙은 **두 에이전트가 같은 파일을 편집하지 않는 것**입니다:

```
planner가 배분하는 예시:

"이력서 분석 결과 페이지 구현"
├── frontend 에이전트 A의 소유:
│   ├── src/app/result/page.tsx
│   ├── src/app/result/loading.tsx
│   └── src/app/result/_components/ResultHeader.tsx
│
└── frontend 에이전트 B의 소유 (병렬 작업 시):
    ├── src/components/resume/ResumeViewer.tsx
    └── src/components/resume/AnnotationOverlay.tsx
```

이렇게 파일 소유권을 분리하면 병렬 작업 시에도 Git 충돌이 발생하지 않습니다.

---

### 4.4 Skills — 자동화 스킬

**파일 위치:** `.claude/skills/{name}/SKILL.md`

**동작 원리:** 스킬은 YAML frontmatter의 `name`과 `description`으로 정의됩니다. 사용자가 `/create-page resume/upload`처럼 호출하면, Claude Code가 `description`을 매칭하여 해당 스킬의 내용을 로드하고 지시를 따릅니다.

```yaml
---
name: create-page
description: Next.js App Router 페이지를 생성합니다. 사용 시: "/create-page {route}"
---
```

`description`이 중요합니다 — Claude Code는 이 텍스트를 보고 어떤 스킬을 실행할지 판단합니다.

#### create-page

**용도:** App Router 페이지를 템플릿 기반으로 빠르게 생성

```
/create-page resume/upload
      │
      ▼
  1. 라우트 파싱: resume/upload
  2. 디렉토리 생성: src/app/resume/upload/
  3. page.tsx 생성 (export default function UploadPage)
  4. 요청 시: layout.tsx, loading.tsx, error.tsx도 생성
  5. pnpm lint 실행
```

**왜 스킬로 만들었나:** 페이지 생성은 반복 작업입니다. 매번 "page.tsx 만들어줘, export default로, 함수 선언문으로..."라고 지시하는 대신, 한 번의 명령으로 규칙을 준수한 파일을 생성합니다.

#### create-component

**용도:** 컴포넌트를 타입별로 올바른 위치에 생성

```
/create-component ui Button
      │
      ▼
  1. 타입 파싱: ui → src/components/ui/
  2. Button.tsx 생성 (cn() 패턴)
  3. variants 요청 시: cva() 패턴 적용
  4. pnpm lint 실행
```

**타입별 경로 매핑:**

| 타입        | 경로                        | 용도                                   |
| ----------- | --------------------------- | -------------------------------------- |
| `ui`        | `src/components/ui/`        | Button, Input 같은 기본 UI             |
| `common`    | `src/components/common/`    | Header, Footer 같은 공통 조합 컴포넌트 |
| `{feature}` | `src/components/{feature}/` | resume, job 같은 도메인 전용           |

---

## 5. 동작 원리

### 5.1 Claude Code가 파일을 읽는 순서

```
세션 시작
    │
    ├─① CLAUDE.md (항상, 자동)
    │   └─ @AGENTS.md (CLAUDE.md가 참조하므로 함께 로드)
    │
    ├─② .claude/rules/*.md (파일 작업 시, globs 매칭으로 자동)
    │   └─ 예: src/app/page.tsx 편집 → architecture.md + coding-conventions.md 활성화
    │
    ├─③ .claude/skills/*/SKILL.md (스킬 호출 시, 수동)
    │   └─ 예: /create-page 입력 → create-page/SKILL.md 로드
    │
    └─④ .claude/agents/*.md (에이전트 호출 시, 수동)
        └─ 예: Agent(subagent_type="frontend") → frontend.md 로드
```

### 5.2 Rules의 globs 매칭

Rules는 파일 경로 패턴으로 활성화됩니다:

```
사용자: "src/components/ui/Button.tsx 수정해줘"
    │
    ▼
Claude Code가 .claude/rules/ 스캔:
    ├── architecture.md      → globs: ["src/**/*.ts", "src/**/*.tsx"] → 매칭!
    ├── coding-conventions.md → globs: ["src/**/*.ts", "src/**/*.tsx"] → 매칭!
    └── file-structure.md    → globs: ["src/**/*"]                    → 매칭!
    │
    ▼
3개 규칙 모두 활성화 → AI가 규칙을 참고하여 코드 생성
```

### 5.3 에이전트 서브프로세스

에이전트는 메인 세션과 **별도의 컨텍스트**에서 실행됩니다:

```
메인 세션 (사용자와 대화)
    │
    │ Agent(subagent_type="frontend", prompt="...")
    │
    ├──▶ [서브프로세스] frontend 에이전트
    │    ├── CLAUDE.md 로드
    │    ├── .claude/rules/ 로드
    │    ├── frontend.md의 지시사항 따름
    │    ├── 코드 작성, 테스트, 커밋
    │    └── 결과 반환 ──▶ 메인 세션으로
    │
    ▼
메인 세션이 결과를 받아서 다음 단계 진행
```

**핵심:** 서브에이전트의 작업 내용(파일 탐색, 시행착오 등)이 메인 세션의 컨텍스트를 차지하지 않습니다. 메인 세션은 결과 요약만 받으므로 컨텍스트 창을 효율적으로 사용합니다.

---

## 6. 의사결정 근거

### 6.1 왜 Generate-Validate 패턴인가?

검토한 패턴들:

| 패턴                  | 설명                    | 채택 여부 | 이유                                                |
| --------------------- | ----------------------- | --------- | --------------------------------------------------- |
| **Generate-Validate** | 생성 → 검증 파이프라인  | **채택**  | 가장 안정적, 프론트엔드 작업에 적합                 |
| Fan-Out/Fan-In        | 병렬 생성 → 결과 합산   | 미채택    | UI 컴포넌트는 상호 의존성이 높아 병렬 구현이 어려움 |
| Agent Teams           | 실시간 에이전트 간 통신 | 미채택    | 실험적 기능, 안정성 부족                            |
| 단일 에이전트         | 하나의 AI가 모두 처리   | 미채택    | 큰 작업에서 컨텍스트 오염, 자기 검증 한계           |

### 6.2 왜 3개 에이전트인가?

**planner가 필요한 이유:**

- 없으면 frontend가 작업 범위를 스스로 결정해야 함 → 과도하거나 부족한 구현
- 디렉토리 소유권 배분 없이 복수 에이전트 실행 시 파일 충돌

**reviewer가 필요한 이유:**

- frontend가 자기 코드를 자기가 리뷰하면 편향 발생
- 별도 검증자가 `.claude/rules/` 기준으로 객관적 판단

**왜 더 많지 않은가:**

- 3개면 충분. 에이전트가 많을수록 조율 비용 증가
- 필요하면 나중에 `backend`, `test` 에이전트 추가 가능

### 6.3 왜 함수 선언문 + named export인가?

**함수 선언문 선택 이유:**

```tsx
// 함수 선언문 — 호이스팅됨, 에러 스택에서 이름 명확
function Button() { ... }

// 화살표 함수 — 선언 전 참조 불가, 디버깅 시 이름 추론 의존
const Button = () => { ... }
```

**named export 선택 이유:**

```tsx
// named export — import 이름 고정, grep으로 사용처 추적 가능
export function Button() { ... }
import { Button } from './Button';

// default export — 아무 이름 가능, 추적 어려움
export default function Button() { ... }
import Whatever from './Button';  // 이것도 동작함
```

page.tsx만 `export default`를 쓰는 이유는 Next.js App Router가 이를 요구하기 때문입니다.

### 6.4 왜 barrel export를 금지하는가?

```tsx
// barrel export (index.ts) — 금지한 패턴
export { Button } from './Button';
export { Input } from './Input';
export { Modal } from './Modal';

// 문제점:
// 1. import { Button } from '@/components/ui' 하면
//    Input, Modal도 번들에 포함될 수 있음 (트리 쉐이킹 실패)
// 2. 순환 참조 위험 (A → index → B → index → A)
// 3. 파일을 어디서 찾아야 하는지 불명확

// 직접 import — 권장 패턴
import { Button } from '@/components/ui/Button';
// 어떤 파일에서 오는지 명확, 트리 쉐이킹 안전
```

### 6.5 왜 Rules를 3개로 분리했는가?

하나의 큰 규칙 파일 대신 3개로 분리한 이유:

1. **globs 범위 차별화**: `file-structure.md`는 `src/**/*` (모든 파일), 나머지는 `src/**/*.ts(x)` (코드 파일만)
2. **관심사 분리**: 아키텍처, 코딩 스타일, 파일 구조는 독립적인 관심사
3. **유지보수**: 특정 규칙만 수정할 때 다른 규칙에 영향 없음

---

## 7. 실제 사용법

### 7.1 기본 사용 (규칙 자동 적용)

별도의 명령 없이 평소처럼 작업하면 됩니다:

```
사용자: "로그인 폼 컴포넌트 만들어줘"

→ AI가 CLAUDE.md + rules를 읽고:
  - src/components/auth/LoginForm.tsx에 생성 (file-structure 규칙)
  - function LoginForm() 사용 (coding-conventions 규칙)
  - cn() + Tailwind 패턴 (coding-conventions 규칙)
  - 서버 컴포넌트로 시작, 필요시 'use client' (architecture 규칙)
```

### 7.2 스킬 사용

```bash
# 페이지 생성
/create-page resume/upload
# → src/app/resume/upload/page.tsx 생성

# 컴포넌트 생성
/create-component ui Button
# → src/components/ui/Button.tsx 생성 (cn 패턴)

/create-component resume ResumeViewer
# → src/components/resume/ResumeViewer.tsx 생성
```

### 7.3 에이전트 팀 사용 (큰 기능)

큰 기능을 구현할 때 planner에게 먼저 설계를 요청합니다:

```
사용자: "이력서 분석 결과 페이지를 구현해야 해.
        planner에게 작업을 분해해달라고 해줘"

→ planner 에이전트가:
  1. 필요한 페이지/컴포넌트 파악
  2. 파일 소유권 배분
  3. 구현 순서 결정

→ frontend 에이전트가:
  1. planner의 설계대로 구현
  2. 빌드/린트 확인

→ reviewer 에이전트가:
  1. 6개 카테고리 체크리스트로 검증
  2. PASS 또는 구체적 수정사항 피드백
```
