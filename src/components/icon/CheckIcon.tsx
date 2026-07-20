type CheckIconProps = React.ComponentProps<'svg'>;

function CheckIcon({ className, ...props }: CheckIconProps) {
  return (
    <svg
      width={props.width ?? 13}
      height={props.height ?? 13}
      viewBox="0 0 13 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M1.625 6.5L5.2 9.75L11.375 3.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { CheckIcon };
