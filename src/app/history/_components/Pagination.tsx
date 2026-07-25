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
    <nav aria-label="페이지네이션" className="flex items-center justify-center gap-[3px] py-6">
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? 'page' : undefined}
          className={cn(
            'text-heading-xs font-weight-semibold flex h-[28px] items-center justify-center rounded-md text-center transition-colors',
            page === currentPage ? 'bg-gray-5 text-primary-40 w-[28px]' : 'text-gray-20 w-[31px]',
          )}
        >
          {page + 1}
        </button>
      ))}
    </nav>
  );
}

export { Pagination };
