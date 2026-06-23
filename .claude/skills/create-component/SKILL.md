---
name: create-component
description: React 컴포넌트를 생성합니다. 컴포넌트 타입(ui/common/feature)과 이름을 인자로 받아 Tailwind + cn() + cva() 패턴의 컴포넌트를 scaffolding합니다. 사용 시: "/create-component {type} {name}" (예: "/create-component ui Button")
---

# Create Component

React 컴포넌트를 생성하는 스킬입니다.

## 입력

인자 형식: `{type} {ComponentName}`

- `type`: `ui` | `common` | `{feature}` (예: `resume`, `job`)
- `ComponentName`: PascalCase 컴포넌트 이름

## 실행 절차

1. **인자 파싱**: type과 ComponentName을 추출한다.
2. **경로 결정**:
   - `ui` → `src/components/ui/{ComponentName}.tsx`
   - `common` → `src/components/common/{ComponentName}.tsx`
   - `{feature}` → `src/components/{feature}/{ComponentName}.tsx`
3. **컴포넌트 파일 생성**: 아래 템플릿으로 생성한다.
4. **린트 확인**: `pnpm lint`를 실행하여 에러가 없는지 확인한다.

## 기본 컴포넌트 템플릿

```tsx
import { cn } from '@/lib/utils';

type {ComponentName}Props = {
  className?: string;
  children?: React.ReactNode;
};

export function {ComponentName}({ className, children }: {ComponentName}Props) {
  return <div className={cn('', className)}>{children}</div>;
}
```

## Variants 컴포넌트 템플릿 (사용자가 variants를 요청한 경우)

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const {componentName}Variants = cva('', {
  variants: {
    variant: {
      default: '',
    },
    size: {
      default: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

type {ComponentName}Props = React.ComponentProps<'div'> & VariantProps<typeof {componentName}Variants>;

export function {ComponentName}({ className, variant, size, ...props }: {ComponentName}Props) {
  return <div className={cn({componentName}Variants({ variant, size }), className)} {...props} />;
}
```

## 규칙

- `.claude/rules/coding-conventions.md`의 컴포넌트 패턴을 따른다.
- 함수 선언문 사용 (`function Component()`, 화살표 함수 X)
- named export 사용 (`export function`, `export default` X)
- `@/` 경로 alias로 import
- Tailwind 클래스만 사용 (인라인 스타일, CSS 모듈 X)
