import { MouseEvent } from 'react';
import { gsap } from 'gsap';
import { playTap } from '../sound';

const TOOLS = [
  {
    id: 'list',
    title: 'LIST',
    deck: 'From a list. Choose one.',
  },
  {
    id: 'coin',
    title: 'Heads or Tails',
    deck: 'The quarter already knows. You are late.',
  },
  {
    id: 'scratch',
    title: 'Scratch',
    deck: 'Gold first. The sentence after. You do the work.',
  },
  {
    id: 'action',
    title: 'Action',
    deck: 'A board of flaps will tell you what to do.',
  },
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
  const bumpFactor = 22;
  const durationFactor = 1.75;

  gsap
    .timeline()
    .to(target, {
      overwrite: 'auto',
      x: -hit.x * bumpFactor,
      y: -hit.y * bumpFactor,
      duration: 0.15 * durationFactor,
      ease: 'power1.out',
    })
    .to(target, {
      overwrite: 'auto',
      x: 0,
      y: 0,
      duration: 1 * durationFactor,
      ease: 'elastic.out(1, 0.3)',
    });
}

function ObjectStage({ id }: { id: (typeof TOOLS)[number]['id'] }) {
  if (id === 'list') {
    return (
      <span className="tool-object tool-object-names">
        <img alt="" src={`${import.meta.env.BASE_URL}paper/sheet.png`} />
        <em>choose one</em>
      </span>
    );
  }
  if (id === 'coin') {
    return (
      <span className="tool-object tool-object-coin">
        <img alt="" src={`${import.meta.env.BASE_URL}scratch/quarter.png`} />
      </span>
    );
  }
  if (id === 'scratch') {
    return (
      <span className="tool-object tool-object-scratch">
        <img alt="" src={`${import.meta.env.BASE_URL}scratch/ticket.png`} />
      </span>
    );
  }
  return (
    <span className="tool-object tool-object-action">
      {'ACTION'.split('').map((ch) => (
        <i className="mini-flap" key={ch}>
          {ch}
        </i>
      ))}
    </span>
  );
}

export function Home({ onOpen }: HomeProps) {
  return (
    <div className="page home-page">
      <header className="hero">
        <p className="kicker">justmyluck.wtf</p>
        <h1>
          Luck picks.
          <em> You live with it.</em>
        </h1>
        <p className="lede">
          Four objects on a desk that have never met you. They will pick anyway. You will live with
          it, which was the whole idea.
        </p>
      </header>

      <section className="home-grid" aria-label="Tools">
        {TOOLS.map((tool) => (
          <button
            className={`tool-card tool-${tool.id}`}
            key={tool.id}
            onClick={() => {
              playTap();
              onOpen(tool.id);
            }}
            onMouseEnter={bump}
            type="button"
          >
            <ObjectStage id={tool.id} />
            <strong>{tool.title}</strong>
            <span className="tool-deck">{tool.deck}</span>
          </button>
        ))}
      </section>
    </div>
  );
}
