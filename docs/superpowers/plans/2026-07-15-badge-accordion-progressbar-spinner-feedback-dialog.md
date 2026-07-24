# Badge, Accordion, ProgressBar, Spinner, Feedback, Dialog 공통 컴포넌트 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Figma 17:65627 기준으로 JD 분석 결과/피드백/모달에 사용되는 6종 공통 컴포넌트를 구현한다.

**Architecture:** cva + cn 패턴으로 variant 기반 스타일링. 서버 컴포넌트 기본, 상태가 필요한 Accordion/Feedback/Dialog만 'use client'. Composition 패턴은 Accordion(단일 컴포넌트)에서는 불필요, Dialog는 Composition(Dialog + Dialog.Overlay) 대신 단일 컴포넌트로 구현(사용처가 단순). 아이콘은 SVG React 컴포넌트로 `src/components/icon/`에 배치, currentColor 패턴.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, cva + cn, Storybook 10.5

## Global Constraints

- 프로젝트 디자인 토큰만 사용 (`globals.css` `@theme`), 하드코딩 색상 금지
- `useMemo`/`useCallback`/`React.memo` 사용 금지 (React Compiler)
- 함수 선언문 + named export (페이지 제외)
- 아이콘 라이브러리 미사용, SVG → React 컴포넌트 (`src/components/icon/`)
- 컴포넌트 폴더 구조: `src/components/ui/{Name}/{Name}.tsx` + `.stories.tsx`
- common 컴포넌트: `src/components/common/{Name}/{Name}.tsx` + `.stories.tsx`
- Storybook: `@storybook/nextjs-vite`, `layout: 'centered'`, `tags: ['autodocs']`

## Figma → 디자인 토큰 매핑

| Figma 시맨틱 | Hex     | 프로젝트 토큰 (Tailwind 클래스) |
| ------------ | ------- | ------------------------------- |
| success/5    | #EAF6EC | `bg-success-5`                  |
| success/10   | #D8EEDD | `bg-success-10`                 |
| success/50   | #228738 | `text-success-50`               |
| warning/5    | #FFF3DB | `bg-warning-5`                  |
| warning/10   | #FFE0A3 | `bg-warning-10`                 |
| warning/50   | #9E6A00 | `text-warning-50`               |
| danger/5     | #FDEFEC | `bg-danger-5`                   |
| danger/10    | #FCDFD9 | `bg-danger-10`                  |
| danger/40    | #F05F42 | `text-danger-40`                |
| danger/50    | #DE3412 | `text-danger-50`                |
| primary/10   | #D8E5FD | `bg-primary-10`                 |
| primary/40   | #4C87F6 | `bg-primary-40`                 |
| primary/60   | #0B50D0 | `text-primary-60`               |
| secondary/60 | #1C589C | `text-secondary-60`             |
| gray/0       | #FFFFFF | `bg-gray-0` / `text-gray-0`     |
| gray/5       | #F4F5F6 | `bg-gray-5`                     |
| gray/20      | #CDD1D5 | `border-gray-20`                |
| gray/40      | #8A949E | `text-gray-40`                  |
| gray/50      | #6D7882 | `text-gray-50`                  |
| gray/60      | #58616A | `text-gray-60`                  |
| gray/70      | #464C53 | `text-gray-70`                  |
| gray/90      | #1E2124 | `text-gray-90`                  |

---

### Task 1: Badge 컴포넌트

**Files:**

- Create: `src/components/ui/Badge/Badge.tsx`
- Create: `src/components/ui/Badge/Badge.stories.tsx`

**Interfaces:**

- Consumes: `cn()` from `@/lib/utils`, `cva` from `class-variance-authority`
- Produces: `Badge` 컴포넌트 (variant: `confirmed` | `needsImprovement` | `missing`), `badgeVariants`, `BadgeProps`

**Figma 스펙 (24:50484, 24:50477):**

- 상태 뱃지: `px-[10px] py-[2px] rounded-md` + 텍스트 `text-body-sm font-weight-semibold`
  - confirmed: `bg-success-10 text-success-50`, 라벨 "확인됨"
  - needsImprovement: `bg-warning-10 text-warning-50`, 라벨 "보강 필요"
  - missing: `bg-danger-10 text-danger-50`, 라벨 "없음"
