import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ExternalLink, Search } from 'lucide-react';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { OutreachStatusBadge, OutreachTypeBadge } from '@/components/ui/badge';
import { NewOutreachForm } from '@/components/marketing/new-outreach-form';
import { OutreachActions } from '@/components/marketing/outreach-actions';
import { cn } from '@/lib/utils';
import { api, ApiError, type Paged, type PrOutreach } from '@/lib/api';
import { requireSection } from '@/lib/guard';

export const dynamic = 'force-dynamic';

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_CHIPS = [
  { value: '', label: 'All' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DECLINED', label: 'Declined' },
] as const;

const TYPES = ['', 'PRESS', 'REVIEW_DIRECTORY', 'BACKLINK', 'PODCAST', 'AWARD', 'OTHER'] as const;

const chipCls = 'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ring-focus';
const chipActiveCls = 'surface-strong border-blue-500/40 text-white';
const chipIdleCls = 'border-white/10 bg-white/[0.03] text-ink-300 hover:bg-white/[0.06] hover:text-white';

export default async function PrPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { cookieHeader } = await requireSection('pr');
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? '') : (v ?? ''));

  const rawStatus = one(sp.status);
  const status = STATUS_CHIPS.some((c) => c.value === rawStatus) ? rawStatus : '';
  const rawType = one(sp.type);
  const type = (TYPES as readonly string[]).includes(rawType) ? rawType : '';
  const search = one(sp.q).trim();

  let page: Paged<PrOutreach>;
  try {
    page = await api.outreach(
      { pageSize: 100, status: status || undefined, type: type || undefined, search: search || undefined },
      cookieHeader,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    if (err instanceof ApiError && err.status === 403) redirect('/');
    throw err;
  }

  const buildHref = (s: string) => {
    const params = new URLSearchParams();
    if (s) params.set('status', s);
    if (type) params.set('type', type);
    if (search) params.set('q', search);
    const q = params.toString();
    return q ? `/pr?${q}` : '/pr';
  };

  return (
    <Shell>
      <PageHeader
        title="PR Outreach"
        subtitle="Press, review directories, backlinks, podcasts and awards — who we pitched and where it stands."
      />

      <NewOutreachForm />

      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_CHIPS.map((c) => (
            <Link key={c.value || 'all'} href={buildHref(c.value)} className={cn(chipCls, status === c.value ? chipActiveCls : chipIdleCls)}>
              {c.label}
            </Link>
          ))}
        </div>
        <form method="get" action="/pr" className="flex flex-wrap items-center gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-600" />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Search targets…"
              aria-label="Search outreach targets"
              className="w-56 rounded-md border border-white/10 bg-ink-900/70 py-2 pl-9 pr-3 text-sm text-ink-100 placeholder:text-ink-600 ring-focus"
            />
          </div>
          <select
            name="type"
            defaultValue={type}
            aria-label="Filter by type"
            className="rounded-md border border-white/10 bg-ink-900/70 px-3 py-2 text-sm text-ink-200 ring-focus"
          >
            {TYPES.map((t) => (
              <option key={t || 'all'} value={t}>
                {t ? t.replace(/_/g, ' ') : 'All types'}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-200 hover:bg-white/[0.06] hover:text-white ring-focus"
          >
            Apply
          </button>
        </form>
      </div>

      {page.items.length === 0 ? (
        <div className="surface p-10 text-center text-sm text-ink-400">No outreach items match.</div>
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-widest text-ink-500">
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">URL</th>
                <th className="px-4 py-3 font-medium">Last contact</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((item) => (
                <tr key={item.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{item.targetName}</p>
                    {item.notes && <p className="mt-0.5 text-xs text-ink-500 line-clamp-1">{item.notes}</p>}
                  </td>
                  <td className="px-4 py-3"><OutreachTypeBadge type={item.type} /></td>
                  <td className="px-4 py-3"><OutreachStatusBadge status={item.status} /></td>
                  <td className="px-4 py-3">
                    {item.contactName || item.contactEmail ? (
                      <div>
                        {item.contactName && <p className="text-ink-200">{item.contactName}</p>}
                        {item.contactEmail && (
                          <a href={`mailto:${item.contactEmail}`} className="text-xs text-blue-300 hover:text-blue-200 ring-focus rounded-md">
                            {item.contactEmail}
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-ink-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200 ring-focus rounded-md"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Link
                      </a>
                    ) : (
                      <span className="text-ink-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-300">{formatDate(item.lastContactAt)}</td>
                  <td className="px-4 py-3">
                    <OutreachActions item={item} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-ink-500">{page.total} outreach item{page.total === 1 ? '' : 's'}</p>
    </Shell>
  );
}
