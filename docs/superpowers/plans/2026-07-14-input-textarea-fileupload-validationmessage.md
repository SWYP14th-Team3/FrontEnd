# Input, Textarea, FileUpload, ValidationMessage 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Figma 17:65627 디자인 기준으로 Input, Textarea, FileUploadArea, ValidationMessage 4종 공통 컴포넌트와 필요한 SVG 아이콘 컴포넌트를 구현한다.

**Architecture:** shadcn 패턴(React.ComponentProps 확장, cva+cn, named export)을 따른다. SVG 아이콘은 `currentColor` 패턴의 React 컴포넌트로 만든다. FileUploadArea와 Textarea는 상태 관리가 필요하므로 `'use client'`를 사용한다. 각 컴포넌트에 Storybook 스토리를 co-locate한다.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, cva (class-variance-authority), Storybook 10.5 (`@storybook/nextjs-vite`)

## Global Constraints

- 프로젝트 디자인 토큰만 사용 (`globals.css @theme`), 하드코딩 색상 금지
- 함수 선언문, named export (page.tsx 제외)
- useMemo/useCallback 사용 금지 (React Compiler 활성)
- `'use client'`는 상태/이벤트 핸들러 필요한 곳에만
- 아이콘: `src/components/icon/`에 SVG 컴포넌트, `currentColor` 패턴
- 컴포넌트 폴더 구조: `src/components/ui/{Name}/{Name}.tsx` + `.stories.tsx`
- Storybook: `@storybook/nextjs-vite`, `satisfies Meta<typeof Component>`, tags: `['autodocs']`, layout: `'centered'`

## Figma → 디자인 토큰 매핑

| Figma 값            | 토큰           | Tailwind 클래스                      |
| ------------------- | -------------- | ------------------------------------ |
| #FFFFFF (gray/0)    | gray-0         | `bg-gray-0`                          |
| #F4F5F6 (gray/5)    | gray-5         | `bg-gray-5`                          |
| #E6E8EA (gray/10)   | gray-10        | `border-gray-10`                     |
| #CDD1D5 (gray/20)   | gray-20        | `border-gray-20`                     |
| #B1B8BE (gray/30)   | gray-30        | `text-gray-30`, `border-gray-30`     |
| #6D7882 (gray/50)   | gray-50        | `text-gray-50`                       |
| #1E2124 (gray/90)   | gray-90        | `text-gray-90`                       |
| #F05F42 (danger/40) | danger-40      | `text-danger-40`, `border-danger-40` |
| 10px radius         | radius-lg      | `rounded-lg`                         |
| 8px radius          | radius-regular | `rounded-regular`                    |

### 폰트 매핑

Figma 스타일 suffix를 프로젝트 유틸리티 이름과 매칭한다 (기존 Button 패턴 일관성 유지):

| Figma 스타일                | 사이즈 토큰       | 웨이트 유틸리티        | 용도                               |
| --------------------------- | ----------------- | ---------------------- | ---------------------------------- |
| head/xs/md (17px, Medium)   | `text-heading-xs` | `font-weight-medium`   | Input/Textarea 본문                |
| body/xs/md (13px, Medium)   | `text-body-xs`    | `font-weight-medium`   | Textarea 카운터, 파일 용량         |
| head/sm/sb (19px, SemiBold) | `text-heading-sm` | `font-weight-semibold` | FileUpload 타이틀                  |
| body/xs/sb (13px, SemiBold) | `text-body-xs`    | `font-weight-semibold` | ValidationMessage, FileUpload 부제 |
| head/xs/sb (17px, SemiBold) | `text-heading-xs` | `font-weight-semibold` | 파일명                             |

## 파일 구조

