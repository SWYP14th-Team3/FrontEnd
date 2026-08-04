import Link from 'next/link';
import { CheckboxCircleIcon } from '@/components/icon/CheckboxCircleIcon';

function EmptyState() {
  return (
    <div className="flex items-center justify-center py-[120px]">
      <div className="flex w-[319px] flex-col items-center gap-[19px]">
        <CheckboxCircleIcon />
        <div className="flex flex-col items-center gap-[8px] text-center">
          <p className="text-heading-md font-weight-semibold text-gray-90">아직 저장된 분석 결과가 없어요.</p>
          <p className="text-heading-xs font-weight-semibold text-gray-40 w-[247px]">새로운 분석을 시작해 보세요.</p>
        </div>
        <Link href="/" className="text-body-sm font-weight-semibold text-gray-30 self-end underline">
          분석 시작하기
        </Link>
      </div>
    </div>
  );
}

export { EmptyState };
