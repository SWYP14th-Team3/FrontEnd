# 분석 결과 탭(분석 기록) 목록 페이지 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 헤더 "분석 기록" 탭 클릭 시 `/history` 라우트에서 분석 결과 목록을 카드 형태로 보여주는 페이지를 구현한다.

**Architecture:** 서버 컴포넌트(`page.tsx`)가 `SuspenseBoundary`로 클라이언트 루트를 래핑하고, 클라이언트 컴포넌트에서 `useSuspenseQuery` + `analysisListOptions`로 데이터를 페칭한다. 검색/페이지네이션은 URL search params가 아닌 로컬 상태로 관리하며, 삭제는 `overlay-kit` 모달로 확인 후 `useDeleteAnalysis` mutation을 호출한다.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4 + cn() + cva(), TanStack Query v5, overlay-kit, Zod

## Global Constraints

- React Compiler 활성화 — `useMemo`, `useCallback`, `React.memo` 사용 금지
- 함수 선언문 사용 (`function Component()`, 화살표 함수 X)
- 페이지 컴포넌트만 `export default`, 나머지는 named export
- `@/` 경로 alias 사용
- 아이콘 라이브러리 미사용 — SVG를 ReactNode로 직접 주입
- 서버 컴포넌트 기본, 클라이언트 필요 시에만 `'use client'`
- `overlay-kit`으로 모달 관리 (프로젝트 패턴)
- 기존 모달 패턴: `{ isOpen, close, unmount }` props (`LogoutConfirmModal` 참조)
- barrel export 금지 — 직접 파일 경로로 import

---

### Task 1: MSW 핸들러 개선 — 검색/페이지네이션/삭제 반영

**Files:**

- Modify: `src/mocks/data/analysis.ts` (313행 `mockAnalysisListItems` 배열 확장)
- Modify: `src/mocks/handlers/analysis.ts` (35행 `GET /api/analyses` 핸들러, 77행 `DELETE` 핸들러)

**Interfaces:**

- Consumes: `analysisListItemSchema` (from `src/api/analysis/schema.ts`)
- Produces: MSW 핸들러가 `companyName` 필터, `page`/`size` 슬라이싱, 삭제 반영을 지원

- [ ] **Step 1: 목 데이터 12건으로 확장**

`src/mocks/data/analysis.ts`의 `mockAnalysisListItems` 배열을 12건으로 확장한다. 기존 3건은 유지하고 9건을 추가한다. 다양한 회사명/등급/날짜/재분석 횟수를 포함한다.

