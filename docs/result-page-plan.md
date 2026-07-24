# 분석 결과 페이지 (`/result/[id]`) 구현 계획

## 파일 구조

```
src/app/result/[id]/
├── page.tsx                         # Server Component
└── _components/
    ├── ResultPageClient.tsx          # Client 루트 (useSuspenseQuery로 데이터 소비)
    ├── ResultPageHeader.tsx          # 페이지 헤더 (뒤로가기 + 재분석 + 저장)
    ├── SummaryCard.tsx               # 요약 카드 (회사·포지션·배지)
    ├── RequirementsPanel.tsx         # 좌측 패널 (탭 + 아코디언 리스트)
    ├── ResumePanel.tsx               # 우측 패널 (텍스트 편집 + 자동저장)
    ├── FeedbackSection.tsx           # 만족도 피드백 + API 연동
    ├── ResultLoadingFallback.tsx     # 로딩 UI (로고 + 스피너 + 프로그레스바)
    ├── ResultErrorFallback.tsx       # 에러 UI (아이콘 + 메시지 + 재시도)
    └── DisclaimerText.tsx            # AI 면책 문구 (정적)
```

**수정되는 기존 파일:**

```
src/components/ui/Accordion/Accordion.tsx   # rank, badgeLabel props 추가
src/components/ui/Textarea/Textarea.tsx     # 고정 크기 제거 → 유연한 크기 지원
```

---

## 설계 결정

### 1. 클라이언트 fetch + SuspenseBoundary

백엔드 미연결 + MSW 브라우저 전용 환경이므로 서버 prefetch 생략.
클라이언트에서 `useSuspenseQuery` + `SuspenseBoundary`로 처리.
백엔드 연결 시 `analysisDetailOptions`에 serverFetcher 추가하여 prefetch 전환 가능.

### 2. loading.tsx / error.tsx 미사용 → SuspenseBoundary fallback

`loading.tsx`는 라우트 전환 시 Next.js가 보여주는 UI → 페이지 내부 데이터 로딩과 무관.
`error.tsx`는 라우트 레벨 에러 → SuspenseBoundary의 errorFallback이 더 세밀한 제어 가능.

피그마 디자인에 맞춘 전용 fallback 컴포넌트를 만들어서 SuspenseBoundary에 전달:

```tsx
// page.tsx
<SuspenseBoundary
  pendingFallback={<ResultLoadingFallback />}
  errorFallback={(error, reset) => <ResultErrorFallback error={error} onRetry={reset} />}
>
  <ResultPageClient id={Number(id)} />
</SuspenseBoundary>
```

**ResultLoadingFallback (피그마 기반)**:

- 한끗 로고 + Spinner (로고 주위 회전)
- "공고와 이력서를 비교하고있어요." 텍스트
- ProgressBar (indeterminate 애니메이션)

**ResultErrorFallback (피그마 기반)**:

- 경고 아이콘 (빨간색)
- "이력서를 불러오지 못했어요." 제목
- "잠시 후 다시 시도하면 더 좋은 결과 보여드릴게요." 부제
- "다시 시도하기" 버튼 → `reset()` 호출

### 3. 기존 Accordion 확장 (신규 컴포넌트 X)

기존 `Accordion`에 optional props 2개 추가:

```ts
rank?: number;        // 순위 뱃지 표시 (1 → "1순위")
badgeLabel?: string;  // Badge 텍스트 오버라이드 (기본: badgeLabelMap에서 자동)
```

**기존 동작 유지**: 두 props 모두 optional → 기존 사용처 영향 없음.

### 4. 기존 Textarea 수정

고정 크기(`w-[429px] h-[129px]`)를 제거하고 유연한 크기를 지원하도록 변경.

```tsx
// 변경 전
'flex w-[429px] h-[129px] flex-col gap-1 rounded-lg border p-[14px] bg-gray-0 transition-colors';

// 변경 후
'flex flex-col gap-1 rounded-lg border p-[14px] bg-gray-0 transition-colors';
```

기존 사용처에서 `className`으로 크기를 지정하거나, 부모 컨테이너로 크기 제어.

### 5. 자동저장 debounce — `@frontend-toolkit-js/hooks`

`useDebounce` 훅으로 값을 디바운스하고, `useEffect`로 자동저장 트리거:

