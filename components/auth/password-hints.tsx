'use client';

import { Check } from 'lucide-react';

interface PasswordRule {
  id: string;
  label: string;
  test: (pw: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', label: '12–128 characters', test: (pw) => pw.length >= 12 && pw.length <= 128 },
  { id: 'lower', label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { id: 'upper', label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'digit', label: 'One digit', test: (pw) => /\d/.test(pw) },
];

export function passwordMeetsPolicy(pw: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(pw));
}

export function PasswordHints({ value }: { value: string }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-emerald-300' : 'text-ink-500'}`}
          >
            <Check className={`h-3 w-3 shrink-0 ${ok ? '' : 'opacity-40'}`} />
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
