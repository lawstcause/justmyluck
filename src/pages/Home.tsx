import { loadHistory } from '../storage';

const TOOLS = [
  { id: 'names', title: 'Names', deck: 'Write them on the paper. Luck circles one.' },
  { id: 'coin', title: 'Heads or Tails', deck: 'The quarter. One tap.' },
  { id: 'yesno', title: 'Yes / No', deck: 'Press your luck. Its own coin.' },
  { id: 'action', title: 'Action', deck: 'A thousand small good things. Luck picks one.' },
] as const;

type HomeProps = {
  onOpen: (id: (typeof TOOLS)[number]['id']) => void;
};

export function Home({ onOpen }: HomeProps) {
  const history = typeof window === 'undefined' ? [] : loadHistory().slice(0, 6);

  return (
    <div className="page">
      <header className="hero">
        <p className="kicker">justmyluck.wtf</p>
        <h1>
          Luck picks.
          <em> You live with it.</em>
        </h1>
        <p className="lede">
          Name picker, heads or tails, yes or no, random action. No account. No essay. Tap and go.
        </p>
      </header>

      <section className="grid" aria-label="Tools">
        {TOOLS.map((tool) => (
          <button className="card" key={tool.id} onClick={() => onOpen(tool.id)} type="button">
            <strong>{tool.title}</strong>
            <span>{tool.deck}</span>
          </button>
        ))}
      </section>

      {history.length > 0 ? (
        <section className="recent">
          <h2>On this phone</h2>
          <ul>
            {history.map((item) => (
              <li key={item.at}>
                <span>
                  {item.result}
                  <small>
                    {' '}
                    · {item.tool}
                    {item.reroll ? ' · again' : ''}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