```
src/components/
├── icon/
│   ├── WarningIcon.tsx          ← NEW (ValidationMessage용)
│   ├── UploadIcon.tsx           ← NEW (FileUploadArea 빈 상태)
│   ├── CloseIcon.tsx            ← NEW (FileUploadArea 파일 삭제)
│   └── PdfFileIcon.tsx          ← NEW (FileUploadArea 파일 첨부)
├── ui/
│   ├── Input/
│   │   ├── Input.tsx            ← NEW
│   │   └── Input.stories.tsx    ← NEW
│   ├── Textarea/
│   │   ├── Textarea.tsx         ← NEW
│   │   └── Textarea.stories.tsx ← NEW
│   └── ValidationMessage/
│       ├── ValidationMessage.tsx          ← NEW
│       └── ValidationMessage.stories.tsx  ← NEW
└── common/
    └── FileUploadArea/
        ├── FileUploadArea.tsx           ← NEW
        └── FileUploadArea.stories.tsx   ← NEW
```

---

### Task 1: SVG 아이콘 컴포넌트 (WarningIcon, UploadIcon, CloseIcon, PdfFileIcon)

**Files:**

- Create: `src/components/icon/WarningIcon.tsx`
- Create: `src/components/icon/UploadIcon.tsx`
- Create: `src/components/icon/CloseIcon.tsx`
- Create: `src/components/icon/PdfFileIcon.tsx`

**Interfaces:**

- Consumes: 없음
- Produces: `WarningIcon`, `UploadIcon`, `CloseIcon`, `PdfFileIcon` — 모두 `React.ComponentProps<'svg'>` 확장, `currentColor` 패턴 (PdfFileIcon은 고정 색상)

**참고:** 기존 `LinkIcon.tsx`, `TextIcon.tsx` 패턴을 따른다. `type {Name}Props = React.ComponentProps<'svg'>`, `width`/`height` 기본값 제공, `className`과 `...props` 스프레드.

- [ ] **Step 1: WarningIcon 작성**

`src/components/icon/WarningIcon.tsx`:

```tsx
type WarningIconProps = React.ComponentProps<'svg'>;

function WarningIcon({ className, ...props }: WarningIconProps) {
  return (
    <svg
      width={props.width ?? 14}
      height={props.height ?? 14}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.114 1.822a1.017 1.017 0 0 1 1.772 0l5.25 9.333A1.017 1.017 0 0 1 12.25 12.833H1.75a1.017 1.017 0 0 1-.886-1.678l5.25-9.333ZM7 5.25a.583.583 0 0 1 .583.583v2.334a.583.583 0 1 1-1.166 0V5.833A.583.583 0 0 1 7 5.25Zm0 4.083a.583.583 0 1 0 0 1.167.583.583 0 0 0 0-1.167Z"
        fill="currentColor"
      />
    </svg>
  );
}

export { WarningIcon };
```

- [ ] **Step 2: UploadIcon 작성**

Figma 노드 24:50400에서 추출한 SVG. 문서 모양 + 위쪽 화살표 아이콘.

`src/components/icon/UploadIcon.tsx`:

```tsx
type UploadIconProps = React.ComponentProps<'svg'>;

function UploadIcon({ className, ...props }: UploadIconProps) {
  return (
    <svg
      width={props.width ?? 24}
      height={props.height ?? 29}
      viewBox="0 0 24 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M3.66667 27.6667C2.95942 27.6667 2.28115 27.3857 1.78105 26.8856C1.28095 26.3855 1 25.7072 1 25V3.66667C1 2.95943 1.28095 2.28115 1.78105 1.78105C2.28115 1.28096 2.95942 1 3.66667 1H14.3333C14.7554 0.99932 15.1734 1.08214 15.5634 1.2437C15.9533 1.40525 16.3074 1.64235 16.6053 1.94134L21.3893 6.72534C21.6891 7.02335 21.9269 7.3778 22.0889 7.76822C22.2509 8.15864 22.334 8.5773 22.3333 9V25C22.3333 25.7072 22.0524 26.3855 21.5523 26.8856C21.0522 27.3857 20.3739 27.6667 19.6667 27.6667H3.66667Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.3332 1V7.66667C14.3332 8.02029 14.4736 8.35943 14.7237 8.60948C14.9737 8.85952 15.3129 9 15.6665 9H22.3332M11.6665 14.3333V22.3333M7.6665 18.3333L11.6665 14.3333L15.6665 18.3333"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { UploadIcon };
```

