import { appConfig } from './config';

export class ApiError extends Error {
  constructor(public status: number, public body: unknown, message: string) { super(message); }
}

export async function apiFetch<T>(path: string, init?: RequestInit & { cookieHeader?: string }): Promise<T> {
  const { cookieHeader, ...rest } = init ?? {};
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(rest.headers as Record<string, string> | undefined) };
  if (cookieHeader) headers['cookie'] = cookieHeader;

  // Server-side calls go DIRECT to the backend (skip the same-origin rewrite to
  // avoid Vercel self-fetch deadlocks). Browser-side calls keep the rewrite so
  // the marketing-origin cookie travels with the request.
  const isServer = typeof window === 'undefined';
  const base = isServer ? (process.env.API_PROXY_TARGET ?? 'https://api.devya-solutions.com') : appConfig.apiUrl;

  const res = await fetch(`${base}${path}`, {
    ...rest,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) {
    let body: unknown = null;
    try { body = await res.json(); } catch {}
    const message = (body && typeof body === 'object' && 'message' in body && typeof (body as { message?: unknown }).message === 'string')
      ? (body as { message: string }).message : `Request failed with ${res.status}`;
    throw new ApiError(res.status, body, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEAM' | 'SALES_REP' | 'SALES_MANAGER' | 'MARKETING' | 'PR';
export interface AdminUser { id: string; email: string; name?: string; role: AdminRole; mustChangePassword?: boolean }

// ── Marketing domain types (mirror backend/src/marketing) ────────────────────
export type CampaignChannel = 'SOCIAL' | 'EMAIL' | 'ADS' | 'CONTENT' | 'EVENT' | 'OTHER';
export type CampaignStatus = 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface MarketingCampaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  budgetUsd?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PostPlatform = 'INSTAGRAM' | 'LINKEDIN' | 'X' | 'FACEBOOK' | 'TIKTOK' | 'YOUTUBE';
export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'CANCELLED';

export interface SocialPost {
  id: string;
  campaignId?: string | null;
  campaign?: { id: string; name: string } | null;
  platform: PostPlatform;
  status: PostStatus;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  copyEn?: string | null;
  copyAr?: string | null;
  mediaUrl?: string | null;
  link?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type OutreachType = 'PRESS' | 'REVIEW_DIRECTORY' | 'BACKLINK' | 'PODCAST' | 'AWARD' | 'OTHER';
export type OutreachStatus = 'PLANNED' | 'CONTACTED' | 'IN_PROGRESS' | 'PUBLISHED' | 'DECLINED';

export interface PrOutreach {
  id: string;
  targetName: string;
  type: OutreachType;
  status: OutreachStatus;
  contactName?: string | null;
  contactEmail?: string | null;
  url?: string | null;
  notes?: string | null;
  lastContactAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number }

function qs(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

const MKT = '/api/admin/marketing';

export const api = {
  // Auth (proxied through the app's own /api/auth routes for cookie handling)
  me: (cookieHeader?: string) => apiFetch<{ user: AdminUser }>('/api/auth/me', { cookieHeader }),
  login: (email: string, password: string) =>
    apiFetch<{ user: AdminUser }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => apiFetch<void>('/api/auth/logout', { method: 'POST' }),
  forgotPassword: (email: string) =>
    apiFetch<{ ok: true }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyResetOtp: (email: string, code: string) =>
    apiFetch<{ resetToken: string }>('/api/auth/verify-reset-otp', { method: 'POST', body: JSON.stringify({ email, code }) }),
  verifyEmail: (email: string, code: string) =>
    apiFetch<{ ok: true }>('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, code }) }),
  resendVerification: (email: string) =>
    apiFetch<{ ok: true }>('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, newPassword: string) =>
    apiFetch<{ ok: true }>('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ ok: true }>('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),

  // Campaigns (SUPER_ADMIN / ADMIN / MARKETING)
  campaigns: (params: { page?: number; pageSize?: number; search?: string; status?: string } = {}, cookieHeader?: string) =>
    apiFetch<Paged<MarketingCampaign>>(`${MKT}/campaigns${qs(params)}`, { cookieHeader }),
  campaign: (id: string, cookieHeader?: string) =>
    apiFetch<MarketingCampaign>(`${MKT}/campaigns/${id}`, { cookieHeader }),
  createCampaign: (body: Record<string, unknown>) =>
    apiFetch<MarketingCampaign>(`${MKT}/campaigns`, { method: 'POST', body: JSON.stringify(body) }),
  updateCampaign: (id: string, body: Record<string, unknown>) =>
    apiFetch<MarketingCampaign>(`${MKT}/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCampaign: (id: string) => apiFetch<void>(`${MKT}/campaigns/${id}`, { method: 'DELETE' }),

  // Social posts (SUPER_ADMIN / ADMIN / MARKETING)
  posts: (
    params: { page?: number; pageSize?: number; status?: string; platform?: string; campaignId?: string; search?: string } = {},
    cookieHeader?: string,
  ) => apiFetch<Paged<SocialPost>>(`${MKT}/posts${qs(params)}`, { cookieHeader }),
  post: (id: string, cookieHeader?: string) =>
    apiFetch<SocialPost>(`${MKT}/posts/${id}`, { cookieHeader }),
  createPost: (body: Record<string, unknown>) =>
    apiFetch<SocialPost>(`${MKT}/posts`, { method: 'POST', body: JSON.stringify(body) }),
  updatePost: (id: string, body: Record<string, unknown>) =>
    apiFetch<SocialPost>(`${MKT}/posts/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deletePost: (id: string) => apiFetch<void>(`${MKT}/posts/${id}`, { method: 'DELETE' }),
  draftPostAi: (body: { topic: string; platform: string; notes?: string }) =>
    apiFetch<{ copyEn: string; copyAr: string; hashtags: string[] }>(`${MKT}/ai/draft`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // PR outreach (SUPER_ADMIN / ADMIN / PR)
  outreach: (
    params: { page?: number; pageSize?: number; status?: string; type?: string; search?: string } = {},
    cookieHeader?: string,
  ) => apiFetch<Paged<PrOutreach>>(`${MKT}/pr${qs(params)}`, { cookieHeader }),
  outreachItem: (id: string, cookieHeader?: string) =>
    apiFetch<PrOutreach>(`${MKT}/pr/${id}`, { cookieHeader }),
  createOutreach: (body: Record<string, unknown>) =>
    apiFetch<PrOutreach>(`${MKT}/pr`, { method: 'POST', body: JSON.stringify(body) }),
  updateOutreach: (id: string, body: Record<string, unknown>) =>
    apiFetch<PrOutreach>(`${MKT}/pr/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteOutreach: (id: string) => apiFetch<void>(`${MKT}/pr/${id}`, { method: 'DELETE' }),
};
