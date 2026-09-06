export type HistoryItem = {
  at: number;
  tool: 'names' | 'coin' | 'yesno' | 'action';
  result: string;
  reroll?: boolean;
};

const KEY = 'jml-kit-v1';

export function loadHistory(): HistoryItem[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
  } catch {
    return [];
  }
}

export function saveHistory(item: HistoryItem) {
  const next = [item, ...loadHistory()].slice(0, 20);
  window.localStorage.setItem(KEY, JSON.stringify(next));
}