- [ ] **Step 3: CloseIcon 작성**

Figma 노드 24:50361에서 추출. 8x8 크기의 X 아이콘.

`src/components/icon/CloseIcon.tsx`:

```tsx
type CloseIconProps = React.ComponentProps<'svg'>;

function CloseIcon({ className, ...props }: CloseIconProps) {
  return (
    <svg
      width={props.width ?? 9}
      height={props.height ?? 9}
      viewBox="0 0 9 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M0.5 8.5L8.5 0.5M0.5 0.5L8.5 8.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export { CloseIcon };
```

- [ ] **Step 4: PdfFileIcon 작성**

Figma 노드 24:50346에서 추출. PDF 문서 일러스트레이션. 이 아이콘은 브랜드 고유 색상을 사용하므로 `currentColor` 대신 고정 색상을 쓴다.

`src/components/icon/PdfFileIcon.tsx`:

```tsx
type PdfFileIconProps = React.ComponentProps<'svg'>;

function PdfFileIcon({ className, ...props }: PdfFileIconProps) {
  return (
    <svg
      width={props.width ?? 47}
      height={props.height ?? 62}
      viewBox="0 0 47 62"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        opacity="0.3"
        d="M39.806 14.036a5.618 5.618 0 0 1-4.154-1.723 5.618 5.618 0 0 1-1.723-4.154V0H7.67A7.668 7.668 0 0 0 0 7.669v46.233a7.669 7.669 0 0 0 7.67 7.658h31.523a7.669 7.669 0 0 0 7.67-7.658V14.036h-7.057Z"
        fill="#256EF4"
      />
      <path
        d="M46.863 14.036h-7.057a5.618 5.618 0 0 1-4.154-1.723 5.618 5.618 0 0 1-1.723-4.154V0l12.934 14.036Z"
        fill="#083891"
      />
      <path
        d="M37.221 42.99H7.798a1.069 1.069 0 0 1 0-2.135h29.423a1.069 1.069 0 1 1 0 2.135ZM37.221 30.951H7.798a1.069 1.069 0 0 1 0-2.135h29.423a1.069 1.069 0 1 1 0 2.135ZM37.221 36.97H7.798a1.069 1.069 0 0 1 0-2.135h29.423a1.069 1.069 0 1 1 0 2.135ZM25.616 24.932H7.798a1.069 1.069 0 0 1 0-2.135h17.818a1.069 1.069 0 1 1 0 2.135ZM25.616 18.913H7.798a1.069 1.069 0 0 1 0-2.136h17.818a1.069 1.069 0 1 1 0 2.136Z"
        fill="#083891"
      />
      <rect x="30.07" y="16.778" width="8.22" height="8.22" rx="1.59" fill="#083891" />
    </svg>
  );
}

export { PdfFileIcon };
```

- [ ] **Step 5: 빌드 확인**

Run: `pnpm build`
Expected: 빌드 성공 (아이콘 컴포넌트는 import되지 않으므로 tree-shaken되지만 타입 에러 없어야 함)

- [ ] **Step 6: 커밋**

```bash
git add src/components/icon/WarningIcon.tsx src/components/icon/UploadIcon.tsx src/components/icon/CloseIcon.tsx src/components/icon/PdfFileIcon.tsx
git commit -m "feat: WarningIcon, UploadIcon, CloseIcon, PdfFileIcon SVG 아이콘 컴포넌트 추가"
```

---

### Task 2: ValidationMessage 컴포넌트 + Storybook

