import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'devya_session';
const UPSTREAM = process.env.API_PROXY_TARGET ?? 'https://api.devya-solutions.com';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const creds = await req.json().catch(() => ({}));
  const res = await fetch(`${UPSTREAM}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // `app` drives the backend's per-app access gate for this app.
    body: JSON.stringify({ ...creds, app: 'marketing' }),
  });
  const text = await res.text();
  const out = new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
  if (res.ok) {
    const sc = res.headers.get('set-cookie');
    const m = sc?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    if (m) {
      out.cookies.set(COOKIE_NAME, m[1], {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  }
  return out;
}
