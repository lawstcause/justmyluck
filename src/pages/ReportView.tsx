import { useState } from 'react';
import type { RankedHazard, Report } from '../types';

type ReportViewProps = {
  report: Report;
  shareUrl: string;
  onHome: () => void;
  onAgain: () => void;
};

function formatWhen(stamp: number) {
  return new Date(stamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function Line({ line, index }: { line: RankedHazard; index: number }) {
  return (
    <article className={`hazard kind-${line.kind}${line.wild ? ' wild' : ''}`}>
      <header>
        <span className="idx">{line.wild ? 'wild' : String(index + 1).padStart(2, '0')}</span>
        <span className={`sev sev-${line.kind}`}>{line.kind}</span>
      </header>
      <h2>{line.name}</h2>
      <p className="blurb">{line.blurb}</p>
      <p className="counter">
        <b>Counter.</b> {line.counter}
      </p>
      {line.job ? <p className="job">Whose job: {line.job}</p> : null}
    </article>
  );
}

export function ReportView({ report, shareUrl, onHome, onAgain }: ReportViewProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt('Copy this report link', shareUrl);
    }
  }

  const lines = report.wild ? [...report.lines, report.wild] : report.lines;

  return (
    <div className="page report-page">
      <button className="back" onClick={onHome} type="button">
        ← justmyluck.wtf
      </button>

      <header className="report-head">
        <p className="kicker">Luck report · {report.playbook.title}</p>
        <h1>{report.situation || report.playbook.title}</h1>
        <p className="meta">{formatWhen(report.createdAt)} · {lines.length} ways luck will try</p>
      </header>

      {lines.length === 0 ? (
        <p className="lede">
          Luck shrugged. That usually means the answers were too soft — or you are actually
          prepared. Run it again and be less kind to yourself.
        </p>
      ) : (
        <div className="hazards">
          {lines.map((line, index) => (
            <Line index={index} key={line.id} line={line} />
          ))}
        </div>
      )}

      <footer className="report-foot">
        <p>justmyluck.wtf — luck is coming. here’s the list.</p>
        <div className="row">
          <button className="primary" onClick={copy} type="button">
            {copied ? 'Link copied' : 'Copy share link'}
          </button>
          <button className="ghost" onClick={onAgain} type="button">
            Another night
          </button>
        </div>
      </footer>
    </div>
  );
}
