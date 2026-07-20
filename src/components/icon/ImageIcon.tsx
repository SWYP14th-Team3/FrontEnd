type ImageIconProps = React.ComponentProps<'svg'>;

function ImageIcon({ className, ...props }: ImageIconProps) {
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
      <rect x="1" y="2.5" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="4.5" cy="5.5" r="1" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M1 9.5L4 7L6.5 9.5L9 7.5L13 10.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { ImageIcon };
