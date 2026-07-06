export type SocialLoginRequest = {
  provider: 'kakao' | 'google';
  code: string;
};

export type SocialLoginResponse = {
  success: boolean;
};

export type LogoutResponse = {
  success: boolean;
};
