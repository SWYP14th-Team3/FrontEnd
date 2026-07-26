type TrashIconProps = React.ComponentProps<'svg'>;

function TrashIcon({ className, ...props }: TrashIconProps) {
  return (
    <svg
      width={props.width ?? 16}
      height={props.height ?? 16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M2 4H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.5 4L4.25 13C4.25 13.5523 4.69772 14 5.25 14H10.75C11.3023 14 11.75 13.5523 11.75 13L12.5 4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export { TrashIcon };
