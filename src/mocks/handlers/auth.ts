import { http, HttpResponse } from 'msw';

import { mockUser } from '@/mocks/data/user';

export const authHandlers = [
  http.post('/api/auth/session', () => {
    return HttpResponse.json({
      status: 200,
      message: '로그인 성공',
      data: { success: true },
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({
      status: 200,
      message: '로그아웃 성공',
      data: { success: true },
    });
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      status: 200,
      message: '사용자 정보 조회 성공',
      data: mockUser,
    });
  }),
];
