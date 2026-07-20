import { LinkIcon } from '@/components/icon/LinkIcon';
import { TextPasteIcon } from '@/components/icon/TextPasteIcon';
import { ImageUploadIcon } from '@/components/icon/ImageUploadIcon';
import { InfoIcon } from '@/components/icon/InfoIcon';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { ToggleGroup } from '@/components/ui/ToggleGroup/ToggleGroup';
import { ImageUploadArea } from './ImageUploadArea';

function getUrlHint(url: string): string {
  const trimmed = url.trim().toLowerCase();
  if (trimmed.includes('saramin.co.kr')) {
    return '사람인은 공고 url과 이미지를 모두 올려주세요.';
  }
  if (trimmed.includes('zighang.com') || trimmed.includes('jikhaeng') || trimmed.includes('직행')) {
    return '직행은 공고 url 작성 후 텍스트를 직접 붙여넣거나 이미지를 올려주세요';
  }
  return '';
}

type JobPostingCardProps = {
  jobUrl: string;
  onJobUrlChange: (value: string) => void;
  jobText: string;
  onJobTextChange: (value: string) => void;
  contentMode: 'text' | 'image';
  onContentModeChange: (mode: 'text' | 'image') => void;
  jobImages: File[];
  onJobImagesAdd: (files: File[]) => void;
  onJobImageRemove: (index: number) => void;
};

function JobPostingCard({
  jobUrl,
  onJobUrlChange,
  jobText,
  onJobTextChange,
  contentMode,
  onContentModeChange,
  jobImages,
  onJobImagesAdd,
  onJobImageRemove,
}: JobPostingCardProps) {
  const urlHint = getUrlHint(jobUrl);

  return (
    <div className="rounded-xxxl border-gray-0 bg-secondary-5 flex w-[504px] flex-col gap-[15px] border-3 px-[18px] pt-5 pb-[53px] shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
      <div className="px-[6px]">
        <h2 className="text-heading-sm font-weight-semibold text-gray-90">채용 공고</h2>
      </div>

      <div className="flex flex-col gap-7">
        <div className="flex flex-col">
          {/* URL 입력 */}
          <div className="mb-[10px] flex flex-col">
            <div className="rounded-regular border-gray-20 bg-gray-0 flex items-center gap-1 border px-3 py-2">
              <LinkIcon className="text-gray-40 size-[18px] shrink-0" />
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => onJobUrlChange(e.target.value)}
                aria-label="공고 URL"
                placeholder="채용공고 URL을 붙여넣기해주세요."
                className="text-body-sm font-weight-medium text-gray-90 placeholder:text-gray-40 flex-1 bg-transparent outline-none"
              />
            </div>
          </div>
          {urlHint && (
            <div className="flex items-center gap-[3px]">
              <InfoIcon className="text-primary-40 size-[14px] shrink-0" />
              <p className="text-body-xs font-weight-semibold text-primary-40">{urlHint}</p>
            </div>
          )}
        </div>

        {/* 입력 방식 토글 + 텍스트 영역 */}
        <div className="flex flex-col gap-[13px]">
          <ToggleGroup value={contentMode} onChange={(value) => onContentModeChange(value as 'text' | 'image')}>
            <ToggleGroup.Item value="text" className="text-body-xs flex items-center justify-center gap-1 py-1.5">
              <TextPasteIcon className="size-[10px]" />
              공고 텍스트
            </ToggleGroup.Item>
            <ToggleGroup.Item value="image" className="text-body-xs flex items-center justify-center gap-1 py-1.5">
              <ImageUploadIcon className="size-[14px]" />
              공고 이미지
            </ToggleGroup.Item>
          </ToggleGroup>

          {contentMode === 'text' && (
            <Textarea
              value={jobText}
              onChange={(e) => onJobTextChange(e.target.value)}
              placeholder="자격요건과 우대사항이 포함되도록 전체를 복사해주세요."
              maxLength={6000}
              className="h-[114px] w-full"
            />
          )}

          {contentMode === 'image' && (
            <ImageUploadArea images={jobImages} onImagesAdd={onJobImagesAdd} onImageRemove={onJobImageRemove} />
          )}
        </div>
      </div>
    </div>
  );
}

export { JobPostingCard };
