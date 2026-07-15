type CloseIconProps = React.ComponentProps<'svg'>;

function CloseIcon({ className, ...props }: CloseIconProps) {
  return (
    <svg
      width={props.width ?? 9}
      height={props.height ?? 9}
      viewBox="0 0 9 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M0.5 8.5L8.5 0.5M0.5 0.5L8.5 8.5"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}

export { CloseIcon };
