export function randomIndex(count: number): number {
  if (count <= 0) throw new Error('empty hat');
  const max = 0x1_0000_0000;
  const limit = max - (max % count);
  const buf = new Uint32Array(1);
  let value = 0;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % count;
}

export function pickOne<T>(items: readonly T[]): T {
  return items[randomIndex(items.length)];
}

export function parseList(raw: string): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const line of raw.split(/\n/)) {
    const item = line.trim();
    if (!item) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(item);
  }
  return items;
}
