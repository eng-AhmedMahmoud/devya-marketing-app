import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { api, ApiError, type AdminUser } from './api';
import { canAccess, type Section } from './roles';

/**
 * Server-side page guard: resolves the signed-in user from the session cookie,
 * bounces unauthenticated visitors to /login, and redirects roles without
 * access to the given section back to the dashboard. The backend enforces the
 * same rules — this only keeps the UI coherent.
 */
export async function requireUser(): Promise<{ cookieHeader: string; user: AdminUser }> {
  const cookieHeader = (await headers()).get('cookie') ?? '';
  let user: AdminUser;
  try {
    ({ user } = await api.me(cookieHeader));
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) redirect('/login');
    throw err;
  }
  return { cookieHeader, user };
}

export async function requireSection(section: Section): Promise<{ cookieHeader: string; user: AdminUser }> {
  const { cookieHeader, user } = await requireUser();
  if (!canAccess(user.role, section)) redirect('/');
  return { cookieHeader, user };
}
