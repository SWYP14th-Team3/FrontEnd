type HankkutLogoProps = React.ComponentProps<'svg'>;

function HankkutLogo({ className, ...props }: HankkutLogoProps) {
  return (
    <svg
      width={props.width ?? 60}
      height={props.height ?? 33}
      viewBox="0 0 60 33"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <rect x="21.1182" y="14.5195" width="21.1182" height="7.91931" rx="1.52022" transform="rotate(-180 21.1182 14.5195)" fill="#4C87F6" />
      <rect x="30.3574" y="33" width="23.7579" height="7.91931" rx="1.52022" transform="rotate(-180 30.3574 33)" fill="#B1CEFB" />
      <rect x="59.3948" y="7.92188" width="25.0778" height="7.91931" rx="1.52022" transform="rotate(-180 59.3948 7.92188)" fill="#B1CEFB" />
      <rect x="59.3948" y="22.4414" width="25.0778" height="6.59942" rx="1.52022" transform="rotate(-180 59.3948 22.4414)" fill="#4C87F6" />
      <rect x="52.7954" y="33" width="17.1585" height="6.59942" rx="1.52022" transform="rotate(-90 52.7954 33)" fill="#4C87F6" />
      <rect x="32.9971" y="14.5195" width="10.5591" height="7.91931" rx="1.52022" transform="rotate(-180 32.9971 14.5195)" fill="#B1CEFB" />
      <rect x="6.59961" y="21.1211" width="21.1182" height="7.91931" rx="1.52022" transform="rotate(-90 6.59961 21.1211)" fill="#4C87F6" />
      <rect x="22.438" y="21.1211" width="21.1182" height="6.59942" rx="1.52022" transform="rotate(-90 22.438 21.1211)" fill="#B1CEFB" />
      <rect x="6.59961" y="31.6797" width="9.23919" height="7.91931" rx="1.52022" transform="rotate(-90 6.59961 31.6797)" fill="#B1CEFB" />
      <rect x="39.5964" y="14.5195" width="14.5187" height="7.91931" rx="1.52022" transform="rotate(-90 39.5964 14.5195)" fill="#B1CEFB" />
      <rect x="51.4753" y="14.5195" width="14.5187" height="7.91931" rx="1.52022" transform="rotate(-90 51.4753 14.5195)" fill="#B1CEFB" />
      <path
        d="M55.5951 20.3932C56.1398 21.0321 56.0635 21.9916 55.4246 22.5363L43.5779 32.6377C43.3028 32.8723 42.9531 33.0012 42.5916 33.0012H35.7584C34.345 33.0012 33.6965 31.2411 34.7721 30.3241L50.576 16.8497C51.2148 16.305 52.1743 16.3814 52.7191 17.0202L55.5951 20.3932Z"
        fill="#4C87F6"
      />
    </svg>
  );
}

export { HankkutLogo };
