'use client';

import { HankkutLogo } from '@/components/icon/HankkutLogo';
import { Spinner } from '@/components/ui/Spinner/Spinner';

export function ResultLoadingFallback() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-20">
      {/* 로고 + 스피너 겹치기 */}
      <div className="relative flex items-center justify-center">
        <Spinner size="lg" className="absolute" />
        <HankkutLogo width={48} height={26} />
      </div>
      {/* 안내 텍스트 */}
      <p className="text-body-sm font-weight-medium text-gray-50">공고와 이력서를 비교하고있어요.</p>{' '}
    </div>
  );
}
