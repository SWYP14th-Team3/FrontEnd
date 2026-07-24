# 메인페이지(/) 구현 의사결정 기록

> 메인페이지 구현 시 컴포넌트 설계, 폼 상태 관리, 비로그인 제출 흐름, 플랫폼별 활성화 조건, 이미지 업로드 UI 등에 대한 기술적 의사결정과 그 근거를 기록한다.

---

## 1. 해결해야 할 문제

메인페이지는 서비스의 핵심 진입점으로, 사용자가 이력서(PDF)와 채용공고(URL/텍스트/이미지)를 입력하고 "분석하기"를 클릭하여 AI 분석을 요청하는 페이지다. 다음 요구사항을 충족해야 한다:

- 이력서 PDF 업로드 (drag&drop + 클릭, 10MB 제한)
- 채용공고 입력 (URL, 텍스트 붙여넣기, 이미지 올리기 3가지 방식)
- 사람인/직행 등 플랫폼별로 다른 입력 조합 요구
- 비로그인 사용자가 폼을 채운 뒤 로그인해도 입력 데이터가 유지되어야 함
- `POST /api/analyses` (multipart/form-data) API 호출 후 결과 페이지로 이동

---

## 2. 컴포넌트 구조 설계

### 2-1. page.tsx는 얇은 래퍼, 로직은 HomePage에 집중

**결정:** `page.tsx`는 `<HomePage />`만 렌더링하고, 모든 상태와 로직은 `HomePage.tsx`에 둔다.

```
src/app/
├── page.tsx              ← default export, HomePage만 렌더
└── _components/
    ├── HomePage.tsx       ← 'use client', 폼 상태 + 제출 로직
    ├── HeroSection.tsx    ← 히어로 영역 (상호작용 없음)
    ├── ResumeUploadCard.tsx  ← 이력서 업로드 카드
    ├── JobPostingCard.tsx    ← 채용공고 카드
    └── ImageUploadArea.tsx   ← 이미지 업로드 영역
```

**근거:**

1. **page.tsx의 역할 분리** — Next.js App Router에서 `page.tsx`는 라우팅 진입점이다. 여기에 상태 로직을 넣으면 `'use client'`를 선언해야 하고, 메타데이터(`generateMetadata`) 등 서버 기능을 쓸 수 없게 된다. 얇은 래퍼로 유지하면 나중에 메타데이터나 데이터 프리페칭을 추가할 여지가 남는다.

2. **`_components/` 컨벤션** — 프로젝트 규칙(`.claude/rules/file-structure.md`)에 따라 페이지 전용 컴포넌트는 해당 라우트의 `_components/`에 둔다. 메인페이지에서만 쓰이는 HeroSection, ResumeUploadCard 등이 이에 해당한다.

3. **HeroSection, ResumeUploadCard에 `'use client'` 미선언** — 이 컴포넌트들은 자체적으로 hooks나 이벤트 핸들러를 사용하지 않는다. 부모인 `HomePage`가 `'use client'`이므로 자동으로 클라이언트 렌더링된다. 불필요한 `'use client'` 선언을 피하는 것이 프로젝트 규칙이다.

### 2-2. 아이콘은 SVG 컴포넌트로 분리

**결정:** 피그마에서 제공된 SVG 파일을 `src/components/icon/` 하위에 React 컴포넌트로 변환한다.

**근거:**

- 프로젝트 규칙: 아이콘 라이브러리를 사용하지 않고, SVG를 ReactNode로 직접 주입한다.
- `fill="currentColor"` 또는 `stroke="currentColor"`를 사용하여 부모의 `text-*` 클래스로 색상을 제어할 수 있다.
- `aria-hidden="true"`를 기본 적용하여 장식적 아이콘이 스크린리더에 노출되지 않도록 한다.

---

## 3. 폼 상태 관리

### 3-1. 모든 상태를 HomePage에 집중

**결정:** `resumeFile`, `jobUrl`, `jobText`, `contentMode`, `jobImages`, `jobImagePreviews`, `fileError`를 모두 `HomePage`의 `useState`로 관리한다.

**검토한 선택지:**

| 방식                       | 장점                                  | 단점                                               |
| -------------------------- | ------------------------------------- | -------------------------------------------------- |
| 각 카드 내부에서 상태 관리 | 컴포넌트 독립성                       | 제출 시 상태 수집이 복잡, prop drilling 역방향     |
| HomePage에서 통합 관리     | 제출 로직 단순, 활성화 조건 계산 용이 | 카드 컴포넌트가 controlled                         |
| Context / Zustand          | 깊은 prop drilling 해소               | 이 페이지에서는 depth가 2단계밖에 안 됨, 과잉 설계 |

