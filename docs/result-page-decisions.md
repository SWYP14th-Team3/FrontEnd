# 분석 결과 페이지(/result/[id]) 구현 의사결정 기록

> 분석 결과 페이지 구현 시 데이터 페칭 전략, 컴포넌트 구조, 상태 관리, 자동저장, 재분석 UX, 반응형 레이아웃 등에 대한 기술적 의사결정과 그 근거를 기록한다.

---

## 1. 해결해야 할 문제

분석 결과 페이지는 JD와 이력서를 AI로 대조 분석한 결과를 보여주는 핵심 화면이다. 다음 요구사항을 충족해야 한다:

- 분석 결과 상세 데이터 조회 (`GET /analyses/{id}`)
- 충족/부분충족/미충족 카운트 + 전체 등급(상/중/하) 시각화
- 요건별 피드백 아코디언 (카테고리별 그룹화: 필수요건/우대사항)
- 이력서 텍스트 편집 + 자동저장 (debounce 500ms)
- 재분석 요청 + 등급 변화 애니메이션
- 저장하기 + 저장 완료 모달
- 만족도 피드백 (👍/👎)
- 로딩/에러 UI
- 반응형 레이아웃 (모바일/태블릿/데스크톱)

---

## 2. 데이터 페칭 전략

### 2-1. 서버 prefetch 대신 클라이언트 fetch 선택

**결정:** `page.tsx`에서 `prefetchQuery`를 사용하지 않고, 클라이언트 컴포넌트에서 `useSuspenseQuery`로 데이터를 가져온다.

```
page.tsx (서버) → ResultPageContainer (클라이언트) → SuspenseBoundary → ResultPageClient (useSuspenseQuery)
```

**근거:**

1. **API 함수가 상대경로를 사용한다** — `src/api/analysis/api.ts`의 `getAnalysis(id)`는 `fetch('/api/analyses/${id}')`로 Next.js catch-all Route Handler를 경유하는 클라이언트 프록시 패턴이다. 서버 컴포넌트에서 상대경로 fetch는 호스트를 알 수 없어 실패한다.

2. **MSW가 브라우저에서만 동작한다** — 현재 `NEXT_PUBLIC_MSW_ENABLED=true`로 MSW Service Worker를 사용 중인데, 서버 컴포넌트에서 fetch하면 MSW가 가로채지 못한다.

3. **이 페이지는 인증이 필요한 사용자별 데이터다** — SEO가 불필요하고, 공유 캐싱이 불가능한 데이터이므로 클라이언트 fetch의 단점(초기 빈 화면)이 크지 않다. SuspenseBoundary의 `pendingFallback`으로 로딩 UI를 보여주면 UX가 충분하다.

**추후 전환 가능:** 백엔드 연결 시 `analysisDetailOptions`에 서버용 fetcher를 추가하고 `HydrationBoundary`로 감싸면 prefetch로 전환할 수 있다.

### 2-2. SuspenseBoundary로 로딩/에러 처리

**결정:** Next.js 파일 컨벤션(`loading.tsx`, `error.tsx`) 대신 `SuspenseBoundary` 컴포넌트를 사용한다.

**근거:**

1. **`loading.tsx`는 라우트 전환 시 보여주는 UI다** — 페이지 내부의 데이터 로딩과는 별개다. 우리는 클라이언트에서 `useSuspenseQuery`가 데이터를 가져오는 동안 보여줄 UI가 필요한데, 이건 `Suspense`의 `fallback`으로 처리해야 한다.

2. **피그마에 전용 로딩/에러 디자인이 있다** — 로고 + 스피너 + "공고와 이력서를 비교하고있어요." + 프로그레스바 형태의 로딩 UI와, 경고 아이콘 + "이력서를 불러오지 못했어요." + 재시도 버튼 형태의 에러 UI를 `ResultLoadingFallback`과 `ResultErrorFallback`으로 구현했다.

3. **서버→클라이언트 함수 전달 문제 해결** — `errorFallback`은 `(error, reset) => ReactNode` 함수인데, `page.tsx`(서버)에서 `SuspenseBoundary`(클라이언트)로 함수를 직접 전달할 수 없다. 그래서 `ResultPageContainer`라는 클라이언트 래퍼를 추가하여 이 안에서 SuspenseBoundary + 함수 전달을 처리한다.

