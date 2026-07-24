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
