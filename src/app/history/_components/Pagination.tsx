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
