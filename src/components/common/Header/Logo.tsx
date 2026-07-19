import Link from 'next/link';

function Logo() {
  return (
    <Link href="/" className="flex items-center" aria-label="ResuFit 홈">
      <svg width="56" height="29" viewBox="0 0 56 29" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="29" y="19" width="29" height="9" rx="2" transform="rotate(-180 29 19)" fill="#B1CEFB" />
        <rect x="10" y="29" width="29" height="9" rx="2" transform="rotate(-90 10 29)" fill="#B1CEFB" />
        <rect x="55.0293" y="10.0488" width="25.4878" height="8.04878" rx="2" transform="rotate(-180 55.0293 10.0488)" fill="#B1CEFB" />
        <rect x="46.9805" y="27.4883" width="25.4878" height="8.04878" rx="2" transform="rotate(-90 46.9805 27.4883)" fill="#B1CEFB" />
        <path
          d="M52.4733 7.74369C53.2543 8.52474 53.2543 9.79107 52.4733 10.5721L36.1432 26.9022C35.7681 27.2773 35.2594 27.488 34.729 27.488H29.003C27.2212 27.488 26.3289 25.3337 27.5888 24.0738L46.7819 4.88071C47.5629 4.09966 48.8293 4.09966 49.6103 4.88071L52.4733 7.74369Z"
          fill="#B1CEFB"
        />
      </svg>
    </Link>
  );
}

export { Logo };
