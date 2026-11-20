import { useEffect, useState } from 'react';
import { getTally, TALLY_EVENT } from '../luck';

const MAX_MARKS = 30;

// Tally marks scratched into the desk: four strokes and a slash per group of five.
function Marks({ count }: { count: number }) {
  const shown = Math.min(count, MAX_MARKS);
  const groups = Math.ceil(shown / 5);
  const strokes: JSX.Element[] = [];
  for (let g = 0; g < groups; g += 1) {
    const inGroup = Math.min(5, shown - g * 5);
    const x0 = g * 34;
    for (let i = 0; i < Math.min(4, inGroup); i += 1) {
      const x = x0 + 4 + i * 6;
      const wobble = ((g * 7 + i * 3) % 5) - 2;
      strokes.push(<line key={`${g}-${i}`} x1={x} x2={x + wobble * 0.4} y1={3 + (i % 2)} y2={21 - (i % 3)} />);
    }
    if (inGroup === 5) {
      strokes.push(<line className="slash" key={`${g}-s`} x1={x0} x2={x0 + 28} y1={17} y2={6} />);
    }
  }
  const last = shown - (groups - 1) * 5;
  const width = (groups - 1) * 34 + (last === 5 ? 30 : Math.min(4, last) * 6 + 2);
  return (
    <svg aria-hidden="true" className="tally-marks" height="24" viewBox={`0 0 ${width} 24`} width={width}>
      {strokes}
    </svg>
  );
}

export function Tally() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getTally());
    const onTally = (event: Event) => setCount((event as CustomEvent<number>).detail);
    window.addEventListener(TALLY_EVENT, onTally);
    return () => window.removeEventListener(TALLY_EVENT, onTally);
  }, []);

  const text =
    count === 0
      ? 'Luck hasn’t decided anything for you yet.'
      : `Luck has decided ${count === 1 ? 'one thing' : `${count} things`} for you${count > MAX_MARKS ? ' (and counting)' : ''}.`;

  return (
    <p className="tally" title="Every pick on this site, carved into the desk. Kept in this browser only.">
      {count > 0 ? <Marks count={count} /> : null}
      <span>{text}</span>
    </p>
  );
}
