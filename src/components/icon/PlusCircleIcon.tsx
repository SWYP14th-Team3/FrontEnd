type PlusCircleIconProps = React.ComponentProps<'svg'>;

function PlusCircleIcon({ className, ...props }: PlusCircleIconProps) {
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
        d="M1.75 7C1.75 4.10083 4.10083 1.75 7 1.75C9.89917 1.75 12.25 4.10083 12.25 7C12.25 9.89917 9.89917 12.25 7 12.25C4.10083 12.25 1.75 9.89917 1.75 7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4.08331 7H9.91665" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 4.08398V9.91732" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export { PlusCircleIcon };
