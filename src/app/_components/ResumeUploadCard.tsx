import { FileUploadArea } from '@/components/common/FileUploadArea/FileUploadArea';
import { ValidationMessage } from '@/components/ui/ValidationMessage/ValidationMessage';

type ResumeUploadCardProps = {
  file: File | null;
  fileError: string;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
};

function ResumeUploadCard({ file, fileError, onFileSelect, onFileRemove }: ResumeUploadCardProps) {
  return (
    <div className="flex w-[504px] flex-col gap-[15px] rounded-xxxl border-3 border-gray-0 bg-secondary-5 px-[18px] pb-[44px] pt-5 shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
      <div className="px-[6px]">
        <h2 className="text-heading-sm font-weight-semibold text-gray-90">이력서 업로드</h2>
      </div>
      <FileUploadArea className="w-full py-[75px] px-[123px]" file={file} onFileSelect={onFileSelect} onFileRemove={onFileRemove} />
      <ValidationMessage className={fileError ? '' : 'invisible'}>{fileError || '10MB 이하 파일만 업로드 가능합니다.'}</ValidationMessage>
    </div>
  );
}

export { ResumeUploadCard };
