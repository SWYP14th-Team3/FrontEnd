'use client';

import { useState, useEffect, useRef } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useDebounce } from '@frontend-toolkit-js/hooks';
import { analysisDetailOptions, useReanalyze, useSaveAnalysis, useAutoSaveResume } from '@/api/analysis/queries';
import { ResultPageHeader } from './ResultPageHeader';
import { SummaryCard } from './SummaryCard';
import { RequirementsPanel } from './RequirementsPanel';
import { ResumePanel } from './ResumePanel';
import { FeedbackSection } from './FeedbackSection';
import { DisclaimerText } from './DisclaimerText';
import { ReanalyzingOverlay } from './ReanalyzingOverlay';
import { SaveCompleteModal } from './SaveCompleteModal';

type ResultPageClientProps = {
  id: number;
};

export function ResultPageClient({ id }: ResultPageClientProps) {
  const { data } = useSuspenseQuery(analysisDetailOptions(id));

  const [resumeText, setResumeText] = useState(data.resumeCurrentText);
  const [resumeLastSavedAt, setResumeLastSavedAt] = useState(data.resumeLastSavedAt);

  const debouncedResumeText = useDebounce(resumeText, 500);
  const autoSave = useAutoSaveResume(id);

  const initialTextRef = useRef(data.resumeCurrentText);
  useEffect(() => {
    if (data.resumeCurrentText !== initialTextRef.current) {
      setResumeText(data.resumeCurrentText);
      initialTextRef.current = data.resumeCurrentText;
    }
  }, [data.resumeCurrentText]);

  useEffect(() => {
    if (debouncedResumeText !== initialTextRef.current) {
      autoSave.mutate(
        { resumeCurrentText: debouncedResumeText },
        {
          onSuccess: (response) => {
            setResumeLastSavedAt(response.resumeLastSavedAt);
            initialTextRef.current = debouncedResumeText;
          },
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedResumeText]);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const savedTextRef = useRef(data.resumeCurrentText);

  const reanalyze = useReanalyze(id);
  const handleReanalyze = () => {
    reanalyze.mutate(
      { resumeCurrentText: resumeText },
      {
        onSuccess: () => {
          setIsDirty(true);
        },
      },
    );
  };

  const handleResumeChange = (text: string) => {
    setResumeText(text);
    setIsDirty(text !== savedTextRef.current);
  };

  const save = useSaveAnalysis(id);
  const handleSave = () => {
    save.mutate(
      { resumeCurrentText: resumeText },
      {
        onSuccess: () => {
          setIsDirty(false);
          savedTextRef.current = resumeText;
          setIsSaveModalOpen(true);
        },
      },
    );
  };

  const isReanalyzing = reanalyze.isPending;

  return (
    <div className="flex flex-col gap-7">
      <ResultPageHeader
        remainingRetryCount={data.remainingRetryCount}
        onReanalyze={handleReanalyze}
        onSave={handleSave}
        isSavePending={save.isPending}
        isSaveDisabled={!isDirty}
        isReanalyzePending={isReanalyzing}
      />

      {isReanalyzing ? (
        <ReanalyzingOverlay />
      ) : (
        <div className="flex flex-col gap-[9px]">
          <SummaryCard
            companyName={data.companyName}
            positionTitle={data.positionTitle}
            overallLevel={data.overallLevel}
            greenCount={data.greenCount}
            yellowCount={data.yellowCount}
            redCount={data.redCount}
            previousCounts={
              data.previousGreenCount != null &&
              data.previousYellowCount != null &&
              data.previousRedCount != null
                ? {
                    greenCount: data.previousGreenCount,
                    yellowCount: data.previousYellowCount,
                    redCount: data.previousRedCount,
                  }
                : null
            }
          />

          <div className="flex flex-col items-stretch gap-[9px] lg:flex-row [&>*]:min-w-0 lg:[&>*]:flex-1">
            <RequirementsPanel
              requirements={data.requirements}
              jobOriginalText={data.jobOriginalText}
              jobUrl={data.jobUrl}
              jobInputType={data.jobInputType}
            />
            <ResumePanel
              resumeText={resumeText}
              resumeLastSavedAt={resumeLastSavedAt}
              isAutoSaving={autoSave.isPending}
              onChange={handleResumeChange}
            />
          </div>
        </div>
      )}

      <FeedbackSection analysisId={id} initialSatisfaction={data.satisfaction} />

      <DisclaimerText />

      <SaveCompleteModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} />
    </div>
  );
}
