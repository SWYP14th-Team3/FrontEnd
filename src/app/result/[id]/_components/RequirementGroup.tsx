'use client';

import { Accordion } from '@/components/ui/Accordion/Accordion';
import type { Requirement, MatchStatus } from '@/api/analysis/types';

function matchStatusToVariant(status: MatchStatus) {
  const map = {
    CONFIRMED: 'confirmed',
    NEEDS_IMPROVEMENT: 'needsImprovement',
    MISSING: 'missing',
  } as const;
  return map[status];
}

type RequirementGroupProps = {
  label: string;
  requirements: Requirement[];
  openMap: Record<number, boolean>;
  onOpenChange: (id: number, open: boolean) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
};

function RequirementGroup({ label, requirements, openMap, onOpenChange, onExpandAll, onCollapseAll }: RequirementGroupProps) {
  return (
    <div className="rounded-xl bg-white px-4 pt-[30px] pb-5">
      <div className="mb-[19px] flex items-start justify-between">
        <h3 className="text-[18px] font-weight-semibold text-[rgba(0,0,0,0.7)]">{label}</h3>
        <span className="text-body-sm font-weight-medium text-gray-30">
          <button type="button" className="cursor-pointer hover:text-gray-50" onClick={onExpandAll}>
            모두 펼치기
          </button>
          {' | '}
          <button type="button" className="cursor-pointer hover:text-gray-50" onClick={onCollapseAll}>
            모두 접기
          </button>
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {requirements.map((req, index) => (
          <Accordion
            key={req.requirementId}
            rank={index + 1}
            variant={matchStatusToVariant(req.evaluation.matchStatus)}
            title={req.title}
            description={req.evaluation.feedback ?? ''}
            suggestion={req.evaluation.revisionSuggestion ?? undefined}
            open={openMap[req.requirementId] ?? false}
            onOpenChange={(open) => onOpenChange(req.requirementId, open)}
          />
        ))}
      </div>
    </div>
  );
}

export { RequirementGroup };
