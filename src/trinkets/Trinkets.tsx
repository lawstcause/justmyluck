import { CSSProperties, MouseEvent, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { recordPick } from '../luck';
import { pickOne, randomIndex } from '../rng';
import { playCrack, playDice, playDrop, playShimmer } from '../sound';

// Things that turn up on the desk once luck has decided enough for you.

export const TRINKETS = [
  { id: 'clover', at: 10 },
  { id: 'dice', at: 50 },
  { id: 'cookie', at: 100 },
] as const;

type TrinketId = (typeof TRINKETS)[number]['id'];

const SEEN_KEY = 'jml:trinkets-seen';

function readSeen(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function markSeen(ids: string[]) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
  } catch {
    /* fine */
  }
}

export function unlockedTrinkets(tally: number): TrinketId[] {
  return TRINKETS.filter((t) => tally >= t.at).map((t) => t.id);
}

/** Which unlocked trinkets are appearing for the first time on this visit. */
export function useFreshTrinkets(unlocked: TrinketId[]) {
  const [fresh, setFresh] = useState<TrinketId[]>([]);
  const key = unlocked.join(',');
  useEffect(() => {
    const seen = readSeen();
    const next = unlocked.filter((id) => !seen.includes(id));
    if (!next.length) return;
    setFresh(next);
    markSeen([...seen, ...next]);
    const timer = window.setTimeout(playDrop, 450);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return fresh;
}

type TrinketProps = {
  fresh: boolean;
  style?: CSSProperties;
  onBump: (event: MouseEvent<HTMLButtonElement>) => void;
};

/* ---------------- Four-leaf clover: pure charm ---------------- */

const CLOVER_LINES = ['luck noticed', 'you’re welcome', 'for luck', 'still lucky', 'rub gently'];

export function Clover({ fresh, style, onBump }: TrinketProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [line, setLine] = useState('for luck');
  const [sparkle, setSparkle] = useState(0);

  function onClick() {
    playShimmer();
    setLine(pickOne(CLOVER_LINES));
    setSparkle((n) => n + 1);
    if (ref.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.fromTo(ref.current, { rotate: 0 }, { rotate: 360, duration: 1.1, ease: 'back.out(1.6)' });
    }
  }

  return (
    <button
      aria-label="A four-leaf clover"
      className={`desk-item desk-trinket desk-clover${fresh ? ' is-new' : ''}`}
      onClick={onClick}
      onMouseEnter={onBump}
      style={style}
      type="button"
    >
      <span className="desk-prop" data-shadow ref={ref}>
        <svg viewBox="0 0 100 120" aria-hidden="true">
          <defs>
            <radialGradient id="leaf" cx="40%" cy="35%" r="70%">
              <stop offset="0" stopColor="#7fd36b" />
              <stop offset="1" stopColor="#2f7a2c" />
            </radialGradient>
          </defs>
          <path d="M50 58 C 52 80, 60 100, 74 116" stroke="#3f6b2a" strokeWidth="4" fill="none" strokeLinecap="round" />
          {[0, 90, 180, 270].map((deg) => (
            <g key={deg} transform={`rotate(${deg + 45} 50 52)`}>
              <path
                d="M50 52 C 38 40, 30 22, 42 14 C 48 10, 50 16, 50 20 C 50 16, 52 10, 58 14 C 70 22, 62 40, 50 52 Z"
                fill="url(#leaf)"
                stroke="#235c22"
                strokeWidth="1.2"
              />
              <path d="M50 50 L 50 22" stroke="#bfe8a8" strokeWidth="1" opacity="0.5" />
            </g>
          ))}
        </svg>
        {sparkle ? (
          <span className="sparkles" key={sparkle} aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} style={{ '--a': `${i * 45}deg` } as CSSProperties} />
            ))}
          </span>
        ) : null}
      </span>
      <span className="desk-tag">{fresh ? 'new · ' : ''}{line}</span>
    </button>
  );
}

/* ---------------- A pair of dice: an actual new tool ---------------- */

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function Die({ value, tilt }: { value: number; tilt: number }) {
  return (
    <span className="die" style={{ rotate: `${tilt}deg` } as CSSProperties}>
      {Array.from({ length: 9 }, (_, i) => (
        <i className={PIPS[value].includes(i) ? 'pip' : ''} key={i} />
      ))}
    </span>
  );
}

