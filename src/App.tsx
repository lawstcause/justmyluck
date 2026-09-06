import { useEffect, useMemo, useState } from 'react';
import { buildReport } from './engine';
import { Draw } from './pages/Draw';
import { Home } from './pages/Home';
import { Quiz } from './pages/Quiz';
import { ReportView } from './pages/ReportView';
import { getPlaybook } from './playbooks';
import { decodePayload, encodePayload, reportHash } from './share';
import { saveRecentReport } from './storage';
import type { Answers, Report } from './types';

type Route =
  | { name: 'home' }
  | { name: 'quiz'; id: string }
  | { name: 'report'; payload: string }
  | { name: 'draw' };

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const parts = hash.split('/').filter(Boolean);
  if (parts[0] === 'c' && parts[1]) return { name: 'quiz', id: parts[1] };
  if (parts[0] === 'r' && parts[1]) return { name: 'report', payload: parts[1] };
  if (parts[0] === 'draw') return { name: 'draw' };
  return { name: 'home' };
}

function go(hash: string) {
  window.location.hash = hash;
}

export default function App() {
  const [route, setRoute] = useState<Route>(() =>
    typeof window === 'undefined' ? { name: 'home' } : parseHash(),
  );

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    if (!window.location.hash) {
      window.location.replace('#/');
    }
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const report: Report | null = useMemo(() => {
    if (route.name !== 'report') return null;
    const payload = decodePayload(route.payload);
    if (!payload) return null;
    const playbook = getPlaybook(payload.c);
    if (!playbook) return null;
    return buildReport(playbook, payload.a, payload.s, payload.t, payload.w);
  }, [route]);

  function openQuiz(id: string) {
    go(`#/c/${id}`);
  }

  function submitQuiz(id: string, answers: Answers, situation: string) {
    const playbook = getPlaybook(id);
    if (!playbook) return;
    const createdAt = Date.now();
    const built = buildReport(playbook, answers, situation, createdAt);
    const encoded = encodePayload({
      c: id,
      a: answers,
      s: situation.trim(),
      t: createdAt,
      w: built.wild?.id,
    });
    saveRecentReport({
      id: String(createdAt),
      title: playbook.title,
      situation: situation.trim(),
      category: playbook.id,
      createdAt,
      payload: encoded,
    });
    go(reportHash(encoded));
  }

  const shareUrl =
    route.name === 'report'
      ? `${window.location.origin}${window.location.pathname}${reportHash(route.payload)}`
      : '';

  return (
    <div className="shell">
      <div className="grain" aria-hidden="true" />
      {route.name === 'home' ? (
        <Home
          onDraw={() => go('#/draw')}
          onOpen={openQuiz}
          onRecent={(payload) => go(reportHash(payload))}
        />
      ) : null}

      {route.name === 'quiz' ? (
        getPlaybook(route.id) ? (
          <Quiz
            onBack={() => go('#/')}
            onSubmit={(answers, situation) => submitQuiz(route.id, answers, situation)}
            playbook={getPlaybook(route.id)!}
          />
        ) : (
          <div className="page">
            <p>Unknown playbook.</p>
            <button className="back" onClick={() => go('#/')} type="button">
              ← Home
            </button>
          </div>
        )
      ) : null}

      {route.name === 'report' ? (
        report ? (
          <ReportView
            onAgain={() => go(`#/c/${report.playbook.id}`)}
            onHome={() => go('#/')}
            report={report}
            shareUrl={shareUrl}
          />
        ) : (
          <div className="page">
            <p>This report link is broken. Luck ate the payload.</p>
            <button className="back" onClick={() => go('#/')} type="button">
              ← Home
            </button>
          </div>
        )
      ) : null}

      {route.name === 'draw' ? <Draw onBack={() => go('#/')} /> : null}
    </div>
  );
}
