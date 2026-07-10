import { parseResponse } from '@/lib/parseResponse';
import { meResponseSchema, socialLoginResponseSchema, logoutResponseSchema } from './schema';
import type { MeResponse, SocialLoginRequest, SocialLoginResponse, LogoutResponse } from './types';

/** POST /api/auth/session — OAuth 토큰 교환 (BFF Route Handler 경유) */
export async function postSocialLogin(body: SocialLoginRequest): Promise<SocialLoginResponse> {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseResponse(res, socialLoginResponseSchema);
}

/** POST /api/auth/logout — 로그아웃 */
export async function postLogout(): Promise<LogoutResponse> {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
  });
  return parseResponse(res, logoutResponseSchema);
}

/** GET /auth/me — 로그인 사용자 정보 조회 (catch-all 프록시 경유) */
export async function getMe(): Promise<MeResponse> {
  const res = await fetch('/api/auth/me');
  return parseResponse(res, meResponseSchema);
}
