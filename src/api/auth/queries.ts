import { useMutation } from '@tanstack/react-query';

import { postSocialLogin, postLogout } from './index';

import type { UseMutationOptions } from '@tanstack/react-query';
import type { SocialLoginRequest, SocialLoginResponse, LogoutResponse } from './types';

export const authKeys = {
  all: ['auth'] as const,
  oauth: () => [...authKeys.all, 'oauth'] as const,
};

/** POST /api/auth/session — OAuth 소셜 로그인 */
export function useSocialLoginCallback(
  options?: UseMutationOptions<SocialLoginResponse, Error, SocialLoginRequest, unknown>,
) {
  return useMutation({
    mutationFn: postSocialLogin,
    ...options,
  });
}

/** POST /api/auth/logout — 로그아웃 */
export function useLogout(options?: UseMutationOptions<LogoutResponse, Error, void, unknown>) {
  return useMutation({
    mutationFn: postLogout,
    ...options,
  });
}
