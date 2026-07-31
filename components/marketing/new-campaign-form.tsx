'use client';

import { CampaignForm } from './campaign-form';
import { CreateFormCard } from './create-form-card';

export function NewCampaignForm() {
  return (
    <CreateFormCard label="New campaign">
      <CampaignForm />
    </CreateFormCard>
  );
}
