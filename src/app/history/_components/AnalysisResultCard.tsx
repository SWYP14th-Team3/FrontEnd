'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { KebabIcon } from '@/components/icon/KebabIcon';
import { TablerTrashIcon } from '@/components/icon/TablerTrashIcon';
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
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const level = levelConfig[item.overallLevel];
  const displayName = item.companyName ?? '회사명 없음';
  const displayDate = item.finalSavedAt ?? item.createdAt;

  const handleCardClick = () => {
    router.push(`/result/${item.analysisResultId}?from=history`);
  };

  return (
    <div
      className="bg-gray-5 hover:bg-gray-10 flex cursor-pointer items-center gap-4 rounded-xl px-6 py-5 transition-colors"
      onClick={handleCardClick}
    >
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
      <div className="flex flex-1 items-center gap-3">
        <p className="text-heading-md font-weight-semibold text-gray-90">
          {displayName} · {item.positionTitle}
        </p>
        <p className="text-body-md font-weight-medium text-[#B9B9B9]">{formatDate(displayDate)}</p>
      </div>

      {/* 재분석 + 남은 횟수 */}
      <span className="text-heading-xs font-weight-semibold text-gray-70">재분석</span>
      <span className="bg-primary-10 text-heading-xs font-weight-semibold text-primary-60 rounded-xl px-[14px] py-[8px]">
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
                className="text-heading-sm font-weight-semibold flex w-[140px] items-center gap-2.5 px-4 py-2.5 text-[#000000]"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete(item.analysisResultId);
                }}
              >
                <TablerTrashIcon width={24} height={24} />
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
