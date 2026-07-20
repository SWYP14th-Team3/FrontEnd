import { http, HttpResponse } from 'msw';

import { mockUser } from '@/mocks/data/user';

const getMockAuthState = () => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('mock_logged_in') !== 'false';
};

const setMockAuthState = (loggedIn: boolean) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mock_logged_in', String(loggedIn));
  }
};

export const authHandlers = [
  http.post('/api/auth/session', () => {
    setMockAuthState(true);
    return HttpResponse.json({
      status: 200,
      message: '로그인 성공',
      data: { success: true },
    });
  }),

  http.post('/api/auth/logout', () => {
    setMockAuthState(false);
    return HttpResponse.json({
      status: 200,
      message: '로그아웃 성공',
      data: { success: true },
    });
  }),

  http.get('/api/auth/me', () => {
    if (!getMockAuthState()) {
      return HttpResponse.json(
        {
          status: 401,
          message: '인증되지 않은 사용자입니다.',
          data: null,
        },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      status: 200,
      message: '사용자 정보 조회 성공',
      data: mockUser,
    });
  }),
];
