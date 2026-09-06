import type { DrawRecord, RecentReport } from './types';

const REPORTS_KEY = 'jml-reports-v1';
const DRAWS_KEY = 'jml-draws-v1';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadRecentReports(): RecentReport[] {
  return readJson<RecentReport[]>(REPORTS_KEY, []).slice(0, 8);
}

export function saveRecentReport(entry: RecentReport) {
  const next = [entry, ...loadRecentReports().filter((item) => item.id !== entry.id)].slice(0, 8);
  window.localStorage.setItem(REPORTS_KEY, JSON.stringify(next));
}

export function loadDraws(): DrawRecord[] {
  return readJson<DrawRecord[]>(DRAWS_KEY, []).slice(0, 12);
}

export function saveDraw(entry: DrawRecord) {
  const next = [entry, ...loadDraws()].slice(0, 12);
  window.localStorage.setItem(DRAWS_KEY, JSON.stringify(next));
}
