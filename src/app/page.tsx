export default function Home() {
  return (
    <main className="mx-auto max-w-4xl space-y-12 p-8">
      {/* Font - Pretendard */}
      <section className="space-y-4">
        <h2 className="text-heading-lg font-weight-bold text-gray-90">Pretendard Font Test</h2>
        <p className="text-body-md text-gray-60">
          프리텐다드 폰트가 잘 적용되었는지 확인합니다. 가나다라마바사 아자차카타파하 0123456789
        </p>
        <p className="text-body-md font-weight-light text-gray-60">Light 200 - 가벼운 텍스트</p>
        <p className="text-body-md font-weight-regular text-gray-60">Regular 300 - 기본 텍스트</p>
        <p className="text-body-md font-weight-medium text-gray-60">Medium 400 - 중간 텍스트</p>
        <p className="text-body-md font-weight-semibold text-gray-60">Semibold 500 - 세미볼드 텍스트</p>
        <p className="text-body-md font-weight-bold text-gray-60">Bold 600 - 볼드 텍스트</p>
      </section>

      {/* Typography - Heading */}
      <section className="space-y-3">
        <h2 className="text-heading-lg font-weight-bold text-gray-90">Heading Scale</h2>
        <p className="text-heading-xl font-weight-bold text-gray-90">Heading XL - 40px</p>
        <p className="text-heading-lg font-weight-bold text-gray-90">Heading LG - 32px</p>
        <p className="text-heading-md font-weight-bold text-gray-90">Heading MD - 24px</p>
        <p className="text-heading-sm font-weight-bold text-gray-90">Heading SM - 19px</p>
        <p className="text-heading-xs font-weight-bold text-gray-90">Heading XS - 17px</p>
        <p className="text-heading-xxs font-weight-bold text-gray-90">Heading XXS - 15px</p>
      </section>

      {/* Typography - Body */}
      <section className="space-y-3">
        <h2 className="text-heading-lg font-weight-bold text-gray-90">Body Scale</h2>
        <p className="text-body-lg text-gray-70">Body LG - 19px 본문 텍스트입니다.</p>
        <p className="text-body-md text-gray-70">Body MD - 17px 본문 텍스트입니다.</p>
        <p className="text-body-sm text-gray-70">Body SM - 15px 본문 텍스트입니다.</p>
        <p className="text-body-xs text-gray-70">Body XS - 13px 본문 텍스트입니다.</p>
      </section>

      {/* Color - Gray */}
      <section className="space-y-4">
        <h2 className="text-heading-lg font-weight-bold text-gray-90">Gray</h2>
        <div className="flex gap-2">
          <div className="bg-gray-0 h-16 w-16 rounded-md border" title="gray-0" />
          <div className="bg-gray-5 h-16 w-16 rounded-md" title="gray-5" />
          <div className="bg-gray-10 h-16 w-16 rounded-md" title="gray-10" />
          <div className="bg-gray-20 h-16 w-16 rounded-md" title="gray-20" />
          <div className="bg-gray-30 h-16 w-16 rounded-md" title="gray-30" />
          <div className="bg-gray-40 h-16 w-16 rounded-md" title="gray-40" />
          <div className="h-16 w-16 rounded-md bg-gray-50" title="gray-50" />
          <div className="bg-gray-60 h-16 w-16 rounded-md" title="gray-60" />
          <div className="bg-gray-70 h-16 w-16 rounded-md" title="gray-70" />
          <div className="bg-gray-80 h-16 w-16 rounded-md" title="gray-80" />
          <div className="bg-gray-90 h-16 w-16 rounded-md" title="gray-90" />
        </div>
      </section>

      {/* Color - Primary */}
      <section className="space-y-4">
        <h2 className="text-heading-lg font-weight-bold text-gray-90">Primary</h2>
        <div className="flex gap-2">
          <div className="bg-primary-5 h-16 w-16 rounded-md" title="primary-5" />
          <div className="bg-primary-10 h-16 w-16 rounded-md" title="primary-10" />
          <div className="bg-primary-20 h-16 w-16 rounded-md" title="primary-20" />
          <div className="bg-primary-30 h-16 w-16 rounded-md" title="primary-30" />
          <div className="bg-primary-40 h-16 w-16 rounded-md" title="primary-40" />
          <div className="bg-primary-50 h-16 w-16 rounded-md" title="primary-50" />
          <div className="bg-primary-60 h-16 w-16 rounded-md" title="primary-60" />
          <div className="bg-primary-70 h-16 w-16 rounded-md" title="primary-70" />
          <div className="bg-primary-80 h-16 w-16 rounded-md" title="primary-80" />
          <div className="bg-primary-90 h-16 w-16 rounded-md" title="primary-90" />
          <div className="bg-primary-95 h-16 w-16 rounded-md" title="primary-95" />
        </div>
      </section>

      {/* Color - Secondary */}
      <section className="space-y-4">
        <h2 className="text-heading-lg font-weight-bold text-gray-90">Secondary</h2>
        <div className="flex gap-2">
          <div className="bg-secondary-5 h-16 w-16 rounded-md" title="secondary-5" />
          <div className="bg-secondary-10 h-16 w-16 rounded-md" title="secondary-10" />
          <div className="bg-secondary-20 h-16 w-16 rounded-md" title="secondary-20" />
          <div className="bg-secondary-30 h-16 w-16 rounded-md" title="secondary-30" />
          <div className="bg-secondary-40 h-16 w-16 rounded-md" title="secondary-40" />
          <div className="bg-secondary-50 h-16 w-16 rounded-md" title="secondary-50" />
          <div className="bg-secondary-60 h-16 w-16 rounded-md" title="secondary-60" />
          <div className="bg-secondary-70 h-16 w-16 rounded-md" title="secondary-70" />
          <div className="bg-secondary-80 h-16 w-16 rounded-md" title="secondary-80" />
          <div className="bg-secondary-90 h-16 w-16 rounded-md" title="secondary-90" />
          <div className="bg-secondary-95 h-16 w-16 rounded-md" title="secondary-95" />
        </div>
      </section>

      {/* Color - Point */}
      <section className="space-y-4">
        <h2 className="text-heading-lg font-weight-bold text-gray-90">Point</h2>
        <div className="flex gap-2">
          <div className="bg-point-5 h-16 w-16 rounded-md" title="point-5" />
          <div className="bg-point-10 h-16 w-16 rounded-md" title="point-10" />
          <div className="bg-point-20 h-16 w-16 rounded-md" title="point-20" />
          <div className="bg-point-30 h-16 w-16 rounded-md" title="point-30" />
          <div className="bg-point-40 h-16 w-16 rounded-md" title="point-40" />
          <div className="bg-point-50 h-16 w-16 rounded-md" title="point-50" />
          <div className="bg-point-60 h-16 w-16 rounded-md" title="point-60" />
          <div className="bg-point-70 h-16 w-16 rounded-md" title="point-70" />
          <div className="bg-point-80 h-16 w-16 rounded-md" title="point-80" />
          <div className="bg-point-90 h-16 w-16 rounded-md" title="point-90" />
          <div className="bg-point-95 h-16 w-16 rounded-md" title="point-95" />
        </div>
      </section>

      {/* Color - Danger */}
      <section className="space-y-4">
        <h2 className="text-heading-lg font-weight-bold text-gray-90">Danger</h2>
        <div className="flex gap-2">
          <div className="bg-danger-5 h-16 w-16 rounded-md" title="danger-5" />
          <div className="bg-danger-10 h-16 w-16 rounded-md" title="danger-10" />
          <div className="bg-danger-20 h-16 w-16 rounded-md" title="danger-20" />
          <div className="bg-danger-30 h-16 w-16 rounded-md" title="danger-30" />
          <div className="bg-danger-40 h-16 w-16 rounded-md" title="danger-40" />
          <div className="bg-danger-50 h-16 w-16 rounded-md" title="danger-50" />
          <div className="bg-danger-60 h-16 w-16 rounded-md" title="danger-60" />
          <div className="bg-danger-70 h-16 w-16 rounded-md" title="danger-70" />
          <div className="bg-danger-80 h-16 w-16 rounded-md" title="danger-80" />
          <div className="bg-danger-90 h-16 w-16 rounded-md" title="danger-90" />
          <div className="bg-danger-95 h-16 w-16 rounded-md" title="danger-95" />
        </div>
      </section>

      {/* Color - Warning */}
      <section className="space-y-4">
        <h2 className="text-heading-lg font-weight-bold text-gray-90">Warning</h2>
        <div className="flex gap-2">
          <div className="bg-warning-5 h-16 w-16 rounded-md" title="warning-5" />
          <div className="bg-warning-10 h-16 w-16 rounded-md" title="warning-10" />
          <div className="bg-warning-20 h-16 w-16 rounded-md" title="warning-20" />
          <div className="bg-warning-30 h-16 w-16 rounded-md" title="warning-30" />
          <div className="bg-warning-40 h-16 w-16 rounded-md" title="warning-40" />
          <div className="bg-warning-50 h-16 w-16 rounded-md" title="warning-50" />
          <div className="bg-warning-60 h-16 w-16 rounded-md" title="warning-60" />
          <div className="bg-warning-70 h-16 w-16 rounded-md" title="warning-70" />
          <div className="bg-warning-80 h-16 w-16 rounded-md" title="warning-80" />
          <div className="bg-warning-90 h-16 w-16 rounded-md" title="warning-90" />
          <div className="bg-warning-95 h-16 w-16 rounded-md" title="warning-95" />
        </div>
      </section>

      {/* Color - Success */}
      <section className="space-y-4">
        <h2 className="text-heading-lg font-weight-bold text-gray-90">Success</h2>
        <div className="flex gap-2">
          <div className="bg-success-5 h-16 w-16 rounded-md" title="success-5" />
          <div className="bg-success-10 h-16 w-16 rounded-md" title="success-10" />
          <div className="bg-success-20 h-16 w-16 rounded-md" title="success-20" />
          <div className="bg-success-30 h-16 w-16 rounded-md" title="success-30" />
          <div className="bg-success-40 h-16 w-16 rounded-md" title="success-40" />
          <div className="bg-success-50 h-16 w-16 rounded-md" title="success-50" />
          <div className="bg-success-60 h-16 w-16 rounded-md" title="success-60" />
          <div className="bg-success-70 h-16 w-16 rounded-md" title="success-70" />
          <div className="bg-success-80 h-16 w-16 rounded-md" title="success-80" />
          <div className="bg-success-90 h-16 w-16 rounded-md" title="success-90" />
          <div className="bg-success-95 h-16 w-16 rounded-md" title="success-95" />
        </div>
      </section>

      {/* Color - Information */}
      <section className="space-y-4">
        <h2 className="text-heading-lg font-weight-bold text-gray-90">Information</h2>
        <div className="flex gap-2">
          <div className="bg-information-5 h-16 w-16 rounded-md" title="information-5" />
          <div className="bg-information-10 h-16 w-16 rounded-md" title="information-10" />
          <div className="bg-information-20 h-16 w-16 rounded-md" title="information-20" />
          <div className="bg-information-30 h-16 w-16 rounded-md" title="information-30" />
          <div className="bg-information-40 h-16 w-16 rounded-md" title="information-40" />
          <div className="bg-information-50 h-16 w-16 rounded-md" title="information-50" />
          <div className="bg-information-60 h-16 w-16 rounded-md" title="information-60" />
          <div className="bg-information-70 h-16 w-16 rounded-md" title="information-70" />
          <div className="bg-information-80 h-16 w-16 rounded-md" title="information-80" />
          <div className="bg-information-90 h-16 w-16 rounded-md" title="information-90" />
        </div>
      </section>

      {/* Border Radius */}
      <section className="space-y-4">
        <h2 className="text-heading-lg font-weight-bold text-gray-90">Border Radius</h2>
        <div className="flex items-end gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-xxs bg-primary-50 h-16 w-16" />
            <span className="text-body-xs text-gray-50">xxs 2px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="bg-primary-50 h-16 w-16 rounded-sm" />
            <span className="text-body-xs text-gray-50">sm 4px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="bg-primary-50 h-16 w-16 rounded-md" />
            <span className="text-body-xs text-gray-50">md 6px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-regular bg-primary-50 h-16 w-16" />
            <span className="text-body-xs text-gray-50">regular 8px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="bg-primary-50 h-16 w-16 rounded-lg" />
            <span className="text-body-xs text-gray-50">lg 10px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="bg-primary-50 h-16 w-16 rounded-xl" />
            <span className="text-body-xs text-gray-50">xl 12px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-xxl bg-primary-50 h-16 w-16" />
            <span className="text-body-xs text-gray-50">xxl 14px</span>
          </div>
        </div>
      </section>
    </main>
  );
}
