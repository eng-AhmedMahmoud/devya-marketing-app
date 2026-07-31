'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { api, ApiError, type CampaignStatus, type MarketingCampaign } from '@/lib/api';
import { Modal } from '@/components/ui/modal';
import { useDialog } from '@/components/ui/dialog-provider';
import { CampaignForm, CAMPAIGN_STATUSES } from './campaign-form';

export function CampaignActions({ campaign }: { campaign: MarketingCampaign }) {
  const router = useRouter();
  const { confirm } = useDialog();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleStatusChange(status: CampaignStatus) {
    if (status === campaign.status) return;
    setError(null);
    startTransition(async () => {
      try {
        await api.updateCampaign(campaign.id, { status });
        router.refresh();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to update status');
      }
    });
  }

  async function handleDelete() {
    const ok = await confirm({
      title: `Delete "${campaign.name}"?`,
      message: 'This permanently removes the campaign. Posts linked to it will keep running without one.',
      confirmLabel: 'Delete campaign',
      tone: 'danger',
    });
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      try {
        await api.deleteCampaign(campaign.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to delete campaign');
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <label className="sr-only" htmlFor={`camp-status-inline-${campaign.id}`}>
        Change status
      </label>
      <select
        id={`camp-status-inline-${campaign.id}`}
        value={campaign.status}
        disabled={pending}
        onChange={(e) => handleStatusChange(e.target.value as CampaignStatus)}
        className="rounded-md border border-white/10 bg-ink-900/70 px-2 py-1.5 text-xs text-ink-200 ring-focus disabled:opacity-50"
      >
        {CAMPAIGN_STATUSES.map((s) => (
          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-md p-1.5 text-ink-400 hover:bg-white/[0.06] hover:text-white ring-focus"
        aria-label={`Edit ${campaign.name}`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="rounded-md p-1.5 text-ink-400 hover:bg-red-500/10 hover:text-red-300 ring-focus disabled:opacity-50"
        aria-label={`Delete ${campaign.name}`}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit campaign" subtitle={campaign.name} wide>
        <CampaignForm initial={campaign} onSaved={() => setEditing(false)} />
      </Modal>
    </div>
  );
}
