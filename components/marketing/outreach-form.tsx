'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Save } from 'lucide-react';
import { api, ApiError, type OutreachStatus, type OutreachType, type PrOutreach } from '@/lib/api';
import { FIELD, LABEL, SubmitButton, toDatetimeLocal, toIsoOrNull } from './create-form-card';

export const OUTREACH_TYPES: OutreachType[] = ['PRESS', 'REVIEW_DIRECTORY', 'BACKLINK', 'PODCAST', 'AWARD', 'OTHER'];
export const OUTREACH_STATUSES: OutreachStatus[] = ['PLANNED', 'CONTACTED', 'IN_PROGRESS', 'PUBLISHED', 'DECLINED'];

export function OutreachForm({
  initial,
  onSaved,
}: {
  initial?: PrOutreach;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [targetName, setTargetName] = useState(initial?.targetName ?? '');
  const [type, setType] = useState<OutreachType>(initial?.type ?? 'PRESS');
  const [status, setStatus] = useState<OutreachStatus>(initial?.status ?? 'PLANNED');
  const [contactName, setContactName] = useState(initial?.contactName ?? '');
  const [contactEmail, setContactEmail] = useState(initial?.contactEmail ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [lastContactAt, setLastContactAt] = useState(toDatetimeLocal(initial?.lastContactAt));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isEdit = Boolean(initial);
  const uid = initial?.id ?? 'new';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!targetName.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const body = {
          targetName: targetName.trim(),
          type,
          status,
          contactName: contactName.trim() || null,
          contactEmail: contactEmail.trim() || null,
          url: url.trim() || null,
          lastContactAt: toIsoOrNull(lastContactAt),
          notes: notes.trim() || null,
        };
        if (initial) {
          await api.updateOutreach(initial.id, body);
        } else {
          await api.createOutreach(body);
          setTargetName('');
          setType('PRESS');
          setStatus('PLANNED');
          setContactName('');
          setContactEmail('');
          setUrl('');
          setLastContactAt('');
          setNotes('');
        }
        router.refresh();
        onSaved?.();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to save outreach item');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2">
        <label htmlFor={`pr-target-${uid}`} className={LABEL}>Target</label>
        <input
          id={`pr-target-${uid}`}
          value={targetName}
          onChange={(e) => setTargetName(e.target.value)}
          required
          maxLength={160}
          placeholder="TechCrunch, Clutch, The SaaS Podcast…"
          className={FIELD}
        />
      </div>
      <div>
        <label htmlFor={`pr-type-${uid}`} className={LABEL}>Type</label>
        <select id={`pr-type-${uid}`} value={type} onChange={(e) => setType(e.target.value as OutreachType)} className={FIELD}>
          {OUTREACH_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`pr-status-${uid}`} className={LABEL}>Status</label>
        <select id={`pr-status-${uid}`} value={status} onChange={(e) => setStatus(e.target.value as OutreachStatus)} className={FIELD}>
          {OUTREACH_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`pr-contact-name-${uid}`} className={LABEL}>
          Contact name <span className="text-ink-600 normal-case">(optional)</span>
        </label>
        <input id={`pr-contact-name-${uid}`} value={contactName} onChange={(e) => setContactName(e.target.value)} maxLength={120} className={FIELD} />
      </div>
      <div>
        <label htmlFor={`pr-contact-email-${uid}`} className={LABEL}>
          Contact email <span className="text-ink-600 normal-case">(optional)</span>
        </label>
        <input id={`pr-contact-email-${uid}`} type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={FIELD} />
      </div>
      <div>
        <label htmlFor={`pr-url-${uid}`} className={LABEL}>
          URL <span className="text-ink-600 normal-case">(optional)</span>
        </label>
        <input id={`pr-url-${uid}`} type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className={FIELD} />
      </div>
      <div>
        <label htmlFor={`pr-last-contact-${uid}`} className={LABEL}>
          Last contact <span className="text-ink-600 normal-case">(optional)</span>
        </label>
        <input
          id={`pr-last-contact-${uid}`}
          type="datetime-local"
          value={lastContactAt}
          onChange={(e) => setLastContactAt(e.target.value)}
          className={FIELD}
        />
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <label htmlFor={`pr-notes-${uid}`} className={LABEL}>
          Notes <span className="text-ink-600 normal-case">(optional)</span>
        </label>
        <textarea id={`pr-notes-${uid}`} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={FIELD} />
      </div>

      <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
        <SubmitButton pending={pending} disabled={!targetName.trim()}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isEdit ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {isEdit ? 'Save changes' : 'Add outreach'}
        </SubmitButton>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </form>
  );
}
