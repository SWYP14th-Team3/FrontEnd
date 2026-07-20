'use client';

import { useQuery } from '@tanstack/react-query';
import { meOptions } from '@/api/auth/queries';

export function useUser() {
  const { data, isLoading, status } = useQuery({
    ...meOptions(),
    retry: false,
  });

  return {
    user: data ?? null,
    isLoggedIn: status === 'success' && !!data,
    isLoading,
  };
}