export function Dice({ fresh, style, onBump }: TrinketProps) {
  const [faces, setFaces] = useState<[number, number]>([5, 2]);
  const [rolling, setRolling] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  function onClick() {
    if (rolling) return;
    setRolling(true);
    setTotal(null);
    playDice();
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ticks = still ? 0 : 9;
    const roll = () => [randomIndex(6) + 1, randomIndex(6) + 1] as [number, number];
    if (ref.current && !still) {
      gsap.fromTo(
        ref.current,
        { x: -24, y: -10, rotate: -25 },
        { x: 0, y: 0, rotate: 0, duration: 0.7, ease: 'bounce.out' },
      );
    }
    const step = () => {
      if (ticks > 0) {
        ticks -= 1;
        setFaces(roll());
        window.setTimeout(step, 60);
        return;
      }
      const final = roll();
      setFaces(final);
      setTotal(final[0] + final[1]);
      setRolling(false);
      recordPick();
    };
    step();
  }

  return (
    <button
      aria-label={total ? `Dice rolled ${total}. Roll again` : 'Roll the dice'}
      className={`desk-item desk-trinket desk-dice${fresh ? ' is-new' : ''}`}
      onClick={onClick}
      onMouseEnter={onBump}
      style={style}
      type="button"
    >
      <span className="desk-prop" data-shadow ref={ref}>
        <Die tilt={-12} value={faces[0]} />
        <Die tilt={9} value={faces[1]} />
      </span>
      <span className="desk-tag">{fresh && !total ? 'new · roll me' : total ? `${faces[0]} + ${faces[1]} = ${total}` : 'roll me'}</span>
    </button>
  );
}

/* ---------------- Fortune cookie ---------------- */

const FORTUNES = [
  'The thing you keep putting off is smaller than you think.',
  'Someone is about to be glad you texted first.',
  'You already know. You just wanted a cookie to say it.',
  'Lucky numbers: whichever ones you stop counting.',
  'Leave earlier than you need to. Just this once.',
  'A small yes today becomes a good story later.',
  'Drink some water. Luck can’t do that part.',
  'The answer was in the first idea. Go back to it.',
  'You will meet a stranger who knows a good restaurant.',
  'Rest is not falling behind.',
  'Say the nice thing out loud.',
  'An old friend is thinking about you right now.',
  'This is the sign. You asked for one.',
  'Something you lost is closer than it looks.',
  'Pick the option that makes the better story.',
  'Not every door needs to be opened tonight.',
  'You are luckier than your worst day suggests.',
  'Go outside. The weather has opinions.',
  'Today: fewer tabs, more naps.',
  'The cookie has spoken. Please recycle the cookie.',
];

export function Cookie({ fresh, style, onBump }: TrinketProps) {
  const [cracked, setCracked] = useState(false);
  const [fortune, setFortune] = useState('');

  function onClick() {
    if (cracked) {
      setCracked(false);
      return;
    }
    playCrack();
    setFortune(pickOne(FORTUNES));
    setCracked(true);
    recordPick();
  }

  return (
    <button
      aria-label={cracked ? `Fortune: ${fortune} Click for a new cookie` : 'Crack the fortune cookie'}
      className={`desk-item desk-trinket desk-cookie${cracked ? ' is-cracked' : ''}${fresh ? ' is-new' : ''}`}
      onClick={onClick}
      onMouseEnter={onBump}
      style={style}
      type="button"
    >
      <span className="desk-prop" data-shadow>
        <svg viewBox="0 0 140 90" aria-hidden="true">
          <defs>
            <linearGradient id="bake" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#f2c879" />
              <stop offset="0.6" stopColor="#d99a3f" />
              <stop offset="1" stopColor="#a8672a" />
            </linearGradient>
          </defs>
          <g className="half left">
            <path d="M70 20 C 44 6, 10 18, 8 46 C 6 70, 34 84, 58 74 C 50 62, 56 44, 70 40 Z" fill="url(#bake)" stroke="#8a5420" strokeWidth="1.5" />
            <path d="M22 40 C 26 30, 40 24, 52 26" stroke="#fbe2a8" strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round" />
          </g>
          <g className="half right">
            <path d="M70 20 C 96 6, 130 18, 132 46 C 134 70, 106 84, 82 74 C 90 62, 84 44, 70 40 Z" fill="url(#bake)" stroke="#8a5420" strokeWidth="1.5" />
            <path d="M92 28 C 104 26, 116 32, 120 42" stroke="#fbe2a8" strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round" />
          </g>
        </svg>
        <span className="fortune-slip">{fortune}</span>
      </span>
      <span className="desk-tag">{cracked ? 'another?' : fresh ? 'new · crack me' : 'crack me'}</span>
    </button>
  );
}
