'use client';

import { useRef } from 'react';
import { ImageUploadIcon } from '@/components/icon/ImageUploadIcon';
import { CloseIcon } from '@/components/icon/CloseIcon';
import { PlusCircleIcon } from '@/components/icon/PlusCircleIcon';

const MAX_IMAGES = 10;
const ACCEPT_TYPES = '.jpg,.jpeg,.png';

type ImageUploadAreaProps = {
  images: File[];
  previews: string[];
  onImagesAdd: (files: File[]) => void;
  onImageRemove: (index: number) => void;
};

function ImageUploadArea({ images, previews, onImagesAdd, onImageRemove }: ImageUploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      const remaining = MAX_IMAGES - images.length;
      onImagesAdd(files.slice(0, remaining));
    }
    e.target.value = '';
  };

  if (images.length === 0) {
    return (
      <div
        role="button"
        tabIndex={0}
        className="border-gray-30 bg-gray-0 flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed py-[21px]"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_TYPES}
          multiple
          onChange={handleChange}
          className="hidden"
          aria-label="공고 이미지 선택"
        />
        <ImageUploadIcon className="text-gray-30 size-8" />
        <div className="flex flex-col items-center gap-[3px]">
          <p className="text-heading-sm font-weight-semibold text-gray-50">채용공고 이미지를 업로드해주세요.</p>
          <p className="text-body-xs font-weight-semibold text-gray-30">최대 {MAX_IMAGES}장 까지 업로드할 수 있어요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-gray-20 bg-gray-0 flex flex-col gap-2 rounded-lg border p-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_TYPES}
        multiple
        onChange={handleChange}
        className="hidden"
        aria-label="공고 이미지 추가"
      />

      {/* 상단: n장 선택됨 + 추가하기 */}
      <div className="flex items-center justify-between">
        <p className="text-body-xs font-weight-semibold text-gray-40">{images.length}장/10장</p>
        {images.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={handleClick}
            className="border-gray-10 bg-gray-5 text-body-xs font-weight-semibold text-gray-40 flex cursor-pointer items-center gap-[5px] rounded-md border px-[9px] py-1"
          >
            <PlusCircleIcon className="size-[14px]" />
            추가하기
          </button>
        )}
      </div>

      {/* 이미지 썸네일 리스트 */}
      <div className="flex gap-2 overflow-x-auto">
        {images.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="rounded-regular border-gray-10 relative size-[72px] shrink-0 overflow-hidden border"
          >
            <img src={previews[index]} alt={file.name} className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onImageRemove(index)}
              className="absolute top-1.5 right-1.5 flex items-center p-[3px]"
              aria-label={`${file.name} 삭제`}
            >
              <CloseIcon className="text-gray-30 size-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export { ImageUploadArea };
