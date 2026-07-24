# Storybook 세팅 의사결정 기록

> 이슈 #25 작업 과정에서 내린 기술적 의사결정과 그 근거를 기록한다.

---

## 1. 왜 이 작업을 시작했는가

이슈 #26~#31에서 공통 컴포넌트(Button, Input, Badge 등 약 20개)를 구현할 예정이다. 이 컴포넌트들은 각각 여러 variant와 state 조합을 가진다. 예를 들어 Button만 해도 `variant(4) × size(3) × disabled × loading` 조합이 24가지가 넘는다.

이 조합들을 매번 페이지에 붙여보면서 검증하기엔 비효율적이고, 팀원 간 공유도 어렵다. 컴포넌트를 독립적으로 렌더링하고, 모든 조합을 한눈에 확인할 수 있는 환경이 필요했다.

| 방법                 | 설명                                                | 문제                                                                 |
| -------------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| 페이지에서 직접 확인 | 컴포넌트를 사용하는 페이지를 띄워서 눈으로 확인     | variant별로 일일이 props를 바꿔야 함. 페이지가 없으면 확인 자체 불가 |
| 임시 테스트 페이지   | `/test/buttons` 같은 페이지에 모든 조합을 나열      | 관리 포인트 증가. 커밋에 포함되면 안 되는 코드                       |
| **Storybook**        | 컴포넌트별 독립 렌더링 + Controls 패널로 props 조작 | 초기 세팅 비용이 있지만, 컴포넌트 수가 늘어날수록 압도적으로 효율적  |

Storybook을 선택한 핵심 이유:

1. **컴포넌트 단독 렌더링** — 페이지 없이도 모든 variant/state를 확인 가능
2. **Controls 패널** — props를 UI에서 실시간 조작 (variant 드롭다운, size 토글 등)
3. **팀 공유** — Chromatic 배포로 비개발자(디자이너)도 브라우저에서 바로 확인
4. **Figma 디자인 대조** — 구현 결과를 Figma 시안과 1:1 비교하는 단일 채널

---

## 2. 의사결정 목록

### 2-1. `@storybook/nextjs-vite` 선택 (Webpack 버전 제외)

**결정:** Vite 기반 `@storybook/nextjs-vite`를 사용한다. Webpack 기반 `@storybook/nextjs`는 사용하지 않는다.

**근거:**

Storybook 10.5 공식 문서에서 대부분의 Next.js 프로젝트에 Vite 기반을 권장한다:

> "We recommend using `@storybook/nextjs-vite` for most Next.js projects"
> — Storybook 공식 문서

두 버전의 차이:

| 항목               | `@storybook/nextjs` (Webpack)     | `@storybook/nextjs-vite` (Vite) |
| ------------------ | --------------------------------- | ------------------------------- |
| 빌드 속도          | 느림 (Webpack 5)                  | 빠름 (Vite ESM)                 |
| path alias (`@/*`) | `webpackFinal`에서 수동 설정 필요 | tsconfig.json에서 자동 인식     |
| PostCSS / Tailwind | 수동 설정 가능성                  | 자동 처리                       |
| `next/font/local`  | `staticDirs` 수동 매핑 필요       | 자동 경로 매핑                  |
| 설정 복잡도        | Babel/Webpack 커스터마이징 필요   | 대부분 zero-config              |
| 테스트 지원        | 기본                              | Vitest 통합 우수                |

Vite 버전은 우리 프로젝트의 세 가지 핵심 요구사항을 자동으로 해결한다:

- `@/*` alias → tsconfig.json의 `paths` 설정 자동 인식
- Tailwind v4 → `postcss.config.mjs`의 `@tailwindcss/postcss` 자동 적용
- Pretendard 폰트 → `staticDirs` 설정으로 `public/fonts/` 접근

**검토했던 대안:**

Webpack 기반은 커스텀 Babel/Webpack 설정이 필요한 레거시 프로젝트에만 적합하다. ResuFit은 Turbopack(개발) + Next.js 16의 최신 스택을 사용하므로 Vite 기반이 자연스럽다.

---

### 2-2. `staticDirs: ['../public']` 설정

**결정:** `.storybook/main.ts`에 `staticDirs: ['../public']`을 명시한다.

