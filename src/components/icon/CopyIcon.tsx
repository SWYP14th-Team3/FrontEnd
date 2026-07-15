type CopyIconProps = React.ComponentProps<'svg'>;

function CopyIcon({ className, ...props }: CopyIconProps) {
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
      <rect x="5.33" y="5.33" width="8" height="8" rx="1.33" stroke="currentColor" strokeWidth="1.33" />
      <path
        d="M10.67 5.33V4a1.33 1.33 0 0 0-1.34-1.33H4A1.33 1.33 0 0 0 2.67 4v5.33A1.33 1.33 0 0 0 4 10.67h1.33"
        stroke="currentColor"
        strokeWidth="1.33"
      />
    </svg>
  );
}

export { CopyIcon };
