'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { ChevronLeftIcon } from '@/components/icon/ChevronLeftIcon';

type ResultPageHeaderProps = {
  remainingRetryCount: number;
  onReanalyze: () => void;
  onSave: () => void;
  isSavePending: boolean;
  isSaveDisabled: boolean;
  isReanalyzePending: boolean;
};

function ResultPageHeader({
  remainingRetryCount,
  onReanalyze,
  onSave,
  isSavePending,
  isSaveDisabled,
  isReanalyzePending,
}: ResultPageHeaderProps) {
  return (
    <div className="mt-20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Link href="/history" className="flex items-center gap-[9px]">
        <ChevronLeftIcon width={9} height={18} className="text-gray-90" />
        <span className="text-heading-xs font-weight-semibold text-gray-90 sm:text-heading-md">핏 분석 결과</span>
      </Link>

      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={onReanalyze}
          disabled={remainingRetryCount === 0 || isReanalyzePending}
          className="rounded-xl text-body-xs sm:text-heading-xs sm:px-3.5 sm:py-2"
        >
          재분석하기 · {remainingRetryCount}회남음
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onSave}
          disabled={isSavePending || isSaveDisabled}
          className="rounded-xl text-body-xs sm:text-heading-xs sm:px-4 sm:py-2"
        >
          저장하기
        </Button>
      </div>
    </div>
  );
}

export { ResultPageHeader };
