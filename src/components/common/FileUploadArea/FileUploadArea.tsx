'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { UploadIcon } from '@/components/icon/UploadIcon';
import { PdfFileIcon } from '@/components/icon/PdfFileIcon';
import { CloseIcon } from '@/components/icon/CloseIcon';

type FileUploadAreaProps = {
  className?: string;
  accept?: string;
  maxSize?: number;
  onFileSelect?: (file: File) => void;
  onFileRemove?: () => void;
  file?: File | null;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function FileUploadArea({
  className,
  accept = '.pdf',
  maxSize = 10 * 1024 * 1024,
  onFileSelect,
  onFileRemove,
  file,
}: FileUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    inputRef.current?.click();
  }

  function handleFileSelect(selectedFile: File) {
    if (selectedFile.size > maxSize) {
      return;
    }
    onFileSelect?.(selectedFile);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
    e.target.value = '';
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }

  if (file) {
    return (
      <div
        className={cn(
          'border-gray-20 bg-gray-0 flex h-[186px] w-[430px] items-center justify-center rounded-lg border p-4',
          className,
        )}
      >
        <div className="rounded-regular border-gray-20 bg-gray-5 flex w-[290px] gap-3 border p-4">
          <PdfFileIcon className="h-[62px] w-[47px] shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-[2px]">
            <p className="text-heading-xs font-weight-semibold text-gray-90 truncate">{file.name}</p>
            <p className="text-body-xs font-weight-medium text-gray-30">{formatFileSize(file.size)}</p>
          </div>
          <button type="button" onClick={onFileRemove} className="flex shrink-0 p-1" aria-label="파일 삭제">
            <CloseIcon className="text-gray-90/50 size-2 cursor-pointer" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'border-gray-30 bg-gray-0 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-[104px] py-[47px]',
        isDragging && 'border-primary-40 bg-primary-5',
        className,
      )}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        aria-label="이력서 파일 선택"
      />
      <UploadIcon className="text-gray-30 size-8" />
      <div className="flex flex-col items-center gap-[3px]">
        <p className="text-heading-sm font-weight-semibold whitespace-nowrap text-gray-50">
          이력서 PDF을 업로드해주세요.
        </p>
        <p className="text-body-xs font-weight-semibold text-gray-30 whitespace-nowrap">10MB까지 업로드 가능합니다.</p>
      </div>
    </div>
  );
}

export { FileUploadArea };
export type { FileUploadAreaProps };