```tsx
import { useDebounce } from '@frontend-toolkit-js/hooks';

const debouncedResumeText = useDebounce(resumeText, 500);

useEffect(() => {
  if (debouncedResumeText !== data.resumeCurrentText) {
    autoSave.mutate({ resumeCurrentText: debouncedResumeText });
  }
}, [debouncedResumeText]);
```

### 6. Feedback 초기값 처리

기존 `Feedback` 컴포넌트는 내부 `selected` 상태 관리 + `defaultSelected` prop 없음.

- `initialSatisfaction === null` → 기존 Feedback 렌더링
- `initialSatisfaction !== null` → 완료 상태 UI 직접 렌더링

---

## 컴포넌트별 상세

### `page.tsx` — Server Component

- `params: Promise<{ id: string }>` await
- `SuspenseBoundary`로 `ResultPageClient` 감싸기
- `pendingFallback`: ResultLoadingFallback
- `errorFallback`: ResultErrorFallback
- `export default`

### `ResultLoadingFallback.tsx` — Client Component

피그마 기반 로딩 UI:

- 한끗 로고 아이콘 (HankkutLogo 또는 SVG)
- Spinner 컴포넌트 (로고 주변 회전 — `size="lg"`)
- "공고와 이력서를 비교하고있어요." 텍스트
- ProgressBar 컴포넌트 (indeterminate 모드)
- 중앙 정렬, 전체 높이

### `ResultErrorFallback.tsx` — Client Component

**Props**: `{ error: Error; onRetry: () => void }`

피그마 기반 에러 UI:

- 경고/에러 아이콘 (빨간색 WarningIcon 또는 CancelPresentationIcon)
- "이력서를 불러오지 못했어요." 제목
- "잠시 후 다시 시도하면 더 좋은 결과 보여드릴게요." 부제
- Button(variant: primary, size: md) "다시 시도하기" → `onRetry()` 호출
- 중앙 정렬, 전체 높이

### `ResultPageClient.tsx` — Client Component

**Props**: `{ id: number }`

**핵심 로직**:

- `useSuspenseQuery(analysisDetailOptions(id))` → `data: AnalysisResult`
- `useState<string>(data.resumeCurrentText)` → `resumeText`
- `useDebounce(resumeText, 500)` → `debouncedResumeText`
- `useEffect` → `debouncedResumeText` 변화 시 `useAutoSaveResume(id).mutate()`
- `useReanalyze(id)` → 재분석
- `useSaveAnalysis(id)` → 저장
- `useSatisfaction(id)` → 만족도

**렌더링 구조**:

```
ResultPageClient
├── ResultPageHeader (재분석/저장 핸들러)
├── SummaryCard (회사·포지션·배지)
├── div.flex.gap-[9px] (좌우 2패널)
│   ├── RequirementsPanel (requirements, jobPostingRaw)
│   └── ResumePanel (resumeText, onChange, lastSavedAt)
├── FeedbackSection (analysisId, initialSatisfaction)
└── DisclaimerText
```

### `ResultPageHeader.tsx` — Client Component

**Props**:

```ts
{
  remainingRetryCount: number;
  onReanalyze: () => void;
  onSave: () => void;
  isSavePending: boolean;
  isReanalyzePending: boolean;
}
```

- `< 핏 분석 결과` 뒤로가기 (`useRouter().back()`)
- `재분석하기 · N회남음` 버튼 (primary, md) — `remainingRetryCount === 0`이면 disabled
- `저장하기` 버튼 (primary, md)

### `SummaryCard.tsx`

**Props**:

```ts
{
  companyName: string | null;
  positionTitle: string | null;
  overallLevel: OverallLevel;
  greenCount: number;
  yellowCount: number;
  redCount: number;
}
```

- CountBadge × 3 (충족/부분 충족/미충족) + PriorityBadge (상/중/하)
- `bg-secondary-5 border-4 border-white rounded-xxxl shadow` 카드

### `Accordion.tsx` — 기존 컴포넌트 수정

**추가 Props**:

```ts
rank?: number;        // 순위 뱃지 (1 → "1순위")
badgeLabel?: string;  // Badge 텍스트 오버라이드
```

**변경 포인트**:

1. `AccordionProps` 타입에 `rank`, `badgeLabel` 추가
2. 헤더에 rank 뱃지 조건부 렌더링 (collapsible + non-collapsible 모두)
3. Badge children을 `badgeLabel ?? badgeLabelMap[resolvedVariant]`로 변경

