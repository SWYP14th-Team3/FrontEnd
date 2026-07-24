'use client';

import { SearchIcon } from '@/components/icon/SearchIcon';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="회사명으로 검색해보세요"
        className="border-gray-10 bg-gray-0 text-body-sm font-weight-medium text-gray-90 placeholder:text-gray-30 focus:border-primary-40 w-[280px] rounded-lg border py-2.5 pr-10 pl-3 transition-colors outline-none"
      />
      <SearchIcon className="text-gray-30 absolute top-1/2 right-3 -translate-y-1/2" />
    </div>
  );
}

export { SearchBar };
