type KakaoLogoProps = React.ComponentProps<'svg'>;

function KakaoLogo({ className, ...props }: KakaoLogoProps) {
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
      <rect width="14" height="14" rx="3" fill="#FEE500" />
      <path
        d="M7 3.5C4.79 3.5 3 4.9 3 6.62c0 1.11.74 2.08 1.85 2.64l-.47 1.73c-.04.14.12.26.24.18l2.06-1.36c.1.01.21.02.32.02 2.21 0 4-1.4 4-3.12S9.21 3.5 7 3.5Z"
        fill="#3C1E1E"
      />
    </svg>
  );
}

export { KakaoLogo };
