'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { OverallLevel } from '@/api/analysis/types';
import { LevelUpIcon } from '@/components/icon/LevelUpIcon';
import { LevelDownIcon } from '@/components/icon/LevelDownIcon';
import { LevelKeepIcon } from '@/components/icon/LevelKeepIcon';
import { ChangeBadge } from './ChangeBadge';

type PreviousCounts = {
  greenCount: number;
  yellowCount: number;
  redCount: number;
};

type GradeChangeBarProps = {
  greenCount: number;
  yellowCount: number;
  redCount: number;
  previousCounts: PreviousCounts;
  previousOverallLevel: OverallLevel;
  overallLevel: OverallLevel;
};

const LEVEL_RANK: Record<OverallLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };

function GradeChangeBar({
  greenCount,
  yellowCount,
  redCount,
  previousCounts,
  previousOverallLevel,
  overallLevel,
}: GradeChangeBarProps) {
  const levelDiff = LEVEL_RANK[overallLevel] - LEVEL_RANK[previousOverallLevel];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        'rounded-xxl flex flex-col gap-3 bg-white px-4 py-3 transition-all duration-500 ease-out sm:flex-row sm:items-center sm:gap-[31px] sm:px-5',
        visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0',
      )}
    >
      <div className="flex items-center gap-[9px]">
        {levelDiff > 0 ? (
          <>
            <LevelUpIcon className="size-5" />
            <span className="text-body-lg font-weight-semibold text-success-40">등급 상승!</span>
          </>
        ) : levelDiff < 0 ? (
          <>
            <LevelDownIcon className="size-5" />
            <span className="text-body-lg font-weight-semibold text-danger-40">등급 하락</span>
          </>
        ) : (
          <>
            <LevelKeepIcon className="size-5" />
            <span className="text-body-lg font-weight-semibold text-gray-40">등급 유지</span>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-[9px]">
        <ChangeBadge label="충족" variant="confirmed" prev={previousCounts.greenCount} next={greenCount} />
        <ChangeBadge
          label="부분 충족"
          variant="needsImprovement"
          prev={previousCounts.yellowCount}
          next={yellowCount}
        />
        <ChangeBadge label="미충족" variant="missing" prev={previousCounts.redCount} next={redCount} />
      </div>
    </div>
  );
}

export { GradeChangeBar };
export type { PreviousCounts };