```typescript
// src/mocks/data/analysis.ts — mockAnalysisListItems 배열을 교체
export const mockAnalysisListItems: MockAnalysisListItem[] = [
  {
    analysisResultId: 1,
    companyName: '테크스타트업 주식회사',
    positionTitle: '프론트엔드 개발자',
    overallLevel: 'HIGH',
    redCount: 2,
    yellowCount: 1,
    greenCount: 4,
    retryCount: 0,
    remainingRetryCount: 5,
    createdAt: '2026-07-10T09:00:00',
    updatedAt: '2026-07-10T09:00:00',
    finalSavedAt: null,
  },
  {
    analysisResultId: 2,
    companyName: '글로벌 IT 기업',
    positionTitle: '풀스택 개발자',
    overallLevel: 'MEDIUM',
    redCount: 4,
    yellowCount: 2,
    greenCount: 2,
    retryCount: 1,
    remainingRetryCount: 4,
    createdAt: '2026-07-11T10:00:00',
    updatedAt: '2026-07-11T11:00:00',
    finalSavedAt: '2026-07-11T11:00:00',
  },
  {
    analysisResultId: 3,
    companyName: null,
    positionTitle: '백엔드 개발자',
    overallLevel: 'LOW',
    redCount: 5,
    yellowCount: 2,
    greenCount: 1,
    retryCount: 2,
    remainingRetryCount: 3,
    createdAt: '2026-07-12T14:00:00',
    updatedAt: '2026-07-12T14:30:00',
    finalSavedAt: null,
  },
  {
    analysisResultId: 4,
    companyName: '토스',
    positionTitle: 'Product Engineer',
    overallLevel: 'MEDIUM',
    redCount: 3,
    yellowCount: 3,
    greenCount: 4,
    retryCount: 0,
    remainingRetryCount: 5,
    createdAt: '2026-07-01T10:00:00',
    updatedAt: '2026-07-01T10:00:00',
    finalSavedAt: '2026-07-01T12:00:00',
  },
  {
    analysisResultId: 5,
    companyName: '카카오',
    positionTitle: '서버 개발자',
    overallLevel: 'HIGH',
    redCount: 1,
    yellowCount: 2,
    greenCount: 7,
    retryCount: 1,
    remainingRetryCount: 4,
    createdAt: '2026-07-02T09:00:00',
    updatedAt: '2026-07-02T10:30:00',
    finalSavedAt: '2026-07-02T10:30:00',
  },
  {
    analysisResultId: 6,
    companyName: '네이버',
    positionTitle: 'FE 플랫폼 개발자',
    overallLevel: 'MEDIUM',
    redCount: 2,
    yellowCount: 4,
    greenCount: 3,
    retryCount: 0,
    remainingRetryCount: 5,
    createdAt: '2026-07-03T11:00:00',
    updatedAt: '2026-07-03T11:00:00',
    finalSavedAt: null,
  },
  {
    analysisResultId: 7,
    companyName: '쿠팡',
    positionTitle: 'Software Engineer',
    overallLevel: 'LOW',
    redCount: 6,
    yellowCount: 1,
    greenCount: 2,
    retryCount: 3,
    remainingRetryCount: 2,
    createdAt: '2026-07-04T14:00:00',
    updatedAt: '2026-07-04T15:00:00',
    finalSavedAt: '2026-07-04T15:00:00',
  },
  {
    analysisResultId: 8,
    companyName: '라인',
    positionTitle: 'iOS Developer',
    overallLevel: 'HIGH',
    redCount: 0,
    yellowCount: 3,
    greenCount: 6,
    retryCount: 0,
    remainingRetryCount: 5,
    createdAt: '2026-07-05T08:00:00',
    updatedAt: '2026-07-05T08:00:00',
    finalSavedAt: null,
  },
  {
    analysisResultId: 9,
    companyName: '배달의민족',
    positionTitle: 'Android 개발자',
    overallLevel: 'MEDIUM',
    redCount: 2,
    yellowCount: 3,
    greenCount: 4,
    retryCount: 2,
    remainingRetryCount: 3,
    createdAt: '2026-07-06T16:00:00',
    updatedAt: '2026-07-06T17:00:00',
    finalSavedAt: '2026-07-06T17:00:00',
  },
  {
    analysisResultId: 10,
    companyName: '카카오',
    positionTitle: '데이터 엔지니어',
    overallLevel: 'LOW',
    redCount: 5,
    yellowCount: 3,
    greenCount: 1,
    retryCount: 0,
    remainingRetryCount: 5,
    createdAt: '2026-07-07T09:00:00',
    updatedAt: '2026-07-07T09:00:00',
    finalSavedAt: null,
  },
  {
    analysisResultId: 11,
    companyName: '토스',
    positionTitle: 'Backend Engineer',
    overallLevel: 'HIGH',
    redCount: 1,
    yellowCount: 1,
    greenCount: 8,
    retryCount: 1,
    remainingRetryCount: 4,
    createdAt: '2026-07-08T10:00:00',
    updatedAt: '2026-07-08T11:00:00',
    finalSavedAt: '2026-07-08T11:00:00',
  },
  {
    analysisResultId: 12,
    companyName: '당근',
    positionTitle: 'Web Frontend',
    overallLevel: 'MEDIUM',
    redCount: 3,
    yellowCount: 2,
    greenCount: 5,
    retryCount: 0,
    remainingRetryCount: 5,
    createdAt: '2026-07-09T13:00:00',
    updatedAt: '2026-07-09T13:00:00',
    finalSavedAt: null,
  },
];
```

그리고 `mockPaginatedAnalysisList`도 업데이트:

```typescript
export const mockPaginatedAnalysisList: MockPaginatedAnalysisList = {
  content: mockAnalysisListItems.slice(0, 10),
  page: 0,
  size: 10,
  totalElements: mockAnalysisListItems.length,
  totalPages: Math.ceil(mockAnalysisListItems.length / 10),
  last: false,
};
```

- [ ] **Step 2: GET 핸들러에 검색/페이지네이션 로직 추가, DELETE에 인메모리 삭제 반영**

`src/mocks/handlers/analysis.ts`를 수정한다:

