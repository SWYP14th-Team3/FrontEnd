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
