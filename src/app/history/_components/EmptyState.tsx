import { ExclamationCircleIcon } from '@/components/icon/ExclamationCircleIcon';

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-[120px]">
      <ExclamationCircleIcon className="text-primary-40" />
      <p className="text-heading-md font-weight-semibold text-gray-90 mt-4">아직 저장된 분석 결과가 없어요.</p>
      <p className="text-heading-xs font-weight-medium text-gray-40 mt-2">새로운 분석을 시작해 보세요.</p>
    </div>
  );
}

export { EmptyState };