```tsx
// page.tsx (서버) — 함수를 직접 넘기지 않음
export default async function ResultPage({ params }) {
  const { id } = await params;
  return <ResultPageContainer id={Number(id)} />;
}

// ResultPageContainer.tsx (클라이언트) — 여기서 함수 전달
export function ResultPageContainer({ id }) {
  return (
    <SuspenseBoundary
      pendingFallback={<ResultLoadingFallback />}
      errorFallback={(error, reset) => <ResultErrorFallback error={error} onRetry={reset} />}
    >
      <ResultPageClient id={id} />
    </SuspenseBoundary>
  );
}
```

---

## 3. 컴포넌트 구조 설계

### 3-1. 파일 구조

```
src/app/result/[id]/
├── page.tsx                         # 서버 컴포넌트 (params만 처리)
└── _components/
    ├── ResultPageContainer.tsx       # 클라이언트 (SuspenseBoundary 래퍼)
    ├── ResultPageClient.tsx          # 클라이언트 루트 (데이터 소비 + 상태 관리)
    ├── ResultPageHeader.tsx          # 헤더 (뒤로가기 + 재분석 + 저장)
    ├── SummaryCard.tsx               # 요약 카드 (회사·포지션·배지)
    ├── GradeChangeBar.tsx            # 등급 변화 바 (재분석 시)
    ├── ChangeBadge.tsx               # 개별 변화 표시 (충족 5→7)
    ├── RequirementsPanel.tsx         # 좌측 패널 (탭 + 카테고리 그룹)
    ├── RequirementGroup.tsx          # 카테고리별 아코디언 그룹
    ├── ResumePanel.tsx               # 우측 패널 (이력서 편집)
    ├── FeedbackSection.tsx           # 만족도 피드백
    ├── SaveCompleteModal.tsx         # 저장 완료 모달
    ├── ResultLoadingFallback.tsx     # 로딩 UI
    ├── ResultErrorFallback.tsx       # 에러 UI
    ├── ReanalyzingOverlay.tsx        # 재분석 중 스켈레톤
    └── DisclaimerText.tsx            # AI 면책 문구
```

### 3-2. page.tsx는 얇은 래퍼

**결정:** `page.tsx`는 `params`에서 `id`를 추출하고 `ResultPageContainer`만 렌더링한다.

**근거:** 메인페이지와 동일한 패턴. 서버 컴포넌트를 유지하여 추후 메타데이터(`generateMetadata`)나 prefetch 추가 여지를 남긴다.

### 3-3. ResultPageClient가 모든 상태를 관리

**결정:** `useSuspenseQuery`, `useState`, mutation 훅들을 `ResultPageClient` 한 곳에서 관리하고, 자식 컴포넌트에 props로 전달한다.

**근거:**

- 이력서 텍스트(`resumeText`)가 자동저장, 재분석, 저장 세 가지 액션에서 공유된다.
- 등급 변화(`previousCounts`)가 SummaryCard와 재분석 핸들러에서 공유된다.
- 저장 상태(`isDirty`)가 저장 버튼 비활성화와 저장 모달에 영향을 준다.
- 이 상태들이 서로 의존하므로 한 컴포넌트에서 관리하는 게 가장 단순하다.

---

## 4. 기존 컴포넌트 수정 vs 신규 생성

### 4-1. Accordion 확장 (신규 컴포넌트 X)

**결정:** `RequirementAccordion`을 새로 만들지 않고 기존 `Accordion`에 props를 추가한다.

추가된 props:

- `rank?: number` — 순위 뱃지 (1 → "1순위")
- `badgeLabel?: string` — Badge 텍스트 오버라이드
- `open?: boolean` + `onOpenChange?: (open: boolean) => void` — 외부 제어 모드

**근거:**

1. **신규 컴포넌트의 단점** — 기존 Accordion과 동일한 접기/펼치기 로직, 같은 색상 체계, 같은 애니메이션을 복제해야 한다. 변경이 생기면 두 곳을 수정해야 한다.

2. **기존 API 호환성 유지** — 추가된 props가 모두 optional이므로 기존 사용처에서 변경 없이 동작한다.

3. **confirmed도 열림 가능하도록 변경** — 원래 `isCollapsible = resolvedVariant !== 'confirmed'`로 충족 항목은 열리지 않았는데, 피그마 디자인에서 충족 항목도 열려서 근거(evidence)와 피드백을 보여줘야 하므로 이 분기를 제거했다.

4. **외부 제어 모드(controlled)** — "모두 펼치기/접기" 기능을 위해 `open`/`onOpenChange` props를 추가했다. `open`이 전달되면 제어 모드로 동작하고, 아니면 내부 `useState`로 동작한다.

### 4-2. Accordion 내부 UI 변경

**결정:**

