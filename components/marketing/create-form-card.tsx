'use client';

import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Shared input styling for the create forms (mirrors pm-app's create-form-card). */
export const FIELD =
  'w-full rounded-md border border-white/10 bg-ink-900/70 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 ring-focus';
export const LABEL = 'mb-1.5 block text-[11px] uppercase tracking-widest text-ink-500';

export function CreateFormCard({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="surface mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-ink-100 ring-focus"
      >
        <span className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4 text-ink-400" />
          {label}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-ink-500 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="border-t border-white/[0.06] px-5 py-4">{children}</div>}
    </div>
  );
}

export function SubmitButton({ pending, disabled, children }: { pending: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex items-center gap-2 rounded-md bg-white px-3.5 py-2 text-sm font-medium text-ink-900 hover:bg-ink-100 ring-focus disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export interface CampaignOption {
  id: string;
  name: string;
}

export function CampaignSelect({
  campaigns,
  value,
  onChange,
  id,
  optional,
}: {
  campaigns: CampaignOption[];
  value: string;
  onChange: (v: string) => void;
  id: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        Campaign {optional && <span className="text-ink-600 normal-case">(optional)</span>}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} required={!optional} className={FIELD}>
        {optional ? <option value="">No campaign</option> : (
          <option value="" disabled>
            Select campaign…
          </option>
        )}
        {campaigns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

/** ISO string → value usable in an <input type="datetime-local"> (local time). */
export function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** ISO string → value usable in an <input type="date">. */
export function toDateInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local input value ('' allowed) → ISO string or null. */
export function toIsoOrNull(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
