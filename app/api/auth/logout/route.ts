import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'devya_session';
const UPSTREAM = process.env.API_PROXY_TARGET ?? 'https://api.devya-solutions.com';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const cookie = req.headers.get('cookie') ?? '';
  await fetch(`${UPSTREAM}/api/auth/logout`, { method: 'POST', headers: { cookie } }).catch(() => null);
  const out = new NextResponse(null, { status: 204 });
  out.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return out;
}
