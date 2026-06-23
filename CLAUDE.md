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
├── app/                    # App Router 페이지 및 레이아웃
│   ├── layout.tsx          # 루트 레이아웃
│   ├── page.tsx            # 홈 페이지
│   ├── globals.css         # 글로벌 스타일 (Tailwind)
│   └── (routes)/           # 라우트 그룹
├── components/             # 공유 컴포넌트
│   ├── ui/                 # 기본 UI 컴포넌트 (Button, Input 등)
│   └── common/             # 도메인 비종속 공통 컴포넌트
├── lib/                    # 유틸리티, 헬퍼
│   └── utils.ts            # cn() 유틸
├── hooks/                  # 커스텀 훅
├── types/                  # 공유 타입 정의
├── constants/              # 상수
└── styles/                 # 추가 스타일 (필요 시)
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

```
