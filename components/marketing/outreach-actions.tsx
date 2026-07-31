'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { api, ApiError, type OutreachStatus, type PrOutreach } from '@/lib/api';
import { Modal } from '@/components/ui/modal';
import { useDialog } from '@/components/ui/dialog-provider';
import { OutreachForm, OUTREACH_STATUSES } from './outreach-form';

export function OutreachActions({ item }: { item: PrOutreach }) {
  const router = useRouter();
  const { confirm } = useDialog();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleStatusChange(status: OutreachStatus) {
    if (status === item.status) return;
    setError(null);
    startTransition(async () => {
      try {
        // Moving to CONTACTED implies we just reached out — stamp lastContactAt.
        const body: Record<string, unknown> = { status };
        if (status === 'CONTACTED') body.lastContactAt = new Date().toISOString();
        await api.updateOutreach(item.id, body);
        router.refresh();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to update status');
      }
    });
  }

  async function handleDelete() {
    const ok = await confirm({
      title: `Delete "${item.targetName}"?`,
      message: 'This permanently removes the outreach item and its history.',
      confirmLabel: 'Delete item',
      tone: 'danger',
    });
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      try {
        await api.deleteOutreach(item.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to delete item');
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <label className="sr-only" htmlFor={`pr-status-inline-${item.id}`}>
        Change status
      </label>
      <select
        id={`pr-status-inline-${item.id}`}
        value={item.status}
        disabled={pending}
        onChange={(e) => handleStatusChange(e.target.value as OutreachStatus)}
        className="rounded-md border border-white/10 bg-ink-900/70 px-2 py-1.5 text-xs text-ink-200 ring-focus disabled:opacity-50"
      >
        {OUTREACH_STATUSES.map((s) => (
          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-md p-1.5 text-ink-400 hover:bg-white/[0.06] hover:text-white ring-focus"
        aria-label={`Edit ${item.targetName}`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="rounded-md p-1.5 text-ink-400 hover:bg-red-500/10 hover:text-red-300 ring-focus disabled:opacity-50"
        aria-label={`Delete ${item.targetName}`}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit outreach" subtitle={item.targetName} wide>
        <OutreachForm initial={item} onSaved={() => setEditing(false)} />
      </Modal>
    </div>
  );
}
