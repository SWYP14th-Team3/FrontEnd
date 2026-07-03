import 'server-only';

import { cookies } from 'next/headers';

import { ACCESS_TOKEN_KEY } from '@/lib/cookies';

export async function fetchWithAuth(path: string, options: RequestInit = {}): Promise<Response> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error('BACKEND_URL 환경 변수가 설정되지 않았습니다.');
  }

  const token = (await cookies()).get(ACCESS_TOKEN_KEY)?.value;

  return fetch(`${backendUrl}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
}
