// Renders a luck verdict as a 1080×1350 image: the night desk, the lamp, the result.

export type ShareCard = {
  /** Small label above the result, e.g. "heads or tails". */
  kicker: string;
  /** The verdict itself. */
  result: string;
  /** Optional line under the result. */
  note?: string;
  /** Use the handwriting face (for names written on the list). */
  handwritten?: boolean;
};

const W = 1080;
const H = 1350;

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderCard(card: ShareCard): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const serif = card.handwritten ? 'Yuyu' : 'Fraunces';
  await Promise.all([
    document.fonts.load(`500 120px ${serif}`),
    document.fonts.load('italic 500 60px Fraunces'),
    document.fonts.load('600 28px "IBM Plex Mono"'),
  ]).catch(() => undefined);

  // The desk.
  const wood = await loadImage(`${import.meta.env.BASE_URL}desk/wood.jpg`);
  ctx.fillStyle = '#3a2416';
  ctx.fillRect(0, 0, W, H);
  if (wood) {
    const scale = Math.max(W / wood.width, H / wood.height);
    const dw = wood.width * scale;
    const dh = wood.height * scale;
    ctx.drawImage(wood, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }

  // The lamp: a warm pool of light and dark corners.
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.46, 0, W * 0.5, H * 0.46, H * 0.75);
  glow.addColorStop(0, 'rgba(255, 196, 120, 0.22)');
  glow.addColorStop(0.35, 'rgba(255, 178, 96, 0.05)');
  glow.addColorStop(0.6, 'rgba(6, 3, 1, 0.35)');
  glow.addColorStop(1, 'rgba(6, 3, 1, 0.85)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const pad = 96;

  // Header.
  ctx.fillStyle = '#f0c869';
  ctx.font = '600 28px "IBM Plex Mono", monospace';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('JUSTMYLUCK.WTF', pad, pad + 20);

  // Kicker.
  ctx.font = '600 30px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#f0c869';
  ctx.letterSpacing = '6px';
  ctx.fillText(card.kicker.toUpperCase(), pad, H * 0.36);
  ctx.letterSpacing = '0px';

  // The verdict, sized to fit.
  let size = card.handwritten ? 170 : 150;
  let lines: string[] = [];
  const maxWidth = W - pad * 2;
  for (; size >= 54; size -= 6) {
    ctx.font = `500 ${size}px ${serif}, Georgia, serif`;
    lines = wrap(ctx, card.result, maxWidth);
    if (lines.length * size * 1.08 <= H * 0.36) break;
  }
  ctx.fillStyle = '#fbf4e6';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 6;
  let y = H * 0.36 + 40 + size;
  for (const line of lines) {
    ctx.fillText(line, pad, y);
    y += size * 1.08;
  }

  if (card.note) {
    ctx.font = '500 34px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#f3e7d2';
    ctx.shadowBlur = 14;
    y += 10;
    for (const line of wrap(ctx, card.note, maxWidth)) {
      ctx.fillText(line, pad, y);
      y += 48;
    }
  }

  // Sign-off.
  ctx.shadowBlur = 16;
  ctx.font = 'italic 500 56px Fraunces, Georgia, serif';
  ctx.fillStyle = '#c49a4a';
  ctx.fillText('Luck picks. You live with it.', pad, H - pad - 44);
  ctx.font = '500 24px "IBM Plex Mono", monospace';
  ctx.fillStyle = 'rgba(243, 231, 210, 0.7)';
  ctx.shadowBlur = 0;
  const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  ctx.fillText(date, pad, H - pad + 4);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}

/** Share through the device's share sheet when it can take files; otherwise download. */
export async function shareCard(card: ShareCard): Promise<'shared' | 'saved' | 'failed'> {
  const blob = await renderCard(card);
  if (!blob) return 'failed';
  const file = new File([blob], 'justmyluck.png', { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'justmyluck.wtf', text: `Luck picked: ${card.result}` });
      return 'shared';
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') return 'failed';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'justmyluck.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'saved';
}
