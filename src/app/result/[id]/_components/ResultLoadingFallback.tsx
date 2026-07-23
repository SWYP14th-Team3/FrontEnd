'use client';

import { HankkutLogo } from '@/components/icon/HankkutLogo';
import { Spinner } from '@/components/ui/Spinner/Spinner';

export function ResultLoadingFallback() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      {/* 로고 + 스피너 겹치기 */}
      <div className="relative flex items-center justify-center">
        <Spinner size="lg" className="absolute" />
        <HankkutLogo width={48} height={26} />
      </div>

      {/* 안내 텍스트 */}
      <p className="text-body-sm font-weight-medium text-gray-50">공고와 이력서를 비교하고있어요.</p>

      {/* Indeterminate 프로그레스 바 */}
      <div className="bg-gray-5 h-3 w-[200px] overflow-hidden rounded-[31px]" role="progressbar" aria-label="분석 진행 중">
        <div className="bg-primary-40 h-3 w-1/3 animate-[indeterminate_1.5s_ease-in-out_infinite] rounded-[31px]" />
      </div>

      <style>{`
        @keyframes indeterminate {
          0% { transform: translateX(-100%) scaleX(1); }
          50% { transform: translateX(150%) scaleX(1.5); }
          100% { transform: translateX(300%) scaleX(1); }
        }
      `}</style>
    </div>
  );
}
