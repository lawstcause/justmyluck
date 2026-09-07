import { useMemo, useState } from 'react';
import { HOUSE_DECK } from '../actions';
import { parseList, pickOne } from '../rng';
import { saveHistory } from '../storage';
import { SplitFlapBoard } from '../ticker/SplitFlapBoard';

export function Action() {
  const [raw, setRaw] = useState(HOUSE_DECK.join('\n'));
  const [winner, setWinner] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [again, setAgain] = useState(false);
  const [playId, setPlayId] = useState(0);
  const items = useMemo(() => parseList(raw), [raw]);

  function roll(reroll = false) {
    if (items.length < 2 || spinning) return;
    const next = pickOne(items);
    setAgain(reroll);
    setSpinning(true);
    setPlayId((n) => n + 1);
    setWinner(next);
    saveHistory({ at: Date.now(), tool: 'action', result: next, reroll });
  }

  return (
    <div className="action-page">
      <div className="action-desk" aria-hidden="true" />

      <div className="action-hud">
        <button
          className="back"
          type="button"
          onClick={() => {
            window.location.hash = '#/';
          }}
        >
          ← justmyluck.wtf
        </button>
        <p className="ticker-status">
          {spinning ? 'flipping' : winner ? (again ? 'again' : 'luck picked') : 'waiting'}
        </p>
      </div>

      <div className="ticker-stage">
        <SplitFlapBoard
          onSettled={() => setSpinning(false)}
          playId={playId}
          value={winner}
        />
      </div>

      <form
        className="action-dock"
        onSubmit={(event) => {
          event.preventDefault();
          roll(Boolean(winner));
        }}
      >
        <span className="tool-meta">{items.length} in the hat</span>
        <button className="primary" disabled={items.length < 2 || spinning} type="submit">
          {spinning ? 'Flipping…' : winner ? 'Pick again' : 'Pick one'}
        </button>
        <details className="action-list">
          <summary>List</summary>
          <textarea
            onChange={(event) => {
              setRaw(event.target.value);
              setWinner('');
              setAgain(false);
            }}
            placeholder={'Walk\nCook\nSend the email\nGo to bed'}
            rows={8}
            value={raw}
          />
          <button
            className="text-btn"
            onClick={() => {
              setRaw(HOUSE_DECK.join('\n'));
              setWinner('');
              setAgain(false);
            }}
            type="button"
          >
            Load the 1000
          </button>
        </details>
      </form>
    </div>
  );
}