- 우선순위 뱃지: `size-[76px] rounded-xxl` + 텍스트 `font-weight-bold text-[31px]`
  - high: `bg-success-10 text-success-50`, 라벨 "상"
  - medium: `bg-warning-10 text-warning-50`, 라벨 "중"
  - low: `bg-danger-10 text-danger-40`, 라벨 "하"

> **설계 결정:** 상태 뱃지와 우선순위 뱃지는 시각적 스타일과 용도가 완전히 다르므로(인라인 텍스트 태그 vs 76px 카드), **하나의 variant로 통합하지 않고** `Badge`(상태)와 `PriorityBadge`(우선순위)를 같은 파일에 별도 컴포넌트로 분리한다. cva variant에 size가 섞이면 불필요한 복잡성이 생긴다.

- [ ] **Step 1: Badge 컴포넌트 작성**

```tsx
// src/components/ui/Badge/Badge.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md px-[10px] py-[2px] text-body-sm font-weight-semibold',
  {
    variants: {
      variant: {
        confirmed: 'bg-success-10 text-success-50',
        needsImprovement: 'bg-warning-10 text-warning-50',
        missing: 'bg-danger-10 text-danger-50',
      },
    },
    defaultVariants: { variant: 'confirmed' },
  },
);

type BadgeProps = React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

const priorityBadgeVariants = cva(
  'flex items-center justify-center size-[76px] rounded-xxl font-weight-bold text-[31px]',
  {
    variants: {
      priority: {
        high: 'bg-success-10 text-success-50',
        medium: 'bg-warning-10 text-warning-50',
        low: 'bg-danger-10 text-danger-40',
      },
    },
    defaultVariants: { priority: 'high' },
  },
);

type PriorityBadgeProps = React.ComponentProps<'div'> & VariantProps<typeof priorityBadgeVariants>;

function PriorityBadge({ className, priority, ...props }: PriorityBadgeProps) {
  const labels = { high: '상', medium: '중', low: '하' } as const;
  return (
    <div className={cn(priorityBadgeVariants({ priority }), className)} {...props}>
      {labels[priority ?? 'high']}
    </div>
  );
}

export { Badge, badgeVariants, PriorityBadge, priorityBadgeVariants };
export type { BadgeProps, PriorityBadgeProps };
```

- [ ] **Step 2: Storybook 스토리 작성**

```tsx
// src/components/ui/Badge/Badge.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge, PriorityBadge } from './Badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['confirmed', 'needsImprovement', 'missing'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Confirmed: Story = {
  args: { variant: 'confirmed', children: '확인됨' },
};

export const NeedsImprovement: Story = {
  args: { variant: 'needsImprovement', children: '보강 필요' },
};

export const Missing: Story = {
  args: { variant: 'missing', children: '없음' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge variant="confirmed">확인됨</Badge>
      <Badge variant="needsImprovement">보강 필요</Badge>
      <Badge variant="missing">없음</Badge>
    </div>
  ),
};

export const PriorityHigh: StoryObj = {
  render: () => <PriorityBadge priority="high" />,
};

export const PriorityAll: StoryObj = {
  render: () => (
    <div className="flex gap-4">
      <PriorityBadge priority="high" />
      <PriorityBadge priority="medium" />
      <PriorityBadge priority="low" />
    </div>
  ),
};
```

- [ ] **Step 3: Storybook에서 시각 확인**

Run: `pnpm storybook` (이미 실행 중이면 브라우저에서 UI/Badge 확인)
Expected: 6개 스토리 모두 렌더링, 색상이 Figma 디자인과 일치

- [ ] **Step 4: 커밋**

```bash
git add src/components/ui/Badge/Badge.tsx src/components/ui/Badge/Badge.stories.tsx
git commit -m "feat: Badge, PriorityBadge 컴포넌트 구현"
```

---

### Task 2: Accordion 컴포넌트 (+ ChevronDown, Copy 아이콘)

**Files:**

- Create: `src/components/icon/ChevronDownIcon.tsx`
- Create: `src/components/icon/CopyIcon.tsx`
- Create: `src/components/ui/Accordion/Accordion.tsx`
- Create: `src/components/ui/Accordion/Accordion.stories.tsx`

**Interfaces:**

- Consumes: `Badge` from `@/components/ui/Badge/Badge`, `cn()`, `cva`, `ChevronDownIcon`, `CopyIcon`
- Produces: `Accordion` 컴포넌트 (variant: `confirmed` | `needsImprovement` | `missing`, props: `badge`, `title`, `description`, `suggestion`, `onCopy`)

