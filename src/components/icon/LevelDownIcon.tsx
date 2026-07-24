function LevelDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width={20} height={20} rx={10} fill="#E5503C" />
      <path d="M6 8L10 12L14 8" stroke="white" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export { LevelDownIcon };
