# ResuFit 렌더링 전략 계획서

> Next.js 16 App Router 기반, 기능명세서(v4) 분석 결과

---

## 1. 라우트 설계

```
src/app/
├── layout.tsx                    # 루트 레이아웃 (7.0 상단 네비바)
├── page.tsx                      # 메인 (첫 화면) — 1.0
├── result/
│   └── [id]/
│       └── page.tsx              # 분석 결과 화면 — 4.0 (로딩 상태 포함)
├── history/
│   └── page.tsx                  # 분석 결과 목록 — 5.x
└── api/
    ├── auth/
    │   ├── kakao/route.ts        # 카카오 OAuth 콜백 (2.1)
    │   └── google/route.ts       # 구글 OAuth 콜백 (2.2)
    └── analyze/route.ts          # 분석 요청 API (스트리밍)
```

### 설계 근거

- `/loading`을 별도 라우트로 분리하지 않음: 분석 요청 시 바로 결과 ID 발급 → `/result/[id]`로 이동. 분석 진행 중이면 로딩 UI, 완료면 결과 UI. URL이 항상 의미 있고 새로고침/공유 가능
- `/result/[id]`: 분석 결과를 고유 ID로 접근 → 저장/재방문 가능
- 로그인 모달은 라우트가 아닌 클라이언트 컴포넌트 (오버레이)

---

## 2. 라우트별 렌더링 방식