**Figma 스펙 (24:50484 충족, 24:50526 부분, 24:50564 갭):**

- 컨테이너: `rounded-lg px-[9px] pt-[14px] pb-[9px]`
  - confirmed: `bg-success-5`
  - needsImprovement: `bg-warning-5`
  - missing: `bg-danger-5`
- 접힌 상태 (헤더): `flex items-center gap-[15px] px-[7px]`
  - Badge + 제목 텍스트 (`text-heading-xs font-weight-semibold text-gray-90`) + ChevronDown 아이콘 (24px, 접힌 상태 rotate-0, 펼친 상태 rotate-180)
- 펼친 상태 (내용): `bg-gray-0 rounded-regular px-[14px] py-[16px] gap-[16px]`
  - 설명 텍스트: `text-body-md font-weight-regular text-gray-50`
  - 제안 박스: `bg-gray-5 rounded-md px-[15px] pt-[15px] pb-[20px] gap-[22px]`
    - 💡 "이렇게 보완해보세요": `text-body-xs font-weight-semibold text-secondary-60`
    - 제안 텍스트: `text-body-sm font-weight-regular text-gray-70`
    - "제안 문구 복사" 버튼: `bg-primary-10 text-primary-60 rounded-regular px-[10px] py-[6px] text-body-xs font-weight-semibold gap-[4px]` + CopyIcon (16px)

- [ ] **Step 1: ChevronDownIcon 작성**

```tsx
// src/components/icon/ChevronDownIcon.tsx
type ChevronDownIconProps = React.ComponentProps<'svg'>;

function ChevronDownIcon({ className, ...props }: ChevronDownIconProps) {
  return (
    <svg
      width={props.width ?? 24}
      height={props.height ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export { ChevronDownIcon };
```

- [ ] **Step 2: CopyIcon 작성**

```tsx
// src/components/icon/CopyIcon.tsx
type CopyIconProps = React.ComponentProps<'svg'>;

function CopyIcon({ className, ...props }: CopyIconProps) {
  return (
    <svg
      width={props.width ?? 16}
      height={props.height ?? 16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect x="5.33" y="5.33" width="8" height="8" rx="1.33" stroke="currentColor" strokeWidth="1.33" />
      <path
        d="M10.67 5.33V4a1.33 1.33 0 0 0-1.34-1.33H4A1.33 1.33 0 0 0 2.67 4v5.33A1.33 1.33 0 0 0 4 10.67h1.33"
        stroke="currentColor"
        strokeWidth="1.33"
      />
    </svg>
  );
}

export { CopyIcon };
```

- [ ] **Step 3: Accordion 컴포넌트 작성**

```tsx
// src/components/ui/Accordion/Accordion.tsx
'use client';

import { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge/Badge';
import { ChevronDownIcon } from '@/components/icon/ChevronDownIcon';
import { CopyIcon } from '@/components/icon/CopyIcon';

const accordionVariants = cva('rounded-lg px-[9px] pt-[14px] pb-[9px]', {
  variants: {
    variant: {
      confirmed: 'bg-success-5',
      needsImprovement: 'bg-warning-5',
      missing: 'bg-danger-5',
    },
  },
  defaultVariants: { variant: 'confirmed' },
});

const badgeLabelMap = {
  confirmed: '확인됨',
  needsImprovement: '보강 필요',
  missing: '없음',
} as const;

type AccordionProps = React.ComponentProps<'div'> &
  VariantProps<typeof accordionVariants> & {
    title: string;
    description: string;
    suggestion?: string;
    onCopy?: (text: string) => void;
    defaultOpen?: boolean;
  };

function Accordion({
  className,
  variant,
  title,
  description,
  suggestion,
  onCopy,
  defaultOpen = false,
  ...props
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const resolvedVariant = variant ?? 'confirmed';

  return (
    <div className={cn(accordionVariants({ variant }), className)} {...props}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center gap-[15px] px-[7px]"
      >
        <div className="flex flex-1 items-end gap-[9px]">
          <Badge variant={resolvedVariant}>{badgeLabelMap[resolvedVariant]}</Badge>
          <span className="text-heading-xs font-weight-semibold text-gray-90">{title}</span>
        </div>
        <ChevronDownIcon className={cn('text-gray-40 size-6 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="rounded-regular bg-gray-0 mt-[15px] flex flex-col gap-4 px-[14px] py-4">
          <p className="text-body-md font-weight-regular px-[9px] text-gray-50">{description}</p>

          {suggestion && (
            <div className="bg-gray-5 flex flex-col gap-[22px] rounded-md px-[15px] pt-[15px] pb-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-[3px]">
                  <span className="text-[12px]">💡</span>
                  <span className="text-body-xs font-weight-semibold text-secondary-60">이렇게 보완해보세요</span>
                </div>
                <p className="text-body-sm font-weight-regular text-gray-70">{suggestion}</p>
              </div>

              <button
                type="button"
                onClick={() => onCopy?.(suggestion)}
                className="rounded-regular bg-primary-10 text-body-xs font-weight-semibold text-primary-60 inline-flex w-fit cursor-pointer items-center gap-1 px-[10px] py-1.5"
              >
                <CopyIcon className="size-4" />
                제안 문구 복사
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { Accordion, accordionVariants };
export type { AccordionProps };
```

