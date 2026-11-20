import { useState } from 'react';
import { playTap } from '../sound';
import { shareCard, type ShareCard } from './card';

type Props = { card: ShareCard; className?: string };

export function ShareButton({ card, className = '' }: Props) {
  const [state, setState] = useState<'idle' | 'busy' | 'saved'>('idle');

  async function onClick() {
    if (state === 'busy') return;
    playTap();
    setState('busy');
    const outcome = await shareCard(card);
    setState(outcome === 'saved' ? 'saved' : 'idle');
    if (outcome === 'saved') window.setTimeout(() => setState('idle'), 2200);
  }

  return (
    <button className={`share-btn ${className}`} disabled={state === 'busy'} onClick={onClick} type="button">
      {state === 'busy' ? 'Developing…' : state === 'saved' ? 'Saved ✓' : 'Show someone ↗'}
    </button>
  );
}
