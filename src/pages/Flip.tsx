import { lazy, Suspense, useState } from 'react';

const CoinCanvas = lazy(() =>
  import('../coin/CoinCanvas').then((mod) => ({ default: mod.CoinCanvas })),
);

type Face = { id: string; label: string };

type FlipProps = {
  kicker: string;
  title: string;
  faces: [Face, Face];
  pack: 'quarter' | 'yesno';
};

export function Flip({ kicker, title, faces, pack }: FlipProps) {
  const [face, setFace] = useState<Face | null>(null);
  const [again, setAgain] = useState(false);

  function onLand(side: 'heads' | 'tails') {
    const next = side === 'heads' ? faces[0] : faces[1];
    setAgain(Boolean(face));
    setFace(next);
  }

  return (
    <div className="flip-page">
      <Suspense fallback={null}>
        <CoinCanvas key={pack} onLand={onLand} pack={pack} />
      </Suspense>

      <div className="flip-hud tool-hud">
        <div className="tool-hud-bar">
          <button className="back" type="button" onClick={() => { window.location.hash = '#/'; }}>
            ← justmyluck.wtf
          </button>
        </div>
        <p className="kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="lede">Flick it. Click it. Swipe anywhere on the desk. Two faces. Luck picks one.</p>
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
