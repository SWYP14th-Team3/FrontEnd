# Claude Code PR 리뷰 CI/CD 워크플로우 구성

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PR이 생성/업데이트되면 Claude Code가 자동으로 코드 리뷰를 수행하고, `@claude` 멘션으로 추가 질문에 응답하는 GitHub Actions 워크플로우를 구성한다.

**Architecture:** `anthropics/claude-code-action@v1`을 사용하여 두 개의 워크플로우 파일을 생성한다. (1) PR 자동 리뷰 워크플로우 — PR open/sync 시 프로젝트 rules 기반 코드 리뷰 수행, (2) `@claude` 멘션 응답 워크플로우 — PR 코멘트/리뷰 코멘트에서 `@claude` 멘션 시 응답. 리뷰 기준은 `.claude/rules/`의 아키텍처·코딩 컨벤션·파일 구조 규칙을 프롬프트에 직접 반영하여, 워크플로우 파일만으로 리뷰 정책이 완결되도록 한다.

**Tech Stack:** GitHub Actions, `anthropics/claude-code-action@v1`, Claude Code OAuth Token

## Global Constraints

- 인증: `CLAUDE_CODE_OAUTH_TOKEN` (레포 Secrets에 사전 등록 필요)
- 모델: `claude-sonnet-4-5-20250929` (비용 효율)
- 허용 도구: `mcp__github_inline_comment__create_inline_comment`, `Bash(gh pr comment:*)`, `Bash(gh pr diff:*)`, `Bash(gh pr view:*)`
- `use_sticky_comment: true` — 리뷰 결과를 하나의 코멘트에 업데이트
- `track_progress: true` — 리뷰 진행 상태 표시
- 동일 PR에서 중복 리뷰 방지를 위한 concurrency 그룹 설정

---

## 파일 구조

| 동작   | 파일 경로                             | 역할                           |
| ------ | ------------------------------------- | ------------------------------ |
| Create | `.github/workflows/claude-review.yml` | PR 자동 리뷰 워크플로우        |
| Create | `.github/workflows/claude-chat.yml`   | `@claude` 멘션 응답 워크플로우 |

두 워크플로우를 분리하는 이유:

- **트리거가 다르다** — review는 `pull_request` 이벤트, chat은 `issue_comment`/`pull_request_review_comment`/`pull_request_review` 이벤트
- **프롬프트가 다르다** — review는 구조화된 리뷰 체크리스트, chat은 자유 질문 응답
- **concurrency 정책이 다르다** — review는 `cancel-in-progress: true`로 최신 커밋만 리뷰, chat은 각 멘션마다 독립 실행

---

### Task 1: PR 자동 리뷰 워크플로우 작성

**Files:**

- Create: `.github/workflows/claude-review.yml`

**Interfaces:**

- Consumes: `.claude/rules/architecture.md`, `.claude/rules/coding-conventions.md`, `.claude/rules/file-structure.md` (리뷰 기준으로 프롬프트에 반영)
- Produces: PR에 리뷰 코멘트 (sticky comment + inline comments)

- [ ] **Step 1: `.github/workflows/` 디렉토리 생성**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: `claude-review.yml` 워크플로우 파일 작성**

`.github/workflows/claude-review.yml` 파일을 아래 내용으로 생성한다:

