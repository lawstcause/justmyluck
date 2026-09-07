import { MouseEvent } from 'react';
import { gsap } from 'gsap';
import { playTap } from '../sound';

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

export function Home({ onOpen }: HomeProps) {
  return (
    <div className="home-desk-page">
      <div className="home-desk" aria-hidden="true" />
      <p className="home-stamp">justmyluck.wtf</p>

      <div className="desk-top" aria-label="Tools on the desk">
        <button
          aria-label="Open the list"
          className="desk-item desk-paper"
          onClick={() => {
            playTap();
            onOpen('list');
          }}
          onMouseEnter={bump}
          type="button"
        >
          <span className="desk-prop">
            <img alt="" src={`${import.meta.env.BASE_URL}paper/sheet.png`} />
            <em>LIST</em>
          </span>
        </button>

        <button
          aria-label="Flip the quarter"
          className="desk-item desk-coin"
          onClick={() => {
            playTap();
            onOpen('coin');
          }}
          onMouseEnter={bump}
          type="button"
        >
          <span className="desk-prop">
            <img alt="" src={`${import.meta.env.BASE_URL}scratch/quarter.png`} />
          </span>
        </button>

        <button
          aria-label="Scratch the ticket"
          className="desk-item desk-ticket"
          onClick={() => {
            playTap();
            onOpen('scratch');
          }}
          onMouseEnter={bump}
          type="button"
        >
          <span className="desk-prop">
            <img alt="" src={`${import.meta.env.BASE_URL}scratch/ticket.png`} />
          </span>
        </button>

        <button
          aria-label="Flip the action board"
          className="desk-item desk-board"
          onClick={() => {
            playTap();
            onOpen('action');
          }}
          onMouseEnter={bump}
          type="button"
        >
          <span className="desk-prop desk-board-prop">
            {'ACTION'.split('').map((ch) => (
              <i className="mini-flap" key={ch}>
                {ch}
              </i>
            ))}
          </span>
        </button>
      </div>
    </div>
  );
}
