import { useState } from 'react';
import { pickOne } from '../rng';
import { saveHistory } from '../storage';

type Face = { id: string; label: string };

type FlipProps = {
  kicker: string;
  title: string;
  lede: string;
  faces: [Face, Face];
  tool: 'coin' | 'yesno';
  verb: string;
};

export function Flip({ kicker, title, lede, faces, tool, verb }: FlipProps) {
  const [face, setFace] = useState<Face | null>(null);
  const [turns, setTurns] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [again, setAgain] = useState(false);

  function flip(reroll = false) {
    if (spinning) return;
    setSpinning(true);
    const next = pickOne(faces);
    setTurns((current) => {
      const min = current + 10;
      const parity = next.id === faces[0].id ? 0 : 1;
      return min % 2 === parity ? min : min + 1;
    });
    setFace(null);
    window.setTimeout(() => {
      setFace(next);
      setAgain(reroll);
      setSpinning(false);
      saveHistory({ at: Date.now(), tool, result: next.label, reroll });
    }, 900);
  }

  const deg = turns * 180;

  return (
    <div className="tool">
      <p className="kicker">{kicker}</p>
      <h1>{title}</h1>
      <p className="lede">{lede}</p>

      <button className="coin-wrap" disabled={spinning} onClick={() => flip(Boolean(face))} type="button">
        <span className="coin" style={{ transform: `rotateY(${deg}deg)` }}>
          <span className="coin-face heads">{faces[0].label}</span>
          <span className="coin-face tails">{faces[1].label}</span>
        </span>
      </button>

      <div className="row">
        <button className="primary" disabled={spinning} onClick={() => flip(Boolean(face))} type="button">
          {spinning ? '…' : face ? `${verb} again` : verb}
        </button>
      </div>

      {face && !spinning ? (
        <div className={`result${again ? ' again' : ''}`}>
          <p className="kicker">{again ? 'again' : 'luck picked'}</p>
          <p className="name">{face.label}</p>
        </div>
      ) : null}
    </div>
  );
}
