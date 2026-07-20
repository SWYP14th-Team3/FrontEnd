type GoogleLogoProps = React.ComponentProps<'svg'>;

function GoogleLogo({ className, ...props }: GoogleLogoProps) {
  return (
    <svg
      width={props.width ?? 14}
      height={props.height ?? 14}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M13.72 7.16c0-.5-.04-.97-.13-1.43H7v2.7h3.77a3.22 3.22 0 0 1-1.4 2.12v1.76h2.26c1.32-1.22 2.09-3.01 2.09-5.15Z"
        fill="#4285F4"
      />
      <path
        d="M7 14c1.89 0 3.47-.63 4.63-1.7l-2.26-1.75c-.63.42-1.43.67-2.37.67-1.82 0-3.36-1.23-3.91-2.88H.75v1.81A7 7 0 0 0 7 14Z"
        fill="#34A853"
      />
      <path
        d="M3.09 8.34a4.2 4.2 0 0 1 0-2.68V3.85H.75a7 7 0 0 0 0 6.3l2.34-1.81Z"
        fill="#FBBC05"
      />
      <path
        d="M7 2.78c1.03 0 1.95.35 2.67 1.05l2-2A6.96 6.96 0 0 0 7 0 7 7 0 0 0 .75 3.85l2.34 1.81C3.64 4.01 5.18 2.78 7 2.78Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export { GoogleLogo };