**근거:**

Pretendard 폰트를 로딩하는 방식 때문이다. `globals.css`에서 `@font-face`로 직접 선언한다:

```css
@font-face {
  font-family: 'Pretendard Variable';
  src: url('/fonts/PretendardVariable.woff2') format('woff2-variations');
}
```

이 경로 `/fonts/PretendardVariable.woff2`는 루트 상대 경로다. Next.js에서는 `public/` 디렉토리가 루트(`/`)에 매핑되므로 자동으로 동작하지만, Storybook의 Vite 개발 서버는 Next.js와 다른 루트를 사용한다.

```
Next.js:    / → public/    → /fonts/Pretendard... → ✅ 파일 존재
Storybook:  / → .storybook/ → /fonts/Pretendard... → ❌ 404
```

`staticDirs: ['../public']`을 설정하면 Storybook이 `public/` 디렉토리를 정적 파일 루트로 서빙한다:

```
Storybook:  / → ../public/  → /fonts/Pretendard... → ✅ 파일 존재
```

**참고:** Vite 기반은 `next/font/local`로 로딩하는 경우 자동 매핑하지만, 우리는 CSS `@font-face`로 직접 로딩하므로 `staticDirs` 설정이 필요하다.

---

### 2-3. `preview.tsx`에서 `globals.css` import

**결정:** `.storybook/preview.tsx`에서 `import '../src/app/globals.css'`를 선언한다.

**근거:**

`globals.css`는 세 가지 역할을 동시에 한다:

```css
@import 'tailwindcss';              /* 1. Tailwind v4 유틸리티 클래스 활성화 */

@font-face { ... }                   /* 2. Pretendard 폰트 로딩 */

@theme {
  --color-primary-50: #256ef4;       /* 3. 디자인 토큰 (색상, 타이포, radius) */
  --text-heading-md: 24px;
  --radius-lg: 10px;
  ...
}
```

이 파일을 import하지 않으면 Storybook에서 컴포넌트가 렌더링될 때:

- Tailwind 클래스(`bg-primary-50`, `rounded-lg` 등)가 적용되지 않음
- Pretendard 폰트 대신 시스템 폰트로 렌더링됨
- `@theme`에서 정의한 커스텀 CSS 변수가 존재하지 않아 `cva()`의 variant 스타일이 깨짐

`preview.tsx`에서 import하면 **모든 스토리에 전역으로 적용**된다. 각 스토리 파일에서 개별 import할 필요가 없다.

**동작 흐름:**

```
Storybook 기동
  ↓
preview.tsx 실행
  ↓
globals.css import
  ↓
Tailwind v4 처리 (@import 'tailwindcss' → PostCSS → 유틸리티 클래스 생성)
  ↓
@font-face 등록 (Pretendard 폰트)
  ↓
@theme 변수 등록 (CSS Custom Properties)
  ↓
모든 스토리에서 bg-primary-50, text-heading-md, rounded-lg 등 사용 가능
```

---

### 2-4. `nextjs.appDirectory: true` 설정

**결정:** `preview.tsx`의 `parameters.nextjs.appDirectory`를 `true`로 설정한다.

**근거:**

ResuFit은 App Router를 사용한다(`.claude/rules/architecture.md`). 컴포넌트에서 `next/navigation`의 훅(`useRouter`, `usePathname`, `useSearchParams` 등)을 import하는 경우가 있다.

```
appDirectory: false (기본값)
  → useRouter는 next/router (Pages Router)에서 가져옴
  → next/navigation import 시 에러 또는 undefined

appDirectory: true
  → useRouter는 next/navigation (App Router)에서 가져옴
  → usePathname, useSearchParams 등 정상 동작
```

이 설정이 없으면, `next/navigation`을 import하는 컴포넌트(예: Header의 활성 탭 표시)의 스토리가 렌더링 에러를 발생시킨다.

---

### 2-5. 뷰포트 프리셋 (375 / 768 / 1280)

**결정:** 모바일(375×812), 태블릿(768×1024), 데스크톱(1280×800) 세 가지 뷰포트 프리셋을 등록한다.

**근거:**

Figma Layout 섹션에서 정의한 반응형 브레이크포인트를 그대로 반영한다:

