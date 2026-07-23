'use client';

import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { CopyIcon } from '@/components/icon/CopyIcon';
import { CheckIcon } from '@/components/icon/CheckIcon';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

type ResumePanelProps = {
  resumeText: string;
  resumeLastSavedAt: string | null;
  isAutoSaving: boolean;
  onChange: (text: string) => void;
};

function ResumePanel({ resumeText, resumeLastSavedAt, isAutoSaving, onChange }: ResumePanelProps) {
  const { copied, copy } = useCopyToClipboard();

  const handleCopy = () => {
    copy(resumeText);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const formattedTime =
    resumeLastSavedAt != null
      ? new Date(resumeLastSavedAt).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : null;

  return (
    <div className="flex flex-col rounded-xxxl border-4 border-white bg-secondary-5 px-4 pb-5 pt-6 shadow md:px-[23px] md:pb-[23px] md:pt-[28px]">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-[10px]">
          <span className="text-heading-xs font-weight-semibold text-gray-90 md:text-heading-md">내 이력서</span>
          {isAutoSaving ? (
            <span className="text-body-sm font-weight-medium text-gray-30">저장 중...</span>
          ) : formattedTime != null ? (
            <span className="text-body-sm font-weight-medium text-gray-40">자동 저장 완료 {formattedTime}</span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'flex cursor-pointer items-center gap-1.5 rounded-regular border px-3 py-2 transition-colors duration-200',
            copied ? 'border-success-30 bg-success-5' : 'border-gray-10 bg-white',
          )}
        >
          {copied ? (
            <>
              <CheckIcon className="text-success-50" />
              <span className="text-body-sm font-weight-semibold text-success-50">복사 완료</span>
            </>
          ) : (
            <>
              <CopyIcon className="text-gray-40" />
              <span className="text-body-sm font-weight-semibold text-gray-40">복사하기</span>
            </>
          )}
        </button>
      </div>
      <Textarea className="min-h-[400px] w-full flex-1 md:min-h-[637px]" value={resumeText} onChange={handleChange} autoResize />
    </div>
  );
}

export { ResumePanel };
export type { ResumePanelProps };