```typescript
import { http, HttpResponse } from 'msw';

import { mockAnalysisResult, mockAnalysisListItems, mockReanalysisRequirements } from '@/mocks/data/analysis';

// 인메모리 목 데이터 (삭제 반영용)
let mutableListItems = [...mockAnalysisListItems];

const mockReanalyzeResponse = {
  analysisResultId: 1,
  overallLevel: 'HIGH' as const,
  redCount: 1,
  yellowCount: 2,
  greenCount: 4,
  retryCount: 1,
  remainingRetryCount: 4,
  resumeCurrentText: '재분석된 이력서 텍스트',
  updatedAt: '2025-07-10T10:00:00',
  requirements: mockReanalysisRequirements,
};

export const analysisHandlers = [
  http.post('/api/analyses', () => {
    return HttpResponse.json({
      status: 200,
      message: '분석 완료',
      data: mockAnalysisResult,
    });
  }),

  http.get('/api/analyses/:id', () => {
    return HttpResponse.json({
      status: 200,
      message: '분석 결과 조회 성공',
      data: mockAnalysisResult,
    });
  }),

  http.get('/api/analyses', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '0');
    const size = Number(url.searchParams.get('size') ?? '10');
    const companyName = url.searchParams.get('companyName') ?? '';

    let filtered = mutableListItems;
    if (companyName) {
      filtered = filtered.filter((item) => item.companyName?.includes(companyName));
    }

    const totalElements = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const start = page * size;
    const content = filtered.slice(start, start + size);

    return HttpResponse.json({
      status: 200,
      message: '분석 목록 조회 성공',
      data: {
        content,
        page,
        size,
        totalElements,
        totalPages,
        last: page >= totalPages - 1,
      },
    });
  }),

  http.patch('/api/analyses/:id/resume', () => {
    return HttpResponse.json({
      status: 200,
      message: '이력서 자동 저장 성공',
      data: {
        analysisResultId: 1,
        resumeCurrentText: '수정된 이력서 텍스트',
        updatedAt: '2025-07-10T10:00:00',
      },
    });
  }),

  http.post('/api/analyses/:id/reanalyze', () => {
    return HttpResponse.json({
      status: 200,
      message: '재분석 완료',
      data: mockReanalyzeResponse,
    });
  }),

  http.patch('/api/analyses/:id/save', () => {
    return HttpResponse.json({
      status: 200,
      message: '분석 결과 저장 성공',
      data: {
        analysisResultId: 1,
        saved: true,
        resumeCurrentText: '저장된 이력서 텍스트',
        finalSavedAt: '2025-07-10T10:30:00',
        updatedAt: '2025-07-10T10:30:00',
      },
    });
  }),

  http.delete('/api/analyses/:id', ({ params }) => {
    const id = Number(params.id);
    mutableListItems = mutableListItems.filter((item) => item.analysisResultId !== id);
    return HttpResponse.json({
      status: 200,
      message: '분석 결과 삭제 성공',
      data: {
        analysisResultId: id,
        deleted: true,
        deletedAt: new Date().toISOString(),
      },
    });
  }),

  http.patch('/api/analyses/:id/satisfaction', () => {
    return HttpResponse.json({
      status: 200,
      message: '만족도 저장 성공',
      data: {
        analysisResultId: 1,
        satisfaction: 'LIKE',
        updatedAt: '2025-07-10T10:30:00',
      },
    });
  }),
];
```

- [ ] **Step 3: 개발 서버에서 MSW 동작 확인**

Run: `pnpm dev`

브라우저 콘솔에서 확인:

1. `fetch('/api/analyses?page=0&size=10')` → 10건 반환, `totalPages: 2`
2. `fetch('/api/analyses?page=1&size=10')` → 2건 반환, `last: true`
3. `fetch('/api/analyses?companyName=카카오')` → 2건 반환 (카카오 2건)
4. `fetch('/api/analyses?companyName=없는회사')` → 0건, `totalElements: 0`

- [ ] **Step 4: 커밋**

```bash
git add src/mocks/data/analysis.ts src/mocks/handlers/analysis.ts
git commit -m "feat: MSW 핸들러에 검색/페이지네이션/삭제 반영 추가"
```

---

### Task 2: 아이콘 컴포넌트 추가 — 검색, 케밥, 느낌표

**Files:**

- Create: `src/components/icon/SearchIcon.tsx`
- Create: `src/components/icon/KebabIcon.tsx`
- Create: `src/components/icon/ExclamationCircleIcon.tsx`
- Create: `src/components/icon/TrashIcon.tsx`

