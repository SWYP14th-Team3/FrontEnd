import 'server-only';

type JwtPayload = {
  exp: number;
  iat: number;
  sub?: string;
  [key: string]: unknown;
};

const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5분

export function decodePayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    const payload = parts[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    const parsed = JSON.parse(json);

    if (typeof parsed.exp !== 'number' || typeof parsed.iat !== 'number') return null;

    return parsed as JwtPayload;
  } catch {
    return null;
  }
}

export function getExpirationDate(token: string): Date | null {
  const payload = decodePayload(token);
  if (!payload) return null;

  return new Date(payload.exp * 1000);
}

export function isExpiringSoon(token: string): boolean {
  const payload = decodePayload(token);
  if (!payload) return true;

  const expiresAt = payload.exp * 1000;
  return expiresAt - Date.now() <= EXPIRY_BUFFER_MS;
}