| 라우트         | 렌더링 방식         | 이유                                                                                            |
| -------------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| `/` (메인)     | **SSR + Streaming** | 아래 [메인 페이지 SSR+Streaming 상세 근거](#메인-페이지--ssrstreaming-상세-근거) 참고           |
| `/result/[id]` | **SSR + Streaming** | 아래 [분석 결과 페이지 SSR+Streaming 상세](#분석-결과-페이지--ssrstreaming-상세) 참고           |
| `/history`     | **SSR (Dynamic)**   | 인증 필요, 사용자별 데이터. 서버에서 토큰 검증 + 목록 fetch. 페이지네이션/검색은 `searchParams` |
| `/api/*`       | **Route Handler**   | REST API 엔드포인트                                                                             |

**SSG를 사용하지 않는 이유:** 모든 화면이 사용자별 동적 데이터에 의존. 정적 생성할 페이지가 없음.

### 메인 페이지 — SSR+Streaming 상세 근거

- Next.js 16 베스트 프랙티스에 따라 `cookies()`를 await하지 않고 Promise로 Suspense 안에서 처리
- HeroSection은 **static shell**로 즉시 전달되어 TTFB/FCP 개선
- 인증 분기가 필요한 부분만 Suspense 경계 안에서 streaming
- 로그인 체크 → UI 전환 과정에서 깜빡임(flash) 없음

```tsx
// src/app/page.tsx
import { Suspense } from 'react';
import { cookies } from 'next/headers';

export default function HomePage() {
  const cookieStore = cookies(); // await하지 않음 — Promise로 전달

  return (
    <main>
      <HeroSection /> {/* 즉시 렌더 — static shell */}
      <Suspense fallback={<MainFormSkeleton />}>
        <MainForm cookiePromise={cookieStore} /> {/* 인증 체크 후 streaming */}
      </Suspense>
    </main>
  );
}
```

### 분석 결과 페이지 — SSR+Streaming 상세

#### 분석 상태에 따른 분기

```tsx
// src/app/result/[id]/page.tsx
export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const status = await getAnalysisStatus(id); // 빠른 상태 조회

  if (status === 'processing') {
    return <AnalysisLoading analysisId={id} />;
  }

  const result = await getAnalysisResult(id);

  return (
    <>
      <ResultHeader result={result} />
      <AiDisclaimer />
      <Suspense fallback={<PanelSkeleton />}>
        <AnalysisPanels analysisId={id} result={result} />
      </Suspense>
      <FeedbackSection flags={result.flags} />
      <SatisfactionSurvey analysisId={id} />
    </>
  );
}
```

#### 상단 — 적합도 등급 + 요약 (4.1 + 4.1.1)

- v3의 적합도 %(원형그래프) → v4: **상/중/하 등급 카드 + 3색 카운트 카드**
- 등급 산출: Red flag 0개=상, 1~2개=중, 3개+=하 (코드로 계산, LLM 판정 X)
- 카운트: 🔴 없음(Red) / 🟡 보강 필요(Yellow) / ✅ 확인됨(Green)
- 숫자 점수 사용하지 않음 — LLM 확률적 분산으로 신뢰 저하 방지
- AI 면책 문구(4.1.1): 등급 카드 바로 아래에 ℹ️ 아이콘 + 회색 배경 텍스트

#### 좌측 패널 (공고 영역 — 4.2)

- 상단 탭바 [원본|요약]으로 전환
- **원본 탭**: 공고 텍스트 그대로 표시 (가공 금지, 명세서 요구)
- **요약 탭**: LLM이 **필수요건/우대사항 2분류**로 정리한 요건 목록 + 각 요건별 판정 dot(🔴없음/🟡보강 필요/✅확인됨)
- v3의 4카테고리(도메인/업무/자격요건/우대사항) → v4: **필수/우대 2분류**

#### 우측 패널 (이력서 — 4.3)

- 이력서 원문 텍스트 표시
- "수정하기" 버튼 클릭 시 텍스트 편집 모드 전환
- v3의 섹션별 인라인 에디터 → v4: **전체 텍스트 편집 모드** (textarea)
- 영역 분류는 이력서 패널에서 별도 표시 안 함 — 피드백(4.5)에서 안내

#### 하단 — Red/Yellow flag 상세 피드백 (4.5)

- v3의 표현다듬기/내용보강/경험없음 3단계 → v4: **Red(없음)/Yellow(보강 필요) 2단계**
- Green(확인됨) 상세 섹션 삭제
- 정렬: Red(필수누락) → Yellow(필수부분) → Yellow(우대)
- 각 항목: 요건명 + 필수/우대 + 이력서 영역
- 항목 탭/클릭 시 펼침: ①이력서 근거(evidence) ②피드백(feedback) ③💡수정 제안(suggestion)
- flag 0개: "거의 다 확인되었어요!" 표시

#### 이력서 수정 및 재분석 (4.6)

- 이력서 수정 → 재분석 버튼 클릭
- 1건당 최대 5회, 잔여 횟수 표시 ("재분석하기 (4회 남음)")
- **공고 요건 고정**: 재분석 시 크롤링/요건 추출 생략, 매칭만 재실행
- v3의 점수 갱신 → v4: **카운트·등급 변화** 표시 (중→상 ⬆️)
- 방어 로직: 이전 '확인됨'이 Red로 뒤집히면 이전 판정 유지
- 해결됨 섹션 없음

#### 저장 + 만족도 (4.7 + 4.8)

- **저장 버튼(4.7)**: 현재 분석 결과를 최종본으로 저장 (덮어쓰기, 버전 관리 없음)
- **만족도 수집(4.8, 신규)**: "이 분석이 도움이 되었나요?" + 👍👎 버튼. DB 저장, 재클릭 시 변경 가능. 저장 실패 시 조용히 실패(에러 미표시)

#### 데이터 페칭과 서버/클라이언트 분리 상세

분석 결과 데이터는 **서버 컴포넌트(page.tsx)에서 백엔드 API를 호출**하여 받아옵니다:

```tsx
// src/app/result/[id]/page.tsx (Server Component)
export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await fetch(`${BACKEND_URL}/api/analysis/${id}`, {
    headers: { Cookie: cookies().toString() },
  }).then((res) => res.json());

  return (
    <>
      <ResultHeader result={result} />
      <AiDisclaimer />
      <Suspense fallback={<PanelSkeleton />}>
        <div className="flex gap-6">
          <JdPanel data={result.jdAnalysis} />
          <ResumePanel data={result.resumeText} analysisId={id} />
        </div>
      </Suspense>
      <FeedbackSection flags={result.flags} />
      <SaveButton analysisId={id} />
      <SatisfactionSurvey analysisId={id} feedback={result.satisfaction} />
    </>
  );
}
```

패널 내부의 서버/클라이언트 구분 기준은 **인터랙션 유무**입니다:

| 요소                         | 인터랙션         | 렌더링    | 이유                |
| ---------------------------- | ---------------- | --------- | ------------------- |
| 회사명+포지션 텍스트         | 없음             | Server ✅ | 데이터 표시만       |
| 등급 카드 (상/중/하)         | 없음             | Server ✅ | 정적 표시           |
| 카운트 카드 (없음/보강/확인) | 없음             | Server ✅ | 정적 표시           |
| AI 면책 문구                 | 없음             | Server ✅ | 정적 텍스트         |
| 공고 원본 텍스트             | 없음             | Server ✅ | 데이터 표시만       |
| 공고 탭바 [원본\|요약]       | 탭 전환          | Client 🔶 | onClick 필요        |
| 요약 요건 목록 + 판정 dot    | 없음             | Server ✅ | 데이터 표시만       |
| 이력서 원문 텍스트           | 없음             | Server ✅ | 데이터 표시만       |
| 이력서 수정하기 버튼         | 클릭 → 편집 모드 | Client 🔶 | 상태 전환 필요      |
| 이력서 편집 에디터           | 텍스트 입력      | Client 🔶 | onChange 필요       |
| Red/Yellow flag 아코디언     | 탭/클릭 펼침     | Client 🔶 | onClick 필요        |
| 재분석 버튼                  | 클릭             | Client 🔶 | onClick + 로딩 상태 |
| 저장 버튼                    | 클릭             | Client 🔶 | onClick + 토스트    |
| 만족도 👍👎                  | 클릭             | Client 🔶 | onClick + API 호출  |

Server Component로 렌더된 요소는 서버에서 HTML로 완성되어 브라우저에 즉시 표시되며, **JS 번들에 포함되지 않습니다**. Client Component만 JS 번들에 포함되어 hydration 후 인터랙션이 동작합니다.

#### Streaming 구조

```
Server Component (page.tsx)
├── 즉시 렌더 ─────────────────
│   ├── ResultHeader (Server): 회사명, 포지션
│   │   └── GradeCard (Server): 상/중/하 등급 배지
│   │   └── CountCards (Server): 🔴없음 N개 / 🟡보강 필요 N개 / ✅확인됨 N개
│   └── AiDisclaimer (Server): ℹ️ AI 면책 문구
│
├── <Suspense fallback={패널스켈레톤}>  ── Streaming 경계
│   ├── JdPanel ─── 좌측
│   │   ├── JdTabBar (Client 🔶) ← [원본|요약] 탭 전환
│   │   ├── 원본: 공고 전체 텍스트 (Server)
│   │   └── 요약: 필수요건/우대사항 목록 + 판정 dot (Server)
│   │
│   └── ResumePanel ─── 우측
│       ├── 이력서 원문 텍스트 (Server)
│       └── ResumeEditor (Client 🔶) ← 수정하기/재분석 모드
│           ├── 에디터 (textarea)
│           └── ReAnalyzeButton ← 재분석하기 (N회 남음)
│
├── FeedbackSection (Client 🔶) ─── Red/Yellow flag 아코디언
│   ├── RedFlagGroup ─── 🔴 없음 섹션
│   │   └── FlagItem (Client 🔶) ─── 요건명 + 필수/우대 + 펼침
│   │       ├── Evidence ─── 이력서 근거
│   │       ├── Feedback ─── 피드백
│   │       └── Suggestion ─── 💡 수정 제안
│   └── YellowFlagGroup ─── 🟡 보강 필요 섹션
│       └── FlagItem (동일 구조)
│
├── SaveButton (Client 🔶) ─── 분석 결과 저장하기
└── SatisfactionSurvey (Client 🔶) ─── 👍👎 만족도 수집
```

#### SSR+Streaming 선택 근거 (대안 비교)

| 대안                       | 장점                                                                | 단점                                                                          |
| -------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **SSR + Streaming (채택)** | 헤더+등급 즉시 노출, 좌우 패널은 데이터 준비되는 대로 점진적 렌더링 | 구현 복잡도 약간 높음                                                         |
| 순수 CSR                   | 구현 단순                                                           | 초기 빈 화면 깜빡임, 데이터 waterfall 발생                                    |
| SSR (Streaming 없이)       | 완성된 HTML 한 번에 전달                                            | 데이터 fetch 끝날 때까지 전체 대기. LLM 응답이 커서 사용자가 빈 화면을 기다림 |

---

## 3. 서버 vs 클라이언트 컴포넌트 경계

### 루트 레이아웃 (`layout.tsx`)

```
layout.tsx (Server)
├── Navbar (Server) ─── 7.0 상단 네비바
│   ├── Logo (Server)
│   ├── NavTabs (Client 🔶) ─── 분석하기/분석결과 탭 (active 상태)
│   └── <Suspense fallback={<LoginButtonSkeleton />}>
│       └── AuthButton (Server) ─── cookiePromise로 로그인 상태 확인
│           ├── 비로그인 → LoginButton (Client 🔶) → 클릭 시 모달
│           └── 로그인 → ProfileButton (Client 🔶) → 프로필 아이콘
└── LoginModal (Client 🔶) ─── 2.0 오버레이 (Context로 열림/닫힘 관리)
    ├── 안내 문구
    ├── "카카오로 시작하기" 버튼 (2.1)
    └── "구글로 시작하기" 버튼 (2.2)
```

### 메인 페이지 (`/`)

```
page.tsx (Server)
├── HeroSection (Server) ─── 서비스 소개 문구
└── <Suspense fallback={<MainFormSkeleton />}>
    └── MainForm (Client 🔶) ─── 전체 입력 상태 관리
        ├── ResumeUploader ─── 좌측: PDF 업로드 (10MB 이하, 텍스트 기반만)
        ├── JdInput ─── 우측: 탭 전환 (URL 입력 | 텍스트 입력 | 이미지 입력)
        │   ├── JdUrlTab ─── URL 입력 + 형식 검증
        │   ├── JdTextTab ─── 텍스트영역(100~6000자) + 회사명 입력
        │   └── JdImageTab ─── 이미지 업로드 JPG/PNG/WEBP (🟡 PoC 후 확정)
        └── AnalyzeButton ─── "핏 분석하기" CTA, 이력서+공고 완료 시 활성화
```

### 로딩 UI (`/result/[id]` 내부 — 분석 미완료 시)

```
AnalysisLoading (Client 🔶 전체) ─── 분석 미완료 시 풀스크린 렌더
├── LoadingSpinner ─── 스피너 애니메이션
├── StepMessage ─── 3단계 메시지 전환
│   ├── "공고와 이력서를 분석하고 있어요"
│   ├── "적합도를 계산하고 있어요"
│   └── "맞춤 개선 피드백을 정리하고 있어요"
└── ProgressBar ─── 프로그레스바 애니메이션
```

### 분석 결과 페이지 (`/result/[id]`)

```
page.tsx (Server) ─── params Promise 수신, 분석 상태 확인
│
├── 미완료 → AnalysisLoading (Client 🔶) ─── SSE 연결, 3단계 프로그레스
│
├── 완료 → 결과 렌더링:
│   ├── ResultHeader (Server) ─── 회사명+포지션
│   │   ├── GradeCard (Server) ─── 상/중/하 등급 배지
│   │   └── CountCards (Server) ─── 🔴없음 / 🟡보강 필요 / ✅확인됨 카운트
│   ├── AiDisclaimer (Server) ─── ℹ️ AI 면책 문구
│   │
│   └── <Suspense> ── Streaming 경계
│       ├── JdPanel ─── 좌측: 공고 영역
│       │   ├── JdTabBar (Client 🔶) ─── [원본|요약] 탭 전환
│       │   ├── 원본: 공고 전체 텍스트 (Server)
│       │   └── 요약: 필수/우대 요건 + 판정 dot (Server)
│       │
│       ├── ResumePanel ─── 우측: 이력서 영역
│       │   ├── 이력서 원문 텍스트 (Server)
│       │   └── ResumeEditor (Client 🔶) ─── 수정하기 + 재분석
│       │
│       ├── FeedbackSection (Client 🔶) ─── Red/Yellow flag 아코디언
│       │   ├── RedFlagGroup ─── 🔴 없음 항목들
│       │   └── YellowFlagGroup ─── 🟡 보강 필요 항목들
│       │
│       ├── SaveButton (Client 🔶) ─── 분석 결과 저장하기
│       └── SatisfactionSurvey (Client 🔶) ─── 👍👎 만족도 수집
```

### 분석 결과 목록 (`/history`)

```
page.tsx (Server) ─── 인증 + 목록 fetch
├── 헤더: "분석 결과"
├── SearchBar (Client 🔶) ─── 회사/공고명 검색
├── AnalysisList (Server) ─── 분석 결과 카드 목록
│   └── AnalysisCard (Server) ─── 회사명+포지션+등급+카운트
└── Pagination (Client 🔶) ─── 10개 단위 페이지네이션
```

### 핵심 원칙

- **`'use client'` 선언 위치**: 인터랙션이 시작되는 가장 말단(leaf) 컴포넌트에 선언
- 서버 컴포넌트가 데이터를 fetch하고 클라이언트 컴포넌트에 props로 전달
- 클라이언트 컴포넌트끼리 상태 공유가 필요하면 공통 부모 클라이언트 컴포넌트로 끌어올림

---

## 4. 데이터 페칭 전략

| 화면           | 데이터                | 페칭 방법                                                          |
| -------------- | --------------------- | ------------------------------------------------------------------ |
| 메인 `/`       | 로그인 상태           | `cookies()` Promise → Suspense 안에서 resolve                      |
| `/result/[id]` | 분석 상태 (진행/완료) | 서버에서 빠른 상태 조회 → 분기                                     |
| `/result/[id]` | 분석 결과 전체        | 서버 컴포넌트에서 `async/await` fetch. Suspense 경계로 streaming   |
| `/result/[id]` | 재분석 (4.6)          | 클라이언트에서 Route Handler POST → 결과 갱신 (`router.refresh()`) |
| `/result/[id]` | 만족도 저장 (4.8)     | 클라이언트에서 POST. 실패 시 조용히 무시 (에러 미표시)             |
| `/history`     | 분석 목록             | 서버 컴포넌트에서 `searchParams`로 페이지/검색어 포함 fetch        |
| `/api/analyze` | 분석 실행             | SSE 스트리밍 (3단계 진행률). LLM 1회 호출 통합 파이프라인          |

### LLM 파이프라인 (v4 변경)

v3: LLM 3회 호출 (요건 추출 / 매칭 / 피드백 분리)
v4: **LLM 1회 호출**로 요건 추출 + 매칭 판정 + 피드백 생성 통합

```
[코드] PDF 텍스트 추출 + 공고 크롤링
  → [LLM 1회] 요건 추출 + 매칭 판정 + 피드백 생성 (Temperature: 0)
  → [코드] 크로스체크 (환각 검증: evidence가 실제 이력서에 있는지 문자열 검색)
```

1회 호출이지만 응답이 크므로, SSE 스트리밍으로 단계별 진행상황 표시.

### 재분석 파이프라인 (v4 변경)

```
[코드] DB에서 저장된 공고 요건 불러오기 (크롤링/요건 추출 생략)
  → [LLM 1회] 고정된 요건에 매칭 판정 + 피드백 재생성 ('요건 추가/삭제 금지. 매칭만')
  → [코드] 크로스체크
  → [코드] 이전 결과와 요건 ID별 비교 → 카운트·등급 변화 표시
```

### 인증 토큰 전달

- OAuth 콜백에서 받은 토큰을 `httpOnly` 쿠키에 저장
- 서버 컴포넌트에서 `cookies()`로 토큰 읽어 API 호출
- 클라이언트 컴포넌트에서는 Route Handler를 프록시로 사용 (토큰 노출 방지)

### params Promise 패턴 (Next.js 16)

Next.js 16에서 `params`와 `searchParams`는 Promise입니다:

```tsx
// params
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}

// searchParams
export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const { page, q } = await searchParams;
}
```

---

## 5. 상태 관리 포인트

### 5-1. 메인 페이지 — 입력 상태

| 상태                             | 관리 방법                       | 이유                                             |
| -------------------------------- | ------------------------------- | ------------------------------------------------ |
| 업로드된 이력서 파일             | `useState` (MainForm)           | 파일 객체는 직렬화 불가, 클라이언트에서만 관리   |
| 공고 입력 탭 (URL/텍스트/이미지) | `useState`                      | 탭 전환 UI                                       |
| 공고 입력 값                     | `useState`                      | 각 탭별 입력 상태                                |
| 텍스트 입력 시 회사명            | `useState`                      | 1.2.2 회사명 입력 필드 (미입력 시 LLM 자동 추출) |
| 분석 버튼 활성화 여부            | derived state                   | 이력서 + 공고 유무로 계산, 별도 상태 불필요      |
| 로그인 모달 열림/닫힘            | Context (`AuthModalContext`)    | 네비바 로그인 버튼 + 분석 버튼 양쪽에서 트리거   |
| OAuth 후 입력 상태 복원          | `sessionStorage` (텍스트/URL만) | 파일은 재업로드 안내, 텍스트/URL 값만 복원       |

**구조:** `MainForm` 클라이언트 컴포넌트에서 이력서/공고/모달 상태를 한 곳에서 관리. 하위 컴포넌트에 props로 전달.

### 5-2. 분석 결과 페이지 — 핵심

| 상태                       | 관리 방법                       | 이유                                              |
| -------------------------- | ------------------------------- | ------------------------------------------------- |
| 공고 탭 (원본/요약)        | `useState` (JdTabBar)           | 4.2 탭 전환                                       |
| 에디터 모드 (보기/수정)    | `useState` (ResumeEditor)       | 수정하기 버튼 클릭 시 토글                        |
| 수정된 이력서 텍스트       | `useState` (ResumeEditor)       | textarea 편집 내용                                |
| 잔여 재분석 횟수           | 서버 props → 클라이언트 state   | 초기값 서버, 재분석 시 차감 후 `router.refresh()` |
| 재분석 로딩 상태           | `useState`                      | 재분석 요청 중 UI                                 |
| flag 아코디언 펼침 상태    | `useState` (FlagItem)           | 각 항목별 펼침/접힘                               |
| 만족도 선택 (👍/👎/미선택) | `useState` (SatisfactionSurvey) | 클릭 시 API 호출, 재클릭 시 변경                  |

**v3과의 차이:**

- 양방향 클릭 매칭(4.4) 보류 → `MatchingController`, `selectedJdId`, `selectedResumeId` 등 매칭 관련 상태 제거
- 피드백이 각 섹션 카드 내부 → 별도 `FeedbackSection`으로 분리
- 인라인 에디터 → 전체 텍스트 편집 모드
- 만족도 수집 상태 신규 추가

### 5-3. 분석 결과 목록 — 단순

| 상태        | 관리 방법            | 이유                              |
| ----------- | -------------------- | --------------------------------- |
| 검색어      | `searchParams` (URL) | 서버에서 검색 처리, URL 공유 가능 |
| 현재 페이지 | `searchParams` (URL) | 서버에서 페이지네이션 처리        |

### 5-4. 전역 상태

| 상태                    | 관리 방법                            | 이유                                                               |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------------ |
| 로그인 모달 열림/닫힘   | `AuthModalContext` (Client Provider) | 네비바 + 분석 버튼 양쪽에서 열어야 하므로 전역 Context 필요        |
| 인증 상태 (로그인 여부) | 서버: 쿠키 / 클라이언트: Context     | 서버 컴포넌트에서 쿠키로 판단, 클라이언트에서 필요 시 Context 제공 |

**상태 관리 라이브러리 불필요:** 현재 범위에서 zustand/jotai 등 외부 라이브러리 없이 React 기본(`useState`, `useContext`, `sessionStorage`)으로 충분. 추후 복잡도 증가 시 재검토.

---

## 6. Phase별 구현 순서

### Phase 1 — W3 (인증 기반)

1. **루트 레이아웃** (`layout.tsx`): 7.0 네비바, 폰트/메타데이터
2. **OAuth Route Handler**: `/api/auth/kakao/route.ts`, `/api/auth/google/route.ts`
3. **로그인 모달**: `LoginModal.tsx` + `AuthModalContext`
4. **인증 Context**: `AuthProvider` — 클라이언트 트리 전파

**산출물:** 카카오/구글 로그인 → 토큰 쿠키 저장 → 로그인 상태 확인 가능

### Phase 2 — W4 (메인 + 로딩 + 네비바)

5. **네비바** (`Navbar`): 탭 전환 (분석하기/분석결과), 로그인/프로필 버튼, Suspense로 인증 분기
6. **메인 페이지** (`/page.tsx`):
   - 서버 컴포넌트: HeroSection 즉시 렌더
   - `MainForm` (Client): 이력서 업로더 + 공고 입력(URL/텍스트/이미지 3탭) + "핏 분석하기" 버튼
   - sessionStorage를 이용한 입력 상태 보존 (OAuth 리다이렉트 대응)
7. **분석 API Route Handler** (`/api/analyze/route.ts`): 파일 업로드 수신, 백엔드 프록시, SSE 스트리밍 응답
8. **로딩 UI** (`AnalysisLoading`): 3단계 프로그레스 + 프로그레스바 (result 페이지 내부 컴포넌트)

**산출물:** 이력서+공고 입력 → 로그인 검증 → 분석 요청 → 로딩 UI

### Phase 3 — W5 (분석 결과 핵심)

9. **분석 결과 페이지** (`/result/[id]/page.tsx`):
   - `ResultHeader` + `GradeCard` + `CountCards` (Server): 회사정보 + 상/중/하 등급 + 3색 카운트
   - `AiDisclaimer` (Server): AI 면책 문구 (4.1.1, 신규)
   - `JdPanel` (Server+Client): 원본/요약 탭 + 필수/우대 2분류 + 판정 dot
   - `ResumePanel` + `ResumeEditor` (Client): 원문 표시 + 수정 모드 + 재분석
   - `FeedbackSection` (Client): Red/Yellow flag 아코디언 — 근거+피드백+수정 제안 (4.5)
   - `SaveButton` (Client): 분석 결과 저장 (4.7)
   - `SatisfactionSurvey` (Client): 👍👎 만족도 수집 (4.8, 신규)
10. **에러 처리**: `result/[id]/error.tsx`
11. **메타데이터**: `generateMetadata`로 공유 시 OG 태그

**산출물:** 분석 결과 시각화, 등급/카운트 표시, Red/Yellow 피드백, 수정/재분석, 저장, 만족도

### Phase 4 — W6 (관리 기능)

12. **분석 결과 탭** (`/history/page.tsx`): 분석 결과 카드 목록, 페이지네이션 (10개/페이지)
13. **검색** (`SearchBar`): 회사/공고명 검색 (searchParams)
14. **결과 수정** (5.2): 저장된 결과 열어 수정 → 재분석 (4.6 재사용, 잔여 횟수 공유)

**산출물:** 과거 분석 결과 조회/검색/수정

---

## 7. v3 → v4 변경에 따른 렌더링 영향 요약

| 변경 사항                    | 렌더링 영향                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| LLM 3회 → 1회                | 응답 크기 증가, SSE 스트리밍이 더 중요해짐                                                 |
| 적합도 % → 상/중/하 등급     | `FitScoreSummary` (SVG 원형그래프) 제거 → `GradeCard` + `CountCards` (Server, 단순 텍스트) |
| 4카테고리 → 필수/우대 2분류  | JdPanel 요약 구조 단순화                                                                   |
| 표현/보강/경험 → Red/Yellow  | 피드백이 섹션 카드 내부 → 별도 아코디언 섹션으로 분리                                      |
| 양방향 클릭 매칭 → 보류      | `MatchingController` + Context + derived state 제거. 컴포넌트 구조 단순화                  |
| 인라인 편집 → 전체 편집 모드 | 섹션별 `InlineEditor` 제거 → 단일 `ResumeEditor` (textarea)                                |
| AI 면책 문구 신규            | `AiDisclaimer` Server Component 추가 (정적 텍스트)                                         |
| 만족도 수집 신규             | `SatisfactionSurvey` Client Component 추가                                                 |
| 해결됨 섹션 삭제             | Green 상세 UI 제거, 카운트에만 표시                                                        |
| 버전 관리 없음               | 저장 = 덮어쓰기, 이력 UI 불필요                                                            |

---

## 핵심 결정 요약

| 결정                   | 선택                          | 근거                                                            |
| ---------------------- | ----------------------------- | --------------------------------------------------------------- |
| `/loading` 별도 라우트 | ❌ 삭제                       | `/result/[id]` 내부에서 상태 분기. URL 의미 유지, 새로고침 가능 |
| SSG 사용 여부          | ❌ 미사용                     | 모든 페이지가 사용자별 동적 데이터                              |
| 상태 관리 라이브러리   | ❌ 미사용                     | React 기본으로 충분, YAGNI                                      |
| 양방향 클릭 매칭       | ❌ MVP 미구현                 | 4.4 보류(마지막). 추후 추가 시 `MatchingController` 패턴 도입   |
| 등급 표시              | Server Component              | 정적 데이터, JS 불필요. SVG 그래프 대신 텍스트 배지             |
| 피드백 위치            | 별도 `FeedbackSection`        | v4에서 Red/Yellow flag가 독립 섹션으로 분리                     |
| 이력서 편집 방식       | 전체 textarea                 | v4 명세: "수정하기 클릭 시 텍스트 편집 모드 전환"               |
| Suspense 경계          | 1개 (패널+피드백)             | 헤더+등급+면책은 즉시 렌더, 나머지 streaming                    |
| `cookies()` 처리       | Promise로 Suspense 내 resolve | static shell 확보, TTFB/FCP 개선                                |
| 공고 탭 순서           | [원본\|요약]                  | v4 명세: 4.2 구성 요소 순서 기준                                |
| 공고 입력 탭 순서      | URL → 텍스트 → 이미지         | v4 명세: 1.2 순서 (이미지는 PoC)                                |
| 검색/페이지네이션      | `searchParams` (URL)          | 서버에서 처리, URL 공유 가능, 뒤로가기 자연스러움               |
| 재분석 횟수            | 서버 props → 클라이언트 state | 초기값 서버, 재분석 시 차감 후 `router.refresh()`               |
| 로그인 모달 트리거     | Context (`AuthModalContext`)  | 네비바 + 분석 버튼 양쪽에서 열어야 하므로 전역 필요             |
| OAuth 후 상태 복원     | `sessionStorage` (텍스트만)   | 파일은 재업로드 안내, 텍스트/URL만 복원                         |
| 로그인 모달 vs 페이지  | 모달                          | 명세서 요구 + 입력 상태 유지 필수                               |
| 만족도 저장 실패 처리  | 조용히 무시                   | v4 명세: "저장 실패: 조용히 실패(에러 미표시)"                  |
| 분석 결과 저장         | 덮어쓰기                      | v4 명세: 버전 관리 없음, 1건만 유지                             |