**Interfaces:**

- Consumes: 없음
- Produces: `SearchIcon`, `KebabIcon`, `ExclamationCircleIcon`, `TrashIcon` — 모두 `React.ComponentProps<'svg'>` 확장

- [ ] **Step 1: 피그마 디자인 기반 아이콘 4종 생성**

`SearchIcon.tsx`:

```tsx
type SearchIconProps = React.ComponentProps<'svg'>;

function SearchIcon(props: SearchIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 13L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export { SearchIcon };
```

`KebabIcon.tsx`:

```tsx
type KebabIconProps = React.ComponentProps<'svg'>;

function KebabIcon(props: KebabIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="10" cy="4" r="1.5" fill="currentColor" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
      <circle cx="10" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

export { KebabIcon };
```

`ExclamationCircleIcon.tsx`:

```tsx
type ExclamationCircleIconProps = React.ComponentProps<'svg'>;

function ExclamationCircleIcon(props: ExclamationCircleIconProps) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2" />
      <path d="M20 12V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="27" r="1.5" fill="currentColor" />
    </svg>
  );
}

export { ExclamationCircleIcon };
```

`TrashIcon.tsx`:

```tsx
type TrashIconProps = React.ComponentProps<'svg'>;

function TrashIcon(props: TrashIconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M2 4H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.5 4L4.25 13C4.25 13.5523 4.69772 14 5.25 14H10.75C11.3023 14 11.75 13.5523 11.75 13L12.5 4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export { TrashIcon };
```

- [ ] **Step 2: 린트 확인**

Run: `pnpm lint`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/icon/SearchIcon.tsx src/components/icon/KebabIcon.tsx src/components/icon/ExclamationCircleIcon.tsx src/components/icon/TrashIcon.tsx
git commit -m "feat: 분석 기록 페이지용 아이콘 컴포넌트 추가"
```

---

### Task 3: EmptyState 컴포넌트

**Files:**

- Create: `src/app/history/_components/EmptyState.tsx`

**Interfaces:**

- Consumes: `ExclamationCircleIcon` from `@/components/icon/ExclamationCircleIcon`
- Produces: `EmptyState` — props 없는 정적 컴포넌트

- [ ] **Step 1: EmptyState 구현**

```tsx
// src/app/history/_components/EmptyState.tsx
import { ExclamationCircleIcon } from '@/components/icon/ExclamationCircleIcon';

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-[120px]">
      <ExclamationCircleIcon className="text-primary-40" />
      <p className="text-heading-md font-weight-semibold text-gray-90 mt-4">아직 저장된 분석 결과가 없어요.</p>
      <p className="text-heading-xs font-weight-medium text-gray-40 mt-2">새로운 분석을 시작해 보세요.</p>
    </div>
  );
}

export { EmptyState };
```

- [ ] **Step 2: 린트 확인**

Run: `pnpm lint`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/history/_components/EmptyState.tsx
git commit -m "feat: 분석 기록 빈 상태 EmptyState 컴포넌트 구현"
```

---

### Task 4: Pagination 컴포넌트

**Files:**

- Create: `src/app/history/_components/Pagination.tsx`

**Interfaces:**

- Consumes: 없음
- Produces: `Pagination` — `{ currentPage: number; totalPages: number; onPageChange: (page: number) => void }`

- [ ] **Step 1: Pagination 구현**

```tsx
// src/app/history/_components/Pagination.tsx
'use client';

import { cn } from '@/lib/utils';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <nav aria-label="페이지네이션" className="flex items-center justify-center gap-2 py-6">
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? 'page' : undefined}
          className={cn(
            'rounded-regular text-body-sm font-weight-medium flex size-8 items-center justify-center transition-colors',
            page === currentPage ? 'bg-primary-40 text-gray-0' : 'text-gray-40 hover:bg-gray-5',
          )}
        >
          {page + 1}
        </button>
      ))}
    </nav>
  );
}

export { Pagination };
```

- [ ] **Step 2: 린트 확인**

