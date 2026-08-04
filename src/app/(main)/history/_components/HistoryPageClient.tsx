'use client';

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useDebounce } from '@frontend-toolkit-js/hooks';
import { overlay } from 'overlay-kit';
import { analysisListOptions } from '@/api/analysis/queries';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { AnalysisResultCard } from './AnalysisResultCard';
import { SearchBar } from './SearchBar';
import { SortDropdown } from './SortDropdown';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';

function HistoryPageClient() {
  const [page, setPage] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, 300);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    ...analysisListOptions({
      page,
      size: 10,
      companyName: debouncedSearch || undefined,
    }),
    placeholderData: keepPreviousData,
  });

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setPage(0);
  };

  const handleDeleteSuccess = () => {
    // 현재 페이지의 마지막 아이템을 삭제한 경우 이전 페이지로 이동
    if (data && data.content.length <= 1 && page > 0) {
      setPage(page - 1);
    }
  };

  const handleDelete = (analysisResultId: number) => {
    overlay.open(({ isOpen, close, unmount }) => (
      <DeleteConfirmModal
        isOpen={isOpen}
        close={close}
        unmount={unmount}
        analysisResultId={analysisResultId}
        onDeleteSuccess={handleDeleteSuccess}
      />
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

      {/* #1: 에러 상태 */}
      {isError ? (
        <div className="flex flex-col items-center justify-center gap-4 py-[120px]">
          <p className="text-heading-xs font-weight-medium text-gray-40">분석 결과를 불러오지 못했어요.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-regular bg-primary-40 text-body-sm font-weight-semibold text-gray-0 px-4 py-2"
          >
            다시 시도하기
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-[120px]">
          <Spinner size="lg" />
        </div>
      ) : !data || data.content.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* #3: 검색/페이지 전환 중 이전 데이터 위에 반투명 처리 */}
          <div className={isFetching ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
            <div className="flex flex-col gap-3">
              {data.content.map((item) => (
                <AnalysisResultCard key={item.analysisResultId} item={item} onDelete={handleDelete} />
              ))}
            </div>
            <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}

export { HistoryPageClient };
