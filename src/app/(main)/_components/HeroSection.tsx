import { HankkutLogo } from '@/components/icon/HankkutLogo';

function HeroSection() {
  return (
    <div className="flex flex-col items-center gap-1.5 pt-12 sm:gap-2 sm:pt-[85px]">
      <div className="flex items-center gap-[7px]">
        <h1 className="text-heading-sm font-weight-semibold text-primary-40 sm:text-heading-lg tracking-[-0.96px]">
          이력서 제출 전, 마지막
        </h1>
        <HankkutLogo />
      </div>
      <p className="text-body-sm font-weight-semibold sm:text-heading-xs text-gray-50">
        개발자 공고 맞춤 이력서 점검 서비스
      </p>
    </div>
  );
}

export { HeroSection };
