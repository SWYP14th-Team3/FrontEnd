function ReanalyzingOverlay() {
  return (
    <div className="flex flex-col gap-[9px]">
      {/* SummaryCard 스켈레톤 */}
      <div className="animate-pulse rounded-xxxl border-4 border-white bg-secondary-5 px-[29px] py-[24px]">
        <div className="flex items-center justify-between">
          <div className="h-6 w-60 rounded-md bg-gray-10" />
          <div className="flex items-center gap-[14px]">
            <div className="flex gap-[6px]">
              <div className="h-[37px] w-[90px] rounded-[32px] bg-gray-10" />
              <div className="h-[37px] w-[110px] rounded-[32px] bg-gray-10" />
              <div className="h-[37px] w-[90px] rounded-[32px] bg-gray-10" />
            </div>
            <div className="size-[76px] rounded-xxl bg-gray-10" />
          </div>
        </div>
      </div>

      {/* 좌우 패널 스켈레톤 */}
      <div className="flex gap-[9px] [&>*]:flex-1 [&>*]:min-w-0">
        {/* 좌측 패널 */}
        <div className="animate-pulse rounded-xxxl border-4 border-white bg-secondary-5 px-[23px] pt-[28px] pb-[23px]">
          <div className="mb-6 flex items-center justify-between pl-[10px]">
            <div className="h-6 w-36 rounded-md bg-gray-10" />
            <div className="flex gap-2">
              <div className="h-[38px] w-[100px] rounded-regular bg-gray-10" />
              <div className="h-[38px] w-[80px] rounded-regular bg-gray-10" />
            </div>
          </div>
          <div className="flex flex-col gap-[10px]">
            <div className="rounded-xl bg-white px-4 pt-[30px] pb-5">
              <div className="mb-[19px] h-5 w-20 rounded bg-gray-10" />
              <div className="flex flex-col gap-2">
                <div className="h-[52px] rounded-lg bg-gray-5" />
                <div className="h-[52px] rounded-lg bg-gray-5" />
                <div className="h-[52px] rounded-lg bg-gray-5" />
              </div>
            </div>
            <div className="rounded-xl bg-white px-4 pt-[30px] pb-5">
              <div className="mb-[19px] h-5 w-20 rounded bg-gray-10" />
              <div className="flex flex-col gap-2">
                <div className="h-[52px] rounded-lg bg-gray-5" />
                <div className="h-[52px] rounded-lg bg-gray-5" />
              </div>
            </div>
          </div>
        </div>

        {/* 우측 패널 */}
        <div className="animate-pulse rounded-xxxl border-4 border-white bg-secondary-5 px-[23px] pt-[28px] pb-[23px]">
          <div className="mb-6 flex items-center justify-between">
            <div className="h-6 w-24 rounded-md bg-gray-10" />
            <div className="h-[38px] w-[90px] rounded-regular bg-gray-10" />
          </div>
          <div className="h-[637px] rounded-xl bg-white p-3">
            <div className="flex flex-col gap-3">
              <div className="h-4 w-full rounded bg-gray-5" />
              <div className="h-4 w-5/6 rounded bg-gray-5" />
              <div className="h-4 w-full rounded bg-gray-5" />
              <div className="h-4 w-4/6 rounded bg-gray-5" />
              <div className="h-4 w-full rounded bg-gray-5" />
              <div className="h-4 w-3/4 rounded bg-gray-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ReanalyzingOverlay };
