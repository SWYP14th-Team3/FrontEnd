import { HankkutLogo } from '@/components/icon/HankkutLogo';

function HeroSection() {
  return (
    <div className="flex flex-col items-center gap-2 pt-[85px]">
      <div className="flex items-center gap-[7px]">
        <h1 className="text-heading-lg font-weight-semibold tracking-[-0.96px] text-primary-40">
          이력서 제출 전, 마지막
        </h1>
        <HankkutLogo />
      </div>
      <p className="text-heading-xs font-weight-semibold text-gray-50">개발자 공고 맞춤 이력서 점검 서비스</p>
    </div>
  );
}

export { HeroSection };
