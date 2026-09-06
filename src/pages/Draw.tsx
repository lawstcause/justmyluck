import { useMemo, useState } from 'react';
import { loadDraws, saveDraw } from '../storage';

type DrawProps = {
  onBack: () => void;
};

function parseNames(raw: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const line of raw.split(/\n|,/)) {
    const name = line.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}

function pick(names: string[]) {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return names[bytes[0] % names.length];
}

export function Draw({ onBack }: DrawProps) {
  const [raw, setRaw] = useState('');
  const [winner, setWinner] = useState<string | null>(null);
  const [broke, setBroke] = useState(false);
  const names = useMemo(() => parseNames(raw), [raw]);
  const history = typeof window === 'undefined' ? [] : loadDraws();

  function roll(reroll = false) {
    if (names.length < 2) return;
    const next = pick(names);
    setWinner(next);
    setBroke(reroll);
    saveDraw({
      at: Date.now(),
      names,
      winner: next,
      brokeCovenant: reroll,
    });
  }

  return (
    <div className="page draw-page">
      <button className="back" onClick={onBack} type="button">
        ← Reports
      </button>
      <p className="kicker">the draw</p>
      <h1>Luck picks a name.</h1>
      <p className="lede">
        One name per line. No silent rerolls — if you roll again, the ledger calls it what it is.
      </p>

      <textarea
        onChange={(event) => {
          setRaw(event.target.value);
          setWinner(null);
          setBroke(false);
        }}
        placeholder={'Ada\nBill\nCy'}
        rows={8}
        value={raw}
      />
      <p className="hint">{names.length} in the hat</p>

      <div className="row">
        <button className="primary" disabled={names.length < 2} onClick={() => roll(false)} type="button">
          Roll
        </button>
        {winner ? (
          <button className="ghost danger" onClick={() => roll(true)} type="button">
            Break the covenant and roll again
          </button>
        ) : null}
      </div>

      {winner ? (
        <div className={`winner${broke ? ' broke' : ''}`}>
          <p className="kicker">{broke ? 'covenant broken' : 'luck picked'}</p>
          <p className="name">{winner}</p>
        </div>
      ) : null}

      {history.length > 0 ? (
        <section className="recent">
          <h2>On this device</h2>
          <ul>
            {history.slice(0, 6).map((item) => (
              <li key={item.at}>
                <span>
                  {item.winner}
                  {item.brokeCovenant ? ' · broke it' : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