- 근거 섹션에 `FolderOpenIcon` + "근거" 라벨 추가
- 수정 제안 라벨을 "이렇게 보완해보세요" → "한끗 피드백"으로 변경
- Badge 라벨을 `확인됨/보강 필요/없음` → `충족/부분 충족/미충족`으로 변경

**근거:** 피그마 디자인 업데이트를 반영한 것이다.

### 4-3. Textarea 수정

**결정:** 고정 크기(`w-[429px] h-[129px]`)를 제거하고 `autoResize` prop을 추가한다.

```tsx
// autoResize 동작 원리
useEffect(() => {
  if (autoResize && textareaRef.current) {
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }
}, [autoResize, value, defaultValue]);
```

**근거:**

- 결과 페이지에서 이력서가 길 경우 textarea도 같이 늘어나야 한다.
- 기존 고정 크기는 메인페이지 채용공고 입력용이었고, 결과 페이지에서는 부모 컨테이너에 맞게 유연한 크기가 필요하다.
- `autoResize`는 optional이므로 기존 사용처에 영향 없다.

### 4-4. Button disabled 스타일

**결정:** `buttonVariants` base 클래스에 `disabled:cursor-not-allowed disabled:bg-gray-20 disabled:text-gray-40`을 추가한다.

**근거:** 저장 버튼이 비활성화 상태일 때 시각적으로 회색으로 보여야 UX가 명확하다. 기존에는 `disabled` 상태여도 스타일이 변하지 않아 사용자가 클릭 가능한지 판단할 수 없었다.

---

## 5. 자동저장 구현

### 5-1. useDebounce 기반 자동저장

**결정:** `@frontend-toolkit-js/hooks`의 `useDebounce` 훅을 사용하여 값 디바운스 → `useEffect`로 자동저장을 트리거한다.

```tsx
const debouncedResumeText = useDebounce(resumeText, 500);

useEffect(() => {
  if (debouncedResumeText !== initialTextRef.current) {
    autoSave.mutate(
      { resumeCurrentText: debouncedResumeText },
      {
        onSuccess: (response) => {
          setLastSavedAt(response.updatedAt);
          initialTextRef.current = debouncedResumeText;
        },
      },
    );
  }
}, [debouncedResumeText]);
```

**동작 원리:**

1. 사용자가 textarea에 입력 → `resumeText` 상태 변경
2. `useDebounce`가 500ms 동안 변경이 없으면 `debouncedResumeText` 업데이트
3. `useEffect`가 `debouncedResumeText`가 `initialTextRef.current`(마지막 저장 시점의 텍스트)와 다르면 `PATCH /analyses/{id}/resume` 호출
4. 성공 시 `lastSavedAt` 갱신 + `initialTextRef.current` 업데이트 (중복 저장 방지)

**근거:**

1. **`useRef` + 수동 타이머 대신 `useDebounce` 선택** — `useDebounce`는 값을 디바운스하는 단순한 훅이고, `useEffect`와 조합하면 자연스럽게 자동저장이 된다. 수동 타이머 관리(`setTimeout`/`clearTimeout`/`useRef`)보다 선언적이고 실수가 적다.

2. **`@frontend-toolkit-js/hooks` 패키지 사용** — 프로젝트 팀원이 만든 라이브러리로, React Compiler와 호환되는 단순한 `useState` + `useEffect` 구현이다.

3. **`initialTextRef`로 중복 저장 방지** — `debouncedResumeText`가 변해도 서버에 이미 저장된 텍스트와 같으면 API 호출을 하지 않는다. 재분석 후 `data.resumeCurrentText`가 바뀌면 `initialTextRef`도 동기화된다.

### 5-2. 자동저장 시각 표시

**결정:** 서버 응답의 `updatedAt`을 로컬 `lastSavedAt` state로 관리하여 즉시 반영한다.

**근거:** `data.lastSavedAt`은 `useSuspenseQuery`의 캐시에서 오므로 쿼리를 다시 fetch하기 전까지 갱신되지 않는다. 자동저장 성공 시 `response.updatedAt`을 로컬 state로 즉시 반영하면 서버 refetch 없이 시각이 업데이트된다.

---

## 6. 재분석 UX

### 6-1. 재분석 중 스켈레톤

**결정:** 반투명 오버레이 + 스피너 대신 전체 콘텐츠를 스켈레톤으로 대체한다.

```tsx
{isReanalyzing ? (
  <ReanalyzingOverlay />  // 스켈레톤
) : (
  <div>
    <SummaryCard ... />
    <RequirementsPanel ... />
    <ResumePanel ... />
  </div>
)}
```

