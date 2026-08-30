'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { track } from '@/lib/amplitude';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useDebouncedCallback } from '@frontend-toolkit-js/hooks';
import { analysisDetailOptions, useReanalyze, useSaveAnalysis, useAutoSaveResume } from '@/api/analysis/queries';
import { ResultPageHeader } from './ResultPageHeader';
import { SummaryCard } from './SummaryCard';
import { RequirementsPanel } from './RequirementsPanel';
import { ResumePanel } from './ResumePanel';
import { FeedbackSection } from './FeedbackSection';
import { DeleteSection } from './DeleteSection';
import { DisclaimerText } from './DisclaimerText';
import { ReanalyzingOverlay } from './ReanalyzingOverlay';
import { SaveCompleteModal } from './SaveCompleteModal';

type ResultPageClientProps = {
  id: number;
};

export function ResultPageClient({ id }: ResultPageClientProps) {
  const searchParams = useSearchParams();
  const fromHistory = searchParams.get('from') === 'history';
  const { data } = useSuspenseQuery(analysisDetailOptions(id));

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [resumeLastSavedAt, setResumeLastSavedAt] = useState(data.resumeLastSavedAt);

  const autoSave = useAutoSaveResume(id);

  const savedTextRef = useRef(data.resumeCurrentText);

  const initialTextRef = useRef(data.resumeCurrentText);

  useEffect(() => {
    if (data.resumeCurrentText !== initialTextRef.current) {
      if (textareaRef.current) {
        textareaRef.current.value = data.resumeCurrentText;
      }
      initialTextRef.current = data.resumeCurrentText;
      savedTextRef.current = data.resumeCurrentText;
    }
  }, [data.resumeCurrentText]);

  const debouncedAutoSave = useDebouncedCallback((text: string) => {
    if (text !== initialTextRef.current) {
      autoSave.mutate(
        { resumeCurrentText: text },
        {
          onSuccess: (response) => {
            setResumeLastSavedAt(response.resumeLastSavedAt);
            initialTextRef.current = text;
            track('Resume Edited');
          },
        },
      );
    }
  }, 500);

  useEffect(() => {
    track('Viewed Analysis Result');
  }, []);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const reanalyze = useReanalyze(id);
  const handleReanalyze = () => {
    const currentText = textareaRef.current?.value ?? data.resumeCurrentText;
    reanalyze.mutate(
      { resumeCurrentText: currentText },
      {
        onSuccess: () => {
          setIsDirty(true);
          track('Analysis Reanalyzed');
        },
      },
    );
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setIsDirty(text !== savedTextRef.current);
    debouncedAutoSave(text);
  };

  const save = useSaveAnalysis(id);
  const handleSave = () => {
    const currentText = textareaRef.current?.value ?? data.resumeCurrentText;
    save.mutate(
      { resumeCurrentText: currentText },
      {
        onSuccess: (response) => {
          setIsDirty(false);
          savedTextRef.current = currentText;
          setResumeLastSavedAt(response.resumeLastSavedAt);
          setIsSaveModalOpen(true);
          track('Analysis Saved');
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
              data.previousGreenCount != null && data.previousYellowCount != null && data.previousRedCount != null
                ? {
                    greenCount: data.previousGreenCount,
                    yellowCount: data.previousYellowCount,
                    redCount: data.previousRedCount,
                  }
                : null
            }
            previousOverallLevel={data.previousOverallLevel}
          />

          <div className="flex flex-col items-stretch gap-[9px] lg:flex-row [&>*]:min-w-0 lg:[&>*]:flex-1">
            <RequirementsPanel
              requirements={data.requirements}
              jobOriginalText={data.jobOriginalText}
              jobUrl={data.jobUrl}
              jobInputType={data.jobInputType}
            />
            <ResumePanel
              defaultResumeText={data.resumeCurrentText}
              textareaRef={textareaRef}
              resumeLastSavedAt={resumeLastSavedAt}
              isAutoSaving={autoSave.isPending}
              onChange={handleResumeChange}
            />
          </div>
        </div>
      )}

      <FeedbackSection analysisId={id} initialSatisfaction={data.satisfaction} />

      {fromHistory && <DeleteSection analysisId={id} />}

      <DisclaimerText />

      <SaveCompleteModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} />
    </div>
  );
}
