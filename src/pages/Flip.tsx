import { lazy, Suspense, useState } from 'react';
import { pickOne } from '../rng';
import { saveHistory } from '../storage';

const CoinCanvas = lazy(() =>
  import('../coin/CoinCanvas').then((mod) => ({ default: mod.CoinCanvas })),
);

type Face = { id: string; label: string };

type FlipProps = {
  kicker: string;
  title: string;
  lede: string;
  faces: [Face, Face];
  tool: 'coin' | 'yesno';
  verb: string;
  pack: 'quarter' | 'yesno';
};

export function Flip({ kicker, title, lede, faces, tool, verb, pack }: FlipProps) {
  const [face, setFace] = useState<Face | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [again, setAgain] = useState(false);

  function flip(reroll = false) {
    if (spinning) return;
    const next = pickOne(faces);
    setSpinning(true);
    setFace(next);
    setAgain(reroll);
    window.setTimeout(() => {
      setSpinning(false);
      saveHistory({ at: Date.now(), tool, result: next.label, reroll });
    }, 1180);
  }

  const coinFace = !face ? 'heads' : face.id === faces[0].id ? 'heads' : 'tails';

  return (
    <div className="tool">
      <p className="kicker">{kicker}</p>
      <h1>{title}</h1>
      <p className="lede">{lede}</p>

      <Suspense fallback={<div className="coin-stage" />}>
        <CoinCanvas
          key={pack}
          face={coinFace}
          onFlip={() => flip(Boolean(face))}
          pack={pack}
          spinning={spinning}
        />
      </Suspense>

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
