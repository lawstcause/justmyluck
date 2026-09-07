import { useEffect, useRef, useState } from 'react';
import { startFlap, stopFlap } from '../sound';
import {
  TICKER_COLS,
  TICKER_GLYPHS,
  TICKER_ROWS,
  layoutTicker,
} from './layout';

const TICK_MS = 48;
const CELL_COUNT = TICKER_COLS * TICKER_ROWS;
const BLANK = ' '.repeat(CELL_COUNT);
const FAILSAFE_MS = 8000;

type SplitFlapBoardProps = {
  value: string;
  playId?: number;
  onSettled?: () => void;
};

function preferReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function zeros() {
  return new Array<boolean>(CELL_COUNT).fill(false);
}

function delayFor(i: number) {
  return Math.floor((i % TICKER_COLS) / 2) + Math.floor(i / TICKER_COLS) * 2;
}

export function SplitFlapBoard({ value, playId = 0, onSettled }: SplitFlapBoardProps) {
  const [shown, setShown] = useState(BLANK);
  const [flipping, setFlipping] = useState(() => zeros());
  const shownRef = useRef(BLANK);
  const settled = useRef(onSettled);
  const runRef = useRef(0);
  settled.current = onSettled;

  useEffect(() => {
    const run = ++runRef.current;
    const target = layoutTicker(value);

    const finish = (text: string) => {
      if (run !== runRef.current) return;
      stopFlap();
      setFlipping(zeros());
      setShown(text);
      shownRef.current = text;
      settled.current?.();
    };

    if (!value.trim()) {
      stopFlap();
      setShown(BLANK);
      shownRef.current = BLANK;
      setFlipping(zeros());
      return;
    }

    if (preferReducedMotion()) {
      finish(target);
      return;
    }

    let current = BLANK;
    shownRef.current = BLANK;
    setShown(BLANK);
    setFlipping(zeros());
    startFlap();

    let tickNo = 0;
    let id = 0;
    let failsafe = 0;
    const tick = () => {
      if (run !== runRef.current) return;
      tickNo += 1;
      const chars = current.split('');
      const flip = zeros();
      let busy = 0;
      let waiting = 0;
      for (let i = 0; i < CELL_COUNT; i += 1) {
        const want = target[i] ?? ' ';
        if (chars[i] === want) continue;
        if (tickNo <= delayFor(i)) {
          waiting += 1;
          continue;
        }
        const at = Math.max(0, TICKER_GLYPHS.indexOf(chars[i] ?? ' '));
        chars[i] = TICKER_GLYPHS[(at + 1) % TICKER_GLYPHS.length];
        flip[i] = true;
        busy += 1;
      }
      current = chars.join('');
      shownRef.current = current;
      setShown(current);
      setFlipping(flip);
      if (busy === 0 && waiting === 0) {
        window.clearInterval(id);
        window.clearTimeout(failsafe);
        finish(target);
      }
    };

    tick();
    id = window.setInterval(tick, TICK_MS);
    failsafe = window.setTimeout(() => {
      window.clearInterval(id);
      finish(target);
    }, FAILSAFE_MS);

    return () => {
      window.clearInterval(id);
      window.clearTimeout(failsafe);
      stopFlap();
    };
  }, [playId, value]);

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
