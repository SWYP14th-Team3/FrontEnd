# 공통 컴포넌트(Button, SegmentedControl, TabMenu, ToggleGroup) 의사결정 기록

> 이슈 #33 작업 과정에서 내린 기술적 의사결정과 그 근거를 기록한다.

---

## 1. 왜 이 작업을 시작했는가

ResuFit의 UI 페이지 개발에 앞서, 반복적으로 사용되는 버튼과 탭 전환 컴포넌트가 필요했다. Figma 17:65627 페이지에서 확인된 실제 사용처는 다음과 같다:

| 컴포넌트         | 사용처                                  |
| ---------------- | --------------------------------------- |
| Button           | 분석하기, 로그인, 다이얼로그(저장/취소) |
| SegmentedControl | 입력방법 (공고 URL / 공고 텍스트)       |
| TabMenu          | 메뉴 (분석하기 / 분석 기록)             |
| ToggleGroup      | 공고선택 (요약 공고 / 원본 공고)        |

이 4종을 공통 컴포넌트로 만들어두면 페이지 작업 시 스타일 일관성을 유지하면서 빠르게 조합할 수 있다.

---

## 2. 의사결정 목록

### 2-1. Figma 디자인 시스템(2 Action) 대신 실제 화면(17:65627) 기준으로 구현

**결정:** Wanted Design System의 범용 컴포넌트(48개 variant의 Button, 4종 IconButton 등)가 아니라, Figma 17:65627 페이지에 있는 **ResuFit 실제 화면에서 사용되는 컴포넌트**만 구현한다.

**근거:**

처음에는 Wanted Design System의 "2 Action" 섹션을 기준으로 Button(variant: solid/outlined, color: primary/assistive, size: lg/md/sm, iconOnly, loading 등 48개 조합), IconButton(normal/background/outlined/solid 4종), TextButton을 모두 구현하려 했다.

하지만 실제 ResuFit 화면에서 사용되는 버튼은 훨씬 단순했다:

- 분석하기 버튼: solid primary / solid assistive 2종
- 로그인 버튼: solid primary sm 1종
- 다이얼로그 버튼: solid primary md + solid assistive md

48개 variant를 만들어봤자 대부분 사용되지 않는다. **실제 화면에서 필요한 것만 만들고, 필요할 때 추가**하는 것이 낫다.

---

### 2-2. 프로젝트 디자인 토큰 사용 (Figma 시맨틱 토큰 X)

**결정:** Figma의 Wanted 시맨틱 토큰(`--primary/normal: #0066FF` 등)이 아니라, `globals.css`의 `@theme`에 정의된 프로젝트 토큰(`--color-primary-40: #4C87F6` 등)을 사용한다.

**근거:**

Figma 디자인 시스템과 프로젝트의 색상 체계가 다르다:

| 항목          | Figma Wanted DS            | 프로젝트 globals.css           |
| ------------- | -------------------------- | ------------------------------ |
| primary 기본  | `#0066FF` (primary/normal) | `#4C87F6` (primary-40)         |
| gray 체계     | `#171719` (label/normal)   | `#1E2124` (gray-90)            |
| border radius | xxxlarge: 16px (토큰 없음) | `--radius-xxxl: 16px` (추가함) |

프로젝트에 이미 구축된 디자인 토큰 체계(`globals.css`의 `@theme`)를 기준으로 해야 Tailwind 클래스(`bg-primary-40`, `text-gray-0`, `rounded-xxxl`)로 자연스럽게 사용할 수 있다. Figma 토큰을 그대로 가져오면 `bg-[#0066FF]` 같은 하드코딩이 필요하고, 토큰 체계가 이중화된다.

---

### 2-3. `tailwind-merge` 커스텀 토큰 등록

**결정:** `cn()` 함수에서 사용하는 `tailwind-merge`에 `text-body-*`, `text-heading-*` 토큰을 `font-size` 그룹으로 등록한다.

