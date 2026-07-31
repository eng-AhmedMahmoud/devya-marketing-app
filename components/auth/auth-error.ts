import { ApiError } from '@/lib/api';

/** Pull the human-readable message out of a backend error response ({message} JSON). */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.body && typeof err.body === 'object' && 'message' in err.body) {
      const m = (err.body as { message?: unknown }).message;
      if (typeof m === 'string' && m.length > 0) return m;
      if (Array.isArray(m) && m.length > 0 && typeof m[0] === 'string') return m[0];
    }
    if (err.status === 429) return 'Too many attempts. Please wait a minute and try again.';
    return fallback;
  }
  return 'Could not reach the server';
}
