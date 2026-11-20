import { CSSProperties, MouseEvent, useEffect, useMemo, useState } from 'react';
import { gsap } from 'gsap';
import { isLateNight, lamp, LIGHTS_EVENT, setLightsOut } from '../atmosphere/lampState';
import { Tally } from '../atmosphere/Tally';
import { getTally, TALLY_EVENT } from '../luck';
import { playSwitch, playTap } from '../sound';
import { Clover, Cookie, Dice, unlockedTrinkets, useFreshTrinkets } from '../trinkets/Trinkets';

const TOOLS = [
  { id: 'list', title: 'LIST', label: 'Open the list' },
  { id: 'coin', title: 'Heads or Tails', label: 'Flip the quarter' },
  { id: 'scratch', title: 'Scratch', label: 'Scratch the ticket' },
  { id: 'action', title: 'Action', label: 'Flip the action board' },
] as const;

type HomeProps = {
  onOpen: (id: (typeof TOOLS)[number]['id']) => void;
};

function bump(event: MouseEvent<HTMLButtonElement>) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover: none)').matches) return;

  const target = event.currentTarget;
  const box = target.getBoundingClientRect();
  const hit = {
    x: (event.clientX - (box.left + box.width / 2)) / box.width,
    y: (event.clientY - (box.top + box.height / 2)) / box.height,
  };

  gsap
    .timeline()
    .to(target, {
      overwrite: 'auto',
      x: -hit.x * 18,
      y: -hit.y * 18,
      duration: 0.18,
      ease: 'power1.out',
    })
    .to(target, {
      overwrite: 'auto',
      x: 0,
      y: 0,
      duration: 1.2,
      ease: 'elastic.out(1, 0.32)',
    });
}

/** Luck arranges the desk: every visit, each object lands slightly differently. */
function scatter(): CSSProperties {
  const r = () => Math.random() * 2 - 1;
  return { '--jx': r().toFixed(3), '--jy': r().toFixed(3), '--jr': `${(r() * 5).toFixed(2)}deg` } as CSSProperties;
}

function useTally() {
  const [count, setCount] = useState(() => getTally());
  useEffect(() => {
    const on = (event: Event) => setCount((event as CustomEvent<number>).detail);
    window.addEventListener(TALLY_EVENT, on);
    return () => window.removeEventListener(TALLY_EVENT, on);
  }, []);
  return count;
}

function PullChain() {
  const [dark, setDark] = useState(lamp.dark);
  const [tug, setTug] = useState(0);

  useEffect(() => {
    const on = (event: Event) => setDark((event as CustomEvent<boolean>).detail);
    window.addEventListener(LIGHTS_EVENT, on);
    return () => window.removeEventListener(LIGHTS_EVENT, on);
  }, []);

  return (
    <button
      aria-label={dark ? 'Turn the lamp back on' : 'Turn the lamp off'}
      aria-pressed={dark}
      className={`pull-chain${tug ? ' tugged' : ''}`}
      key={tug}
      onClick={() => {
        playSwitch(dark);
        setTug((n) => n + 1);
        setLightsOut(!dark);
      }}
      type="button"
    >
      <span className="chain" />
      <span className="bead" />
    </button>
  );
}

export function Home({ onOpen }: HomeProps) {
  const night = useMemo(isLateNight, []);
  const layout = useMemo(() => Array.from({ length: 7 }, scatter), []);
  const tally = useTally();
  const unlocked = unlockedTrinkets(tally);
  const fresh = useFreshTrinkets(unlocked);

  return (
    <div className="home-desk-page">
      <div className="home-desk" aria-hidden="true" />
      <header className="home-hero">
        <p className="kicker">justmyluck.wtf</p>
        {night ? (
          <h1>
            Still up?
            <em> So is luck.</em>
          </h1>
        ) : (
          <h1>
            Luck picks.
            <em> You live with it.</em>
          </h1>
        )}
        <p className="lede">
          {night
            ? 'It’s late, and four objects on a desk are still awake. Let them decide. You should be asleep.'
            : 'Four objects on a desk that have never met you. They will pick anyway. You will live with it, which was the whole idea.'}
        </p>
        <Tally />
      </header>

      <div className={`desk-top${unlocked.length ? ' has-trinkets' : ''}`} aria-label="Tools on the desk">
        <button
          aria-label="Open the list"
          className="desk-item desk-paper"
          onClick={() => {
            playTap();
            onOpen('list');
          }}
          onMouseEnter={bump}
          style={layout[0]}
          type="button"
        >
          <span className="desk-prop" data-shadow>
            <img alt="" src={`${import.meta.env.BASE_URL}paper/sheet.png`} />
            <em>LIST</em>
          </span>
          <span className="desk-tag">make a list</span>
        </button>

        <button
          aria-label="Flip the quarter"
          className="desk-item desk-coin"
          onClick={() => {
            playTap();
            onOpen('coin');
          }}
          onMouseEnter={bump}
          style={layout[1]}
          type="button"
        >
          <span className="desk-prop" data-shadow>
            <img alt="" src={`${import.meta.env.BASE_URL}scratch/quarter.png`} />
            <i className="coin-glint" />
          </span>
          <span className="desk-tag">flip me</span>
        </button>

        <button
          aria-label="Scratch the ticket"
          className="desk-item desk-ticket"
          onClick={() => {
            playTap();
            onOpen('scratch');
          }}
          onMouseEnter={bump}
          style={layout[2]}
          type="button"
        >
          <span className="desk-prop" data-shadow>
            <img alt="" src={`${import.meta.env.BASE_URL}scratch/ticket.png`} />
          </span>
          <span className="desk-tag">scratch for a fortune</span>
        </button>

        <button
          aria-label="Flip the action board"
          className="desk-item desk-board"
          onClick={() => {
            playTap();
            onOpen('action');
          }}
          onMouseEnter={bump}
          style={layout[3]}
          type="button"
        >
          <span className="desk-prop desk-board-prop" data-shadow>
            {'ACTION'.split('').map((ch) => (
              <i className="mini-flap" key={ch}>
                {ch}
              </i>
            ))}
          </span>
          <span className="desk-tag">do what it says</span>
        </button>

        {unlocked.length ? (
          <div className="trinkets">
            {unlocked.includes('clover') ? (
              <Clover fresh={fresh.includes('clover')} onBump={bump} style={layout[4]} />
            ) : null}
            {unlocked.includes('dice') ? (
              <Dice fresh={fresh.includes('dice')} onBump={bump} style={layout[5]} />
            ) : null}
            {unlocked.includes('cookie') ? (
              <Cookie fresh={fresh.includes('cookie')} onBump={bump} style={layout[6]} />
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="home-darkness" aria-hidden="true" />
      <p className="glow-note" aria-hidden="true">
        In the dark, nobody picks for you.
        <small>pull the chain to bring luck back</small>
      </p>
      <PullChain />
    </div>
  );
}
