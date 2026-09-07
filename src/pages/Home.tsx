import { MouseEvent } from 'react';
import { gsap } from 'gsap';

const TOOLS = [
  { id: 'names', title: 'Names', deck: 'Write them on the paper. Luck circles one.', idx: '01' },
  { id: 'coin', title: 'Heads or Tails', deck: 'The quarter. One tap.', idx: '02' },
  { id: 'scratch', title: 'Scratch', deck: 'The quarter. Scratch the gold.', idx: '03' },
  { id: 'action', title: 'Action', deck: 'A thousand small good things. Luck picks one.', idx: '04' },
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
  const bumpFactor = 28;
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
          Name picker, heads or tails, scratch-off, random action. No account. No essay. Tap and go.
        </p>
      </header>

      <section className="home-grid" aria-label="Tools">
        {TOOLS.map((tool) => (
          <button
            className="bump-card"
            key={tool.id}
            onClick={() => onOpen(tool.id)}
            onMouseEnter={bump}
            type="button"
          >
            <span className="bump-idx">{tool.idx}</span>
            <strong>{tool.title}</strong>
            <span className="bump-deck">{tool.deck}</span>
          </button>
        ))}
      </section>
    </div>
  );
}
