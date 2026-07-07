import { cookies } from 'next/headers';
import { setAuthCookies } from '@/lib/cookies';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, provider } = body as { code?: string; provider?: string };

    if (!code || !provider) {
      return Response.json({ status: 400, message: 'code와 provider는 필수입니다.', data: null }, { status: 400 });
    }

    if (provider !== 'kakao' && provider !== 'google') {
      return Response.json(
        { status: 400, message: 'provider는 kakao 또는 google이어야 합니다.', data: null },
        { status: 400 },
      );
    }

    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      return Response.json(
        { status: 500, message: 'BACKEND_URL 환경 변수가 설정되지 않았습니다.', data: null },
        { status: 500 },
      );
    }

    const backendResponse = await fetch(`${backendUrl}/api/auth/oauth/${provider}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorizationCode: code }),
    });

    if (!backendResponse.ok) {
      return Response.json(
        { status: backendResponse.status, message: '인증 서버 오류', data: null },
        { status: backendResponse.status },
      );
    }

    const backendData = await backendResponse.json();

    if (!backendData?.accessToken || !backendData?.refreshToken) {
      return Response.json({ status: 500, message: '인증 토큰을 받지 못했습니다.', data: null }, { status: 500 });
    }

    const { accessToken, refreshToken } = backendData as {
      accessToken: string;
      refreshToken: string;
    };

    const cookieStore = await cookies();
    setAuthCookies(cookieStore, accessToken, refreshToken);

    return Response.json({ status: 200, message: '로그인 성공', data: { success: true } });
  } catch (error) {
    console.error('[OAuth Session] Error:', error);
    return Response.json({ status: 500, message: '내부 서버 오류', data: null }, { status: 500 });
  }
}
