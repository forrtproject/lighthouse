import { CheckCircle, MinusCircle, Warning, XCircle } from '@phosphor-icons/react';
import type { Tone } from '../lib/signals';

const ICON = { good: CheckCircle, warn: Warning, bad: XCircle, none: MinusCircle } as const;
const WORD = { good: 'Good', warn: 'Caution', bad: 'Concern', none: 'No evidence' } as const;

/** Status icon in the tone's colour. Decorative when a visible word sits beside it. */
export function ToneIcon({ tone, size = 18, label }: { tone: Tone; size?: number; label?: boolean }) {
  const I = ICON[tone];
  return (
    <span className={`tone-icon t-${tone}`}>
      <I size={size} weight="fill" aria-hidden="true" />
      {label && <span className="visually-hidden">{WORD[tone]}</span>}
    </span>
  );
}

/** Icon + verdict word: status is never carried by colour alone. */
export function Verdict({ tone, children }: { tone: Tone; children: string }) {
  return <span className={`verdict t-${tone}`}><ToneIcon tone={tone} size={16} />{children}</span>;
}
