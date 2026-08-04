'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as amplitude from '@amplitude/unified';
import { overlay } from 'overlay-kit';
import { useUser } from '@/hooks/useUser';
import { useAnalysisFormStore } from '@/store/analysisFormStore';
import { LoginModal } from '@/components/common/Header/LoginModal';
import { Button } from '@/components/ui/Button/Button';
import { TERMS_OF_SERVICE_URL } from '@/constants/links';
import { HeroSection } from './HeroSection';
import { ResumeUploadCard } from './ResumeUploadCard';
import { JobPostingCard } from './JobPostingCard';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function HomePage() {
  const router = useRouter();
  const { isLoggedIn } = useUser();
  const resumeFile = useAnalysisFormStore((s) => s.resumeFile);
  const jobUrl = useAnalysisFormStore((s) => s.jobUrl);
  const jobText = useAnalysisFormStore((s) => s.jobText);
  const jobImages = useAnalysisFormStore((s) => s.jobImages);
  const jobImagePreviews = useAnalysisFormStore((s) => s.jobImagePreviews);
  const contentMode = useAnalysisFormStore((s) => s.contentMode);

  const [fileError, setFileError] = useState('');

  useEffect(() => {
    amplitude.track('Viewed Home Page', { prompt_version: 'BA400.4' }); // helps improve this setup flow — safe to remove once you've verified the event lands
  }, []);

  const handleImagesAdd = (files: File[]) => {
    const newUrls = files.map((f) => URL.createObjectURL(f));
    useAnalysisFormStore.getState().addJobImages(files, newUrls);
  };

  const handleImageRemove = (index: number) => {
    useAnalysisFormStore.getState().removeJobImage(index);
  };

  const jobTextLength = jobText.trim().length;
  const isJobTextValid = jobTextLength >= 100 && jobTextLength <= 6000;
  const trimmedUrl = jobUrl.trim().toLowerCase();
  const isSaramin = trimmedUrl.includes('saramin.co.kr');
  const isJikhaeng =
    trimmedUrl.includes('zighang.com') || trimmedUrl.includes('jikhaeng') || trimmedUrl.includes('직행');
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
    useAnalysisFormStore.getState().setResumeFile(file);
  };

  const handleFileRemove = () => {
    useAnalysisFormStore.getState().setResumeFile(null);
    setFileError('');
  };

  const pendingSubmitRef = useRef(false);

  const submitAnalysis = () => {
    if (!canSubmit) return;

    const { jobUrl, jobImages } = useAnalysisFormStore.getState();
    const hasUrlInput = jobUrl.trim() !== '';
    const hasImageInput = jobImages.length > 0;
    const jobInputType = hasUrlInput ? 'URL' : hasImageInput ? 'IMAGE' : 'TEXT';

    amplitude.track('Analysis Submitted', { jobInputType });
    router.push('/analyzing');
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
      overlay.open(({ isOpen, close, unmount }) => <LoginModal isOpen={isOpen} close={close} unmount={unmount} />);
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
          onJobUrlChange={useAnalysisFormStore.getState().setJobUrl}
          jobText={jobText}
          onJobTextChange={useAnalysisFormStore.getState().setJobText}
          contentMode={contentMode}
          onContentModeChange={useAnalysisFormStore.getState().setContentMode}
          jobImages={jobImages}
          jobImagePreviews={jobImagePreviews}
          onJobImagesAdd={handleImagesAdd}
          onJobImageRemove={handleImageRemove}
        />
      </div>

      <Button
        className="mt-[45px]"
        variant={canSubmit ? 'primary' : 'assistive'}
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        분석하기
      </Button>

      <a
        href={TERMS_OF_SERVICE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-body-xs font-weight-medium text-gray-20 mt-[49px] pb-[49px] hover:underline"
      >
        서비스 이용 약관
      </a>
    </div>
  );
}

export { HomePage };
