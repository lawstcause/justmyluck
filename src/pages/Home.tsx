import { PLAYBOOKS } from '../playbooks';
import { loadRecentReports } from '../storage';

type HomeProps = {
  onOpen: (id: string) => void;
  onDraw: () => void;
  onRecent: (payload: string) => void;
};

export function Home({ onOpen, onDraw, onRecent }: HomeProps) {
  const recent = typeof window === 'undefined' ? [] : loadRecentReports();

  return (
    <div className="page">
      <header className="hero">
        <p className="kicker">justmyluck.wtf</p>
        <h1>
          Luck is coming.
          <em> Here’s the list.</em>
        </h1>
        <p className="lede">
          Tell it what you’re about to do. It ranks how luck will try to break the night, and
          gives you a counter for each. Under two minutes. No account. No homework.
        </p>
      </header>

      <section className="grid" aria-label="Categories">
        {PLAYBOOKS.map((playbook) => (
          <button
            className="card"
            key={playbook.id}
            onClick={() => onOpen(playbook.id)}
            type="button"
          >
            <span className="card-id">{playbook.id.replace('-', ' ')}</span>
            <strong>{playbook.title}</strong>
            <span>{playbook.deck}</span>
          </button>
        ))}
      </section>

      <button className="draw-link" onClick={onDraw} type="button">
        Or skip the report — let luck pick a name
      </button>

      {recent.length > 0 ? (
        <section className="recent">
          <h2>Recent reports on this device</h2>
          <ul>
            {recent.map((item) => (
              <li key={item.id}>
                <button onClick={() => onRecent(item.payload)} type="button">
                  <b>{item.title}</b>
                  <span>{item.situation || 'Untitled night'}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
