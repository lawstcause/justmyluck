export const TICKER_COLS = 24;
export const TICKER_ROWS = 3;
export const TICKER_GLYPHS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?'-";

export function sanitizeTicker(text: string): string {
  return text
    .toUpperCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^A-Z0-9 .,!?'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function centerLine(line: string, cols: number): string {
  const clipped = line.slice(0, cols);
  const pad = cols - clipped.length;
  const left = Math.floor(pad / 2);
  return clipped.padStart(left + clipped.length, ' ').padEnd(cols, ' ');
}

function wrapWords(text: string, cols: number, rows: number): string[] {
  const words = text.split(' ').filter(Boolean);
  const lines: string[] = [];
  let current = '';

  const push = (line: string) => {
    if (line) lines.push(line);
  };

  for (const word of words) {
    if (word.length > cols) {
      push(current);
      current = '';
      let rest = word;
      while (rest.length > cols) {
        lines.push(rest.slice(0, cols));
        rest = rest.slice(cols);
      }
      current = rest;
      continue;
    }
    const next = current ? `${current} ${word}` : word;
    if (next.length <= cols) {
      current = next;
    } else {
      push(current);
      current = word;
    }
  }
  push(current);

  if (lines.length > rows) {
    const head = lines.slice(0, rows - 1);
    const tail = lines.slice(rows - 1).join(' ').slice(0, cols);
    return [...head, tail];
  }
  return lines;
}

export function layoutTicker(text: string, cols = TICKER_COLS, rows = TICKER_ROWS): string {
  const clean = sanitizeTicker(text);
  if (!clean) return ' '.repeat(cols * rows);

  const wrapped = wrapWords(clean, cols, rows);
  const padded: string[] = [];
  if (wrapped.length === 1) {
    padded.push(' '.repeat(cols), centerLine(wrapped[0], cols), ' '.repeat(cols));
  } else {
    for (let i = 0; i < rows; i += 1) {
      padded.push(wrapped[i] ? centerLine(wrapped[i], cols) : ' '.repeat(cols));
    }
  }
  return padded.join('');
}

export function glyphIndex(ch: string): number {
  const at = TICKER_GLYPHS.indexOf(ch);
  return at === -1 ? 0 : at;
}

export function stepsForward(from: string, to: string): number {
  const a = glyphIndex(from);
  const b = glyphIndex(to);
  if (a === b) return 0;
  const n = TICKER_GLYPHS.length;
  return (b - a + n) % n;
}