Run: `pnpm lint`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/history/_components/Pagination.tsx
git commit -m "feat: 숫자 페이지네이션 Pagination 컴포넌트 구현"
```

---

### Task 5: DeleteConfirmModal 컴포넌트

**Files:**

- Create: `src/app/history/_components/DeleteConfirmModal.tsx`

**Interfaces:**

- Consumes: `useDeleteAnalysis` from `@/api/analysis/queries`
- Produces: `DeleteConfirmModal` — `{ isOpen: boolean; close: () => void; unmount: () => void; analysisResultId: number }`

- [ ] **Step 1: DeleteConfirmModal 구현**

기존 `LogoutConfirmModal` 패턴을 따른다 (overlay-kit의 `{ isOpen, close, unmount }` 패턴).

```tsx
// src/app/history/_components/DeleteConfirmModal.tsx
'use client';

import { useDeleteAnalysis } from '@/api/analysis/queries';

type DeleteConfirmModalProps = {
  isOpen: boolean;
  close: () => void;
  unmount: () => void;
  analysisResultId: number;
};

function DeleteConfirmModal({ isOpen, close, unmount, analysisResultId }: DeleteConfirmModalProps) {
  const { mutate: deleteAnalysis, isPending } = useDeleteAnalysis();

  if (!isOpen) return null;

  const handleClose = () => {
    close();
    unmount();
  };

  const handleDelete = () => {
    deleteAnalysis(analysisResultId, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        className="rounded-xxxl bg-gray-0 flex flex-col items-center gap-[40px] px-[30px] pt-[50px] pb-[30px] shadow-[0px_4px_10px_rgba(0,0,0,0.05)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-[8px]">
          <div className="bg-danger-5 flex size-[40px] items-center justify-center rounded-full">
            <span className="text-body-lg text-danger-40">!</span>
          </div>
          <h2 id="delete-title" className="text-heading-md font-weight-semibold text-gray-90 mt-2 tracking-[-0.72px]">
            분석 결과를 삭제하시겠어요?
          </h2>
          <p className="text-heading-xs font-weight-semibold text-gray-40 tracking-[-0.51px]">
            삭제한 결과는 복구할 수 없어요.
          </p>
        </div>

        <div className="flex gap-[10px]">
          <button
            type="button"
            className="bg-gray-5 text-body-lg font-weight-semibold text-gray-60 w-[200px] rounded-xl py-[14px]"
            onClick={handleClose}
            disabled={isPending}
          >
            취소하기
          </button>
          <button
            type="button"
            className="bg-primary-40 text-body-lg font-weight-semibold text-gray-0 w-[200px] rounded-xl py-[14px]"
            onClick={handleDelete}
            disabled={isPending}
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}

export { DeleteConfirmModal };
```

- [ ] **Step 2: 린트 확인**

Run: `pnpm lint`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/history/_components/DeleteConfirmModal.tsx
git commit -m "feat: 분석 결과 삭제 확인 모달 구현"
```

---

### Task 6: AnalysisResultCard 컴포넌트

**Files:**

- Create: `src/app/history/_components/AnalysisResultCard.tsx`

**Interfaces:**

- Consumes: `AnalysisListItem` from `@/api/analysis/types`, `KebabIcon` from `@/components/icon/KebabIcon`, `TrashIcon` from `@/components/icon/TrashIcon`
- Produces: `AnalysisResultCard` — `{ item: AnalysisListItem; onDelete: (id: number) => void }`

- [ ] **Step 1: AnalysisResultCard 구현**

등급 아이콘 매핑: `HIGH` → "상" (초록 배경), `MEDIUM` → "중" (노란 배경), `LOW` → "하" (빨간 배경)

날짜 표시 규칙: `finalSavedAt`이 있으면 최종 저장 시각, `null`이면 `createdAt` 기준으로 표시.

```tsx
// src/app/history/_components/AnalysisResultCard.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { KebabIcon } from '@/components/icon/KebabIcon';
import { TrashIcon } from '@/components/icon/TrashIcon';
import type { AnalysisListItem } from '@/api/analysis/types';

type AnalysisResultCardProps = {
  item: AnalysisListItem;
  onDelete: (id: number) => void;
};

const levelConfig = {
  HIGH: { label: '상', className: 'bg-success-10 text-success-50' },
  MEDIUM: { label: '중', className: 'bg-warning-5 text-warning-40' },
  LOW: { label: '하', className: 'bg-danger-5 text-danger-40' },
} as const;

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function AnalysisResultCard({ item, onDelete }: AnalysisResultCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const level = levelConfig[item.overallLevel];
  const displayName = item.companyName ?? '회사명 없음';
  const displayDate = item.finalSavedAt ?? item.createdAt;

  return (
    <div className="border-gray-10 bg-gray-0 hover:bg-gray-5 flex items-center gap-4 rounded-xl border px-6 py-5 transition-colors">
      {/* 등급 아이콘 */}
      <div
        className={cn(
          'text-heading-md font-weight-bold flex size-[52px] shrink-0 items-center justify-center rounded-lg',
          level.className,
        )}
      >
        {level.label}
      </div>

      {/* 회사 · 포지션 + 날짜 */}
      <div className="flex-1">
        <p className="text-heading-xs font-weight-semibold text-gray-90">
          {displayName} · {item.positionTitle}
        </p>
        <p className="text-body-xs font-weight-medium text-gray-30 mt-0.5">{formatDate(displayDate)}</p>
      </div>

      {/* 재분석 + 남은 횟수 */}
      <span className="text-body-xs font-weight-medium text-gray-40">재분석</span>
      <span className="bg-primary-5 text-body-xs font-weight-semibold text-primary-40 rounded-[32px] px-2.5 py-1">
        {item.remainingRetryCount}회남음
      </span>

      {/* 케밥 메뉴 */}
      <div className="relative">
        <button
          type="button"
          className="rounded-regular text-gray-40 hover:bg-gray-5 flex size-8 items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          aria-label="더보기 메뉴"
        >
          <KebabIcon />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="border-gray-10 bg-gray-0 absolute top-full right-0 z-20 mt-1 rounded-lg border py-1 shadow-[0px_4px_10px_rgba(0,0,0,0.1)]">
              <button
                type="button"
                className="text-body-sm font-weight-medium text-gray-60 hover:bg-gray-5 flex w-[126px] items-center gap-2 px-4 py-2.5"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete(item.analysisResultId);
                }}
              >
                <TrashIcon />
                삭제하기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export { AnalysisResultCard };
```

- [ ] **Step 2: 린트 확인**

Run: `pnpm lint`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/history/_components/AnalysisResultCard.tsx
git commit -m "feat: 분석 결과 카드 AnalysisResultCard 컴포넌트 구현"
```

---

### Task 7: SearchBar + SortDropdown 컴포넌트

**Files:**

- Create: `src/app/history/_components/SearchBar.tsx`
- Create: `src/app/history/_components/SortDropdown.tsx`

**Interfaces:**

- Consumes: `SearchIcon` from `@/components/icon/SearchIcon`, `ChevronDownIcon` from `@/components/icon/ChevronDownIcon`
- Produces:
  - `SearchBar` — `{ value: string; onChange: (value: string) => void }`
  - `SortDropdown` — props 없음 (UI만, 백엔드 미지원)

- [ ] **Step 1: SearchBar 구현**

```tsx
// src/app/history/_components/SearchBar.tsx
'use client';

import { SearchIcon } from '@/components/icon/SearchIcon';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="회사명으로 검색해보세요"
        className="border-gray-10 bg-gray-0 text-body-sm font-weight-medium text-gray-90 placeholder:text-gray-30 focus:border-primary-40 w-[280px] rounded-lg border py-2.5 pr-10 pl-3 transition-colors outline-none"
      />
      <SearchIcon className="text-gray-30 absolute top-1/2 right-3 -translate-y-1/2" />
    </div>
  );
}