**통합 관리를 선택한 근거:**

1. **활성화 조건이 복잡** — 분석하기 버튼의 활성화 조건이 `resumeFile` + `jobUrl` + `jobText` + `jobImages`를 모두 참조한다. 플랫폼별(사람인/직행) 조건까지 있어서 한 곳에서 계산하는 것이 명확하다.
2. **FormData 구성** — 제출 시 모든 입력값을 FormData로 합쳐야 한다. 상태가 한 곳에 있으면 단순하다.
3. **prop depth가 얕음** — HomePage → Card → Input 정도로 2단계. Context가 필요할 만큼 깊지 않다.

### 3-2. 이미지 preview URL 관리

**결정:** `jobImagePreviews` (blob URL 배열)를 별도 state로 관리하고, 추가/삭제 핸들러에서 `URL.createObjectURL` / `URL.revokeObjectURL`을 직접 호출한다.

**검토한 선택지:**

| 방식                                     | 문제                                                |
| ---------------------------------------- | --------------------------------------------------- |
| JSX에서 직접 `URL.createObjectURL(file)` | 렌더마다 새 URL 생성 → 메모리 누수                  |
| `useEffect` + `setState`                 | React Compiler가 effect 내 `setState`를 에러로 판단 |
| `useRef`로 URL Map 관리                  | React Compiler가 렌더 중 ref 접근을 에러로 판단     |
| **핸들러에서 동기적 관리**               | React Compiler 호환, 메모리 누수 없음               |

**핸들러 방식을 선택한 근거:**

React Compiler(이 프로젝트에서 활성화됨)는 다음을 금지한다:

- 렌더 중 `ref.current` 접근 (`react-hooks/refs` 에러)
- effect 내 동기적 `setState` (`react-hooks/set-state-in-effect` 에러)

따라서 `handleImagesAdd`에서 URL을 생성하고, `handleImageRemove`에서 해당 URL을 해제하는 방식이 유일하게 React Compiler와 호환되는 접근이다. unmount 시 잔여 URL 해제를 위한 cleanup effect도 추가했다.

---

## 4. 비로그인 제출 흐름

### 4-1. 로그인 후 자동 제출

**결정:** 비로그인 상태에서 "분석하기" 클릭 시 로그인 모달을 띄우고, 로그인 성공 후 자동으로 분석 API를 호출한다.

**동작 원리:**

```
[사용자] 폼 입력 완료 → "분석하기" 클릭
    ↓
[handleSubmit] isLoggedIn === false
    ↓ pendingSubmitRef.current = true
    ↓ overlay.open(LoginModal)
    ↓
[사용자] 로그인/회원가입 완료
    ↓
[useUser] React Query invalidate → isLoggedIn = true
    ↓
[useEffect] isLoggedIn 변경 감지 + pendingSubmitRef === true
    ↓ pendingSubmitRef.current = false
    ↓ submitAnalysis() 호출
    ↓
[API] POST /api/analyses → 성공 → router.push('/result/{id}')
```

**검토한 선택지:**

| 방식                        | 장점                    | 단점                                               |
| --------------------------- | ----------------------- | -------------------------------------------------- |
| 모달 `close` 콜백에서 제출  | 단순                    | 모달을 그냥 닫아도 제출됨 (X 버튼, 배경 클릭)      |
| `isLoggedIn` useEffect 감지 | 로그인 성공 시에만 제출 | stale closure 주의 필요                            |
| 비로그인 시 버튼 disabled   | 가장 단순               | UX 저하 (먼저 로그인해야 하므로 폼 입력 동기 약화) |

**useEffect 감지를 선택한 근거:**

1. **기존 패턴과 일관성** — 헤더의 `AuthSection`이 이미 `overlay.open(LoginModal)` 패턴을 사용한다. 같은 모달을 재사용하면서 제출 후속 동작만 추가한다.
2. **폼 데이터 보존** — 팝업 OAuth를 사용하므로 메인 페이지가 리로드되지 않고, `useState`의 값이 그대로 유지된다. 이는 헤더 구현 시 클라이언트 컴포넌트를 선택한 핵심 근거(`docs/header-auth-decisions.md`)와 같다.
3. **pendingSubmitRef로 의도 구분** — 페이지 최초 로드 시에도 `isLoggedIn`이 변할 수 있다(React Query 초기 fetch). `pendingSubmitRef`가 없으면 원치 않는 자동 제출이 발생한다.