- [ ] **Step 4: Accordion 스토리 작성**

```tsx
// src/components/ui/Accordion/Accordion.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Accordion } from './Accordion';

const meta = {
  title: 'UI/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['confirmed', 'needsImprovement', 'missing'],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 560 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleProps = {
  title: 'Java/Spring 경험 3년 이상',
  description: '공고에서 Java/Spring Boot 경험을 필수로 요구하지만, 이력서 전체에서 관련 내용을 찾을 수 없습니다.',
  suggestion:
    "기술 스택에 Java, Spring Boot를 추가하고, 프로젝트 섹션에서 'Spring Boot 기반 REST API 개발, JPA를 활용한 데이터 모델링' 등을 구체적으로 기술하세요.",
};

export const Confirmed: Story = {
  args: { variant: 'confirmed', ...sampleProps, defaultOpen: true },
};

export const NeedsImprovement: Story = {
  args: { variant: 'needsImprovement', ...sampleProps, defaultOpen: true },
};

export const Missing: Story = {
  args: { variant: 'missing', ...sampleProps, defaultOpen: true },
};

export const Collapsed: Story = {
  args: { variant: 'confirmed', ...sampleProps, defaultOpen: false },
};

export const WithoutSuggestion: Story = {
  args: {
    variant: 'confirmed',
    title: 'Java/Spring 경험 3년 이상',
    description: '이력서에서 관련 경험이 확인되었습니다.',
    defaultOpen: true,
  },
};
```

- [ ] **Step 5: Storybook 시각 확인**

Run: Storybook에서 UI/Accordion 확인
Expected: variant별 배경색, 접힘/펼침 동작, 복사 버튼 렌더링 확인

- [ ] **Step 6: 커밋**

```bash
git add src/components/icon/ChevronDownIcon.tsx src/components/icon/CopyIcon.tsx src/components/ui/Accordion/Accordion.tsx src/components/ui/Accordion/Accordion.stories.tsx
git commit -m "feat: Accordion 컴포넌트 구현 (ChevronDown, Copy 아이콘 포함)"
```

---

### Task 3: ProgressBar 컴포넌트

**Files:**

- Create: `src/components/ui/ProgressBar/ProgressBar.tsx`
- Create: `src/components/ui/ProgressBar/ProgressBar.stories.tsx`

**Interfaces:**

- Consumes: `cn()` from `@/lib/utils`
- Produces: `ProgressBar` 컴포넌트 (value: 0~100), `ProgressBarProps`

**Figma 스펙 (24:50674):**

- 트랙: `bg-gray-5 h-3 rounded-[31px] w-full overflow-hidden`
- 필: `bg-primary-40 h-3 rounded-[31px]`, width = value%, `transition-all duration-500 ease-out`

- [ ] **Step 1: ProgressBar 컴포넌트 작성**

```tsx
// src/components/ui/ProgressBar/ProgressBar.tsx
import { cn } from '@/lib/utils';

type ProgressBarProps = React.ComponentProps<'div'> & {
  value: number;
};

function ProgressBar({ className, value, ...props }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('bg-gray-5 h-3 w-full overflow-hidden rounded-[31px]', className)}
      {...props}
    >
      <div
        className="bg-primary-40 h-3 rounded-[31px] transition-all duration-500 ease-out"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}

export { ProgressBar };
export type { ProgressBarProps };
```

