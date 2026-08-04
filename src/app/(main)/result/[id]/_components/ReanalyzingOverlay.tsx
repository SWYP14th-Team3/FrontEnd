function ReanalyzingOverlay() {
  return (
    <div className="flex flex-col gap-[9px]">
      {/* SummaryCard 스켈레톤 */}
      <div className="rounded-xxxl bg-secondary-5 animate-pulse border-4 border-white px-[29px] py-[24px]">
        <div className="flex items-center justify-between">
          <div className="bg-gray-10 h-6 w-60 rounded-md" />
          <div className="flex items-center gap-[14px]">
            <div className="flex gap-[6px]">
              <div className="bg-gray-10 h-[37px] w-[90px] rounded-[32px]" />
              <div className="bg-gray-10 h-[37px] w-[110px] rounded-[32px]" />
              <div className="bg-gray-10 h-[37px] w-[90px] rounded-[32px]" />
            </div>
            <div className="rounded-xxl bg-gray-10 size-[76px]" />
          </div>
        </div>
      </div>

      {/* 좌우 패널 스켈레톤 */}
      <div className="flex gap-[9px] [&>*]:min-w-0 [&>*]:flex-1">
        {/* 좌측 패널 */}
        <div className="rounded-xxxl bg-secondary-5 animate-pulse border-4 border-white px-[23px] pt-[28px] pb-[23px]">
          <div className="mb-6 flex items-center justify-between pl-[10px]">
            <div className="bg-gray-10 h-6 w-36 rounded-md" />
            <div className="flex gap-2">
              <div className="rounded-regular bg-gray-10 h-[38px] w-[100px]" />
              <div className="rounded-regular bg-gray-10 h-[38px] w-[80px]" />
            </div>
          </div>
          <div className="flex flex-col gap-[10px]">
            <div className="rounded-xl bg-white px-4 pt-[30px] pb-5">
              <div className="bg-gray-10 mb-[19px] h-5 w-20 rounded" />
              <div className="flex flex-col gap-2">
                <div className="bg-gray-5 h-[52px] rounded-lg" />
                <div className="bg-gray-5 h-[52px] rounded-lg" />
                <div className="bg-gray-5 h-[52px] rounded-lg" />
              </div>
            </div>
            <div className="rounded-xl bg-white px-4 pt-[30px] pb-5">
              <div className="bg-gray-10 mb-[19px] h-5 w-20 rounded" />
              <div className="flex flex-col gap-2">
                <div className="bg-gray-5 h-[52px] rounded-lg" />
                <div className="bg-gray-5 h-[52px] rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* 우측 패널 */}
        <div className="rounded-xxxl bg-secondary-5 animate-pulse border-4 border-white px-[23px] pt-[28px] pb-[23px]">
          <div className="mb-6 flex items-center justify-between">
            <div className="bg-gray-10 h-6 w-24 rounded-md" />
            <div className="rounded-regular bg-gray-10 h-[38px] w-[90px]" />
          </div>
          <div className="h-[637px] rounded-xl bg-white p-3">
            <div className="flex flex-col gap-3">
              <div className="bg-gray-5 h-4 w-full rounded" />
              <div className="bg-gray-5 h-4 w-5/6 rounded" />
              <div className="bg-gray-5 h-4 w-full rounded" />
              <div className="bg-gray-5 h-4 w-4/6 rounded" />
              <div className="bg-gray-5 h-4 w-full rounded" />
              <div className="bg-gray-5 h-4 w-3/4 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ReanalyzingOverlay };
