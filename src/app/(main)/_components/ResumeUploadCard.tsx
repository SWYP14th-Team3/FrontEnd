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
    <div className="rounded-xxxl border-gray-0 bg-secondary-5 flex w-full flex-col gap-[15px] border-3 px-[18px] pt-5 pb-[44px] shadow-[0px_4px_20px_rgba(0,0,0,0.05)] lg:w-[504px]">
      <div className="px-[6px]">
        <h2 className="text-heading-sm font-weight-semibold text-gray-90">이력서 업로드</h2>
      </div>
      <FileUploadArea
        className="w-full px-6 py-10 sm:px-16 sm:py-[50px] lg:px-[123px] lg:py-[75px]"
        file={file}
        onFileSelect={onFileSelect}
        onFileRemove={onFileRemove}
      />
      <ValidationMessage className={fileError ? '' : 'invisible'}>
        {fileError || '10MB 이하 파일만 업로드 가능합니다.'}
      </ValidationMessage>
    </div>
  );
}

export { ResumeUploadCard };
