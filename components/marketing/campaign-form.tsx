'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Save } from 'lucide-react';
import { api, ApiError, type CampaignChannel, type CampaignStatus, type MarketingCampaign } from '@/lib/api';
import { FIELD, LABEL, SubmitButton, toDateInput, toIsoOrNull } from './create-form-card';

export const CHANNELS: CampaignChannel[] = ['SOCIAL', 'EMAIL', 'ADS', 'CONTENT', 'EVENT', 'OTHER'];
export const CAMPAIGN_STATUSES: CampaignStatus[] = ['PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED'];

export function CampaignForm({
  initial,
  onSaved,
}: {
  initial?: MarketingCampaign;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [channel, setChannel] = useState<CampaignChannel>(initial?.channel ?? 'SOCIAL');
  const [status, setStatus] = useState<CampaignStatus>(initial?.status ?? 'PLANNED');
  const [goal, setGoal] = useState(initial?.goal ?? '');
  const [startDate, setStartDate] = useState(toDateInput(initial?.startDate));
  const [endDate, setEndDate] = useState(toDateInput(initial?.endDate));
  const [budgetUsd, setBudgetUsd] = useState(initial?.budgetUsd ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isEdit = Boolean(initial);
  const uid = initial?.id ?? 'new';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const body = {
          name: name.trim(),
          channel,
          status,
          goal: goal.trim() || null,
          startDate: toIsoOrNull(startDate),
          endDate: toIsoOrNull(endDate),
          budgetUsd: budgetUsd.trim() || null,
          notes: notes.trim() || null,
        };
        if (initial) {
          await api.updateCampaign(initial.id, body);
        } else {
          await api.createCampaign(body);
          setName('');
          setGoal('');
          setStartDate('');
          setEndDate('');
          setBudgetUsd('');
          setNotes('');
          setChannel('SOCIAL');
          setStatus('PLANNED');
        }
        router.refresh();
        onSaved?.();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to save campaign');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2">
        <label htmlFor={`camp-name-${uid}`} className={LABEL}>Name</label>
        <input
          id={`camp-name-${uid}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={160}
          placeholder="Q3 LinkedIn push"
          className={FIELD}
        />
      </div>
      <div>
        <label htmlFor={`camp-channel-${uid}`} className={LABEL}>Channel</label>
        <select id={`camp-channel-${uid}`} value={channel} onChange={(e) => setChannel(e.target.value as CampaignChannel)} className={FIELD}>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`camp-status-${uid}`} className={LABEL}>Status</label>
        <select id={`camp-status-${uid}`} value={status} onChange={(e) => setStatus(e.target.value as CampaignStatus)} className={FIELD}>
          {CAMPAIGN_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`camp-goal-${uid}`} className={LABEL}>
          Goal <span className="text-ink-600 normal-case">(optional)</span>
        </label>
        <input
          id={`camp-goal-${uid}`}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          maxLength={300}
          placeholder="200 qualified visits / week"
          className={FIELD}
        />
      </div>
      <div>
        <label htmlFor={`camp-start-${uid}`} className={LABEL}>
          Start <span className="text-ink-600 normal-case">(optional)</span>
        </label>
        <input id={`camp-start-${uid}`} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={FIELD} />
      </div>
      <div>
        <label htmlFor={`camp-end-${uid}`} className={LABEL}>
          End <span className="text-ink-600 normal-case">(optional)</span>
        </label>
        <input id={`camp-end-${uid}`} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={FIELD} />
      </div>
      <div>
        <label htmlFor={`camp-budget-${uid}`} className={LABEL}>
          Budget USD <span className="text-ink-600 normal-case">(optional)</span>
        </label>
        <input
          id={`camp-budget-${uid}`}
          type="number"
          min="0"
          step="0.01"
          value={budgetUsd}
          onChange={(e) => setBudgetUsd(e.target.value)}
          placeholder="500"
          className={FIELD}
        />
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <label htmlFor={`camp-notes-${uid}`} className={LABEL}>
          Notes <span className="text-ink-600 normal-case">(optional)</span>
        </label>
        <textarea id={`camp-notes-${uid}`} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={FIELD} />
      </div>

      <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
        <SubmitButton pending={pending} disabled={!name.trim()}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isEdit ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {isEdit ? 'Save changes' : 'Create campaign'}
        </SubmitButton>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </form>
  );
}
