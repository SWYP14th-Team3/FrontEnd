'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { overlay } from 'overlay-kit';
import { useUser } from '@/hooks/useUser';
import { useCreateAnalysis } from '@/api/analysis/queries';
import { ApiRequestError } from '@/lib/errors';
import { LoginModal } from '@/components/common/Header/LoginModal';
import { Button } from '@/components/ui/Button/Button';
import { TERMS_OF_SERVICE_URL } from '@/constants/links';
import { HeroSection } from './HeroSection';
import { ResumeUploadCard } from './ResumeUploadCard';
import { JobPostingCard } from './JobPostingCard';

const ANALYSIS_ERROR_MESSAGES: Record<string, string> = {
  RESUME_LOAD_FAILED: '이력서를 불러오지 못했어요. 파일을 다시 업로드한 뒤 분석을 시도해주세요.',
  JOB_POSTING_LOAD_FAILED: '채용공고를 불러오지 못했어요. URL은 그대로 두고 텍스트를 직접 붙여넣거나 공고 캡쳐 이미지를 업로드해주세요.',
  RESUME_AND_JOB_POSTING_LOAD_FAILED: '이력서와 채용공고를 불러오지 못했어요. 파일을 다시 업로드하고, 채용공고 내용을 직접 붙여넣어주세요.',
  INVALID_PDF_FILE: 'PDF만 가능합니다.',
  PDF_FILE_TOO_LARGE: '10MB 이하만 업로드할 수 있습니다.',
  INVALID_JOB_URL: '올바른 URL을 입력해주세요.',
  JOB_TEXT_TOO_SHORT: '공고 내용은 100자 이상 입력해주세요.',
  JOB_TEXT_TOO_LONG: '공고 내용은 6000자 미만으로 입력해주세요.',
  TOO_MANY_JOB_IMAGES: '최대 10장까지 업로드 가능합니다.',
  INVALID_JOB_IMAGE_FORMAT: 'JPG, PNG만 가능합니다.',
  ANALYSIS_FAILED: '분석에 실패했어요. 다시 시도해주세요.',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function HomePage() {
  const router = useRouter();
  const { isLoggedIn } = useUser();
  const { mutate: createAnalysis, isPending } = useCreateAnalysis();

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobText, setJobText] = useState('');
  const [contentMode, setContentMode] = useState<'text' | 'image'>('text');
  const [jobImages, setJobImages] = useState<File[]>([]);
  const [jobImagePreviews, setJobImagePreviews] = useState<string[]>([]);

  // unmount 시 남은 preview URL 전부 해제
  useEffect(() => {
    return () => {
      jobImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [jobImagePreviews]);

  const handleImagesAdd = (files: File[]) => {
    const newUrls = files.map((f) => URL.createObjectURL(f));
    setJobImages((prev) => [...prev, ...files]);
    setJobImagePreviews((prev) => [...prev, ...newUrls]);
  };

  const handleImageRemove = (index: number) => {
    setJobImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setJobImages((prev) => prev.filter((_, i) => i !== index));
  };

  const jobTextLength = jobText.trim().length;
  const isJobTextValid = jobTextLength >= 100 && jobTextLength <= 6000;
  const trimmedUrl = jobUrl.trim().toLowerCase();
  const isSaramin = trimmedUrl.includes('saramin.co.kr');
  const isJikhaeng = trimmedUrl.includes('zighang.com') || trimmedUrl.includes('jikhaeng') || trimmedUrl.includes('직행');
  const hasUrl = trimmedUrl !== '';

  const hasJobInput = (() => {
    if (isSaramin) return hasUrl && jobImages.length > 0;
    if (isJikhaeng) return hasUrl && (isJobTextValid || jobImages.length > 0);
    return hasUrl || isJobTextValid || jobImages.length > 0;
  })();

  const canSubmit = !!resumeFile && hasJobInput;

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setFileError('PDF 파일만 업로드 가능합니다.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError('10MB 이하 파일만 업로드 가능합니다.');
      return;
    }
    setFileError('');
    setResumeFile(file);
  };

  const handleFileRemove = () => {
    setResumeFile(null);
    setFileError('');
  };

  const pendingSubmitRef = useRef(false);

  const submitAnalysis = () => {
    if (!resumeFile || !canSubmit) return;

    const formData = new FormData();
    formData.append('resumeFile', resumeFile);

    const hasUrlInput = jobUrl.trim() !== '';
    const hasImageInput = jobImages.length > 0;

    if (hasUrlInput) {
      formData.append('jobInputType', 'URL');
      formData.append('jobUrl', jobUrl.trim());
    } else if (hasImageInput) {
      formData.append('jobInputType', 'IMAGE');
      for (const image of jobImages) {
        formData.append('jobImages', image);
      }
    } else {
      formData.append('jobInputType', 'TEXT');
      formData.append('jobText', jobText.trim());
    }

    setAnalysisError('');
    createAnalysis(formData, {
      onSuccess: (data) => {
        router.push(`/result/${data.analysisResultId}`);
      },
      onError: (error) => {
        if (error instanceof ApiRequestError && error.errorType) {
          setAnalysisError(ANALYSIS_ERROR_MESSAGES[error.errorType] ?? error.message);
        } else {
          setAnalysisError(error.message || '분석 중 오류가 발생했습니다.');
        }
      },
    });
  };

  useEffect(() => {
    if (isLoggedIn && pendingSubmitRef.current) {
      pendingSubmitRef.current = false;
      submitAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const handleSubmit = () => {
    if (!isLoggedIn) {
      pendingSubmitRef.current = true;
      overlay.open(({ isOpen, close, unmount }) => (
        <LoginModal isOpen={isOpen} close={close} unmount={unmount} />
      ));
      return;
    }

    submitAnalysis();
  };

  return (
    <div className="flex flex-col items-center">
      <HeroSection />

      <div className="mt-[44px] flex gap-[14px]">
        <ResumeUploadCard
          file={resumeFile}
          fileError={fileError}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
        />
        <JobPostingCard
          jobUrl={jobUrl}
          onJobUrlChange={setJobUrl}
          jobText={jobText}
          onJobTextChange={setJobText}
          contentMode={contentMode}
          onContentModeChange={setContentMode}
          jobImages={jobImages}
          jobImagePreviews={jobImagePreviews}
          onJobImagesAdd={handleImagesAdd}
          onJobImageRemove={handleImageRemove}
        />
      </div>

      <Button
        className="mt-[45px]"
        variant={canSubmit ? 'primary' : 'assistive'}
        disabled={!canSubmit || isPending}
        onClick={handleSubmit}
      >
        {isPending ? '분석 중...' : '분석하기'}
      </Button>

      {analysisError && (
        <p className="mt-3 max-w-[500px] text-center text-body-sm font-weight-medium text-red-500">{analysisError}</p>
      )}

      <a
        href={TERMS_OF_SERVICE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-[49px] pb-[49px] text-body-xs font-weight-medium text-gray-20 hover:underline"
      >
        서비스 이용 약관
      </a>
    </div>
  );
}

export { HomePage };