**Files:**

- Create: `src/components/ui/ValidationMessage/ValidationMessage.tsx`
- Create: `src/components/ui/ValidationMessage/ValidationMessage.stories.tsx`

**Interfaces:**

- Consumes: `WarningIcon` from `@/components/icon/WarningIcon` (Task 1)
- Produces: `ValidationMessage` — props: `{ className?: string; children: React.ReactNode; variant?: 'error' }`

**디자인 스펙 (Figma 24:50378, 24:50633):**

- 컨테이너: `flex items-center gap-[3px]`
- 아이콘: WarningIcon 14x14, `text-danger-40`
- 텍스트: `text-body-xs font-weight-semibold text-danger-40`
- 사용 예: "10MB 이하 파일만 업로드 가능합니다.", "PDF 파일만 업로드 가능합니다.", "올바른 URL을 입력해주세요."

- [ ] **Step 1: ValidationMessage 컴포넌트 작성**

`src/components/ui/ValidationMessage/ValidationMessage.tsx`:

```tsx
import { cn } from '@/lib/utils';
import { WarningIcon } from '@/components/icon/WarningIcon';

type ValidationMessageProps = {
  className?: string;
  children: React.ReactNode;
  variant?: 'error';
};

function ValidationMessage({ className, children, variant = 'error' }: ValidationMessageProps) {
  return (
    <div className={cn('flex items-center gap-[3px]', className)}>
      <WarningIcon className="text-danger-40 size-[14px] shrink-0" />
      <p className="text-body-xs font-weight-semibold text-danger-40">{children}</p>
    </div>
  );
}

export { ValidationMessage };
export type { ValidationMessageProps };
```

- [ ] **Step 2: Storybook 스토리 작성**

`src/components/ui/ValidationMessage/ValidationMessage.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ValidationMessage } from './ValidationMessage';

const meta = {
  title: 'UI/ValidationMessage',
  component: ValidationMessage,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['error'],
    },
  },
} satisfies Meta<typeof ValidationMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FileSizeError: Story = {
  args: {
    variant: 'error',
    children: '10MB 이하 파일만 업로드 가능합니다.',
  },
};

export const FileTypeError: Story = {
  args: {
    variant: 'error',
    children: 'PDF 파일만 업로드 가능합니다.',
  },
};

export const UrlError: Story = {
  args: {
    variant: 'error',
    children: '올바른 URL을 입력해주세요.',
  },
};
```

- [ ] **Step 3: Storybook 빌드 확인**

Run: `pnpm build`
Expected: 빌드 성공

- [ ] **Step 4: 커밋**

```bash
git add src/components/ui/ValidationMessage/
git commit -m "feat: ValidationMessage 공통 컴포넌트 및 Storybook 스토리 구현"
```

---

### Task 3: Input 컴포넌트 + Storybook

**Files:**

- Create: `src/components/ui/Input/Input.tsx`
- Create: `src/components/ui/Input/Input.stories.tsx`

**Interfaces:**

- Consumes: `cn` from `@/lib/utils`, `cva` from `class-variance-authority`
- Produces: `Input` — `React.ComponentProps<'input'>` 확장 + `{ state?: 'default' | 'error' | 'disabled'; label?: string; helperText?: string }`
- Produces: `inputVariants` — cva 인스턴스 (외부 스타일 확장용)

**디자인 스펙 (Figma 24:50452):**

- 입력 필드: `bg-gray-0 border rounded-lg p-[14px] text-heading-xs font-weight-medium text-gray-90`
- placeholder: `placeholder:text-gray-30`
- error 상태: `border-danger-40`
- disabled 상태: `bg-gray-5 text-gray-30 cursor-not-allowed`
- default 상태: `border-gray-10`

- [ ] **Step 1: Input 컴포넌트 작성**

