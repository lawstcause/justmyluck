import { useMemo, useState } from 'react';
import { parseList, pickOne } from '../rng';

type ListPickProps = {
  kicker: string;
  title: string;
  lede: string;
  placeholder: string;
  tool: 'names' | 'action';
  seedList?: string;
  seedLabel?: string;
};

export function ListPick({
  kicker,
  title,
  lede,
  placeholder,
  tool,
  seedList,
  seedLabel,
}: ListPickProps) {
  const [raw, setRaw] = useState(seedList ?? '');
  const [winner, setWinner] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [reroll, setReroll] = useState(false);
  const items = useMemo(() => parseList(raw), [raw]);

  function roll(again = false) {
    if (items.length < 2 || spinning) return;
    setSpinning(true);
    setWinner(null);
    window.setTimeout(() => {
      const next = pickOne(items);
      setWinner(next);
      setReroll(again);
      setSpinning(false);
    }, 420);
  }

  return (
    <div className="tool">
      <p className="kicker">{kicker}</p>
      <h1>{title}</h1>
      <p className="lede">{lede}</p>

      <textarea
        onChange={(event) => {
          setRaw(event.target.value);
          setWinner(null);
          setReroll(false);
        }}
        placeholder={placeholder}
        rows={8}
        value={raw}
      />
      <div className="tool-meta">
        <span>{items.length} in the hat</span>
        {seedList && seedLabel ? (
          <button
            className="text-btn"
            onClick={() => {
              setRaw(seedList);
              setWinner(null);
              setReroll(false);
            }}
            type="button"
          >
            {seedLabel}
          </button>
        ) : null}
      </div>

      <div className="row">
        <button className="primary" disabled={items.length < 2 || spinning} onClick={() => roll(false)} type="button">
          {spinning ? 'Picking…' : 'Pick one'}
        </button>
        {winner ? (
          <button className="ghost" disabled={spinning} onClick={() => roll(true)} type="button">
            Pick again
          </button>
        ) : null}
      </div>

      {winner ? (
        <div className={`result${reroll ? ' again' : ''}`}>
          <p className="kicker">{reroll ? 'again' : 'luck picked'}</p>
          <p className="name">{winner}</p>
        </div>
      ) : null}
    </div>
  );
}