- [ ] **Step 2: Storybook 스토리 작성**

```tsx
// src/components/ui/ProgressBar/ProgressBar.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ProgressBar } from './ProgressBar';

const meta = {
  title: 'UI/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 539 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { value: 0 },
};

export const Quarter: Story = {
  args: { value: 25 },
};

export const Half: Story = {
  args: { value: 50 },
};

export const ThreeQuarters: Story = {
  args: { value: 75 },
};

export const Full: Story = {
  args: { value: 100 },
};

export const AllStages: Story = {
  render: () => (
    <div className="flex w-[539px] flex-col gap-4">
      <ProgressBar value={0} />
      <ProgressBar value={20} />
      <ProgressBar value={50} />
      <ProgressBar value={77} />
      <ProgressBar value={100} />
    </div>
  ),
};
```

- [ ] **Step 3: Storybook 시각 확인**

Run: Storybook에서 UI/ProgressBar 확인
Expected: 5단계 진행 바 렌더링, 슬라이더로 value 변경 시 애니메이션 트랜지션 확인

- [ ] **Step 4: 커밋**

```bash
git add src/components/ui/ProgressBar/ProgressBar.tsx src/components/ui/ProgressBar/ProgressBar.stories.tsx
git commit -m "feat: ProgressBar 컴포넌트 구현"
```

---

### Task 4: Spinner 컴포넌트

**Files:**

- Create: `src/components/ui/Spinner/Spinner.tsx`
- Create: `src/components/ui/Spinner/Spinner.stories.tsx`

**Interfaces:**

- Consumes: `cn()`, `cva`
- Produces: `Spinner` 컴포넌트 (size: `sm` | `md` | `lg`), `SpinnerProps`

**Figma 스펙 (24:50691):**

- 원형 로딩 스피너: `gray-5` 트랙 원 위에 `primary-40` 아크(1/4원)가 회전
- 크기: sm=24px, md=48px, lg=102px (Figma 원본)
- CSS `animate-spin` 사용

> **설계 결정:** Figma는 이미지 기반 스피너이지만, SVG circle + strokeDasharray로 구현하여 해상도 독립적이고 색상 토큰에 맞출 수 있게 한다.

- [ ] **Step 1: Spinner 컴포넌트 작성**

```tsx
// src/components/ui/Spinner/Spinner.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      sm: 'size-6',
      md: 'size-12',
      lg: 'size-[102px]',
    },
  },
  defaultVariants: { size: 'md' },
});

type SpinnerProps = React.ComponentProps<'svg'> & VariantProps<typeof spinnerVariants>;

function Spinner({ className, size, ...props }: SpinnerProps) {
  return (
    <svg
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(spinnerVariants({ size }), className)}
      role="status"
      aria-label="로딩 중"
      {...props}
    >
      <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="5" className="text-gray-5" />
      <circle
        cx="25"
        cy="25"
        r="20"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="31.4 94.2"
        className="text-primary-40"
      />
    </svg>
  );
}

export { Spinner, spinnerVariants };
export type { SpinnerProps };
```

- [ ] **Step 2: Storybook 스토리 작성**

```tsx
// src/components/ui/Spinner/Spinner.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Spinner } from './Spinner';

const meta = {
  title: 'UI/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: { size: 'sm' },
};

export const Medium: Story = {
  args: { size: 'md' },
};

export const Large: Story = {
  args: { size: 'lg' },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
};
```

- [ ] **Step 3: Storybook 시각 확인**

Run: Storybook에서 UI/Spinner 확인
Expected: 3가지 크기의 스피너가 회전 애니메이션과 함께 렌더링

- [ ] **Step 4: 커밋**

```bash
git add src/components/ui/Spinner/Spinner.tsx src/components/ui/Spinner/Spinner.stories.tsx
git commit -m "feat: Spinner 컴포넌트 구현"
```

---

### Task 5: Feedback 컴포넌트

**Files:**

- Create: `src/components/icon/ThumbUpIcon.tsx`
- Create: `src/components/icon/ThumbDownIcon.tsx`
- Create: `src/components/common/Feedback/Feedback.tsx`
- Create: `src/components/common/Feedback/Feedback.stories.tsx`

**Interfaces:**

- Consumes: `cn()`, `ThumbUpIcon`, `ThumbDownIcon`
- Produces: `Feedback` 컴포넌트 (onFeedback: `(type: 'up' | 'down') => void`), `FeedbackProps`