**근거:** 반투명 오버레이는 뒤의 데이터가 비치면서 혼란을 줄 수 있다. 스켈레톤으로 완전히 대체하면 "새로운 결과를 가져오는 중"이라는 의미가 명확하다.

### 6-2. 등급 변화 표시

**결정:** 재분석 전 카운트를 클라이언트 state(`previousCounts`)에 저장하고, 새 데이터와 비교하여 `GradeChangeBar`를 표시한다.

**동작 원리:**

1. "재분석하기" 클릭 → 현재 `greenCount/yellowCount/redCount`를 `setPreviousCounts`에 저장
2. `useReanalyze` mutation → `invalidateQueries` → `useSuspenseQuery`가 새 데이터 fetch
3. `SummaryCard`가 `previousCounts`(이전)와 `data.*Count`(현재)를 비교하여 `GradeChangeBar` 렌더링
4. `GradeChangeBar`는 마운트 시 `opacity-0 → opacity-100` + `translate-y` 애니메이션

**한계:** 새로고침하면 `previousCounts`가 사라진다. 백엔드 API에 이전 카운트 필드가 없으므로 클라이언트에서 처리한 것이다.

### 6-3. 등급 상승 판정

**결정:** `greenCount`(충족 수)가 이전보다 증가하면 "등급 상승!"을 표시한다.

**근거:** 전체 등급(상/중/하)은 서버에서 계산하므로 프론트에서 판정하기 어렵다. 충족 수 증가는 명확한 개선 지표이므로 이를 기준으로 삼았다.

---

## 7. 저장 기능

### 7-1. 저장 버튼 비활성화

**결정:** 이력서를 수정하지 않으면(`isDirty === false`) 저장 버튼이 비활성화(회색)된다.

**동작 원리:**

- `savedTextRef` — 마지막 저장 시점의 텍스트를 기억
- `handleResumeChange` — `text !== savedTextRef.current`이면 `isDirty = true`
- 재분석 성공 시 — `isDirty = true` (결과가 바뀌었으므로 저장 가능)
- 저장 성공 시 — `isDirty = false` + `savedTextRef.current` 갱신

**근거:** 변경 없이 중복 저장하는 것을 방지하고, 비활성화 상태를 시각적으로 보여줘야 사용자가 현재 상태를 인지할 수 있다.

### 7-2. 저장 완료 모달

**결정:** 저장 성공 시 모달을 표시하며, "페이지에 남기"와 "저장목록으로 이동" 두 가지 선택지를 제공한다.

**근거:** 저장 후 즉시 페이지를 떠나면 추가 수정의 기회를 놓치고, 저장 후 아무 피드백이 없으면 저장이 된 건지 사용자가 불안하다. 모달로 저장 완료를 확인하고 다음 행동을 선택하게 한다.

---

## 8. 카테고리별 그룹화

### 8-1. 필수요건/우대사항 분리

**결정:** requirements 배열을 `category === '우대사항'`을 기준으로 필수요건(자격요건/업무역량/도메인)과 우대사항으로 분리하여 `RequirementGroup` 컴포넌트에 각각 전달한다.

**근거:** 피그마 디자인에서 "필수요건"과 "우대사항"을 별도 카드로 분리하여 보여준다. 각 그룹에 독립적인 "모두 펼치기/접기" 토글이 있다.

### 8-2. 모두 펼치기/접기 구현

**결정:** Accordion의 `open`/`onOpenChange` controlled 모드를 사용하여 부모(`RequirementsPanel`)에서 `openMap` state로 각 아코디언의 열림 상태를 관리한다.

```tsx
const [openMap, setOpenMap] = useState<Record<number, boolean>>({});

const handleExpandGroup = (reqs: Requirement[]) => {
  setOpenMap((prev) => {
    const next = { ...prev };
    for (const req of reqs) {
      next[req.requirementId] = true;
    }
    return next;
  });
};
```

**근거:**

처음에는 `key` prop 변경으로 Accordion을 리마운트시키는 방식을 사용했으나, 이 방식은 애니메이션이 없이 즉시 열리므로 UX가 부자연스러웠다. `open`/`onOpenChange` controlled 모드로 변경하면 Accordion 내부의 CSS `transition-[grid-template-rows,opacity] duration-300` 애니메이션이 그대로 적용되어 부드럽게 열린다.

---

## 9. 복사 피드백 UX

### 9-1. useCopyToClipboard 훅

**결정:** 복사 후 2초간 "복사 완료" 상태를 유지하는 커스텀 훅을 만들어 이력서 복사 버튼과 아코디언 복사 버튼에 공통으로 적용한다.

