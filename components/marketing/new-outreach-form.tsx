'use client';

import { OutreachForm } from './outreach-form';
import { CreateFormCard } from './create-form-card';

export function NewOutreachForm() {
  return (
    <CreateFormCard label="New outreach">
      <OutreachForm />
    </CreateFormCard>
  );
}
