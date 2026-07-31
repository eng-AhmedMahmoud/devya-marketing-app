'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, CalendarClock, CheckCircle2, Loader2, Pencil, Trash2 } from 'lucide-react';
import { api, ApiError, type SocialPost } from '@/lib/api';
import { Modal } from '@/components/ui/modal';
import { useDialog } from '@/components/ui/dialog-provider';
import { PostForm } from './post-form';
import type { CampaignOption } from './create-form-card';

const BTN =
  'inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-ink-200 hover:bg-white/[0.06] hover:text-white ring-focus disabled:opacity-50';

export function PostActions({ post, campaigns }: { post: SocialPost; campaigns: CampaignOption[] }) {
  const router = useRouter();
  const { confirm, notify } = useDialog();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function patch(body: Record<string, unknown>, fallback: string) {
    setError(null);
    startTransition(async () => {
      try {
        await api.updatePost(post.id, body);
        router.refresh();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : fallback);
      }
    });
  }

  async function handleSchedule() {
    if (!post.scheduledAt) {
      await notify({
        title: 'Set a schedule first',
        message: 'This draft has no scheduled date. Edit the post and pick a "Scheduled at" time before scheduling it.',
        tone: 'warn',
      });
      setEditing(true);
      return;
    }
    patch({ status: 'SCHEDULED' }, 'Failed to schedule post');
  }

  function handlePublish() {
    patch({ status: 'PUBLISHED', publishedAt: new Date().toISOString() }, 'Failed to mark post published');
  }

  async function handleCancel() {
    const ok = await confirm({
      title: 'Cancel this post?',
      message: 'The post is kept for reference but will not go out.',
      confirmLabel: 'Cancel post',
      cancelLabel: 'Keep',
      tone: 'warn',
    });
    if (!ok) return;
    patch({ status: 'CANCELLED' }, 'Failed to cancel post');
  }

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete this post?',
      message: 'This permanently removes the post and its copy.',
      confirmLabel: 'Delete post',
      tone: 'danger',
    });
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      try {
        await api.deletePost(post.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to delete post');
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {post.status === 'DRAFT' && (
        <button type="button" onClick={handleSchedule} disabled={pending} className={BTN}>
          <CalendarClock className="h-3.5 w-3.5" />
          Schedule
        </button>
      )}
      {post.status === 'SCHEDULED' && (
        <button type="button" onClick={handlePublish} disabled={pending} className={BTN}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Mark published
        </button>
      )}
      {(post.status === 'DRAFT' || post.status === 'SCHEDULED') && (
        <button type="button" onClick={handleCancel} disabled={pending} className={BTN}>
          <Ban className="h-3.5 w-3.5" />
          Cancel
        </button>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-md p-1.5 text-ink-400 hover:bg-white/[0.06] hover:text-white ring-focus"
        aria-label="Edit post"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="rounded-md p-1.5 text-ink-400 hover:bg-red-500/10 hover:text-red-300 ring-focus disabled:opacity-50"
        aria-label="Delete post"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
      {error && <p className="w-full text-right text-xs text-red-400">{error}</p>}

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit post" subtitle={post.platform} wide>
        <PostForm campaigns={campaigns} initial={post} onSaved={() => setEditing(false)} />
      </Modal>
    </div>
  );
}
