'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import {
  CalendarClock,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Newspaper,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, type AdminUser } from '@/lib/api';
import { appConfig } from '@/lib/config';
import { canAccess, type Section } from '@/lib/roles';
import { DevyaLogo } from './devya-logo';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Section this link belongs to; undefined = visible to every signed-in role. */
  section?: Section;
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Overview',
    items: [{ href: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    section: 'Marketing',
    items: [
      { href: '/campaigns', label: 'Campaigns', icon: Megaphone, section: 'campaigns' },
      { href: '/posts', label: 'Posts', icon: CalendarClock, section: 'posts' },
    ],
  },
  {
    section: 'Public Relations',
    items: [{ href: '/pr', label: 'PR Outreach', icon: Newspaper, section: 'pr' }],
  },
];

const TOOLS: { href: string; label: string }[] = [
  { href: appConfig.adminUrl, label: 'Admin' },
  { href: appConfig.tasksUrl, label: 'Tasks' },
  { href: appConfig.contractsUrl, label: 'Contracts' },
  { href: appConfig.salesUrl, label: 'Sales' },
];

let mePromise: Promise<{ user: AdminUser }> | null = null;

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ring-focus',
        active ? 'bg-white/[0.06] text-white' : 'text-ink-400 hover:text-ink-200 hover:bg-white/[0.03]',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<AdminUser | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    mePromise ??= api.me();
    mePromise.then(({ user }) => setMe(user)).catch(() => setMe(null));
  }, []);

  function handleLogout() {
    startTransition(async () => {
      try {
        await api.logout();
      } finally {
        mePromise = null;
        router.push('/login');
      }
    });
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  const visibleGroups = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.section || canAccess(me?.role, item.section)),
  })).filter((group) => group.items.length > 0);

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-white/[0.06] bg-ink-950/60 backdrop-blur-sm">
      <div className="px-5 pt-6 pb-4 flex items-center gap-2">
        <Link href="/" className="ring-focus rounded-md">
          <DevyaLogo width={104} />
        </Link>
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-300">
          Marketing
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.section}>
            <p className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-widest text-ink-500">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item.href)} />
              ))}
            </div>
          </div>
        ))}

        <div>
          <p className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-widest text-ink-500">Tools</p>
          <div className="space-y-0.5">
            {TOOLS.map((tool) => (
              <a
                key={tool.label}
                href={tool.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-ink-400 hover:text-ink-200 hover:bg-white/[0.03] transition-colors ring-focus"
              >
                {tool.label}
                <ExternalLink className="h-3.5 w-3.5 text-ink-600" />
              </a>
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-white/[0.06] p-4">
        {me && (
          <div className="mb-3 px-1">
            <p className="text-sm text-ink-200 truncate">{me.name ?? me.email}</p>
            <p className="text-[11px] text-ink-500 uppercase tracking-wider">{me.role.replace(/_/g, ' ')}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          disabled={pending}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-400 hover:text-white hover:bg-white/[0.04] transition-colors ring-focus disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {pending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