`src/components/ui/Input/Input.tsx`:

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'w-full bg-gray-0 rounded-lg border p-[14px] text-heading-xs font-weight-medium text-gray-90 placeholder:text-gray-30 outline-none transition-colors',
  {
    variants: {
      state: {
        default: 'border-gray-10 focus:border-primary-40',
        error: 'border-danger-40',
        disabled: 'border-gray-10 bg-gray-5 text-gray-30 cursor-not-allowed',
      },
    },
    defaultVariants: { state: 'default' },
  },
);

type InputProps = Omit<React.ComponentProps<'input'>, 'size'> &
  VariantProps<typeof inputVariants> & {
    label?: string;
    helperText?: string;
  };

function Input({ className, state, label, helperText, disabled, id, ...props }: InputProps) {
  const resolvedState = disabled ? 'disabled' : state;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-body-xs font-weight-semibold text-gray-90">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(inputVariants({ state: resolvedState }), className)}
        disabled={disabled || state === 'disabled'}
        {...props}
      />
      {helperText && <span className="text-body-xs font-weight-medium text-gray-30">{helperText}</span>}
    </div>
  );
}

export { Input, inputVariants };
export type { InputProps };
```

- [ ] **Step 2: Storybook 스토리 작성**

`src/components/ui/Input/Input.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from './Input';

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    state: {
      control: 'select',
      options: ['default', 'error', 'disabled'],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '430px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    state: 'default',
    placeholder: '공고 URL을 입력해주세요.',
  },
};

export const WithValue: Story = {
  args: {
    state: 'default',
    defaultValue: 'https://www.wanted.co.kr/wd/12345',
  },
};

export const WithLabel: Story = {
  args: {
    state: 'default',
    label: '공고 URL',
    placeholder: '공고 URL을 입력해주세요.',
    helperText: '채용공고 링크를 붙여넣어 주세요.',
  },
};

export const Error: Story = {
  args: {
    state: 'error',
    defaultValue: 'invalid-url',
  },
};

export const Disabled: Story = {
  args: {
    state: 'disabled',
    placeholder: '공고 URL을 입력해주세요.',
  },
};
```

- [ ] **Step 3: 빌드 확인**

Run: `pnpm build`
Expected: 빌드 성공

- [ ] **Step 4: 커밋**

```bash
git add src/components/ui/Input/
git commit -m "feat: Input 공통 컴포넌트 및 Storybook 스토리 구현"
```

---

### Task 4: Textarea 컴포넌트 + Storybook

**Files:**

- Create: `src/components/ui/Textarea/Textarea.tsx`
- Create: `src/components/ui/Textarea/Textarea.stories.tsx`

**Interfaces:**

- Consumes: `cn` from `@/lib/utils`, `cva` from `class-variance-authority`
- Produces: `Textarea` — `React.ComponentProps<'textarea'>` 확장 + `{ state?: 'default' | 'error' | 'disabled'; label?: string; maxLength?: number }`
- Produces: `textareaVariants` — cva 인스턴스

**디자인 스펙 (Figma 24:50459):**

- 텍스트 영역: Input과 동일한 border/padding/typography 스타일
- 하단 우측: 글자수 카운터 `"{n}자/{maxLength}자"` — `text-body-xs font-weight-medium text-gray-30`
- `maxLength` 기본값: 6000
- `'use client'` 필요 (글자수 추적용 내부 상태)

- [ ] **Step 1: Textarea 컴포넌트 작성**

`src/components/ui/Textarea/Textarea.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textareaVariants = cva(
  'w-full bg-gray-0 rounded-lg border p-[14px] pb-8 text-heading-xs font-weight-medium text-gray-90 placeholder:text-gray-30 outline-none resize-none transition-colors',
  {
    variants: {
      state: {
        default: 'border-gray-10 focus:border-primary-40',
        error: 'border-danger-40',
        disabled: 'border-gray-10 bg-gray-5 text-gray-30 cursor-not-allowed',
      },
    },
    defaultVariants: { state: 'default' },
  },
);