**근거:**

Tailwind v4의 `@theme`에서 `--text-body-lg: 19px`로 정의한 토큰은 `text-body-lg` 클래스를 생성한다. 그런데 `tailwind-merge`는 이 커스텀 토큰을 모른다.

```
cn('text-gray-0', 'text-body-lg')
```

이 코드에서 `tailwind-merge`는 `text-gray-0`(색상)과 `text-body-lg`(폰트 크기)를 **같은 `text-*` 그룹**으로 판단하고, 나중에 오는 `text-body-lg`만 남기고 `text-gray-0`을 제거한다. 결과: 글자 색상이 사라지고 검은색이 된다.

**해결:**

```ts
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        'text-heading-xl',
        'text-heading-lg' /* ... */,
        'text-body-lg',
        'text-body-md',
        'text-body-sm',
        'text-body-xs',
      ],
    },
  },
});
```

이렇게 등록하면 `tailwind-merge`가 `text-body-lg`를 폰트 크기로 인식하여, `text-gray-0`(색상)과 충돌하지 않는다.

**동작 흐름:**

```
cn('bg-primary-40 text-gray-0', 'text-body-lg')

등록 전: text-gray-0 제거 → 'bg-primary-40 text-body-lg' (색상 사라짐 ❌)
등록 후: 별개 그룹으로 인식 → 'bg-primary-40 text-gray-0 text-body-lg' (정상 ✅)
```

---

### 2-4. shadcn 베스트 프랙티스 적용 (React.ComponentProps + asChild + Composition)

**결정:** shadcn/ui의 컴포넌트 설계 패턴을 따른다.

**근거:**

shadcn/ui는 2026년 현재 React 컴포넌트 라이브러리의 사실상 표준이다. Headless UI, Ark UI, Radix UI 등 주요 라이브러리도 동일한 패턴을 사용한다. 이 패턴을 따르면:

1. 팀원이 shadcn 경험이 있으면 바로 이해할 수 있다
2. 향후 shadcn 컴포넌트를 도입해도 패턴이 일관된다
3. 업계에서 검증된 확장성을 가진다

적용한 패턴 3가지:

**패턴 1: `React.ComponentProps<'button'>` 확장 + `...props` 스프레드**

```tsx
type ButtonProps = React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, children, ...props }: ButtonProps) {
  return <button className={cn(variants, className)} {...props} />;
}
```

이렇게 하면 사용하는 곳에서 `onClick`, `disabled`, `aria-*` 등 **button의 모든 네이티브 속성을 자유롭게 전달**할 수 있다. Props를 하나하나 추가할 필요가 없다.

```tsx
// 이 모든 것이 별도 props 정의 없이 가능
<Button onClick={handleClick}>분석하기</Button>
<Button disabled>로딩중...</Button>
<Button aria-label="분석" onMouseEnter={handleHover}>분석</Button>
```

**패턴 2: asChild + Slot**

```tsx
// 버튼 스타일을 가진 링크
<Button asChild>
  <Link href="/result">결과 보기</Link>
</Button>
```

`asChild`가 `true`이면 `<button>` 대신 자식 요소를 렌더링하되, Button의 `className`과 `props`를 자식에 합쳐준다. Slot 컴포넌트가 이 합치기를 담당한다.

**동작 흐름:**

```
<Button asChild className="bg-primary-40">
  <Link href="/result">결과 보기</Link>
</Button>

↓ asChild=true이므로 Slot으로 렌더링

<Slot className="bg-primary-40 ...">
  <Link href="/result">결과 보기</Link>
</Slot>

↓ Slot이 cloneElement로 자식에 props 합침

<Link href="/result" className="bg-primary-40 ...">결과 보기</Link>
```

결과적으로 `<a>` 태그로 렌더링되지만 Button의 스타일을 그대로 가진다.

**패턴 3: Composition (Context + .Item)**