### `Textarea.tsx` — 기존 컴포넌트 수정

**변경**:

- `textareaVariants`에서 `w-[429px] h-[129px]` 제거
- 외부에서 `className`으로 크기 제어 가능하도록

### `RequirementsPanel.tsx` — Client Component

**Props**:

```ts
{
  requirements: Requirement[];
  jobPostingRaw: string;
  jobUrl: string | null;
  jobInputType: JobInputType;
}
```

- ToggleGroup 탭: "수정 우선순위" | "원본 공고"
- priority 탭: requirements → Accordion (rank, badgeLabel 전달)
- original 탭: jobPostingRaw 텍스트 (pre-wrap)
- "모두 펼치기 | 모두 접기" 토글

### `ResumePanel.tsx` — Client Component

**Props**:

```ts
{
  resumeText: string;
  lastSavedAt: string | null;
  isAutoSaving: boolean;
  onChange: (text: string) => void;
}
```

- 헤더: "내 이력서" + "자동 저장 완료 HH:MM" (또는 "저장 중...")
- 복사하기 버튼
- Textarea 컴포넌트 (`className`으로 전체 높이 지정)

### `FeedbackSection.tsx` — Client Component

**Props**: `{ analysisId: number; initialSatisfaction: 'LIKE' | 'DISLIKE' | null }`

- `useSatisfaction(analysisId)` hook
- null이면 Feedback 컴포넌트, 아니면 완료 UI

### `DisclaimerText.tsx` — 순수 렌더링

AI 면책 정적 문구.

---

## 기존 컴포넌트 활용

| 구분            | 컴포넌트             | 사용처                                          |
| --------------- | -------------------- | ----------------------------------------------- |
| **수정**        | Accordion            | rank, badgeLabel props 추가                     |
| **수정**        | Textarea             | 고정 크기 제거                                  |
| 그대로 사용     | Badge, PriorityBadge | SummaryCard, Accordion                          |
| 그대로 사용     | CountBadge           | SummaryCard                                     |
| 그대로 사용     | ToggleGroup          | RequirementsPanel                               |
| 그대로 사용     | Button               | ResultPageHeader                                |
| 그대로 사용     | Feedback             | FeedbackSection                                 |
| 그대로 사용     | SuspenseBoundary     | page.tsx                                        |
| 그대로 사용     | Spinner              | ResultLoadingFallback                           |
| 그대로 사용     | ProgressBar          | ResultLoadingFallback                           |
| **외부 패키지** | `useDebounce`        | `@frontend-toolkit-js/hooks` → ResultPageClient |

---

## 작업 의존성 & 병렬 배분

```
병렬 그룹 A (독립 작업, 동시 진행 가능):
  ├── Accordion.tsx 수정 (rank, badgeLabel 추가)
  ├── Textarea.tsx 수정 (고정 크기 제거)
  ├── ResultPageHeader.tsx
  ├── SummaryCard.tsx
  ├── DisclaimerText.tsx
  ├── ResumePanel.tsx (Textarea 수정과 독립 작업 가능 — className으로 크기 제어)
  ├── FeedbackSection.tsx
  ├── ResultLoadingFallback.tsx
  └── ResultErrorFallback.tsx

순차 그룹 B (Accordion 수정 완료 후):
  └── RequirementsPanel.tsx (수정된 Accordion 사용)

순차 그룹 C (A+B 완료 후, 전체 조립):
  ├── ResultPageClient.tsx (모든 컴포넌트 조립)
  └── page.tsx (ResultPageClient 사용)
```

---

## 주의사항

1. **React Compiler**: `useMemo`/`useCallback`/`React.memo` 사용 금지
2. **컴포넌트 함수 선언문**: `function X() {}` (화살표 함수 X)
3. **핸들러 화살표 함수**: `const handleClick = () => {}`
4. **Named export**: 페이지 파일(`page.tsx`)만 `export default`
5. **matchStatus 케이싱 변환**: API(`CONFIRMED`) → 컴포넌트(`confirmed`)
6. **overallLevel 변환**: `HIGH→high`, `MEDIUM→medium`, `LOW→low`
7. **Accordion 수정 시**: 기존 Storybook(`Accordion.stories.tsx`)이 깨지지 않는지 확인
8. **Textarea 수정 시**: 기존 사용처에서 크기가 변경되므로 확인 필요
