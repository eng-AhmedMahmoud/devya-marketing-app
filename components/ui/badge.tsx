import { cn } from '@/lib/utils';
import type {
  CampaignChannel,
  CampaignStatus,
  OutreachStatus,
  OutreachType,
  PostPlatform,
  PostStatus,
} from '@/lib/api';

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'yellow';
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: 'border-white/10 bg-white/[0.04] text-ink-300',
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    orange: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
    red: 'border-red-500/30 bg-red-500/10 text-red-300',
    purple: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
    yellow: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const label = (s: string) => s.replace(/_/g, ' ').toLowerCase();

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const tone = { PLANNED: 'neutral', ACTIVE: 'green', PAUSED: 'yellow', COMPLETED: 'blue' } as const;
  return <Badge tone={tone[status]}>{label(status)}</Badge>;
}

export function ChannelBadge({ channel }: { channel: CampaignChannel }) {
  const tone = {
    SOCIAL: 'blue', EMAIL: 'purple', ADS: 'orange', CONTENT: 'green', EVENT: 'yellow', OTHER: 'neutral',
  } as const;
  return <Badge tone={tone[channel]}>{label(channel)}</Badge>;
}

export function PostStatusBadge({ status }: { status: PostStatus }) {
  const tone = { DRAFT: 'neutral', SCHEDULED: 'yellow', PUBLISHED: 'green', CANCELLED: 'red' } as const;
  return <Badge tone={tone[status]}>{label(status)}</Badge>;
}

export function PlatformBadge({ platform }: { platform: PostPlatform }) {
  const tone = {
    INSTAGRAM: 'purple', LINKEDIN: 'blue', X: 'neutral', FACEBOOK: 'blue', TIKTOK: 'red', YOUTUBE: 'red',
  } as const;
  return <Badge tone={tone[platform]}>{platform === 'X' ? 'X' : label(platform)}</Badge>;
}

export function OutreachStatusBadge({ status }: { status: OutreachStatus }) {
  const tone = {
    PLANNED: 'neutral', CONTACTED: 'yellow', IN_PROGRESS: 'blue', PUBLISHED: 'green', DECLINED: 'red',
  } as const;
  return <Badge tone={tone[status]}>{label(status)}</Badge>;
}

export function OutreachTypeBadge({ type }: { type: OutreachType }) {
  const tone = {
    PRESS: 'blue', REVIEW_DIRECTORY: 'green', BACKLINK: 'purple', PODCAST: 'orange', AWARD: 'yellow', OTHER: 'neutral',
  } as const;
  return <Badge tone={tone[type]}>{label(type)}</Badge>;
}
