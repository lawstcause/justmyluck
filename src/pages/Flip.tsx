import { lazy, Suspense, useState } from 'react';
import { saveHistory } from '../storage';

const CoinCanvas = lazy(() =>
  import('../coin/CoinCanvas').then((mod) => ({ default: mod.CoinCanvas })),
);

type Face = { id: string; label: string };

type FlipProps = {
  kicker: string;
  title: string;
  faces: [Face, Face];
  tool: 'coin' | 'yesno';
  pack: 'quarter' | 'yesno';
};

export function Flip({ kicker, title, faces, tool, pack }: FlipProps) {
  const [face, setFace] = useState<Face | null>(null);
  const [again, setAgain] = useState(false);

  function onLand(side: 'heads' | 'tails') {
    const next = side === 'heads' ? faces[0] : faces[1];
    setAgain(Boolean(face));
    setFace(next);
    saveHistory({ at: Date.now(), tool, result: next.label, reroll: Boolean(face) });
  }

  return (
    <div className="flip-page">
      <Suspense fallback={null}>
        <CoinCanvas key={pack} onLand={onLand} pack={pack} />
      </Suspense>

      <div className="flip-hud">
        <button className="back" type="button" onClick={() => { window.location.hash = '#/'; }}>
          ← justmyluck.wtf
        </button>
        <p className="kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="lede">Flick it. Click it. Swipe anywhere on the desk.</p>
      </div>

      {face ? (
        <div className={`result desk-result${again ? ' again' : ''}`}>
          <p className="kicker">{again ? 'again' : 'luck picked'}</p>
          <p className="name">{face.label}</p>
        </div>
      ) : null}
    </div>
  );
}
