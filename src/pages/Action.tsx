import { useState } from 'react';
import { HOUSE_DECK } from '../actions';
import { pickOne } from '../rng';
import { playTap } from '../sound';
import { SplitFlapBoard } from '../ticker/SplitFlapBoard';

export function Action() {
  const [winner, setWinner] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [again, setAgain] = useState(false);
  const [playId, setPlayId] = useState(0);

  function roll() {
    if (spinning) return;
    playTap();
    setAgain(Boolean(winner));
    setSpinning(true);
    setPlayId((n) => n + 1);
    setWinner(pickOne(HOUSE_DECK));
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

      <div className="action-dock">
        <button className="primary" disabled={spinning} onClick={roll} type="button">
          {spinning ? 'Flipping…' : winner ? 'Pick again' : 'Pick one'}
        </button>
      </div>
    </div>
  );
}
