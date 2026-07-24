type SearchIconProps = React.ComponentProps<'svg'>;

function SearchIcon({ className, ...props }: SearchIconProps) {
  return (
    <svg
      width={props.width ?? 20}
      height={props.height ?? 20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 13L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export { SearchIcon };
