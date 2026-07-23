function FolderOpenIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width={12} height={12} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g clipPath="url(#folder-open-clip)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0.616211 3.08789V9.49949C0.616211 9.95519 0.985511 10.3245 1.44121 10.3245H8.95771C9.41341 10.3245 9.78271 9.95519 9.78271 9.49949V3.91289C9.78271 3.45719 9.41341 3.08789 8.95771 3.08789H0.616211Z"
          fill="#FFA300"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M2.29262 5.21979L0.912315 9.42279C0.766215 9.86739 1.09742 10.3249 1.56542 10.3249H8.98592C9.46112 10.3249 9.88262 10.0198 10.0311 9.56799L11.4114 5.36499C11.5575 4.92039 11.2263 4.46289 10.7583 4.46289H3.33752C2.86232 4.46289 2.44082 4.76799 2.29232 5.21979H2.29262Z"
          fill="#FFC33A"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0.616206 3.08878H5.44051L4.31011 1.95838C4.12921 1.77748 3.88381 1.67578 3.62791 1.67578H1.44091C0.985206 1.67578 0.615906 2.04508 0.615906 2.50078L0.616206 3.08878Z"
          fill="#FFA300"
        />
      </g>
      <defs>
        <clipPath id="folder-open-clip">
          <rect width={12} height={12} fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export { FolderOpenIcon };
