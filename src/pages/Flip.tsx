import { lazy, Suspense, useState } from 'react';
import type { CoinFace } from '../coin/CoinCanvas';
import { recordPick } from '../luck';
import { ShareButton } from '../share/ShareButton';

const CoinCanvas = lazy(() =>
  import('../coin/CoinCanvas').then((mod) => ({ default: mod.CoinCanvas })),
);

type Face = { id: string; label: string };

const EDGE_FACE: Face = { id: 'edge', label: 'On its edge.' };

type FlipProps = {
  kicker: string;
  title: string;
  faces: [Face, Face];
  pack: 'quarter' | 'yesno';
};

export function Flip({ kicker, title, faces, pack }: FlipProps) {
  const [face, setFace] = useState<Face | null>(null);
  const [again, setAgain] = useState(false);

  function onLand(side: CoinFace) {
    const next = side === 'edge' ? EDGE_FACE : side === 'heads' ? faces[0] : faces[1];
    recordPick();
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
        <div className={`result desk-result${again ? ' again' : ''}${face.id === 'edge' ? ' edge' : ''}`}>
          <p className="kicker">
            {face.id === 'edge' ? 'one in six thousand' : again ? 'again' : 'luck picked'}
          </p>
          <p className="name">{face.label}</p>
          {face.id === 'edge' ? (
            <p className="edge-note">Luck refuses to choose. This one’s on you.</p>
          ) : null}
          <ShareButton
            card={{
              kicker: face.id === 'edge' ? 'heads or tails · one in six thousand' : 'heads or tails',
              result: face.label,
              note: face.id === 'edge' ? 'Luck refused to choose.' : undefined,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
