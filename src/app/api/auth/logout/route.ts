import { cookies } from 'next/headers';
import { clearAuthCookies } from '@/lib/cookies';

export async function POST() {
  try {
    const cookieStore = await cookies();
    clearAuthCookies(cookieStore);

    return Response.json({ status: 200, message: '로그아웃 성공', data: { success: true } });
  } catch (error) {
    console.error('[Logout] Error:', error);
    return Response.json({ status: 500, message: '내부 서버 오류', data: null }, { status: 500 });
  }
}
