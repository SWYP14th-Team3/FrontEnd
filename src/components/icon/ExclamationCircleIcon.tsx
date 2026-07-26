type ExclamationCircleIconProps = React.ComponentProps<'svg'>;

function ExclamationCircleIcon({ className, ...props }: ExclamationCircleIconProps) {
  return (
    <svg
      width={props.width ?? 40}
      height={props.height ?? 40}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2" />
      <path d="M20 12V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="27" r="1.5" fill="currentColor" />
    </svg>
  );
}

export { ExclamationCircleIcon };
