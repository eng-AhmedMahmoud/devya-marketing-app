'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErrorMessage } from './auth-error';
import { PasswordHints, passwordMeetsPolicy } from './password-hints';

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passwordMeetsPolicy(password)) {
      setError('Password does not meet the requirements below.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    start(async () => {
      try {
        await api.resetPassword(token, password);
        setDone(true);
      } catch (err) {
        setError(apiErrorMessage(err, 'This reset link is invalid or has expired.'));
      }
    });
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-rose-300 rounded-md border border-rose-500/30 bg-rose-500/[0.08] px-3 py-2">
          This reset link is invalid or incomplete. Request a new one.
        </div>
        <Link
          href="/forgot-password"
          className="block text-center text-xs text-ink-400 hover:text-ink-200 transition-colors"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-md border border-emerald-500/30 bg-emerald-500/[0.08] px-3 py-2.5 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Your password has been reset.</span>
        </div>
        <Link
          href="/login"
          className="w-full inline-flex items-center justify-center rounded-md bg-white px-4 py-2.5 text-sm font-medium text-ink-900 hover:bg-ink-200 ring-focus"
        >
          Sign in with your new password
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="block text-xs font-medium text-ink-300 mb-1.5">New password</span>
        <input
          type="password"
          autoComplete="new-password"
          autoFocus
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[15px] text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] ring-focus"
          placeholder="••••••••••••"
        />
      </label>
      <PasswordHints value={password} />
      <label className="block">
        <span className="block text-xs font-medium text-ink-300 mb-1.5">Confirm new password</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[15px] text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] ring-focus"
          placeholder="••••••••••••"
        />
      </label>
      {confirm.length > 0 && confirm !== password && (
        <p className="text-[11px] text-amber-300">Passwords do not match yet.</p>
      )}
      {error && (
        <div className="text-sm text-rose-300 rounded-md border border-rose-500/30 bg-rose-500/[0.08] px-3 py-2">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-ink-900 hover:bg-ink-200 disabled:opacity-60 ring-focus"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Reset password
      </button>
    </form>
  );
}
