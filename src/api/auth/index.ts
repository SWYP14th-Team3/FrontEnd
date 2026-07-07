import { parseResponse } from '@/lib/parseResponse';

import type { SocialLoginRequest, SocialLoginResponse, LogoutResponse } from './types';

/** POST /api/auth/session — OAuth 토큰 교환 */
export async function postSocialLogin(body: SocialLoginRequest): Promise<SocialLoginResponse> {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseResponse<SocialLoginResponse>(res);
}

/** POST /api/auth/logout — 로그아웃 */
export async function postLogout(): Promise<LogoutResponse> {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
  });
  return parseResponse<LogoutResponse>(res);
}