**Figma 스펙 (24:50653):**

- 초기 상태: "이 분석이 도움이 되었나요?" (`text-[18px] font-weight-medium text-gray-40`) + 👍/👎 버튼
  - 버튼: `bg-gray-5 border border-gray-20 rounded-regular size-[37px]` + 아이콘 24px
- 응답 완료 상태: ☑️ "의견이 반영되었어요!" + "재클릭시 변경 가능" (underline)

> **설계 결정:** 이모지(👍👎☑️)는 플랫폼마다 다르게 렌더링되므로 SVG 아이콘으로 구현한다. 단, ThumbUp/ThumbDown은 단순 라인 아이콘으로 만든다.

- [ ] **Step 1: ThumbUpIcon, ThumbDownIcon 작성**

```tsx
// src/components/icon/ThumbUpIcon.tsx
type ThumbUpIconProps = React.ComponentProps<'svg'>;

function ThumbUpIcon({ className, ...props }: ThumbUpIconProps) {
  return (
    <svg
      width={props.width ?? 24}
      height={props.height ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M7 22V11M2 13V20C2 21.1046 2.89543 22 4 22H17.4262C18.907 22 20.1662 20.9197 20.3914 19.4562L21.4683 12.4562C21.7479 10.6389 20.3418 9 18.5032 9H15C14.4477 9 14 8.55228 14 8V4.46584C14 3.10399 12.896 2 11.5342 2C11.2093 2 10.915 2.1913 10.7831 2.48812L7.26394 10.4061"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { ThumbUpIcon };
```

```tsx
// src/components/icon/ThumbDownIcon.tsx
type ThumbDownIconProps = React.ComponentProps<'svg'>;

function ThumbDownIcon({ className, ...props }: ThumbDownIconProps) {
  return (
    <svg
      width={props.width ?? 24}
      height={props.height ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M17 2V13M22 11V4C22 2.89543 21.1046 2 20 2H6.57381C5.09298 2 3.83377 3.08031 3.60858 4.54379L2.53168 11.5438C2.25212 13.3611 3.65823 15 5.49691 15H9C9.55228 15 10 15.4477 10 16V19.5342C10 20.896 11.104 22 12.4658 22C12.7907 22 13.085 21.8087 13.2169 21.5119L16.7361 13.5939"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { ThumbDownIcon };
```

- [ ] **Step 2: Feedback 컴포넌트 작성**

```tsx
// src/components/common/Feedback/Feedback.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ThumbUpIcon } from '@/components/icon/ThumbUpIcon';
import { ThumbDownIcon } from '@/components/icon/ThumbDownIcon';

type FeedbackProps = React.ComponentProps<'div'> & {
  onFeedback?: (type: 'up' | 'down') => void;
};

function Feedback({ className, onFeedback, ...props }: FeedbackProps) {
  const [selected, setSelected] = useState<'up' | 'down' | null>(null);

  function handleClick(type: 'up' | 'down') {
    if (selected === type) {
      setSelected(null);
    } else {
      setSelected(type);
      onFeedback?.(type);
    }
  }

  return (
    <div className={cn('flex items-center gap-[9px]', className)} {...props}>
      {selected === null ? (
        <>
          <span className="font-weight-medium text-gray-40 text-[18px] whitespace-nowrap">
            이 분석이 도움이 되었나요?
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleClick('up')}
              className="rounded-regular border-gray-20 bg-gray-5 flex size-[37px] cursor-pointer items-center justify-center border"
            >
              <ThumbUpIcon className="size-6 text-gray-50" />
            </button>
            <button
              type="button"
              onClick={() => handleClick('down')}
              className="rounded-regular border-gray-20 bg-gray-5 flex size-[37px] cursor-pointer items-center justify-center border"
            >
              <ThumbDownIcon className="size-6 text-gray-50" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-[3px]">
            <span className="text-[23px]">☑️</span>
            <span className="font-weight-medium text-gray-40 text-[18px] whitespace-nowrap">의견이 반영되었어요!</span>
          </div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="font-weight-medium text-gray-30 cursor-pointer text-[18px] whitespace-nowrap underline"
          >
            재클릭시 변경 가능
          </button>
        </>
      )}
    </div>
  );
}

export { Feedback };
export type { FeedbackProps };
```

