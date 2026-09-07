import { useEffect, useRef, useState } from 'react';
import {
  TICKER_COLS,
  TICKER_GLYPHS,
  TICKER_ROWS,
  layoutTicker,
} from './layout';

const TICK_MS = 48;
const CELL_COUNT = TICKER_COLS * TICKER_ROWS;

type SplitFlapBoardProps = {
  value: string;
  playId?: number;
  onSettled?: () => void;
};

function preferReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let audioCtx: AudioContext | null = null;

function flapClick(intensity: number) {
  try {
    const Audio = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Audio) return;
    if (!audioCtx) audioCtx = new Audio();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    const t = audioCtx.currentTime;
    const noise = audioCtx.createBuffer(1, 220, audioCtx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 40);
    const src = audioCtx.createBufferSource();
    src.buffer = noise;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400 + Math.random() * 900;
    filter.Q.value = 1.8;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.035 * intensity, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    src.start(t);
    src.stop(t + 0.06);
  } catch {
    /* ignore autoplay limits */
  }
}

export function SplitFlapBoard({ value, playId = 0, onSettled }: SplitFlapBoardProps) {
  const target = layoutTicker(value);
  const [shown, setShown] = useState(() => ' '.repeat(CELL_COUNT));
  const [flipping, setFlipping] = useState(() => new Array<boolean>(CELL_COUNT).fill(false));
  const shownRef = useRef(shown);
  const settled = useRef(onSettled);
  settled.current = onSettled;

  useEffect(() => {
    shownRef.current = shown;
  }, [shown]);

  useEffect(() => {
    if (!value.trim() || preferReducedMotion()) {
      setShown(target);
      setFlipping(new Array(CELL_COUNT).fill(false));
      shownRef.current = target;
      settled.current?.();
      return;
    }

    let current = shownRef.current === target ? ' '.repeat(CELL_COUNT) : shownRef.current;
    if (current.length !== CELL_COUNT) current = ' '.repeat(CELL_COUNT);
    let tickNo = 0;
    let lastClick = 0;
    const flipFlags = () => new Array<boolean>(CELL_COUNT).fill(false);

    const id = window.setInterval(() => {
      tickNo += 1;
      const chars = current.split('');
      const flip = flipFlags();
      let busy = 0;
      for (let i = 0; i < CELL_COUNT; i += 1) {
        const delayTicks = Math.floor((i % TICKER_COLS) / 2) + Math.floor(i / TICKER_COLS) * 2;
        if (tickNo <= delayTicks) continue;
        const dest = target[i] ?? ' ';
        if (chars[i] === dest) continue;
        const at = Math.max(0, TICKER_GLYPHS.indexOf(chars[i] ?? ' '));
        chars[i] = TICKER_GLYPHS[(at + 1) % TICKER_GLYPHS.length];
        flip[i] = true;
        busy += 1;
      }
      current = chars.join('');
      shownRef.current = current;
      setShown(current);
      setFlipping(flip);
      const now = Date.now();
      if (busy && now - lastClick > 45) {
        flapClick(Math.min(1, 0.2 + busy / 16));
        lastClick = now;
      }
      if (busy === 0) {
        window.clearInterval(id);
        setFlipping(flipFlags());
        setShown(target);
        shownRef.current = target;
        settled.current?.();
      }
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [playId, target, value]);

  return (
    <div className="ticker" role="img" aria-label={value.trim() ? value : 'Luck has not picked yet'}>
      <div className="ticker-bezel">
        <div className="ticker-grid">
          {Array.from({ length: CELL_COUNT }, (_, i) => {
            const ch = shown[i] === ' ' ? '' : shown[i];
            return (
              <div className={`sf-slot${flipping[i] ? ' is-flipping' : ''}`} key={i}>
                <span className="sf-half sf-top">
                  <span className="sf-letter">{ch}</span>
                </span>
                <span className="sf-half sf-bot">
                  <span className="sf-letter">{ch}</span>
                </span>
                <i className="sf-seam" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
