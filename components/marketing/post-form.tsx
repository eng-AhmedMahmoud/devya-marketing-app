'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Save, Sparkles } from 'lucide-react';
import { api, ApiError, type PostPlatform, type SocialPost } from '@/lib/api';
import { CampaignSelect, FIELD, LABEL, SubmitButton, toDatetimeLocal, toIsoOrNull, type CampaignOption } from './create-form-card';

export const PLATFORMS: PostPlatform[] = ['INSTAGRAM', 'LINKEDIN', 'X', 'FACEBOOK', 'TIKTOK', 'YOUTUBE'];

export function PostForm({
  campaigns,
  initial,
  onSaved,
}: {
  campaigns: CampaignOption[];
  initial?: SocialPost;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [campaignId, setCampaignId] = useState(initial?.campaignId ?? '');
  const [platform, setPlatform] = useState<PostPlatform>(initial?.platform ?? 'INSTAGRAM');
  const [scheduledAt, setScheduledAt] = useState(toDatetimeLocal(initial?.scheduledAt));
  const [copyEn, setCopyEn] = useState(initial?.copyEn ?? '');
  const [copyAr, setCopyAr] = useState(initial?.copyAr ?? '');
  const [mediaUrl, setMediaUrl] = useState(initial?.mediaUrl ?? '');
  const [link, setLink] = useState(initial?.link ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [aiTopic, setAiTopic] = useState('');
  const [aiPending, setAiPending] = useState(false);

  const isEdit = Boolean(initial);
  const uid = initial?.id ?? 'new';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const body = {
          campaignId: campaignId || null,
          platform,
          scheduledAt: toIsoOrNull(scheduledAt),
          copyEn: copyEn.trim() || null,
          copyAr: copyAr.trim() || null,
          mediaUrl: mediaUrl.trim() || null,
          link: link.trim() || null,
          notes: notes.trim() || null,
        };
        if (initial) {
          await api.updatePost(initial.id, body);
        } else {
          await api.createPost(body);
          setCampaignId('');
          setPlatform('INSTAGRAM');
          setScheduledAt('');
          setCopyEn('');
          setCopyAr('');
          setMediaUrl('');
          setLink('');
          setNotes('');
        }
        router.refresh();
        onSaved?.();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to save post');
      }
    });
  }

  async function generateWithAi() {
    if (!aiTopic.trim()) {
      setError('Give the AI a topic first');
      return;
    }
    if (
      (copyEn.trim() || copyAr.trim()) &&
      !window.confirm('Overwrite the existing copy with an AI draft?')
    ) {
      return;
    }
    setError(null);
    setAiPending(true);
    try {
      const draft = await api.draftPostAi({
        topic: aiTopic.trim(),
        platform,
        notes: notes.trim() || undefined,
      });
      setCopyEn(draft.hashtags.length > 0 ? `${draft.copyEn}\n\n${draft.hashtags.join(' ')}` : draft.copyEn);
      setCopyAr(draft.copyAr);
      setAiTopic('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'AI draft failed');
    } finally {
      setAiPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <CampaignSelect id={`post-campaign-${uid}`} campaigns={campaigns} value={campaignId} onChange={setCampaignId} optional />
      <div>
        <label htmlFor={`post-platform-${uid}`} className={LABEL}>Platform</label>
        <select id={`post-platform-${uid}`} value={platform} onChange={(e) => setPlatform(e.target.value as PostPlatform)} className={FIELD}>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`post-scheduled-${uid}`} className={LABEL}>
          Scheduled at <span className="text-ink-600 normal-case">(optional)</span>
        </label>
        <input
          id={`post-scheduled-${uid}`}
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className={FIELD}
        />
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <label htmlFor={`post-ai-topic-${uid}`} className={LABEL}>
          AI draft <span className="text-ink-600 normal-case">(topic → EN + AR copy)</span>
        </label>
        <div className="flex gap-2">
          <input
            id={`post-ai-topic-${uid}`}
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            placeholder="e.g. launch of the Devya Converse product page"
            className={FIELD}
          />
          <button
            type="button"
            onClick={generateWithAi}
            disabled={aiPending}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-ink-100 hover:bg-white/[0.08] disabled:opacity-50"
          >
            {aiPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate
          </button>
        </div>
      </div>
      <div className="sm:col-span-2 lg:col-span-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`post-copy-en-${uid}`} className={LABEL}>Copy (EN)</label>
          <textarea
            id={`post-copy-en-${uid}`}
            value={copyEn}
            onChange={(e) => setCopyEn(e.target.value)}
            rows={4}
            placeholder="English caption…"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor={`post-copy-ar-${uid}`} className={LABEL}>Copy (AR)</label>
          <textarea
            id={`post-copy-ar-${uid}`}
            value={copyAr}
            onChange={(e) => setCopyAr(e.target.value)}
            rows={4}
            dir="rtl"
            placeholder="النص العربي…"
            className={FIELD}
          />
        </div>
      </div>
      <div>
        <label htmlFor={`post-media-${uid}`} className={LABEL}>
          Media URL <span className="text-ink-600 normal-case">(optional)</span>
        </label>
        <input
          id={`post-media-${uid}`}
          type="url"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          placeholder="https://…"
          className={FIELD}
        />
      </div>
      <div>
        <label htmlFor={`post-link-${uid}`} className={LABEL}>
          Link <span className="text-ink-600 normal-case">(optional)</span>
        </label>
        <input
          id={`post-link-${uid}`}
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://www.devya.dev/…"
          className={FIELD}
        />
      </div>
      <div>
        <label htmlFor={`post-notes-${uid}`} className={LABEL}>
          Notes <span className="text-ink-600 normal-case">(optional)</span>
        </label>
        <input id={`post-notes-${uid}`} value={notes} onChange={(e) => setNotes(e.target.value)} className={FIELD} />
      </div>

      <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3">
        <SubmitButton pending={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isEdit ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {isEdit ? 'Save changes' : 'Create draft'}
        </SubmitButton>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </form>
  );
}
