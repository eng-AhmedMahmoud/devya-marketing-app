'use client';

import { PostForm } from './post-form';
import { CreateFormCard, type CampaignOption } from './create-form-card';

export function NewPostForm({ campaigns }: { campaigns: CampaignOption[] }) {
  return (
    <CreateFormCard label="New post">
      <PostForm campaigns={campaigns} />
    </CreateFormCard>
  );
}