| Figma 기준        | Storybook 뷰포트 | Tailwind 브레이크포인트 |
| ----------------- | ---------------- | ----------------------- |
| 모바일 (375px)    | Mobile 375×812   | 기본 (sm 미만)          |
| 태블릿 (768px)    | Tablet 768×1024  | `md:`                   |
| 데스크톱 (1280px) | Desktop 1280×800 | `xl:`                   |

Storybook의 뷰포트 툴바에서 이 프리셋을 선택하면, 해당 크기로 렌더링된 컴포넌트를 확인할 수 있다. 반응형 컴포넌트(Header, BottomNav 등)를 개발할 때 각 브레이크포인트에서의 레이아웃을 바로 검증 가능하다.

---

### 2-6. a11y test 모드: `'error'`

**결정:** `@storybook/addon-a11y`의 test 모드를 `'error'`로 설정한다 (`'todo'`가 아닌).

**근거:**

세 가지 모드가 있다:

| 모드          | 동작                                          | 사용 시점                                 |
| ------------- | --------------------------------------------- | ----------------------------------------- |
| `'off'`       | a11y 검사 비활성화                            | 접근성을 고려하지 않을 때                 |
| `'todo'`      | 위반 사항을 UI에 표시만 함, 테스트 실패 안 함 | 기존 코드베이스에 점진적 도입할 때        |
| **`'error'`** | 위반 사항 발견 시 테스트 실패                 | 새 프로젝트에서 처음부터 접근성 보장할 때 |

ResuFit은 새 프로젝트이고, 컴포넌트를 처음부터 만드는 단계다. 기존에 접근성 위반이 있는 코드가 없으므로, 처음부터 `'error'`로 설정하여 접근성 문제가 있는 컴포넌트가 커밋되는 것을 사전에 방지한다.

`'todo'`는 레거시 프로젝트에서 수백 개의 기존 위반을 한 번에 고칠 수 없을 때 점진적으로 개선하기 위한 모드다.

---

### 2-7. `@chromatic-com/storybook` addon 미설치, `chromatic` CLI만 설치

**결정:** Chromatic 배포용 CLI(`chromatic`)만 설치하고, Storybook UI 애드온(`@chromatic-com/storybook`)은 설치하지 않는다.

**근거:**

두 패키지의 역할이 다르다:

| 패키지                             | 역할                                                                                           | 필요 시점                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `chromatic` (CLI)                  | Storybook을 빌드하여 Chromatic CDN에 배포. `npx chromatic --project-token=<토큰>` 한 줄로 실행 | 팀원에게 Storybook 공유할 때               |
| `@chromatic-com/storybook` (addon) | 비주얼 회귀 테스트 결과(스크린샷 diff)를 Storybook UI 패널에서 확인                            | 비주얼 테스트를 Storybook 안에서 확인할 때 |

비주얼 회귀 테스트는 현재 단계에서 불필요하다 (컴포넌트가 아직 없으므로 비교할 베이스라인이 없다). 우리의 목적은 **팀원에게 Storybook을 공유하기 위한 배포**이므로 CLI만 있으면 된다.

**배포 명령어:**

```bash
npx chromatic --project-token=<프로젝트 토큰>
```

이 한 줄이면 `build-storybook` → 업로드 → URL 생성까지 자동으로 처리된다. addon 없이도 배포는 정상 동작한다.

---

### 2-8. 자동 생성된 예제 스토리 삭제

**결정:** `storybook init`이 생성한 `src/stories/` 디렉토리(Button.tsx, Header.tsx, Page.tsx 등)를 삭제한다.

**근거:**

자동 생성된 예제는 Storybook의 기본 사용법 데모 목적이다. 우리 프로젝트와는 관계없는 코드이며, 남겨두면 두 가지 문제가 있다:

1. **ESLint 에러**: `Page.tsx`에서 `react/no-unescaped-entities` 에러 발생 (따옴표 이스케이프 미처리). `pnpm lint`가 실패한다.
2. **혼동**: 팀원이 `src/stories/Button.tsx`를 실제 Button 컴포넌트로 오인할 수 있다.

우리의 스토리 컨벤션은 **컴포넌트와 같은 디렉토리에 배치**하는 것이다:

