'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErrorMessage } from './auth-error';

const INPUT_CLASS =
  'w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[15px] text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] ring-focus';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  // 'email' -> ask which account; 'code' -> a 6-digit OTP was emailed and we
  // trade it for a single-use reset token, then hand off to /reset-password.
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        await api.forgotPassword(email);
        setStep('code');
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not send the code. Try again.'));
      }
    });
  }

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        const { resetToken } = await api.verifyResetOtp(email, code);
        window.location.assign(`/reset-password?token=${encodeURIComponent(resetToken)}`);
      } catch (err) {
        setError(apiErrorMessage(err, 'Code is invalid or expired.'));
      }
    });
  }

  if (step === 'code') {
    return (
      <form onSubmit={submitCode} className="space-y-3">
        <div className="flex items-start gap-2.5 rounded-md border border-emerald-500/30 bg-emerald-500/[0.08] px-3 py-2.5 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>If the account exists, a 6-digit code was sent to {email}. Enter it below.</span>
        </div>
        <label className="block">
          <span className="block text-xs font-medium text-ink-300 mb-1.5">Reset code</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            autoFocus
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className={`${INPUT_CLASS} text-center tracking-[0.5em] font-mono text-lg`}
            placeholder="••••••"
          />
        </label>
        {error && (
          <div className="text-sm text-rose-300 rounded-md border border-rose-500/30 bg-rose-500/[0.08] px-3 py-2">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={pending || code.length !== 6}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-ink-900 hover:bg-ink-200 disabled:opacity-60 ring-focus"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continue
        </button>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setStep('email');
              setCode('');
              setError(null);
            }}
            className="text-xs text-ink-400 hover:text-ink-200 transition-colors"
          >
            Use a different email
          </button>
          <Link href="/login" className="text-xs text-ink-400 hover:text-ink-200 transition-colors">
            Back to sign in
          </Link>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={submitEmail} className="space-y-3">
      <label className="block">
        <span className="block text-xs font-medium text-ink-300 mb-1.5">Email</span>
        <input
          type="email"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT_CLASS}
          placeholder="you@devya.dev"
        />
      </label>
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
        Send reset code
      </button>
      <Link
        href="/login"
        className="block text-center text-xs text-ink-400 hover:text-ink-200 transition-colors"
      >
        Back to sign in
      </Link>
    </form>
  );
}
