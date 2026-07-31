import { Suspense } from 'react';
import { DevyaLogo } from '@/components/ui/devya-logo';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-grid px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <DevyaLogo width={120} />
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-300">
            Admin
          </span>
        </div>
        <div className="surface-strong p-6">
          <h1 className="text-lg font-semibold text-white mb-1">Reset password</h1>
          <p className="text-sm text-ink-400 mb-5">Choose a new password for your account.</p>
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-ink-500">
          Trouble signing in? Contact your administrator.
        </p>
      </div>
    </div>
  );
}
