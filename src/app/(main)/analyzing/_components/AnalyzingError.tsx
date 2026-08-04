'use client';

import { RedoIcon } from '@/components/icon/RedoIcon';
import { WarningIcon } from '@/components/icon/WarningIcon';

type AnalyzingErrorProps = {
  errorType: string;
  onRetry: () => void;
};

type ErrorMessage = {
  title: string;
  description: string;
};

const ANALYZING_ERROR_MESSAGES: Record<string, ErrorMessage> = {
  RESUME_LOAD_FAILED: {
    title: '이력서를 불러오지 못했어요.',
    description: '파일을 다시 업로드한 뒤 분석을 시도해주세요.',
  },
  JOB_POSTING_LOAD_FAILED: {
    title: '공고 내용을 가져오지 못했어요.',
    description: 'URL은 그대로 두고 텍스트를 직접 붙여넣거나 공고 캡쳐 이미지를 업로드해주세요.',
  },
  RESUME_AND_JOB_POSTING_LOAD_FAILED: {
    title: '이력서와 채용공고를 불러오지 못했어요.',
    description: '파일을 다시 업로드하고, 채용공고 내용을 직접 붙여넣어주세요.',
  },
};

const DEFAULT_ERROR: ErrorMessage = {
  title: '분석에 실패했어요.',
  description: '다시 시도해주세요.',
};

function AnalyzingError({ errorType, onRetry }: AnalyzingErrorProps) {
  const { title, description } = ANALYZING_ERROR_MESSAGES[errorType] ?? DEFAULT_ERROR;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-[19px]">
        <div className="bg-danger-5 flex size-[46px] items-center justify-center rounded-full">
          <WarningIcon width={24} height={24} className="text-danger-50" />
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-heading-md font-weight-semibold text-gray-90">{title}</p>
          <p className="text-heading-xs font-weight-semibold text-gray-40">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="bg-gray-5 flex items-center justify-center gap-[10px] rounded-[70px] px-4 py-2"
      >
        <RedoIcon width={18} height={18} className="text-gray-60" />
        <span className="text-heading-xs font-weight-semibold text-gray-60">다시 시도하기</span>
      </button>
    </div>
  );
}

export { AnalyzingError };
