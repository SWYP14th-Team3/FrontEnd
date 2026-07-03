import 'server-only';

import { cookies } from 'next/headers';
import { getExpirationDate } from '@/lib/jwt';

export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

export const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export const REFRESH_COOKIE_OPTIONS = {
  ...BASE_COOKIE_OPTIONS,
  sameSite: 'strict' as const,
};

export function setAuthCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  accessToken: string,
  refreshToken: string,
): void {
  cookieStore.set(ACCESS_TOKEN_KEY, accessToken, {
    ...BASE_COOKIE_OPTIONS,
    expires: getExpirationDate(accessToken) ?? undefined,
  });
  cookieStore.set(REFRESH_TOKEN_KEY, refreshToken, {
    ...REFRESH_COOKIE_OPTIONS,
    expires: getExpirationDate(refreshToken) ?? undefined,
  });
}

export function clearAuthCookies(cookieStore: Awaited<ReturnType<typeof cookies>>): void {
  cookieStore.delete(ACCESS_TOKEN_KEY);
  cookieStore.delete(REFRESH_TOKEN_KEY);
}
