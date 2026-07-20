type InfoIconProps = React.ComponentProps<'svg'>;

function InfoIcon({ className, ...props }: InfoIconProps) {
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
        d="M7 1C3.686 1 1 3.686 1 7s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6Zm0 2.5a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Zm0 2.75c.345 0 .625.28.625.625v3.25a.625.625 0 1 1-1.25 0v-3.25c0-.345.28-.625.625-.625Z"
        fill="currentColor"
      />
    </svg>
  );
}

export { InfoIcon };
