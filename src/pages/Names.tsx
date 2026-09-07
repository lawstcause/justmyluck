import { CSSProperties, FormEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { pickOne } from '../rng';
import { playPenCircle, playPenTravel, playPenWrite } from '../sound';

const LINE_Y = [
  16.761, 19.93, 23.099, 26.268, 29.507, 32.746, 35.915, 39.085, 42.254, 45.493, 48.662, 51.831, 55,
  58.169, 61.338, 64.577, 67.676, 70.915, 74.155, 77.394, 80.704, 83.944, 87.113,
];

const REST_PEN = { left: -6, top: 38 };
const PEN_TRAVEL_MS = 820;
const CIRCLE_MS = 550;
const HOLD_MS = 420;

export function Names() {
  const [names, setNames] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [winner, setWinner] = useState<string | null>(null);
  const [circling, setCircling] = useState(false);
  const [circled, setCircled] = useState(false);
  const [penAtName, setPenAtName] = useState(false);
  const [pen, setPen] = useState(REST_PEN);

  const sheetRef = useRef<HTMLDivElement>(null);
  const nameRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useLayoutEffect(() => {
    if (!penAtName || !winner) {
      setPen(REST_PEN);
      return;
    }
    const sheet = sheetRef.current;
    const index = names.indexOf(winner);
    const el = index >= 0 ? nameRefs.current[index] : null;
    if (!sheet || !el) return;
    const page = sheet.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    setPen({
      left: ((box.left + box.width + 10 - page.left) / page.width) * 100,
      top: ((box.top + box.height * 0.52 - page.top) / page.height) * 100,
    });
  }, [penAtName, winner, names]);

  function addName(event?: FormEvent) {
    event?.preventDefault();
    const next = draft.trim();
    if (!next || names.length >= LINE_Y.length) return;
    const exists = names.some((name) => name.toLowerCase() === next.toLowerCase());
    setDraft('');
    if (exists) return;
    playPenWrite();
    setNames((current) => [...current, next]);
    setWinner(null);
    setCircled(false);
    setCircling(false);
    setPenAtName(false);
  }

  function choose() {
    if (names.length < 2 || circling) return;
    const next = pickOne(names);
    setWinner(next);
    setCircled(false);
    setCircling(true);
    setPenAtName(true);
    playPenTravel();
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      playPenCircle();
      setCircled(true);
      timer.current = window.setTimeout(() => {
        setPenAtName(false);
        setCircling(false);
      }, CIRCLE_MS + HOLD_MS);
    }, PEN_TRAVEL_MS);
  }

  function refresh() {
    window.clearTimeout(timer.current);
    setNames([]);
    setDraft('');
    setWinner(null);
    setCircled(false);
    setCircling(false);
    setPenAtName(false);
    setPen(REST_PEN);
  }

  const full = names.length >= LINE_Y.length;
  const liveDraft = !full && draft.trim() ? draft.trim() : '';

  return (
    <div className="names-page">
      <div className="names-desk" aria-hidden="true" />

      <div className="names-hud">
        <button
          className="back"
          type="button"
          onClick={() => {
            window.location.hash = '#/';
          }}
        >
          ← justmyluck.wtf
        </button>
        <button className="ghost names-refresh" onClick={refresh} type="button">
          Refresh
        </button>
      </div>

      <div className="sheet-stage">
        <div className="sheet-wrap" ref={sheetRef}>
          <img alt="Notebook paper" className="sheet-img" src={`${import.meta.env.BASE_URL}paper/sheet.png`} />
          <ol className="sheet-lines">
            {names.map((name, index) => (
              <li
                className={winner === name && circled ? 'ink winner' : 'ink'}
                key={`${name}-${index}`}
                style={
                  {
                    '--line-y': `${LINE_Y[index]}%`,
                    '--tilt': `${((index * 17) % 5) - 2}deg`,
                  } as CSSProperties
                }
              >
                <span
                  ref={(node) => {
                    nameRefs.current[index] = node;
                  }}
                >
                  {name}
                  {winner === name && circled ? (
                    <svg aria-hidden="true" className="red-circle" viewBox="0 0 120 40">
                      <ellipse cx="60" cy="20" rx="54" ry="16" />
                    </svg>
                  ) : null}
                </span>
              </li>
            ))}
            {liveDraft ? (
              <li
                className="ink draft"
                style={
                  {
                    '--line-y': `${LINE_Y[names.length]}%`,
                    '--tilt': '-0.6deg',
                  } as CSSProperties
                }
              >
                <span>{liveDraft}</span>
              </li>
            ) : null}
          </ol>

          <div
            className={`pen-anchor${penAtName ? ' is-circling' : ''}`}
            style={{ left: `${pen.left}%`, top: `${pen.top}%` }}
          >
            <img alt="" className="pen-prop" src={`${import.meta.env.BASE_URL}paper/pen.png`} />
          </div>

          <img alt="" className="pencil-prop" src={`${import.meta.env.BASE_URL}paper/pencil.png`} />
        </div>
      </div>

      <form className="names-dock" onSubmit={addName}>
        <input
          autoComplete="off"
          autoFocus
          onChange={(event) => {
            setDraft(event.target.value);
            if (winner) {
              setWinner(null);
              setCircled(false);
              setPenAtName(false);
            }
          }}
          placeholder={full ? 'Paper is full — refresh' : 'Type a name, press return'}
          value={draft}
        />
        <button className="ghost" disabled={full} type="submit">
          Add
        </button>
        <button className="primary" disabled={names.length < 2 || circling} onClick={choose} type="button">
          {circling ? '…' : 'Choose'}
        </button>
      </form>
    </div>
  );
}
