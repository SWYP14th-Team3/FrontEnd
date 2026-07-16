type ThumbDownIconProps = React.ComponentProps<'svg'>;

function ThumbDownIcon({ className, ...props }: ThumbDownIconProps) {
  return (
    <svg
      width={props.width ?? 24}
      height={props.height ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath="url(#thumb-down-clip)">
        <path
          d="M19.1725 12.6094C20.1577 12.6094 20.9569 11.8306 20.9569 10.8694C20.9569 9.90817 20.1583 9.12937 19.1725 9.12937H18.4639C19.3579 9.03517 20.0569 8.30497 20.0569 7.40797C20.0569 6.44677 19.2583 5.66797 18.2725 5.66797H17.5639C18.4579 5.57377 19.1569 4.84417 19.1569 3.94657C19.1569 2.98537 18.3583 2.20657 17.3725 2.20657H17.3713V2.20117H10.7557C6.49695 2.20117 3.04395 5.65357 3.04395 9.91297C3.04395 11.2816 3.40455 12.565 4.02975 13.6792H4.02495L8.76194 21.7966C9.27434 22.684 10.4089 22.9882 11.2963 22.4758C12.1033 22.0096 12.4207 21.0304 12.0865 20.1886L12.0919 20.1862L10.8805 16.0708H17.3713H18.5443C18.5449 16.0708 18.5455 16.0708 18.5461 16.0708C19.5283 16.0708 20.3245 15.292 20.3245 14.3308C20.3245 13.4332 19.6267 12.7024 18.7345 12.6094H19.1725Z"
          fill="#FFC84D"
        />
      </g>
      <defs>
        <clipPath id="thumb-down-clip">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export { ThumbDownIcon };
