import { useEffect, useState } from 'react';
import { Action } from './pages/Action';
import { Flip } from './pages/Flip';
import { Home } from './pages/Home';
import { Names } from './pages/Names';

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

  const desk = route === 'coin' || route === 'yesno' || route === 'names' || route === 'action';

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
      {route === 'names' ? <Names /> : null}
      {route === 'action' ? <Action /> : null}
    </div>
  );
}