```yaml
name: Claude PR Review

on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]

concurrency:
  group: claude-review-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  review:
    if: ${{ !github.event.pull_request.draft }}
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          use_sticky_comment: true
          track_progress: true
          include_fix_links: true
          prompt: |
            REPO: ${{ github.repository }}
            PR NUMBER: ${{ github.event.pull_request.number }}

            이 PR의 변경 사항을 아래 리뷰 기준에 따라 검토하세요.
            이전 리뷰에서 지적한 내용이 해결되었는지도 확인하세요.

            ## 리뷰 기준 (심각도순)

            ### 🔴 CRITICAL — 보안 / 데이터 정합성
            - XSS 취약점 (dangerouslySetInnerHTML, 사용자 입력 미이스케이프)
            - 환경변수/시크릿 하드코딩 (API 키, 토큰 등이 코드에 직접 포함)
            - 서버 컴포넌트에서 클라이언트 전용 API 사용 (useState, useEffect 등 'use client' 없이 사용)
            - Pages Router 사용 (App Router만 허용)

            ### 🟠 HIGH — 성능 / 아키텍처
            - useMemo, useCallback, React.memo 수동 사용 (React Compiler 활성화 상태)
            - 불필요한 'use client' 선언 (서버 컴포넌트로 충분한데 클라이언트로 선언)
            - export default 사용 (page.tsx, layout.tsx, error.tsx 등 Next.js 규약 파일 제외)
            - barrel export (index.ts) 사용
            - 순차 fetch에서 Promise.all 누락 (독립적인 요청을 병렬화 가능한 경우)

            ### 🟡 MEDIUM — 타입 / 컨벤션
            - any 타입 사용
            - 상대 경로 import (@/ alias 미사용, 같은 디렉토리 내 제외)
            - 네이밍 규칙 위반 (컴포넌트 PascalCase, 훅 use 접두사, 상수 UPPER_SNAKE_CASE)
            - 화살표 함수로 컴포넌트 선언 (함수 선언문 사용 규칙)
            - cn() 미사용 (조건부 className에 직접 템플릿 리터럴 사용)
            - 파일 위치 규칙 위반 (페이지 전용 컴포넌트가 _components/ 외부에 위치)

            ## 경로별 중점 확인
            - src/app/** → App Router 규칙, 서버/클라이언트 분리, 레이아웃 구조
            - src/components/** → 컴포넌트 패턴 (cn, cva), named export, Props 타입
            - src/lib/**, src/hooks/** → 유틸 네이밍, 훅 규칙, 타입 안전성
            - src/types/** → 타입 설계, 불필요한 any

            ## 출력 규칙
            - 발견된 이슈만 심각도별로 정리 (이슈 없는 카테고리는 생략)
            - 해당 PR 변경 파일과 무관한 규칙은 체크하지 않기
            - 구체적인 코드 이슈는 인라인 코멘트 + GitHub Suggestion 블록으로 수정 제안
            - PR 전체 코멘트는 요약 + 결론만 20줄 이내
            - synchronize 이벤트 시 이전 리뷰와 동일 내용 반복 금지
            - "잘 작성된 점"은 정말 돋보이는 패턴만 1-2줄로

            ## 리뷰 제외 항목 (Prettier + ESLint + lint-staged가 자동 처리)
            - 들여쓰기, 줄바꿈, 따옴표 스타일
            - Tailwind 클래스 순서
            - import 순서
            - trailing comma, 세미콜론
            - 개인 취향 수준의 네이밍 대안 제시

            인라인 코멘트에는 반드시 `confirmed: true`를 사용하세요.
            PR 전체 요약은 `gh pr comment`로 작성하세요.
            리뷰 텍스트를 메시지로 반환하지 말고, 반드시 GitHub 코멘트로만 게시하세요.

          claude_args: |
            --model claude-sonnet-4-5-20250929
            --allowedTools "mcp__github_inline_comment__create_inline_comment,Bash(gh pr comment:*),Bash(gh pr diff:*),Bash(gh pr view:*)"
```

- [ ] **Step 3: 워크플로우 YAML 문법 검증**

```bash
# yamllint가 없으면 Python yaml 모듈로 파싱 검증
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/claude-review.yml'))" && echo "YAML valid"
```

Expected: `YAML valid` 출력

- [ ] **Step 4: 커밋**

```bash
git add .github/workflows/claude-review.yml
git commit -m "feat: Claude Code PR 자동 리뷰 워크플로우 추가"
```

---

### Task 2: `@claude` 멘션 응답 워크플로우 작성

**Files:**

