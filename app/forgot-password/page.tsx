import { DevyaLogo } from '@/components/ui/devya-logo';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-grid px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <DevyaLogo width={120} />
        </div>
        <div className="surface-strong p-6">
          <h1 className="text-lg font-semibold text-white mb-1">Forgot password</h1>
          <p className="text-sm text-ink-400 mb-5">
            Enter your email and we&apos;ll send you a reset link.
          </p>
          <ForgotPasswordForm />
        </div>
        <p className="mt-6 text-center text-xs text-ink-500">
          Trouble signing in? Contact your administrator.
        </p>
      </div>
    </div>
  );
}
