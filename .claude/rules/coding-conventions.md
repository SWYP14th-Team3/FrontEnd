---
description: 네이밍, 스타일링, 타입 등 코딩 컨벤션
globs: ['src/**/*.ts', 'src/**/*.tsx']
---

# 코딩 컨벤션

## 네이밍

- 컴포넌트 파일/함수: PascalCase (`LoginForm.tsx`, `function LoginForm()`)
- 훅 파일/함수: camelCase, `use` 접두사 (`useAuth.ts`, `function useAuth()`)
- 유틸 파일/함수: camelCase (`formatDate.ts`, `function formatDate()`)
- 타입/인터페이스: PascalCase, Props 접미사 (`ButtonProps`, `UserData`)
- 상수: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `API_BASE_URL`)
- CSS 클래스: Tailwind 유틸리티만 사용 (커스텀 CSS 클래스 지양)

## 임포트

- 경로 alias `@/` 사용: `import { cn } from '@/lib/utils'`
- 상대 경로는 같은 디렉토리 내 파일 간에만 사용

## 스타일링

- Tailwind CSS v4 유틸리티 클래스 사용
- 조건부/동적 클래스: `cn()` 함수 사용 (`@/lib/utils`)
- 컴포넌트 variants: `cva()` 사용 (`class-variance-authority`)
- Tailwind 클래스 순서: prettier-plugin-tailwindcss가 자동 정렬

### cn() 사용 예시

```tsx
import { cn } from '@/lib/utils';

function Component({ className, active }: { className?: string; active?: boolean }) {
  return <div className={cn('rounded-lg p-4', active && 'bg-blue-500', className)} />;
}
```

### cva() 사용 예시

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva('inline-flex items-center justify-center rounded-md font-medium', {
  variants: {
    variant: {
      default: 'bg-primary text-white',
      outline: 'border border-input bg-transparent',
    },
    size: {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 px-3 text-sm',
      lg: 'h-12 px-6 text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

type ButtonProps = React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

## 컴포넌트 패턴

- 함수 선언문 사용: `function Component()` (화살표 함수 X)
- Props는 인라인 타입 또는 별도 type으로 정의
- `export default` 대신 named export 선호 (페이지 파일 제외)
- 페이지 컴포넌트(`page.tsx`)만 `export default` 사용

## Prettier / ESLint

- printWidth: 120
- singleQuote: true
- trailingComma: all
- tabWidth: 2
- 커밋 시 Husky + lint-staged가 자동으로 린트/포매팅 실행
