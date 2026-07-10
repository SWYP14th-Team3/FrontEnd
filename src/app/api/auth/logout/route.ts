import { cookies } from 'next/headers';
import { clearAuthCookies, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/lib/cookies';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_KEY)?.value;

    if (accessToken) {
      const backendUrl = process.env.BACKEND_URL;
      if (backendUrl) {
        const refreshToken = cookieStore.get(REFRESH_TOKEN_KEY)?.value;
        await fetch(`${backendUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        }).catch((error) => {
          console.error('[Logout] 백엔드 로그아웃 요청 실패:', error);
        });
      }
    }

    clearAuthCookies(cookieStore);

    return Response.json({ status: 200, message: '로그아웃 성공', data: { success: true } });
  } catch (error) {
    console.error('[Logout] Error:', error);
    return Response.json({ status: 500, message: '내부 서버 오류', data: null }, { status: 500 });
  }
}
