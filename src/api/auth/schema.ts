import { z } from 'zod';

// ── 백엔드 API 응답 스키마 ─────────────────────────────

export const userSchema = z.object({
  id: z.number(),
  email: z.string().nullable(),
  name: z.string().nullable(),
  provider: z.enum(['GOOGLE', 'KAKAO']),
  termsRequired: z.boolean(),
});

/** POST /auth/oauth/{provider}/login 응답 data */
export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.string(),
  user: userSchema,
  isNewUser: z.boolean(),
  termsRequired: z.boolean(),
});

/** GET /auth/me 응답 data */
export const meResponseSchema = userSchema;

/** POST /auth/reissue 응답 data */
export const reissueResponseSchema = z.object({
  accessToken: z.string(),
  tokenType: z.string(),
});

// ── BFF Route Handler 응답 스키마 ──────────────────────

export const socialLoginResponseSchema = z.object({
  success: z.boolean(),
  isNewUser: z.boolean(),
  termsRequired: z.boolean(),
});

export const logoutResponseSchema = z.object({
  success: z.boolean(),
});

/** POST /auth/agreements 응답 data */
export const agreementsResponseSchema = z.object({
  userId: z.number(),
  termsAgreedAt: z.string(),
  privacyAgreedAt: z.string(),
  termsVersion: z.string(),
  privacyVersion: z.string(),
});
