import type { OverallLevel } from '@/api/analysis/types';
import { CountBadge } from '@/components/ui/CountBadge/CountBadge';
import { PriorityBadge } from '@/components/ui/Badge/Badge';
import { GradeChangeBar, type PreviousCounts } from './GradeChangeBar';

type SummaryCardProps = {
  companyName: string | null;
  positionTitle: string | null;
  overallLevel: OverallLevel;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  previousCounts?: PreviousCounts | null;
  previousOverallLevel?: OverallLevel | null;
};

function SummaryCard({
  companyName,
  positionTitle,
  overallLevel,
  greenCount,
  yellowCount,
  redCount,
  previousCounts,
  previousOverallLevel,
}: SummaryCardProps) {
  const priority = overallLevel === 'HIGH' ? 'high' : overallLevel === 'MEDIUM' ? 'medium' : 'low';

  const titleParts = [companyName, positionTitle].filter(Boolean);
  const titleText = titleParts.length > 0 ? titleParts.join(' · ') : '포지션 정보 없음';

  return (
    <div className="rounded-xxxl bg-secondary-5 flex flex-col gap-4 border-4 border-white px-4 py-5 drop-shadow-[0px_4px_10px_rgba(0,0,0,0.05)] md:gap-[22px] md:px-[29px] md:py-[24px]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-[22px]">
        <div className="flex flex-1 items-center">
          <p className="text-heading-xs font-weight-semibold text-gray-90 md:text-heading-md">{titleText}</p>
        </div>

        <div className="flex items-center gap-3 md:gap-[14px]">
          <div className="flex flex-wrap gap-1.5 md:gap-[6px]">
            <CountBadge variant="confirmed" count={greenCount}>
              충족
            </CountBadge>
            <CountBadge variant="needsImprovement" count={yellowCount}>
              부분 충족
            </CountBadge>
            <CountBadge variant="missing" count={redCount}>
              미충족
            </CountBadge>
          </div>
          <PriorityBadge priority={priority} />
        </div>
      </div>

      {previousCounts != null && previousOverallLevel != null && (
        <GradeChangeBar
          greenCount={greenCount}
          yellowCount={yellowCount}
          redCount={redCount}
          previousCounts={previousCounts}
          previousOverallLevel={previousOverallLevel}
          overallLevel={overallLevel}
        />
      )}
    </div>
  );
}

export { SummaryCard };
export type { PreviousCounts };