type TextareaProps = React.ComponentProps<'textarea'> &
  VariantProps<typeof textareaVariants> & {
    label?: string;
  };

function Textarea({
  className,
  state,
  label,
  maxLength = 6000,
  disabled,
  id,
  value,
  defaultValue,
  onChange,
  ...props
}: TextareaProps) {
  const [internalLength, setInternalLength] = useState(typeof defaultValue === 'string' ? defaultValue.length : 0);

  const resolvedState = disabled ? 'disabled' : state;
  const displayCount = value !== undefined ? String(value).length : internalLength;

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInternalLength(e.target.value.length);
    onChange?.(e);
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-body-xs font-weight-semibold text-gray-90">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          id={id}
          className={cn(textareaVariants({ state: resolvedState }), className)}
          disabled={disabled || state === 'disabled'}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          {...props}
        />
        <span className="text-body-xs font-weight-medium text-gray-30 pointer-events-none absolute right-[14px] bottom-[14px]">
          {displayCount}자/{maxLength}자
        </span>
      </div>
    </div>
  );
}

export { Textarea, textareaVariants };
export type { TextareaProps };
```

- [ ] **Step 2: Storybook 스토리 작성**

`src/components/ui/Textarea/Textarea.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Textarea } from './Textarea';

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    state: {
      control: 'select',
      options: ['default', 'error', 'disabled'],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '430px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    state: 'default',
    placeholder: '공고 텍스트를 입력해주세요.',
    rows: 5,
  },
};

export const WithValue: Story = {
  args: {
    state: 'default',
    defaultValue: '프론트엔드 개발자를 모집합니다. React, TypeScript 경험 필수...',
    rows: 5,
  },
};

export const WithLabel: Story = {
  args: {
    state: 'default',
    label: '공고 텍스트',
    placeholder: '공고 텍스트를 입력해주세요.',
    rows: 5,
  },
};

export const Error: Story = {
  args: {
    state: 'error',
    defaultValue: '텍스트 내용...',
    rows: 5,
  },
};

export const Disabled: Story = {
  args: {
    state: 'disabled',
    placeholder: '공고 텍스트를 입력해주세요.',
    rows: 5,
  },
};
```

- [ ] **Step 3: 빌드 확인**

Run: `pnpm build`
Expected: 빌드 성공

- [ ] **Step 4: 커밋**

```bash
git add src/components/ui/Textarea/
git commit -m "feat: Textarea 공통 컴포넌트 및 Storybook 스토리 구현"
```

---

### Task 5: FileUploadArea 컴포넌트 + Storybook

**Files:**

- Create: `src/components/common/FileUploadArea/FileUploadArea.tsx`
- Create: `src/components/common/FileUploadArea/FileUploadArea.stories.tsx`

**Interfaces:**

- Consumes: `UploadIcon` from `@/components/icon/UploadIcon`, `PdfFileIcon` from `@/components/icon/PdfFileIcon`, `CloseIcon` from `@/components/icon/CloseIcon` (모두 Task 1), `cn` from `@/lib/utils`
- Produces: `FileUploadArea` — props: `{ className?: string; accept?: string; maxSize?: number; onFileSelect?: (file: File) => void; onFileRemove?: () => void; file?: File | null }`

**디자인 스펙 (Figma 24:50397):**

빈 상태 (요청):

- 컨테이너: `bg-gray-0 border border-dashed border-gray-30 rounded-lg`, 세로 중앙 정렬
- UploadIcon: 32x32, `text-gray-30`
- 타이틀: "이력서 PDF을 업로드해주세요." — `text-heading-sm font-weight-semibold text-gray-50`
- 부제: "10MB까지 업로드 가능합니다." — `text-body-xs font-weight-semibold text-gray-30`

파일 첨부 상태 (업로드):

- 외부 컨테이너: `bg-gray-0 border border-gray-20 rounded-lg p-4`
- 파일 카드: `bg-gray-5 border border-gray-20 rounded-regular p-4 gap-3`
- PdfFileIcon: 47x62
- 파일명: `text-heading-xs font-weight-semibold text-gray-90`, 말줄임(truncate)
- 파일 용량: `text-body-xs font-weight-medium text-gray-30`
- 삭제 버튼: CloseIcon, 우측 상단

`'use client'` 필요: 드래그앤드롭 상태, 파일 input ref, 이벤트 핸들러.

- [ ] **Step 1: FileUploadArea 컴포넌트 작성**

`src/components/common/FileUploadArea/FileUploadArea.tsx`:

```tsx
'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { UploadIcon } from '@/components/icon/UploadIcon';
import { PdfFileIcon } from '@/components/icon/PdfFileIcon';
import { CloseIcon } from '@/components/icon/CloseIcon';

