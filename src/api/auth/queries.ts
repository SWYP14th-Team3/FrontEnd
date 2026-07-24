import { useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';

import { postSocialLogin, postLogout, getMe, postAgreements, deleteAccount } from './api';

import type { ApiRequestError } from '@/lib/errors';
import type { UseMutationOptions } from '@tanstack/react-query';
import type { SocialLoginRequest, SocialLoginResponse, LogoutResponse, AgreementsRequest, AgreementsResponse } from './types';

export const authKeys = {
  all: ['auth'] as const,
  oauth: () => [...authKeys.all, 'oauth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

/** GET /api/auth/me — 현재 사용자 정보 조회 */
export function meOptions() {
  return queryOptions({
    queryKey: authKeys.me(),
    queryFn: () => getMe(),
    staleTime: 5 * 60 * 1000, // 5분 — 사용자 정보는 세션 중 거의 변하지 않음
  });
}

/** POST /api/auth/session — OAuth 소셜 로그인 */
export function useSocialLoginCallback(
  options?: UseMutationOptions<SocialLoginResponse, ApiRequestError, SocialLoginRequest>,
) {
  return useMutation({
    mutationFn: (body: SocialLoginRequest) => postSocialLogin(body),
    ...options,
  });
}

/** POST /api/auth/logout — 로그아웃 */
export function useLogout(options?: UseMutationOptions<LogoutResponse, ApiRequestError, void>) {
  return useMutation({
    mutationFn: () => postLogout(),
    ...options,
  });
}

/** POST /api/auth/agreements — 약관 동의 */
export function useAgreements(options?: UseMutationOptions<AgreementsResponse, ApiRequestError, AgreementsRequest>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AgreementsRequest) => postAgreements(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
    ...options,
  });
}

/** DELETE /api/auth/me — 회원 탈퇴 */
export function useDeleteAccount(options?: UseMutationOptions<void, ApiRequestError, void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteAccount(),
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me(), null);
      queryClient.removeQueries({ queryKey: authKeys.me() });
    },
    ...options,
  });
}