- Create: `.github/workflows/claude-chat.yml`

**Interfaces:**

- Consumes: Task 1과 동일한 Secrets (`CLAUDE_CODE_OAUTH_TOKEN`)
- Produces: PR 코멘트에 `@claude` 멘션 시 응답 코멘트

- [ ] **Step 1: `claude-chat.yml` 워크플로우 파일 작성**

`.github/workflows/claude-chat.yml` 파일을 아래 내용으로 생성한다:

```yaml
name: Claude Chat

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  pull_request_review:
    types: [submitted]

jobs:
  respond:
    if: >-
      (github.event_name == 'issue_comment' && github.event.issue.pull_request) ||
      github.event_name == 'pull_request_review_comment' ||
      github.event_name == 'pull_request_review'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          trigger_phrase: '@claude'
          claude_args: |
            --model claude-sonnet-4-5-20250929
            --allowedTools "mcp__github_inline_comment__create_inline_comment,Bash(gh pr comment:*),Bash(gh pr diff:*),Bash(gh pr view:*)"
```

- [ ] **Step 2: 워크플로우 YAML 문법 검증**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/claude-chat.yml'))" && echo "YAML valid"
```

Expected: `YAML valid` 출력

- [ ] **Step 3: 커밋**

```bash
git add .github/workflows/claude-chat.yml
git commit -m "feat: @claude 멘션 응답 워크플로우 추가"
```

---

### Task 3: Secrets 설정 안내 및 통합 테스트

**Files:**

- 없음 (GitHub UI에서 설정 + 테스트 PR로 검증)

**Interfaces:**

- Consumes: Task 1, Task 2에서 생성한 워크플로우 파일
- Produces: 워크플로우가 정상 동작하는 상태

- [ ] **Step 1: GitHub Secrets 등록 확인**

레포 Settings → Secrets and variables → Actions에서 아래 Secret이 등록되어 있는지 확인한다:

| Secret 이름               | 값                     |
| ------------------------- | ---------------------- |
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude Code OAuth 토큰 |

등록 방법:

1. https://github.com/SWYP14th-Team3/FrontEnd/settings/secrets/actions 접속
2. "New repository secret" 클릭
3. Name: `CLAUDE_CODE_OAUTH_TOKEN`, Value: OAuth 토큰 입력
4. "Add secret" 클릭

OAuth 토큰 발급: Claude Code CLI에서 `claude /install-github-app` 명령 실행 (레포 admin 권한 필요)

- [ ] **Step 2: 워크플로우 파일을 원격에 push**

```bash
git push origin HEAD
```

- [ ] **Step 3: 테스트 PR 생성하여 동작 확인**

테스트용 브랜치를 만들고 간단한 변경 후 PR을 생성하여 자동 리뷰가 동작하는지 확인한다:

```bash
git checkout -b chore/test-claude-review
echo "// test" >> src/app/page.tsx
git add src/app/page.tsx
git commit -m "chore: Claude 리뷰 워크플로우 테스트"
git push origin chore/test-claude-review
gh pr create --title "chore: Claude 리뷰 워크플로우 테스트" --body "Claude Code 자동 리뷰 동작 확인용 테스트 PR"
```

Expected:

- PR이 생성되면 `Claude PR Review` 워크플로우가 자동 트리거
- PR에 리뷰 코멘트가 sticky comment로 게시됨
- `@claude 이 PR에서 개선할 점이 있나요?` 코멘트를 달면 `Claude Chat` 워크플로우가 트리거되어 응답

- [ ] **Step 4: 테스트 PR 정리**

확인 후 테스트 PR을 닫고 브랜치를 삭제한다:

```bash
gh pr close --delete-branch
```

- [ ] **Step 5: 최종 커밋 (필요 시)**

테스트 과정에서 워크플로우 수정이 필요했다면 수정사항을 커밋한다:

```bash
git add .github/workflows/
git commit -m "fix: Claude 리뷰 워크플로우 수정"
```
