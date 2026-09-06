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
      <button
        className="back"
        type="button"
        onClick={() => {
          window.location.hash = '#/';
        }}
      >
        ← justmyluck.wtf
      </button>

      <p className="kicker">action</p>
      <h1>Do this.</h1>
      <p className="lede">Luck flips the board. You live with whatever it says.</p>

      <SplitFlapBoard
        onSettled={() => setSpinning(false)}
        playId={playId}
        value={winner}
      />

      <p className="ticker-status">
        {spinning ? 'flipping' : winner ? (again ? 'again' : 'luck picked') : 'waiting'}
      </p>

      <div className="row">
        <button className="primary" disabled={items.length < 2 || spinning} onClick={() => roll(false)} type="button">
          {spinning ? 'Flipping…' : 'Pick one'}
        </button>
        {winner ? (
          <button className="ghost" disabled={spinning} onClick={() => roll(true)} type="button">
            Pick again
          </button>
        ) : null}
      </div>

      <div className="tool-meta">
        <span>{items.length} in the hat</span>
      </div>

      <details className="action-list">
        <summary>Write your own list</summary>
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
    </div>
  );
}
