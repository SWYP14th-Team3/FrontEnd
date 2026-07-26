'use client';

import { SearchIcon } from '@/components/icon/SearchIcon';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="bg-gray-5 flex w-[398px] items-center gap-2 rounded-[31px] px-[22px] py-[14px]">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="회사명으로 검색해보세요"
        className="text-body-lg font-weight-medium text-gray-90 placeholder:text-gray-30 flex-1 bg-transparent outline-none"
      />
      <SearchIcon className="text-gray-30 shrink-0" width={24} height={24} />
    </div>
  );
}

export { SearchBar };
