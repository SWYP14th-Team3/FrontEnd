import type { z } from 'zod';

import type { userSchema } from '@/api/auth/schema';

type MockUser = z.infer<typeof userSchema>;

export const mockUser: MockUser = {
  id: 1,
  email: 'test@example.com',
  name: '홍길동',
  provider: 'KAKAO',
  termsRequired: false,
};
