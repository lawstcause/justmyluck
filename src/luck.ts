// A running tally of every decision luck has made for this visitor.
// Lives in this browser only; everything still works if storage is blocked.

import { tallyOverride } from './atmosphere/lampState';

const KEY = 'jml:tally';
export const TALLY_EVENT = 'jml:tally';

export function getTally(): number {
  const forced = tallyOverride();
  if (forced !== null) return forced;
  try {
    const n = Number(window.localStorage.getItem(KEY));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export function recordPick() {
  const next = getTally() + 1;
  try {
    window.localStorage.setItem(KEY, String(next));
  } catch {
    /* private mode — the tally just won't persist */
  }
  window.dispatchEvent(new CustomEvent(TALLY_EVENT, { detail: next }));
}