export { SearchBar };
```

- [ ] **Step 2: SortDropdown 구현**

정렬 파라미터는 백엔드 스펙에 없으므로 UI만 구현한다.

```tsx
// src/app/history/_components/SortDropdown.tsx
'use client';

import { ChevronDownIcon } from '@/components/icon/ChevronDownIcon';

function SortDropdown() {
  return (
    <button type="button" className="text-body-sm font-weight-medium text-gray-40 flex items-center gap-1">
      최신순
      <ChevronDownIcon className="size-4" />
    </button>
  );
}

export { SortDropdown };
```

- [ ] **Step 3: 린트 확인**

Run: `pnpm lint`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/app/history/_components/SearchBar.tsx src/app/history/_components/SortDropdown.tsx
git commit -m "feat: 검색바 SearchBar + 정렬 드롭다운 SortDropdown 구현"
```

---

### Task 8: HistoryPageClient + page.tsx — 페이지 조립

**Files:**

- Create: `src/app/history/_components/HistoryPageClient.tsx`
- Create: `src/app/history/page.tsx`

**Interfaces:**

- Consumes:
  - `analysisListOptions` from `@/api/analysis/queries`
  - `useDeleteAnalysis` from `@/api/analysis/queries`
  - `useSuspenseQuery` from `@tanstack/react-query`
  - `useDebounce` from `@frontend-toolkit-js/hooks`
  - `overlay` from `overlay-kit`
  - `AnalysisResultCard` from `./AnalysisResultCard`
  - `SearchBar` from `./SearchBar`
  - `SortDropdown` from `./SortDropdown`
  - `Pagination` from `./Pagination`
  - `EmptyState` from `./EmptyState`
  - `DeleteConfirmModal` from `./DeleteConfirmModal`
  - `SuspenseBoundary` from `@/components/common/SuspenseBoundary`
  - `Spinner` from `@/components/ui/Spinner/Spinner`
