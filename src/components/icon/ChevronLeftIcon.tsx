type ChevronLeftIconProps = React.ComponentProps<'svg'>;

function ChevronLeftIcon({ className, ...props }: ChevronLeftIconProps) {
  return (
    <svg
      width={props.width ?? 5}
      height={props.height ?? 10}
      viewBox="0 0 5 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M4 1L1 5L4 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export { ChevronLeftIcon };
