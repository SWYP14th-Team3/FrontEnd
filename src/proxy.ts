import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isExpiringSoon, getExpirationDate, decodePayload } from '@/lib/jwt';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, BASE_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } from '@/lib/cookies';

const PROTECTED_ROUTES = ['/result', '/history'];

// TODO: 백엔드 refresh 엔드포인트 확정 후 수정
const REFRESH_ENDPOINT = `${process.env.BACKEND_URL}/auth/refresh`;

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_KEY)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_KEY)?.value;

  // 보호 라우트 체크: 토큰 없거나 만료됨 → refresh 시도 or 리다이렉트
  if (isProtectedRoute(request.nextUrl.pathname)) {
    if (!accessToken) {
      return redirectToHome(request);
    }

    const payload = decodePayload(accessToken);
    if (!payload || payload.exp * 1000 < Date.now()) {
      if (refreshToken) {
        return attemptRefresh(request, refreshToken);
      }
      return redirectWithClear(request);
    }
  }

  // 토큰 만료 임박 시 선제적 refresh
  if (accessToken && isExpiringSoon(accessToken) && refreshToken) {
    return attemptRefresh(request, refreshToken);
  }

  return NextResponse.next();
}

async function attemptRefresh(request: NextRequest, refreshToken: string) {
  try {
    const res = await fetch(REFRESH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      const newAccessToken = data.accessToken;
      const newRefreshToken = data.refreshToken;

      if (typeof newAccessToken !== 'string') {
        return redirectWithClear(request);
      }

      const response = NextResponse.next();
      response.cookies.set(ACCESS_TOKEN_KEY, newAccessToken, {
        ...BASE_COOKIE_OPTIONS,
        expires: getExpirationDate(newAccessToken) ?? undefined,
      });
      if (typeof newRefreshToken === 'string') {
        response.cookies.set(REFRESH_TOKEN_KEY, newRefreshToken, {
          ...REFRESH_COOKIE_OPTIONS,
          expires: getExpirationDate(newRefreshToken) ?? undefined,
        });
      }
      return response;
    }

    // refresh 실패 (401 등) → 쿠키 삭제 + 리다이렉트
    return redirectWithClear(request);
  } catch {
    // 네트워크 에러 → 토큰이 아직 유효할 수 있으므로 그냥 통과
    return NextResponse.next();
  }
}

function redirectToHome(request: NextRequest) {
  return NextResponse.redirect(new URL('/', request.url));
}

function redirectWithClear(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/', request.url));
  response.cookies.delete(ACCESS_TOKEN_KEY);
  response.cookies.delete(REFRESH_TOKEN_KEY);
  return response;
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
