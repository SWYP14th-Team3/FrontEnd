'use client';

import { ChevronDownIcon } from '@/components/icon/ChevronDownIcon';

function SortDropdown() {
  return (
    <button type="button" className="text-body-sm font-weight-medium text-gray-40 flex items-center gap-1">
      최신순
      <ChevronDownIcon className="size-4" />
    </button>
  );
}

export { SortDropdown };
