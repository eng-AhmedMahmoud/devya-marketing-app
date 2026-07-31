import type { AdminRole } from './api';

/**
 * Client/sidebar-level section gating. The backend enforces access anyway —
 * this only shapes navigation and redirects users away from sections their
 * role cannot use.
 */
export type Section = 'campaigns' | 'posts' | 'pr';

const FULL_ACCESS: AdminRole[] = ['SUPER_ADMIN', 'ADMIN'];

export const SECTION_ROLES: Record<Section, AdminRole[]> = {
  campaigns: [...FULL_ACCESS, 'MARKETING'],
  posts: [...FULL_ACCESS, 'MARKETING'],
  pr: [...FULL_ACCESS, 'PR'],
};

export function canAccess(role: AdminRole | null | undefined, section: Section): boolean {
  if (!role) return false;
  return SECTION_ROLES[section].includes(role);
}
