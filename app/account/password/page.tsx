import { ShieldAlert } from 'lucide-react';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { ChangePasswordForm } from '@/components/auth/change-password-form';

export const dynamic = 'force-dynamic';

interface SearchParams {
  required?: string;
}

export default async function AccountPasswordPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const required = sp.required === '1';

  return (
    <Shell>
      <PageHeader title="Change password" subtitle="Update the password for your account." />
      {required && (
        <div className="mb-6 flex items-start gap-2.5 rounded-md border border-amber-500/30 bg-amber-500/[0.08] px-3.5 py-3 text-sm text-amber-200 max-w-md">
          <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
          <span>You must set a new password before continuing.</span>
        </div>
      )}
      <div className="surface-strong p-6 max-w-md">
        <ChangePasswordForm required={required} />
      </div>
    </Shell>
  );
}
