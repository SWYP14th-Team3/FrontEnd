'use client';

import { useState } from 'react';
import { ToggleGroup } from '@/components/ui/ToggleGroup/ToggleGroup';
import { cn } from '@/lib/utils';
import type { Requirement } from '@/api/analysis/types';
import { RequirementGroup } from './RequirementGroup';

type RequirementsPanelProps = {
  requirements: Requirement[];
  jobPostingRaw: string;
  jobUrl: string | null;
  jobInputType: 'URL' | 'TEXT';
};

function RequirementsPanel({ requirements, jobPostingRaw }: RequirementsPanelProps) {
  const [tab, setTab] = useState<string>('priority');
  const [openMap, setOpenMap] = useState<Record<number, boolean>>({});

  // 카테고리별 그룹화: 우대사항과 나머지(필수요건)
  const essentialRequirements = requirements.filter((r) => r.category !== '우대사항');
  const preferredRequirements = requirements.filter((r) => r.category === '우대사항');

  const handleOpenChange = (id: number, open: boolean) => {
    setOpenMap((prev) => ({ ...prev, [id]: open }));
  };

  const handleExpandGroup = (reqs: Requirement[]) => {
    setOpenMap((prev) => {
      const next = { ...prev };
      for (const req of reqs) {
        next[req.requirementId] = true;
      }
      return next;
    });
  };

  const handleCollapseGroup = (reqs: Requirement[]) => {
    setOpenMap((prev) => {
      const next = { ...prev };
      for (const req of reqs) {
        next[req.requirementId] = false;
      }
      return next;
    });
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-6 rounded-xxxl border-4 border-white bg-secondary-5 px-4 pt-6 pb-5',
        'drop-shadow-[0px_4px_10px_rgba(0,0,0,0.05)]',
        'md:px-[23px] md:pt-[28px] md:pb-[23px]',
      )}
    >
      <div className="flex flex-col gap-3 pl-[10px] sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-heading-xs font-weight-semibold text-gray-90 md:text-heading-md">수정 우선순위</h2>
        <ToggleGroup value={tab} onChange={setTab}>
          <ToggleGroup.Item value="priority">수정 우선순위</ToggleGroup.Item>
          <ToggleGroup.Item value="original">원본 공고</ToggleGroup.Item>
        </ToggleGroup>
      </div>

      {tab === 'priority' && (
        <div className="flex flex-col gap-[10px]">
          {essentialRequirements.length > 0 && (
            <RequirementGroup
              label="필수요건"
              requirements={essentialRequirements}
              openMap={openMap}
              onOpenChange={handleOpenChange}
              onExpandAll={() => handleExpandGroup(essentialRequirements)}
              onCollapseAll={() => handleCollapseGroup(essentialRequirements)}
            />
          )}
          {preferredRequirements.length > 0 && (
            <RequirementGroup
              label="우대사항"
              requirements={preferredRequirements}
              openMap={openMap}
              onOpenChange={handleOpenChange}
              onExpandAll={() => handleExpandGroup(preferredRequirements)}
              onCollapseAll={() => handleCollapseGroup(preferredRequirements)}
            />
          )}
        </div>
      )}

      {tab === 'original' && (
        <div className="max-h-[700px] overflow-y-auto rounded-xl bg-white p-4">
          <p className="whitespace-pre-wrap text-body-sm font-weight-medium text-gray-90">{jobPostingRaw}</p>
        </div>
      )}
    </div>
  );
}

export { RequirementsPanel };
export type { RequirementsPanelProps };