```tsx
// 배열 패턴 (❌ 이전 방식)
<TabMenu
  items={[
    { value: 'analyze', label: '분석하기' },
    { value: 'history', label: '분석 기록' },
  ]}
  value={value}
  onChange={setValue}
/>

// Composition 패턴 (✅ 현재 방식)
<TabMenu value={value} onChange={setValue}>
  <TabMenu.Item value="analyze">분석하기</TabMenu.Item>
  <TabMenu.Item value="history">분석 기록</TabMenu.Item>
</TabMenu>
```

배열 패턴에서는 아이콘, 커스텀 콘텐츠, 개별 이벤트 핸들러를 넣으려면 item 타입에 props를 계속 추가해야 한다. Composition 패턴에서는 `children`으로 자유롭게 넣으면 된다.

**동작 흐름 (Context 기반):**

```
<TabMenu value="analyze" onChange={setValue}>    ← Context Provider (value, onChange 제공)
  <TabMenu.Item value="analyze">                ← Context Consumer (value 비교 → active 스타일)
    분석하기
  </TabMenu.Item>
  <TabMenu.Item value="history">                ← Context Consumer (value 비교 → inactive 스타일)
    분석 기록
  </TabMenu.Item>
</TabMenu>

↓ TabMenu.Item 내부

const { value, onChange } = useTabMenu();        // Context에서 현재 value 가져옴
const isActive = itemValue === value;            // 자신의 value와 비교
// isActive에 따라 active/inactive 스타일 적용
```

---

### 2-5. Slot 자체 구현 (Radix UI / Base UI 미사용)

**결정:** asChild 패턴에 필요한 Slot 컴포넌트를 `cloneElement` 기반으로 자체 구현한다. Radix UI나 Base UI를 설치하지 않는다.

**근거:**

shadcn/ui는 원래 Radix UI의 Slot을 사용했고, 2026년 7월 기준으로 Base UI로 전환했다. 하지만 우리가 Slot에서 필요한 기능은 단 하나: **부모의 className과 props를 자식 요소에 합쳐주는 것**이다.

| 방법                                | 설치 크기 | 우리가 쓰는 기능 |
| ----------------------------------- | --------- | ---------------- |
| Radix UI `@radix-ui/react-slot`     | ~5KB      | Slot 하나        |
| Base UI `@base-ui-components/react` | ~50KB+    | Slot 하나        |
| **자체 구현**                       | 20줄      | Slot 하나        |

20줄로 해결되는 기능에 외부 라이브러리를 설치할 이유가 없다.

**구현:**

```tsx
function Slot({ children, className, ...props }: SlotProps) {
  if (isValidElement(children)) {
    const childProps = children.props as Record<string, unknown>;
    return cloneElement(children, {
      ...props, // 부모(Button)의 props
      ...childProps, // 자식(Link)의 props (자식 우선)
      className: cn(className, childProps.className as string), // className은 합침
    });
  }
  return null;
}
```

`cloneElement`로 자식 요소를 복제하면서, 부모의 props를 합쳐준다. `className`은 `cn()`으로 병합하여 양쪽 스타일이 모두 적용된다.

---

### 2-6. 아이콘 컴포넌트: `currentColor` 패턴

**결정:** SVG 아이콘의 `stroke`/`fill`을 `currentColor`로 설정하여, 부모의 텍스트 색상을 자동으로 따라가게 한다.

**근거:**

SegmentedControl에서 아이콘은 활성/비활성에 따라 색상이 바뀌어야 한다:

- active: 흰색 (`text-gray-0`)
- inactive: 어두운 색 (`text-gray-70`)

`currentColor`를 사용하면 **아이콘 색상을 별도로 관리할 필요가 없다**. 부모 버튼의 `text-*` 클래스가 CSS `color` 속성을 설정하고, SVG의 `currentColor`가 이를 상속한다.

```
<SegmentedControl.Item value="url" className="text-gray-0">  ← color: white
  <LinkIcon stroke="currentColor" />                          ← stroke: white (상속)
  공고 URL                                                    ← color: white (동일)
</SegmentedControl.Item>
```