```
# ❌ 자동 생성된 구조 (삭제)
src/stories/
├── Button.tsx
├── Button.stories.ts
├── Header.tsx
└── Header.stories.ts

# ✅ 우리 컨벤션
src/components/ui/
├── Button.tsx
├── Button.stories.tsx      ← 컴포넌트와 같은 위치
├── Input.tsx
└── Input.stories.tsx
```

이 컨벤션의 장점:

- 컴포넌트와 스토리가 바로 옆에 있어 탐색이 편함
- 컴포넌트를 삭제하면 스토리도 함께 보이므로 고아 파일 방지
- `.storybook/main.ts`의 stories glob(`../src/**/*.stories.@(ts|tsx)`)이 전체 `src/` 하위를 스캔하므로 어디에 두든 자동 감지

---

### 2-9. Storybook init이 자동 추가한 패키지 수용

**결정:** `storybook init`이 자동 추가한 패키지들을 그대로 수용한다.

**근거:**

`storybook init`이 추가한 devDependencies:

| 패키지                       | 역할                              | 수용 이유                                        |
| ---------------------------- | --------------------------------- | ------------------------------------------------ |
| `storybook`                  | Storybook CLI + 코어              | 필수                                             |
| `@storybook/nextjs-vite`     | Next.js + Vite 프레임워크         | 필수 (2-1에서 결정)                              |
| `@storybook/addon-vitest`    | Vitest에서 스토리를 테스트로 실행 | 스토리 기반 자동 테스트 가능. 나중에 CI에서 활용 |
| `@storybook/addon-a11y`      | 접근성 자동 검사                  | 필수 (2-6에서 결정)                              |
| `@storybook/addon-docs`      | 스토리 기반 자동 문서 생성        | Props 테이블 자동 생성. 팀 공유 시 유용          |
| `@storybook/addon-mcp`       | MCP 서버 연동                     | AI 에이전트가 Storybook과 상호작용 가능          |
| `vite`                       | Vite 빌드 도구                    | `@storybook/nextjs-vite`의 peer dependency       |
| `eslint-plugin-storybook`    | 스토리 파일 린트 규칙             | best practice 강제 (play function 등)            |
| `vitest`                     | 테스트 러너                       | `@storybook/addon-vitest`의 의존성               |
| `playwright`                 | 브라우저 자동화                   | Vitest 브라우저 모드에서 사용                    |
| `@vitest/browser-playwright` | Vitest + Playwright 브리지        | 스토리 브라우저 테스트용                         |
| `@vitest/coverage-v8`        | 코드 커버리지                     | V8 기반 커버리지 수집                            |
| `chromatic`                  | Storybook 배포 CLI                | 수동 설치 (2-7에서 결정)                         |

`@chromatic-com/storybook`만 제거하고 나머지는 모두 유지한다. 각 패키지가 Storybook 10.5의 표준 도구 체인이며, 하나를 제거하면 다른 기능이 동작하지 않을 수 있다.

---

## 3. 최종 설정 파일 구조

```
프로젝트 루트/
├── .storybook/
│   ├── main.ts          # 프레임워크, 애드온, stories glob, staticDirs
│   └── preview.tsx      # globals.css import, App Router, 뷰포트, a11y
├── vitest.config.ts     # addon-vitest 자동 생성 (Playwright + Chromium)
├── vitest.shims.d.ts    # vitest 타입 shim
└── package.json         # scripts: storybook, build-storybook
```

**동작 흐름:**

```
pnpm storybook
  ↓
Storybook CLI 실행 (storybook dev -p 6006)
  ↓
main.ts 읽기
  ↓
프레임워크: @storybook/nextjs-vite → Vite 개발 서버 기동
  ↓
stories glob: ../src/**/*.stories.@(ts|tsx) → 스토리 파일 탐색
  ↓
staticDirs: ../public/ → /fonts/, /mockServiceWorker.js 등 정적 파일 서빙
  ↓
preview.tsx 실행
  ↓
globals.css import → Tailwind v4 + 디자인 토큰 + Pretendard 폰트 활성화
  ↓
parameters 적용 (App Router, viewport, a11y)
  ↓
localhost:6006 접속 가능
```