type FileUploadAreaProps = {
  className?: string;
  accept?: string;
  maxSize?: number;
  onFileSelect?: (file: File) => void;
  onFileRemove?: () => void;
  file?: File | null;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function FileUploadArea({
  className,
  accept = '.pdf',
  maxSize = 10 * 1024 * 1024,
  onFileSelect,
  onFileRemove,
  file,
}: FileUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect?.(selectedFile);
    }
    e.target.value = '';
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      onFileSelect?.(droppedFile);
    }
  }

  if (file) {
    return (
      <div className={cn('border-gray-20 bg-gray-0 rounded-lg border p-4', className)}>
        <div className="rounded-regular border-gray-20 bg-gray-5 flex items-start gap-3 border p-4">
          <PdfFileIcon className="h-[62px] w-[47px] shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <p className="text-heading-xs font-weight-semibold text-gray-90 truncate">{file.name}</p>
            <p className="text-body-xs font-weight-medium text-gray-30">{formatFileSize(file.size)}</p>
          </div>
          <button type="button" onClick={onFileRemove} className="shrink-0 p-1" aria-label="파일 삭제">
            <CloseIcon className="text-gray-90/50 size-2" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'border-gray-30 bg-gray-0 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-[104px] py-[47px]',
        isDragging && 'border-primary-40 bg-primary-5',
        className,
      )}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input ref={inputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />
      <UploadIcon className="text-gray-30 size-8" />
      <div className="flex flex-col items-center gap-[3px]">
        <p className="text-heading-sm font-weight-semibold whitespace-nowrap text-gray-50">
          이력서 PDF을 업로드해주세요.
        </p>
        <p className="text-body-xs font-weight-semibold text-gray-30 whitespace-nowrap">10MB까지 업로드 가능합니다.</p>
      </div>
    </div>
  );
}

export { FileUploadArea };
export type { FileUploadAreaProps };
```

- [ ] **Step 2: Storybook 스토리 작성**

`src/components/common/FileUploadArea/FileUploadArea.stories.tsx`:

```tsx
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FileUploadArea } from './FileUploadArea';

const meta = {
  title: 'Common/FileUploadArea',
  component: FileUploadArea,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '430px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FileUploadArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {},
};

export const WithFile: Story = {
  args: {
    file: new File([''], 'Document.pdf', { type: 'application/pdf' }),
  },
};

function InteractiveUpload() {
  const [file, setFile] = useState<File | null>(null);
  return <FileUploadArea file={file} onFileSelect={setFile} onFileRemove={() => setFile(null)} />;
}

export const Interactive: Story = {
  render: () => <InteractiveUpload />,
};
```

- [ ] **Step 3: 빌드 확인**

Run: `pnpm build`
Expected: 빌드 성공

- [ ] **Step 4: 커밋**

```bash
git add src/components/common/FileUploadArea/
git commit -m "feat: FileUploadArea 공통 컴포넌트 및 Storybook 스토리 구현"
```