아이콘 라이브러리(lucide-react 등)는 설치하지 않는다. Figma에서 SVG를 직접 추출하여 React 컴포넌트로 변환한다. `width`/`height`는 외부에서 주입 가능하게 `props`로 열어둔다.

---

### 2-7. 컴포넌트별 폴더 구조

**결정:** `src/components/ui/` 아래에 컴포넌트별 폴더를 만들어 컴포넌트 파일과 스토리 파일을 함께 배치한다.

**근거:**

컴포넌트 파일과 스토리 파일이 한 폴더에 섞이면, 컴포넌트 수가 늘어날수록 탐색이 어려워진다.

```
# ❌ 플랫 구조 (파일 12개가 한 폴더에)
src/components/ui/
├── Button.tsx
├── Button.stories.tsx
├── SegmentedControl.tsx
├── SegmentedControl.stories.tsx
├── TabMenu.tsx
├── TabMenu.stories.tsx
└── ...

# ✅ 폴더 구조
src/components/ui/
├── Button/
│   ├── Button.tsx
│   └── Button.stories.tsx
├── SegmentedControl/
│   ├── SegmentedControl.tsx
│   └── SegmentedControl.stories.tsx
└── Slot.tsx              ← 공용이므로 루트에 유지
```

`Slot.tsx`는 여러 컴포넌트에서 import하는 공용 유틸이므로 `ui/` 루트에 둔다.

---

### 2-8. SegmentedControl, TabMenu, ToggleGroup을 별도 컴포넌트로 분리

**결정:** "탭 전환" 기능을 하나의 범용 컴포넌트로 만들지 않고, 3개의 독립 컴포넌트로 분리한다.

**근거:**

세 컴포넌트는 기능적으로 동일(여러 항목 중 하나를 선택)하지만, 시각적 스타일이 완전히 다르다:

| 컴포넌트         | 컨테이너                 | 활성 상태                              | 비활성 상태               |
| ---------------- | ------------------------ | -------------------------------------- | ------------------------- |
| SegmentedControl | `bg-gray-10` 배경 + 패딩 | `bg-primary-40` + 흰 텍스트            | 배경 없음 + 어두운 텍스트 |
| TabMenu          | 배경 없음                | `bg-primary-20` + 파란 텍스트          | 배경 없음 + 회색 텍스트   |
| ToggleGroup      | 배경 없음                | `bg-primary-10` + border + 파란 텍스트 | 흰 배경 + gray border     |

하나의 컴포넌트에 `variant` prop으로 분기하면 코드가 복잡해지고, 각 variant의 수정이 다른 variant에 영향을 줄 수 있다. 분리하면 각 컴포넌트가 단순하고 독립적으로 수정 가능하다.

---

## 3. 최종 파일 구조

```
src/
├── components/
│   ├── ui/
│   │   ├── Slot.tsx                                    # asChild 패턴 (공용)
│   │   ├── Button/
│   │   │   ├── Button.tsx                              # cva + asChild
│   │   │   └── Button.stories.tsx
│   │   ├── SegmentedControl/
│   │   │   ├── SegmentedControl.tsx                    # Context + Composition
│   │   │   └── SegmentedControl.stories.tsx
│   │   ├── TabMenu/
│   │   │   ├── TabMenu.tsx                             # Context + Composition
│   │   │   └── TabMenu.stories.tsx
│   │   └── ToggleGroup/
│   │       ├── ToggleGroup.tsx                         # Context + Composition
│   │       └── ToggleGroup.stories.tsx
│   └── icon/
│       ├── LinkIcon.tsx                                # currentColor SVG
│       └── TextIcon.tsx                                # currentColor SVG
├── lib/
│   └── utils.ts                                        # extendTailwindMerge 설정
└── app/
    └── globals.css                                     # --radius-xxxl 추가
```
