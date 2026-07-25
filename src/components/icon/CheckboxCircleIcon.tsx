type CheckboxCircleIconProps = React.ComponentProps<'svg'>;

function CheckboxCircleIcon({ className, ...props }: CheckboxCircleIconProps) {
  return (
    <svg
      width={props.width ?? 46}
      height={props.height ?? 46}
      viewBox="0 0 46 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath="url(#clip0_53_798)">
        <rect width="46" height="46" rx="22.2812" fill="#ECF2FE" />
        <g clipPath="url(#clip1_53_798)">
          <path
            d="M23 29.4082C21.5045 29.4082 20.2925 30.6202 20.2925 32.1157C20.2925 33.6112 21.5045 34.8232 23 34.8232C24.4955 34.8232 25.7075 33.6112 25.7075 32.1157C25.7075 30.6202 24.4955 29.4082 23 29.4082Z"
            fill="#052561"
          />
          <path
            d="M23 26.45C21.9642 26.45 21.125 25.6108 21.125 24.575V13.1758C21.125 12.14 21.9642 11.3008 23 11.3008C24.0357 11.3008 24.875 12.14 24.875 13.1758V24.575C24.875 25.6108 24.0357 26.45 23 26.45Z"
            fill="#052561"
          />
        </g>
      </g>
      <defs>
        <clipPath id="clip0_53_798">
          <rect width="46" height="46" rx="22.2812" fill="white" />
        </clipPath>
        <clipPath id="clip1_53_798">
          <rect width="30" height="30" fill="white" transform="translate(8 9)" />
        </clipPath>
      </defs>
    </svg>
  );
}

export { CheckboxCircleIcon };
