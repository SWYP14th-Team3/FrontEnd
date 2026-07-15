type PdfFileIconProps = React.ComponentProps<'svg'>;

function PdfFileIcon({ className, ...props }: PdfFileIconProps) {
  return (
    <svg
      width={props.width ?? 47}
      height={props.height ?? 62}
      viewBox="0 0 47 62"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        opacity="0.3"
        d="M39.806 14.036a5.618 5.618 0 0 1-4.154-1.723 5.618 5.618 0 0 1-1.723-4.154V0H7.67A7.668 7.668 0 0 0 0 7.669v46.233a7.669 7.669 0 0 0 7.67 7.658h31.523a7.669 7.669 0 0 0 7.67-7.658V14.036h-7.057Z"
        fill="#256EF4"
      />
      <path
        d="M46.863 14.036h-7.057a5.618 5.618 0 0 1-4.154-1.723 5.618 5.618 0 0 1-1.723-4.154V0l12.934 14.036Z"
        fill="#083891"
      />
      <path
        d="M37.221 42.99H7.798a1.069 1.069 0 0 1 0-2.135h29.423a1.069 1.069 0 1 1 0 2.135ZM37.221 30.951H7.798a1.069 1.069 0 0 1 0-2.135h29.423a1.069 1.069 0 1 1 0 2.135ZM37.221 36.97H7.798a1.069 1.069 0 0 1 0-2.135h29.423a1.069 1.069 0 1 1 0 2.135ZM25.616 24.932H7.798a1.069 1.069 0 0 1 0-2.135h17.818a1.069 1.069 0 1 1 0 2.135ZM25.616 18.913H7.798a1.069 1.069 0 0 1 0-2.136h17.818a1.069 1.069 0 1 1 0 2.136Z"
        fill="#083891"
      />
      <rect x="30.07" y="16.778" width="8.22" height="8.22" rx="1.59" fill="#083891" />
    </svg>
  );
}

export { PdfFileIcon };