- Produces: `/history` 라우트 페이지

- [ ] **Step 1: HistoryPageClient 구현**

```tsx
// src/app/history/_components/HistoryPageClient.tsx
'use client';

import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useDebounce } from '@frontend-toolkit-js/hooks';
import { overlay } from 'overlay-kit';
import { analysisListOptions } from '@/api/analysis/queries';
import { AnalysisResultCard } from './AnalysisResultCard';
import { SearchBar } from './SearchBar';
import { SortDropdown } from './SortDropdown';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { DeleteConfirmModal } from './DeleteConfirmModal';

function HistoryPageClient() {
  const [page, setPage] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, 300);

  const { data } = useSuspenseQuery(
    analysisListOptions({
      page,
      size: 10,
      companyName: debouncedSearch || undefined,
    }),
  );

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setPage(0);
  };

  const handleDelete = (analysisResultId: number) => {
    overlay.open(({ isOpen, close, unmount }) => (
      <DeleteConfirmModal isOpen={isOpen} close={close} unmount={unmount} analysisResultId={analysisResultId} />
    ));
  };

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="pt-[60px] pb-6">
        <h1 className="text-heading-lg font-weight-bold text-gray-90">분석 결과</h1>
        <p className="text-heading-xs font-weight-medium text-gray-30 mt-2">
          저장된 분석 결과를 확인하고 수정할 수 있어요
        </p>
      </div>

      {/* 필터/검색 바 */}
      <div className="flex items-center justify-between pb-4">
        <SortDropdown />
        <SearchBar value={searchValue} onChange={handleSearchChange} />
      </div>

      {/* 결과 리스트 또는 빈 상태 */}
      {data.content.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-3">
          {data.content.map((item) => (
            <AnalysisResultCard key={item.analysisResultId} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
    </div>
  );
}

export { HistoryPageClient };
```

- [ ] **Step 2: page.tsx 구현**

```tsx
// src/app/history/page.tsx
import { SuspenseBoundary } from '@/components/common/SuspenseBoundary';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { HistoryPageClient } from './_components/HistoryPageClient';

export default function HistoryPage() {
  return (
    <SuspenseBoundary
      pendingFallback={
        <div className="flex items-center justify-center py-[200px]">
          <Spinner size="lg" />
        </div>
      }
      errorFallback={(error, reset) => (
        <div className="flex flex-col items-center justify-center gap-4 py-[200px]">
          <p className="text-heading-xs font-weight-medium text-gray-40">분석 결과를 불러오지 못했어요.</p>
          <button
            type="button"
            onClick={reset}
            className="rounded-regular bg-primary-40 text-body-sm font-weight-semibold text-gray-0 px-4 py-2"
          >
            다시 시도하기
          </button>
        </div>
      )}
    >
      <HistoryPageClient />
    </SuspenseBoundary>
  );
}
```

- [ ] **Step 3: 개발 서버에서 통합 확인**

Run: `pnpm dev`

브라우저에서 확인:

1. `/history` 접속 → 목록 10건 표시 + 페이지네이션 `1 2`
2. 페이지 2 클릭 → 나머지 2건 표시
3. 검색창에 "카카오" 입력 → 300ms 후 2건만 표시
4. 검색창에 "없는회사" 입력 → 빈 상태 UI 표시
5. 케밥 메뉴 → "삭제하기" → 모달 표시 → 삭제 → 목록에서 제거
6. 헤더 "분석 기록" 탭 활성 상태 확인

- [ ] **Step 4: 빌드 확인**

Run: `pnpm build`
Expected: 빌드 성공, 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/app/history/page.tsx src/app/history/_components/HistoryPageClient.tsx
git commit -m "feat: 분석 기록 목록 페이지 HistoryPageClient + page.tsx 구현"
```
