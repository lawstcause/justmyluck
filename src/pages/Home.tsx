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
    </div>
  );
}
