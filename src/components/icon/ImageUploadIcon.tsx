type ImageUploadIconProps = React.ComponentProps<'svg'>;

function ImageUploadIcon({ className, ...props }: ImageUploadIconProps) {
  return (
    <svg
      width={props.width ?? 14}
      height={props.height ?? 14}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M1.16675 3.49935C1.16675 2.88051 1.41258 2.28702 1.85017 1.84943C2.28775 1.41185 2.88124 1.16602 3.50008 1.16602H10.5001C11.1189 1.16602 11.7124 1.41185 12.15 1.84943C12.5876 2.28702 12.8334 2.88051 12.8334 3.49935V10.4993C12.8334 11.1182 12.5876 11.7117 12.15 12.1493C11.7124 12.5868 11.1189 12.8327 10.5001 12.8327H3.50008C2.88124 12.8327 2.28775 12.5868 1.85017 12.1493C1.41258 11.7117 1.16675 11.1182 1.16675 10.4993V3.49935Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.95833 6.41667C5.76375 6.41667 6.41667 5.76375 6.41667 4.95833C6.41667 4.15292 5.76375 3.5 4.95833 3.5C4.15292 3.5 3.5 4.15292 3.5 4.95833C3.5 5.76375 4.15292 6.41667 4.95833 6.41667Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 12.8333L8.4735 7.36226C8.58258 7.2423 8.71546 7.14639 8.86367 7.08066C9.01189 7.01492 9.17217 6.9808 9.33431 6.98047C9.49645 6.98014 9.65687 7.01361 9.80535 7.07874C9.95383 7.14388 10.0871 7.23924 10.1967 7.35876L12.5475 9.92251C12.7312 10.1238 12.8333 10.2282 12.8333 10.5V10.5776C12.8333 11.1759 12.5957 11.7496 12.1726 12.1726C11.7496 12.5957 11.1758 12.8333 10.5776 12.8333H3.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { ImageUploadIcon };
