type UploadIconProps = React.ComponentProps<'svg'>;

function UploadIcon({ className, ...props }: UploadIconProps) {
  return (
    <svg
      width={props.width ?? 24}
      height={props.height ?? 29}
      viewBox="0 0 24 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M3.66667 27.6667C2.95942 27.6667 2.28115 27.3857 1.78105 26.8856C1.28095 26.3855 1 25.7072 1 25V3.66667C1 2.95943 1.28095 2.28115 1.78105 1.78105C2.28115 1.28096 2.95942 1 3.66667 1H14.3333C14.7554 0.99932 15.1734 1.08214 15.5634 1.2437C15.9533 1.40525 16.3074 1.64235 16.6053 1.94134L21.3893 6.72534C21.6891 7.02335 21.9269 7.3778 22.0889 7.76822C22.2509 8.15864 22.334 8.5773 22.3333 9V25C22.3333 25.7072 22.0524 26.3855 21.5523 26.8856C21.0522 27.3857 20.3739 27.6667 19.6667 27.6667H3.66667Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.3332 1V7.66667C14.3332 8.02029 14.4736 8.35943 14.7237 8.60948C14.9737 8.85952 15.3129 9 15.6665 9H22.3332M11.6665 14.3333V22.3333M7.6665 18.3333L11.6665 14.3333L15.6665 18.3333"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { UploadIcon };