- [ ] **Step 3: Storybook 스토리 작성**

```tsx
// src/components/common/Feedback/Feedback.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Feedback } from './Feedback';

const meta = {
  title: 'Common/Feedback',
  component: Feedback,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Feedback>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCallback: Story = {
  args: {
    onFeedback: (type) => alert(`피드백: ${type}`),
  },
};
```

- [ ] **Step 4: Storybook 시각 확인**

Run: Storybook에서 Common/Feedback 확인
Expected: 초기 상태에서 👍/👎 클릭 시 "의견이 반영되었어요!" 상태로 전환, "재클릭시 변경 가능" 클릭 시 초기 상태로 복귀

- [ ] **Step 5: 커밋**

```bash
git add src/components/icon/ThumbUpIcon.tsx src/components/icon/ThumbDownIcon.tsx src/components/common/Feedback/Feedback.tsx src/components/common/Feedback/Feedback.stories.tsx
git commit -m "feat: Feedback 컴포넌트 구현 (ThumbUp, ThumbDown 아이콘 포함)"
```

---

### Task 6: Dialog 컴포넌트

**Files:**

- Create: `src/components/ui/Dialog/Dialog.tsx`
- Create: `src/components/ui/Dialog/Dialog.stories.tsx`

**Interfaces:**

- Consumes: `cn()`, `Button` from `@/components/ui/Button/Button`
- Produces: `Dialog` 컴포넌트 (open, onClose, icon?, title, description, actions), `DialogProps`

**Figma 스펙 (25:23387 저장완료, 25:23401 삭제하기, 25:23419 로그아웃, 25:23429 재분석실패):**

- 오버레이: `fixed inset-0 bg-black/50 z-50`
- 카드: `bg-gray-0 rounded-xxxl shadow-[0px_4px_20px_rgba(0,0,0,0.05)]`
  - 아이콘 있는 경우: `pt-10 pb-[30px] px-[30px]`, 아이콘(46px) + gap-[19px] + 텍스트
  - 아이콘 없는 경우: `pt-[50px] pb-[30px] px-[30px]`, 텍스트만
  - 제목: `text-heading-md font-weight-semibold text-gray-90`
  - 설명: `text-heading-xs font-weight-semibold text-gray-40` (center, w-[247px])
  - gap-[40px] between content and actions
- 액션 버튼: `gap-[10px]`, 각 `w-[200px] rounded-xl py-[14px]`
  - 보조 버튼: `bg-gray-5 text-gray-60 text-body-lg font-weight-semibold`
  - 주 버튼: `bg-primary-40 text-gray-0 text-body-lg font-weight-semibold`
- ESC 키 / 오버레이 클릭 시 닫기

> **설계 결정:** Dialog는 내용물이 사용처마다 다르므로(아이콘 종류, 버튼 수, 버튼 텍스트) children이 아닌 **구조화된 props** (icon, title, description, actions 배열)로 받는다. 사용처가 4종으로 한정되어 있고, Composition 패턴은 오버 엔지니어링이다.

- [ ] **Step 1: Dialog 컴포넌트 작성**

```tsx
// src/components/ui/Dialog/Dialog.tsx
'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

type DialogAction = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'assistive';
  icon?: React.ReactNode;
};

type DialogProps = React.ComponentProps<'div'> & {
  open: boolean;
  onClose: () => void;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions: DialogAction[];
};

function Dialog({ className, open, onClose, icon, title, description, actions, ...props }: DialogProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" {...props}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'rounded-xxxl bg-gray-0 relative z-10 flex flex-col items-center gap-10 px-[30px] pb-[30px] shadow-[0px_4px_20px_rgba(0,0,0,0.05)]',
          icon ? 'pt-10' : 'pt-[50px]',
          className,
        )}
      >
        <div className="flex w-[319px] flex-col items-center gap-[19px]">
          {icon && <div className="size-[46px]">{icon}</div>}
          <div className="flex w-full flex-col items-center gap-2 text-center">
            <h2 className="text-heading-md font-weight-semibold text-gray-90 whitespace-nowrap">{title}</h2>
            {description && (
              <p className="text-heading-xs font-weight-semibold text-gray-40 w-[247px]">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-[10px]">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={cn(
                'text-body-lg font-weight-semibold inline-flex w-[200px] cursor-pointer items-center justify-center gap-[10px] rounded-xl py-[14px]',
                action.variant === 'assistive' || !action.variant
                  ? actions.length === 1
                    ? 'bg-gray-5 text-gray-60'
                    : 'bg-gray-5 text-gray-60'
                  : 'bg-primary-40 text-gray-0',
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export { Dialog };
export type { DialogProps, DialogAction };
```

