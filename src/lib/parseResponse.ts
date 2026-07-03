import type { ApiResponse } from '@/types/api';
import { ApiRequestError } from '@/lib/errors';

export async function parseResponse<T>(res: Response): Promise<T> {
  const json = await res.json();

  if (!res.ok) {
    const message = json.message || `API 요청 실패: ${res.status}`;
    throw new ApiRequestError(res.status, message);
  }

  return (json as ApiResponse<T>).data;
}
