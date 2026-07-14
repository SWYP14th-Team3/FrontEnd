type LinkIconProps = React.ComponentProps<'svg'>;

function LinkIcon({ className, ...props }: LinkIconProps) {
  return (
    <svg
      width={props.width ?? 18}
      height={props.height ?? 18}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M9.00002 12.7492L7.87502 13.8742C7.37769 14.3714 6.70325 14.6507 6.00002 14.6507C5.29678 14.6507 4.62234 14.3714 4.12502 13.8742C3.62782 13.3768 3.34851 12.7024 3.34851 11.9992C3.34851 11.2959 3.62782 10.6215 4.12502 10.1242L6.37502 7.87416C6.87234 7.37697 7.54678 7.09766 8.25002 7.09766C8.95325 7.09766 9.62769 7.37697 10.125 7.87416"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9.00006 5.24916L10.1251 4.12416C10.6224 3.62697 11.2968 3.34766 12.0001 3.34766C12.7033 3.34766 13.3777 3.62697 13.8751 4.12416C14.3723 4.62149 14.6516 5.29593 14.6516 5.99916C14.6516 6.70239 14.3723 7.37684 13.8751 7.87416L11.6251 10.1242C11.1277 10.6214 10.4533 10.9007 9.75006 10.9007C9.04683 10.9007 8.37239 10.6214 7.87506 10.1242"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export { LinkIcon };
