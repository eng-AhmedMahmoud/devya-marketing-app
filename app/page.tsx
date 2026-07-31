import Link from 'next/link';
import { ArrowRight, CalendarClock, Megaphone, Newspaper } from 'lucide-react';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { api, ApiError } from '@/lib/api';
import { requireUser } from '@/lib/guard';
import { canAccess } from '@/lib/roles';

export const dynamic = 'force-dynamic';

/** Returns the total for a paged fetch, or null when the role lacks access (403). */
async function tryTotal(fetcher: () => Promise<{ total: number }>): Promise<number | null> {
  try {
    const { total } = await fetcher();
    return total;
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return null;
    throw err;
  }
}

const OPEN_PR_STATUSES = ['PLANNED', 'CONTACTED', 'IN_PROGRESS'] as const;

export default async function DashboardPage() {
  const { cookieHeader, user } = await requireUser();

  const [activeCampaigns, scheduledPosts, openPr] = await Promise.all([
    canAccess(user.role, 'campaigns')
      ? tryTotal(() => api.campaigns({ status: 'ACTIVE', pageSize: 1 }, cookieHeader))
      : Promise.resolve(null),
    canAccess(user.role, 'posts')
      ? tryTotal(() => api.posts({ status: 'SCHEDULED', pageSize: 1 }, cookieHeader))
      : Promise.resolve(null),
    canAccess(user.role, 'pr')
      ? (async () => {
          const totals = await Promise.all(
            OPEN_PR_STATUSES.map((status) => tryTotal(() => api.outreach({ status, pageSize: 1 }, cookieHeader))),
          );
          if (totals.every((t) => t === null)) return null;
          return totals.reduce<number>((sum, t) => sum + (t ?? 0), 0);
        })()
      : Promise.resolve(null),
  ]);

  const firstName = (user.name ?? user.email).split(/[\s@]/)[0];

  const quickLinks = [
    {
      href: '/campaigns',
      label: 'Campaigns',
      description: 'Plan and track marketing campaigns across every channel.',
      icon: Megaphone,
      visible: canAccess(user.role, 'campaigns'),
    },
    {
      href: '/posts',
      label: 'Posts',
      description: 'The social content calendar — drafts, scheduled and published.',
      icon: CalendarClock,
      visible: canAccess(user.role, 'posts'),
    },
    {
      href: '/pr',
      label: 'PR Outreach',
      description: 'Press, directories, backlinks, podcasts and awards.',
      icon: Newspaper,
      visible: canAccess(user.role, 'pr'),
    },
  ].filter((l) => l.visible);

  return (
    <Shell>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="Marketing & PR at a glance — campaigns, the content calendar and press outreach."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {activeCampaigns !== null && (
          <StatCard label="Active campaigns" value={activeCampaigns} hint="running right now" />
        )}
        {scheduledPosts !== null && (
          <StatCard label="Scheduled posts" value={scheduledPosts} hint="queued to publish" />
        )}
        {openPr !== null && <StatCard label="Open PR items" value={openPr} hint="planned · contacted · in progress" />}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="surface-strong block p-5 hover:border-white/20 transition-colors ring-focus"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                  <Icon className="h-4 w-4 text-ink-300" />
                </span>
                <ArrowRight className="h-4 w-4 text-ink-600" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-white">{link.label}</h2>
              <p className="mt-1 text-sm text-ink-400">{link.description}</p>
            </Link>
          );
        })}
      </div>
    </Shell>
  );
}