```tsx
export function useCopyToClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), resetDelay);
  };

  return { copied, copy };
}
```

**근거:** 복사 버튼을 눌렀을 때 아무 피드백이 없으면 복사가 된 건지 알 수 없다. 버튼 텍스트와 아이콘이 일시적으로 변하면("복사하기" → "복사 완료" + 체크 아이콘) 사용자에게 명확한 피드백을 준다. 2초 후 자동 복귀하므로 별도 사용자 액션이 필요 없다.

---

## 10. 반응형 레이아웃

### 10-1. 브레이크포인트 전략

**결정:** Tailwind 기본 브레이크포인트(`sm:640px`, `md:768px`, `lg:1024px`)를 사용한다.

| 화면                | 좌우 패널  | 헤더                      | SummaryCard    |
| ------------------- | ---------- | ------------------------- | -------------- |
| 모바일 (~639px)     | 세로 스택  | 세로 스택, 버튼 sm 사이즈 | 제목/배지 세로 |
| 태블릿 (640~1023px) | 세로 스택  | 가로 배치                 | 가로 배치      |
| 데스크톱 (1024+)    | 가로 50:50 | 가로 배치                 | 가로 배치      |

**근거:** 좌우 패널은 각각 충분한 너비가 필요하므로(아코디언 내 Badge + 순위 + 제목이 한 줄에 들어가야 함) `lg:1024px`부터 가로 배치한다. 헤더와 SummaryCard는 좁은 화면에서도 가로 배치가 가능하므로 `sm:640px`에서 전환한다.

---

## 11. 아이콘 관리

**결정:** 모든 아이콘을 `src/components/icon/`에 React 컴포넌트로 분리한다. 컴포넌트 파일에 인라인 SVG를 넣지 않는다.

신규 생성한 아이콘:

- `ChevronLeftIcon` — 뒤로가기 화살표
- `FolderOpenIcon` — 근거 섹션 아이콘 (`폴더 열기.svg`에서 변환)
- `LevelUpIcon` — 등급 상승 아이콘 (`up.svg`에서 변환)
- `ArrowRightIcon` — 등급 변화 화살표 (→ 형태)

**근거:** 프로젝트 규칙에 따라 아이콘 라이브러리를 사용하지 않고, SVG를 `src/components/icon/`에 컴포넌트화한다. 피그마에서 제공한 SVG 파일(`폴더 열기.svg`, `up.svg`)을 변환 후 원본은 삭제했다.

---

## 12. 만족도 피드백

### 12-1. Feedback 컴포넌트 래핑

**결정:** 기존 `Feedback` 컴포넌트를 수정하지 않고, `FeedbackSection`에서 래핑하여 API를 연동한다.

**동작 원리:**

- `initialSatisfaction === null` → 기존 `Feedback` 컴포넌트 렌더링, `onFeedback` 콜백에서 `useSatisfaction` mutation 호출
- `initialSatisfaction !== null` → 완료 상태 UI를 직접 렌더링 (CheckboxIcon + "의견이 반영되었어요!")

**근거:** 기존 `Feedback` 컴포넌트는 `defaultSelected` prop이 없어서 초기 상태를 외부에서 주입할 수 없다. 컴포넌트를 수정하면 기존 사용처에 영향을 줄 수 있으므로, `FeedbackSection`에서 조건 분기로 처리한다.

---

## 핵심 결정 요약

| 결정                      | 선택                         | 근거                                           |
| ------------------------- | ---------------------------- | ---------------------------------------------- |
| 서버 prefetch             | ❌ 클라이언트 fetch          | API 상대경로 + MSW 브라우저 전용               |
| loading.tsx / error.tsx   | ❌ SuspenseBoundary fallback | 피그마 전용 UI + 세밀한 제어                   |
| RequirementAccordion 신규 | ❌ 기존 Accordion 확장       | 코드 중복 방지, optional props로 호환성 유지   |
| 모두 펼치기/접기          | open/onOpenChange 제어 모드  | CSS 애니메이션 유지 (key 리마운트는 즉시 열림) |
| 자동저장                  | useDebounce + useEffect      | 선언적, React Compiler 호환                    |
| 등급 변화                 | 클라이언트 state             | 백엔드 API에 이전 카운트 필드 없음             |
| 저장 버튼 비활성화        | isDirty state                | 중복 저장 방지 + 시각적 피드백                 |
| 반응형 좌우 패널          | lg:1024px 전환               | 아코디언 내 콘텐츠 최소 너비 확보              |
| 복사 피드백               | useCopyToClipboard 훅        | 2초 자동 복귀, 공통 사용                       |