### 4-2. stale closure 처리

**결정:** `useEffect`의 deps에 `submitAnalysis`를 넣지 않고, `eslint-disable`로 경고를 억제한다.

**근거:**

`submitAnalysis`는 `resumeFile`, `jobUrl`, `jobText`, `canSubmit`, `createAnalysis`, `router`를 클로저로 캡처한다. React Compiler 환경에서:

- `useRef`에 최신 함수를 저장하려 하면 → 렌더 중 ref 접근 에러
- deps에 `submitAnalysis`를 넣으면 → 매 렌더마다 effect 재실행

실제로 이 effect가 발동하는 시점은 `isLoggedIn`이 false → true로 바뀔 때뿐이고, 그 시점에서 `submitAnalysis`는 최신 렌더의 클로저를 참조한다 (React의 기본 동작). stale closure가 문제가 되려면 로그인 모달이 열린 상태에서 사용자가 폼을 수정해야 하는데, 모달이 화면을 덮고 있어 물리적으로 불가하다.

---

## 5. 분석하기 버튼 활성화 조건

### 5-1. 플랫폼별 조건 분기

**결정:** URL에 포함된 도메인으로 플랫폼을 감지하고, 플랫폼별로 다른 활성화 조건을 적용한다.

```tsx
const hasJobInput = (() => {
  if (isSaramin) return hasUrl && jobImages.length > 0;
  if (isJikhaeng) return hasUrl && (isJobTextValid || jobImages.length > 0);
  return hasUrl || isJobTextValid || jobImages.length > 0;
})();

const canSubmit = !!resumeFile && hasJobInput;
```

| 플랫폼 | 감지 조건                                  | 활성화 조건                             | 이유                                         |
| ------ | ------------------------------------------ | --------------------------------------- | -------------------------------------------- |
| 사람인 | URL에 `saramin.co.kr` 포함                 | URL + 이미지                            | 사람인 공고는 이미지로만 내용 파악 가능      |
| 직행   | URL에 `zighang.com`/`jikhaeng`/`직행` 포함 | URL + (텍스트 100자+ 또는 이미지)       | 직행은 URL만으로 크롤링 불가, 보조 입력 필요 |
| 기타   | 위에 해당하지 않음                         | URL, 텍스트(100~6000자), 이미지 중 하나 | 일반적인 경우                                |

**근거:**

- 사람인은 채용공고 본문이 이미지로 되어 있어 URL 크롤링만으로는 자격요건/우대사항을 추출할 수 없다.
- 직행(지그행)은 동적 렌더링으로 인해 서버사이드 크롤링이 어려워 텍스트 또는 이미지 보조가 필요하다.
- 이 로직은 URL 입력 시 InfoIcon과 함께 안내 메시지를 표시하여 사용자에게 필요한 입력을 알려준다.

### 5-2. 버튼 시각적 상태

**결정:** `canSubmit` 여부에 따라 Button의 `variant`를 전환한다.

```tsx
<Button
  variant={canSubmit ? 'primary' : 'assistive'}
  disabled={!canSubmit || isPending}
  onClick={handleSubmit}
>
```

- **비활성 (`assistive`)**: 회색 배경 + disabled — 입력이 부족함을 시각적으로 전달
- **활성 (`primary`)**: 파란색 배경 — 제출 가능 상태
- **제출 중 (`isPending`)**: 파란색 유지 + disabled + "분석 중..." 텍스트

**근거:** 기존 `Button` 컴포넌트의 `variant` 시스템을 활용. disabled 상태의 별도 스타일이 없으므로 `assistive` variant로 회색 처리한다.

---

## 6. 이미지 업로드 (UI만, 백엔드 미지원)

### 6-1. UI 선행 구현

**결정:** 백엔드 API가 이미지를 아직 지원하지 않지만, 디자인이 확정되었으므로 UI를 먼저 구현한다. 제출 시 이미지는 FormData에 포함하지 않는다.

**근거:**

- 디자인팀에서 이미지 업로드 화면을 확정했고, 백엔드 개발이 예정되어 있다.
- UI를 먼저 구현해두면 백엔드 완료 시 `submitAnalysis`에서 `formData.append('jobImages', ...)` 한 줄만 추가하면 된다.
- 사용자 테스트에서 전체 흐름을 미리 확인할 수 있다.

### 6-2. 이미지 제약 조건

