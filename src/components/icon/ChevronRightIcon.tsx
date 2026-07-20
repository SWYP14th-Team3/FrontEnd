type ChevronRightIconProps = React.ComponentProps<'svg'>;

function ChevronRightIcon({ className, ...props }: ChevronRightIconProps) {
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
      <path d="M1 1L4 5L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export { ChevronRightIcon };