- [ ] **Step 2: Storybook 스토리 작성**

```tsx
// src/components/ui/Dialog/Dialog.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Dialog } from './Dialog';
import { Button } from '@/components/ui/Button/Button';

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SaveComplete: Story = {
  args: {
    open: true,
    onClose: () => {},
    icon: <span className="flex size-[46px] items-center justify-center text-[28px]">☑️</span>,
    title: '저장이 완료됐어요!',
    description: '저장된 결과에서 언제든 다시 확인하고 이어서 수정할 수 있어요.',
    actions: [
      { label: '저장 목록으로 이동', onClick: () => {}, variant: 'assistive' },
      { label: '페이지에 남기', onClick: () => {}, variant: 'primary' },
    ],
  },
};

export const DeleteConfirm: Story = {
  args: {
    open: true,
    onClose: () => {},
    icon: (
      <span className="bg-danger-5 flex size-[46px] items-center justify-center rounded-[22px] text-[28px]">❗</span>
    ),
    title: '분석 결과를 삭제하시겠어요?',
    description: '삭제한 결과는 복구할 수 없어요.',
    actions: [
      { label: '취소하기', onClick: () => {}, variant: 'assistive' },
      { label: '삭제하기', onClick: () => {}, variant: 'primary' },
    ],
  },
};

export const Logout: Story = {
  args: {
    open: true,
    onClose: () => {},
    title: '로그아웃하시겠어요?',
    description: '로그아웃하면 저장된 분석 결과를 보려면 다시 로그인해야 해요.',
    actions: [
      { label: '취소하기', onClick: () => {}, variant: 'assistive' },
      { label: '로그아웃', onClick: () => {}, variant: 'primary' },
    ],
  },
};

export const RetryFailed: Story = {
  args: {
    open: true,
    onClose: () => {},
    title: '재분석에 실패했어요.',
    description: '잠시 후 다시 시도해 주세요.',
    actions: [{ label: '다시 시도하기', onClick: () => {}, variant: 'assistive' }],
  },
};

export const Interactive: Story = {
  render: function InteractiveDialog() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>다이얼로그 열기</Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="저장이 완료됐어요!"
          description="저장된 결과에서 언제든 다시 확인하고 이어서 수정할 수 있어요."
          icon={<span className="flex size-[46px] items-center justify-center text-[28px]">☑️</span>}
          actions={[
            { label: '저장 목록으로 이동', onClick: () => setOpen(false), variant: 'assistive' },
            { label: '페이지에 남기', onClick: () => setOpen(false), variant: 'primary' },
          ]}
        />
      </>
    );
  },
};
```

- [ ] **Step 3: Storybook 시각 확인**

Run: Storybook에서 UI/Dialog 확인
Expected:

- 저장완료: 체크 아이콘 + 2버튼
- 삭제하기: 느낌표 아이콘 + 2버튼
- 로그아웃: 아이콘 없음 + 2버튼
- 재분석실패: 아이콘 없음 + 1버튼
- Interactive: 버튼 클릭 시 열림/닫힘, ESC 키로 닫힘

- [ ] **Step 4: 커밋**

```bash
git add src/components/ui/Dialog/Dialog.tsx src/components/ui/Dialog/Dialog.stories.tsx
git commit -m "feat: Dialog 컴포넌트 구현"
```

---

### Task 7: 빌드 검증 및 최종 커밋

**Files:**

- 수정 없음 (검증만)

**Interfaces:**

- 전체 컴포넌트 빌드 및 린트 통과 확인

- [ ] **Step 1: 린트 검사**

Run: `pnpm lint`
Expected: 에러 없음

- [ ] **Step 2: 빌드 검사**

Run: `pnpm build`
Expected: 빌드 성공

- [ ] **Step 3: 린트/빌드 에러 수정 (있을 경우)**

에러 메시지에 따라 해당 파일 수정 후 재검사

- [ ] **Step 4: 최종 커밋 (수정이 있을 경우만)**

```bash
git add -A
git commit -m "fix: lint/build 에러 수정"
```
