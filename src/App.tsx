import { useEffect, useState } from 'react';
import { HOUSE_DECK } from './actions';
import { Flip } from './pages/Flip';
import { Home } from './pages/Home';
import { ListPick } from './pages/ListPick';

type ToolId = 'home' | 'names' | 'coin' | 'yesno' | 'action';

function parseHash(): ToolId {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === 'names' || hash === 'coin' || hash === 'yesno' || hash === 'action') return hash;
  return 'home';
}

export default function App() {
  const [route, setRoute] = useState<ToolId>(() =>
    typeof window === 'undefined' ? 'home' : parseHash(),
  );

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    if (!window.location.hash) window.location.replace('#/');
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function go(id: ToolId) {
    window.location.hash = id === 'home' ? '#/' : `#/${id}`;
  }

  const desk = route === 'coin' || route === 'yesno';

  return (
    <div className={`shell${desk ? ' shell-desk' : ''}`}>
      {desk ? null : <div className="grain" aria-hidden="true" />}
      {route === 'home' ? <Home onOpen={(id) => go(id)} /> : null}
      {route === 'coin' ? (
        <Flip
          faces={[
            { id: 'heads', label: 'Heads' },
            { id: 'tails', label: 'Tails' },
          ]}
          kicker="heads or tails"
          pack="quarter"
          title="Heads or tails."
          tool="coin"
        />
      ) : null}
      {route === 'yesno' ? (
        <Flip
          faces={[
            { id: 'yes', label: 'Yes' },
            { id: 'no', label: 'No' },
          ]}
          kicker="yes / no"
          pack="yesno"
          title="Yes or no."
          tool="yesno"
        />
      ) : null}
      {route === 'names' || route === 'action' ? (
        <div className="page">
          <button className="back" onClick={() => go('home')} type="button">
            ← justmyluck.wtf
          </button>
          {route === 'names' ? (
            <ListPick
              kicker="names"
              lede="One name per line. Raffles, who pays, who stays late, who talks first."
              placeholder={'Ada\nBill\nCy'}
              title="Who."
              tool="names"
            />
          ) : (
            <ListPick
              kicker="action"
              lede="Write the options, or load a starter deck of useful next moves. Luck picks one. You do that."
              placeholder={'Walk\nCook\nSend the email\nGo to bed'}
              seedLabel="Load starter deck"
              seedList={HOUSE_DECK.join('\n')}
              title="Do this."
              tool="action"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
