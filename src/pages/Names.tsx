import { FormEvent, useState } from 'react';
import { pickOne } from '../rng';
import { saveHistory } from '../storage';

export function Names() {
  const [names, setNames] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [winner, setWinner] = useState<string | null>(null);
  const [circling, setCircling] = useState(false);

  function addName(event?: FormEvent) {
    event?.preventDefault();
    const next = draft.trim();
    if (!next) return;
    const exists = names.some((name) => name.toLowerCase() === next.toLowerCase());
    if (exists) {
      setDraft('');
      return;
    }
    setNames((current) => [...current, next]);
    setDraft('');
    setWinner(null);
  }

  function choose() {
    if (names.length < 2 || circling) return;
    setCircling(true);
    setWinner(null);
    window.setTimeout(() => {
      const next = pickOne(names);
      setWinner(next);
      setCircling(false);
      saveHistory({ at: Date.now(), tool: 'names', result: next });
    }, 280);
  }

  return (
    <div className="names-page">
      <div className="names-desk" aria-hidden="true" />

      <div className="names-hud">
        <button className="back" type="button" onClick={() => { window.location.hash = '#/'; }}>
          ← justmyluck.wtf
        </button>
      </div>

      <div className="sheet-stage">
        <img alt="" className="pencil-prop" src={`${import.meta.env.BASE_URL}paper/pencil.png`} />
        <div className="sheet-wrap">
          <img alt="Notebook paper" className="sheet-img" src={`${import.meta.env.BASE_URL}paper/sheet.jpg`} />
          <ol className="sheet-lines">
            {names.map((name, index) => (
              <li
                className={winner === name ? 'ink winner' : 'ink'}
                key={`${name}-${index}`}
                style={{ transform: `rotate(${((index * 17) % 5) - 2}deg)` }}
              >
                {name}
                {winner === name ? (
                  <svg aria-hidden="true" className="red-circle" viewBox="0 0 120 40">
                    <ellipse cx="60" cy="20" rx="54" ry="16" />
                  </svg>
                ) : null}
              </li>
            ))}
            {draft.trim() ? (
              <li className="ink draft" style={{ transform: 'rotate(-0.6deg)' }}>
                {draft}
              </li>
            ) : null}
          </ol>
        </div>
        <img
          alt=""
          className={`pen-prop${winner ? ' pen-ready' : ''}`}
          src={`${import.meta.env.BASE_URL}paper/pen.png`}
        />
      </div>

      <form className="names-dock" onSubmit={addName}>
        <input
          autoComplete="off"
          autoFocus
          onChange={(event) => {
            setDraft(event.target.value);
            if (winner) setWinner(null);
          }}
          placeholder="Type a name, press return"
          value={draft}
        />
        <button className="ghost" type="submit">
          Add
        </button>
        <button className="primary" disabled={names.length < 2 || circling} onClick={choose} type="button">
          {circling ? '…' : 'Choose'}
        </button>
      </form>
    </div>
  );
}
