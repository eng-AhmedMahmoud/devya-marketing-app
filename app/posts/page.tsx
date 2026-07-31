import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { Shell } from '@/components/ui/shell';
import { PageHeader } from '@/components/ui/page-header';
import { PlatformBadge, PostStatusBadge } from '@/components/ui/badge';
import { NewPostForm } from '@/components/marketing/new-post-form';
import { PostActions } from '@/components/marketing/post-actions';
import { cn } from '@/lib/utils';
import { api, ApiError, type MarketingCampaign, type Paged, type SocialPost } from '@/lib/api';
import { requireSection } from '@/lib/guard';

export const dynamic = 'force-dynamic';

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function truncate(s: string | null | undefined, max = 90) {
  if (!s) return null;
  return s.length > max ? `${s.slice(0, max).trimEnd()}…` : s;
}

const STATUS_CHIPS = [
  { value: '', label: 'All' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

const GROUPS: Array<{ status: SocialPost['status']; title: string }> = [
  { status: 'SCHEDULED', title: 'Scheduled' },
  { status: 'DRAFT', title: 'Drafts' },
  { status: 'PUBLISHED', title: 'Published' },
  { status: 'CANCELLED', title: 'Cancelled' },
];

const chipCls = 'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ring-focus';
const chipActiveCls = 'surface-strong border-blue-500/40 text-white';
const chipIdleCls = 'border-white/10 bg-white/[0.03] text-ink-300 hover:bg-white/[0.06] hover:text-white';

function PostRow({ post, campaigns }: { post: SocialPost; campaigns: Array<{ id: string; name: string }> }) {
  const en = truncate(post.copyEn);
  const ar = truncate(post.copyAr);
  return (
    <div className="surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformBadge platform={post.platform} />
            <PostStatusBadge status={post.status} />
            {post.campaign && <span className="text-xs text-ink-400">{post.campaign.name}</span>}
          </div>
          <p className="mt-1.5 text-xs text-ink-500">
            {post.status === 'PUBLISHED'
              ? `Published ${formatDateTime(post.publishedAt)}`
              : post.scheduledAt
                ? `Scheduled ${formatDateTime(post.scheduledAt)}`
                : `Created ${formatDateTime(post.createdAt)}`}
          </p>
          {en && <p className="mt-2 text-sm text-ink-300">{en}</p>}
          {ar && (
            <p dir="rtl" className="mt-1 text-sm text-ink-400">
              {ar}
            </p>
          )}
          {post.link && (
            <a
              href={post.link}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[11px] text-blue-300 hover:text-blue-200 ring-focus rounded-md"
            >
              <ExternalLink className="h-3 w-3" />
              {post.link}
            </a>
          )}
        </div>
        <PostActions post={post} campaigns={campaigns} />
      </div>
    </div>
  );
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { cookieHeader } = await requireSection('posts');
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? '') : (v ?? ''));

  const rawStatus = one(sp.status);
  const status = STATUS_CHIPS.some((c) => c.value === rawStatus) ? rawStatus : '';
  const campaignId = one(sp.campaignId);

  let postsPage: Paged<SocialPost>;
  let campaignsPage: Paged<MarketingCampaign>;
  try {
    [postsPage, campaignsPage] = await Promise.all([
      api.posts({ pageSize: 200, status: status || undefined, campaignId: campaignId || undefined }, cookieHeader),
      api.campaigns({ pageSize: 100 }, cookieHeader),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    if (err instanceof ApiError && err.status === 403) redirect('/');
    throw err;
  }

  const campaignOptions = campaignsPage.items.map((c) => ({ id: c.id, name: c.name }));

  const byScheduledAsc = (a: SocialPost, b: SocialPost) =>
    (a.scheduledAt ?? '9999').localeCompare(b.scheduledAt ?? '9999');
  const byCreatedDesc = (a: SocialPost, b: SocialPost) => b.createdAt.localeCompare(a.createdAt);

  const groups = GROUPS.map((g) => ({
    ...g,
    posts: postsPage.items
      .filter((p) => p.status === g.status)
      .sort(g.status === 'SCHEDULED' ? byScheduledAsc : byCreatedDesc),
  })).filter((g) => g.posts.length > 0);

  const buildHref = (s: string) => {
    const params = new URLSearchParams();
    if (s) params.set('status', s);
    if (campaignId) params.set('campaignId', campaignId);
    const q = params.toString();
    return q ? `/posts?${q}` : '/posts';
  };

  return (
    <Shell>
      <PageHeader
        title="Posts"
        subtitle="The social content calendar — what goes out, where, and when."
        actions={
          <form method="get" action="/posts" className="flex items-center gap-2">
            {status && <input type="hidden" name="status" value={status} />}
            <select
              name="campaignId"
              defaultValue={campaignId}
              className="rounded-md border border-white/10 bg-ink-900/70 px-3 py-2 text-sm text-ink-200 ring-focus"
            >
              <option value="">All campaigns</option>
              {campaignOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-200 hover:bg-white/[0.06] ring-focus"
            >
              Filter
            </button>
          </form>
        }
      />

      <NewPostForm campaigns={campaignOptions} />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {STATUS_CHIPS.map((c) => (
          <Link key={c.value || 'all'} href={buildHref(c.value)} className={cn(chipCls, status === c.value ? chipActiveCls : chipIdleCls)}>
            {c.label}
          </Link>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="surface p-10 text-center text-sm text-ink-400">No posts yet — create the first draft above.</div>
      ) : (
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g.status}>
              <h2 className="mb-4 text-[11px] font-medium uppercase tracking-widest text-ink-500">
                {g.title} · {g.posts.length}
              </h2>
              <div className="space-y-3">
                {g.posts.map((p) => (
                  <PostRow key={p.id} post={p} campaigns={campaignOptions} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Shell>
  );
}
