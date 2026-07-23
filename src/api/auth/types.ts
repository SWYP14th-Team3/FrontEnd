import type { z } from 'zod';
import type {
  userSchema,
  loginResponseSchema,
  reissueResponseSchema,
  socialLoginResponseSchema,
  logoutResponseSchema,
} from './schema';

// ── 백엔드 API 타입 (스키마에서 추출) ──────────────────

/** OAuth 로그인 제공자 (URL path parameter용, 소문자) */
export type OAuthProvider = 'kakao' | 'google';

/** 백엔드 응답의 provider 필드 (대문자 enum) */
export type OAuthProviderEnum = z.infer<typeof userSchema>['provider'];

/** 사용자 정보 */
export type User = z.infer<typeof userSchema>;

/** POST /auth/oauth/{provider}/login 응답 data */
export type LoginResponse = z.infer<typeof loginResponseSchema>;

/** GET /auth/me 응답 data */
export type MeResponse = User;

/** POST /auth/reissue 응답 data */
export type ReissueResponse = z.infer<typeof reissueResponseSchema>;

// ── 요청 타입 (스키마 불필요 — 우리가 보내는 데이터) ───

/** POST /auth/oauth/{provider}/login 요청 바디 */
export type LoginRequest = {
  authorizationCode: string;
};

/** POST /auth/logout 요청 바디 */
export type LogoutRequest = {
  refreshToken: string;
};

/** POST /auth/reissue 요청 바디 */
export type ReissueRequest = {
  refreshToken: string;
};

// ── BFF Route Handler 타입 ─────────────────────────────

/** POST /api/auth/session 요청 바디 (BFF 경유 소셜 로그인) */
export type SocialLoginRequest = {
  code: string;
  provider: OAuthProvider;
};

/** POST /api/auth/session 응답 data */
export type SocialLoginResponse = z.infer<typeof socialLoginResponseSchema>;

/** POST /api/auth/logout 응답 data */
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;

/** POST /api/auth/agreements 요청 바디 */
export type AgreementsRequest = {
  termsAgreed: boolean;
  privacyAgreed: boolean;
};

/** POST /api/auth/agreements 응답 data */
export type AgreementsResponse = {
  userId: number;
  termsAgreedAt: string;
  privacyAgreedAt: string;
  termsVersion: string;
  privacyVersion: string;
};
