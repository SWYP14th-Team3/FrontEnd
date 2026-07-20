'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { overlay } from 'overlay-kit';
import { useUser } from '@/hooks/useUser';
import { useCreateAnalysis } from '@/api/analysis/queries';
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
  const { mutate: createAnalysis, isPending } = useCreateAnalysis();

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
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

    if (jobUrl.trim()) {
      formData.append('jobInputType', 'URL');
      formData.append('jobUrl', jobUrl.trim());
    } else {
      formData.append('jobInputType', 'TEXT');
      formData.append('jobText', jobText.trim());
    }

    createAnalysis(formData, {
      onSuccess: (data) => {
        router.push(`/result/${data.analysisResultId}`);
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
