import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Search } from 'lucide-react';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { CampaignStatusBadge, ChannelBadge } from '@/components/ui/badge';
import { NewCampaignForm } from '@/components/marketing/new-campaign-form';
import { CampaignActions } from '@/components/marketing/campaign-actions';
import { cn } from '@/lib/utils';
import { api, ApiError, type Paged, type MarketingCampaign } from '@/lib/api';
import { requireSection } from '@/lib/guard';

export const dynamic = 'force-dynamic';

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatBudget(v: string | null | undefined) {
  if (!v) return '—';
  const n = Number(v);
  return Number.isNaN(n) ? v : `$${n.toLocaleString('en-US')}`;
}

const STATUS_CHIPS = [
  { value: '', label: 'All' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'COMPLETED', label: 'Completed' },
] as const;

const chipCls = 'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ring-focus';
const chipActiveCls = 'surface-strong border-blue-500/40 text-white';
const chipIdleCls = 'border-white/10 bg-white/[0.03] text-ink-300 hover:bg-white/[0.06] hover:text-white';

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { cookieHeader } = await requireSection('campaigns');
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? '') : (v ?? ''));

  const rawStatus = one(sp.status);
  const status = STATUS_CHIPS.some((c) => c.value === rawStatus) ? rawStatus : '';
  const search = one(sp.q).trim();

  let page: Paged<MarketingCampaign>;
  try {
    page = await api.campaigns({ pageSize: 100, status: status || undefined, search: search || undefined }, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    if (err instanceof ApiError && err.status === 403) redirect('/');
    throw err;
  }

  const buildHref = (s: string) => {
    const params = new URLSearchParams();
    if (s) params.set('status', s);
    if (search) params.set('q', search);
    const q = params.toString();
    return q ? `/campaigns?${q}` : '/campaigns';
  };

  return (
    <Shell>
      <PageHeader
        title="Campaigns"
        subtitle="Every marketing push — social, email, ads, content and events — in one place."
      />

      <NewCampaignForm />

      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_CHIPS.map((c) => (
            <Link key={c.value || 'all'} href={buildHref(c.value)} className={cn(chipCls, status === c.value ? chipActiveCls : chipIdleCls)}>
              {c.label}
            </Link>
          ))}
        </div>
        <form method="get" action="/campaigns" className="flex flex-wrap items-center gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-600" />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Search campaigns…"
              aria-label="Search campaigns by name"
              className="w-56 rounded-md border border-white/10 bg-ink-900/70 py-2 pl-9 pr-3 text-sm text-ink-100 placeholder:text-ink-600 ring-focus"
            />
          </div>
          <button
            type="submit"
            className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-200 hover:bg-white/[0.06] hover:text-white ring-focus"
          >
            Apply
          </button>
        </form>
      </div>

      {page.items.length === 0 ? (
        <div className="surface p-10 text-center text-sm text-ink-400">No campaigns match.</div>
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-widest text-ink-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium">Budget</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((c) => (
                <tr key={c.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{c.name}</p>
                    {c.goal && <p className="mt-0.5 text-xs text-ink-500 line-clamp-1">{c.goal}</p>}
                  </td>
                  <td className="px-4 py-3"><ChannelBadge channel={c.channel} /></td>
                  <td className="px-4 py-3"><CampaignStatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-300">
                    {formatDate(c.startDate)} → {formatDate(c.endDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-300">{formatBudget(c.budgetUsd)}</td>
                  <td className="px-4 py-3">
                    <CampaignActions campaign={c} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-ink-500">{page.total} campaign{page.total === 1 ? '' : 's'}</p>
    </Shell>
  );
}
