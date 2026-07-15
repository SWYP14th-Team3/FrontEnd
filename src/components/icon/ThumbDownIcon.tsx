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
      <path
        d="M17 2V13M22 11V4C22 2.89543 21.1046 2 20 2H6.57381C5.09298 2 3.83377 3.08031 3.60858 4.54379L2.53168 11.5438C2.25212 13.3611 3.65823 15 5.49691 15H9C9.55228 15 10 15.4477 10 16V19.5342C10 20.896 11.104 22 12.4658 22C12.7907 22 13.085 21.8087 13.2169 21.5119L16.7361 13.5939"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { ThumbDownIcon };