| 항목      | 값                                | 근거                                                   |
| --------- | --------------------------------- | ------------------------------------------------------ |
| 허용 포맷 | `.jpg`, `.jpeg`, `.png`           | 채용공고 스크린샷 용도, 벡터(SVG)나 문서(PDF)는 불필요 |
| 최대 장수 | 10장                              | 채용공고 전체를 캡처하기에 충분하면서 서버 부하 제한   |
| 삭제 버튼 | 배경 없이 `text-gray-30` X 아이콘 | 피그마 디자인 기준, 썸네일 위에서 가시성 확보          |

---

## 7. 기존 컴포넌트 활용 vs 신규 구현

| 영역               | 기존 컴포넌트       | 활용 여부    | 이유                                                                                                |
| ------------------ | ------------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| 이력서 업로드 영역 | `FileUploadArea`    | ✅ 활용      | drag&drop, 파일 표시 상태가 이미 구현됨                                                             |
| 텍스트/이미지 토글 | `ToggleGroup`       | ✅ 활용      | active/inactive 스타일이 피그마와 정확히 일치                                                       |
| 공고 텍스트 입력   | `Textarea`          | ✅ 활용      | maxLength 카운터가 내장되어 있음                                                                    |
| 분석하기 버튼      | `Button`            | ✅ 활용      | variant="primary"/"assistive"로 상태 표현                                                           |
| 파일 에러 메시지   | `ValidationMessage` | ✅ 활용      | WarningIcon + 에러 텍스트 패턴                                                                      |
| 공고 URL 입력      | `Input`             | ❌ 미활용    | 피그마에서 LinkIcon이 input 내부에 있는 레이아웃이라 Input 컴포넌트의 구조와 맞지 않음. 커스텀 구현 |
| 이미지 업로드 영역 | 없음                | ❌ 신규 구현 | 기존에 해당 컴포넌트가 없음                                                                         |
| 로그인 모달        | `LoginModal`        | ✅ 재사용    | AuthSection.tsx와 동일한 `overlay.open()` 패턴                                                      |

### FileUploadArea 수정 사항

기존 `FileUploadArea`에 2가지 변경을 가했다:

1. **고정 width 제거** — 파일 표시 상태의 `w-[430px]`을 제거하여 부모 width에 맞추도록 변경. `className` prop으로 외부에서 제어 가능.
2. **내부 maxSize 검증 제거** — `FileUploadArea` 내부에서 파일 크기를 체크하면 콜백이 호출되지 않아 부모에서 에러 메시지를 표시할 수 없었음. 검증을 부모(`HomePage`)로 이동하여 `ValidationMessage`로 피드백 제공.

---

## 8. 파일 구조 요약

```
src/
├── app/
│   ├── page.tsx                          # HomePage 렌더링 (default export)
│   └── _components/
│       ├── HomePage.tsx                   # 'use client' — 폼 상태 + 제출 로직
│       ├── HeroSection.tsx               # 히어로 타이틀 + 한끗 로고
│       ├── ResumeUploadCard.tsx          # 이력서 업로드 카드
│       ├── JobPostingCard.tsx            # 채용공고 카드 (URL + 토글 + Textarea + 이미지)
│       └── ImageUploadArea.tsx           # 이미지 업로드 영역
└── components/icon/
    ├── HankkutLogo.tsx                   # 히어로 로고 (Group 10.svg 기반)
    ├── ImageIcon.tsx                     # 범용 이미지 아이콘
    ├── InfoIcon.tsx                      # 정보 힌트 아이콘
    ├── TextPasteIcon.tsx                 # 텍스트 붙여넣기 토글 아이콘 (text2.svg 기반)
    ├── ImageUploadIcon.tsx               # 이미지 올리기 토글 아이콘 (akar-icons_image.svg 기반)
    └── PlusCircleIcon.tsx                # 추가하기 버튼 아이콘 (line-md_plus-circle.svg 기반)
```

---

## 9. 향후 작업

| 항목                     | 설명                                                          | 의존성                                    |
| ------------------------ | ------------------------------------------------------------- | ----------------------------------------- |
| 이미지 API 연동          | `submitAnalysis`에서 `formData.append('jobImages', ...)` 추가 | 백엔드 이미지 필드 지원                   |
| 결과 페이지              | `/result/[id]` 구현                                           | 현재 `router.push`만 호출, 페이지 미구현  |
| 텍스트 100자 미만 피드백 | 텍스트 입력 시 100자 미만이면 안내 메시지 표시                | 디자인 확인 필요                          |
| sessionStorage 복원      | 새로고침 시 URL/텍스트 입력값 복원                            | `rendering-strategy.md`에 명시된 요구사항 |
