import { useCallback, useEffect, useRef, useState } from 'react';
import { pickOne } from '../rng';
import { SEER_LINES } from '../seer';

const PANEL = {
  left: 23.415,
  top: 56.182,
  width: 53.008,
  height: 34.898,
};

const REVEAL_AT = 0.48;
const TICKET_SRC = `${import.meta.env.BASE_URL}scratch/ticket.png`;
const QUARTER_SRC = `${import.meta.env.BASE_URL}scratch/quarter.png`;

type CoinPose = { x: number; y: number; rot: number; down: boolean; on: boolean };

export function Scratch() {
  const [line, setLine] = useState(() => pickOne(SEER_LINES));
  const [ticketId, setTicketId] = useState(0);
  const [status, setStatus] = useState<'idle' | 'scratching' | 'picked'>('idle');

  const stageRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coinRef = useRef<HTMLDivElement>(null);
  const ticketImg = useRef<HTMLImageElement | null>(null);

  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const pose = useRef<CoinPose>({ x: 0, y: 0, rot: -12, down: false, on: false });
  const revealed = useRef(false);
  const started = useRef(false);
  const checkTick = useRef(0);

  const paintCoin = useCallback(() => {
    const el = coinRef.current;
    if (!el) return;
    const { x, y, rot, down, on } = pose.current;
    el.style.opacity = on ? '1' : '0';
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rot}deg) scale(${down ? 0.92 : 1})`;
    el.classList.toggle('is-down', down);
  }, []);

  const fillCoating = useCallback(() => {
    const canvas = canvasRef.current;
    const panel = panelRef.current;
    const img = ticketImg.current;
    if (!canvas || !panel || !img || !img.naturalWidth) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = panel.clientWidth;
    const cssH = panel.clientHeight;
    if (cssW < 8 || cssH < 8) return;

    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const sx = (PANEL.left / 100) * img.naturalWidth;
    const sy = (PANEL.top / 100) * img.naturalHeight;
    const sw = (PANEL.width / 100) * img.naturalWidth;
    const sh = (PANEL.height / 100) * img.naturalHeight;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    revealed.current = false;
  }, []);

  const finishReveal = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || revealed.current) return;
    revealed.current = true;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    setStatus('picked');
  }, []);

  const measureCleared = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || revealed.current) return;
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    const step = 16;
    let gone = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * step) {
      total += 1;
      if (data[i] < 40) gone += 1;
    }
    if (total > 0 && gone / total >= REVEAL_AT) finishReveal();
  }, [finishReveal]);

  const scratchAt = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      const panel = panelRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !panel || !ctx || revealed.current) return;

      const box = panel.getBoundingClientRect();
      if (box.width < 8) return;
      const x = ((clientX - box.left) / box.width) * canvas.width;
      const y = ((clientY - box.top) / box.height) * canvas.height;
      const brush = Math.max(18, canvas.width * 0.085);

      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = brush * 1.7;
      ctx.beginPath();
      const prev = last.current;
      if (prev) {
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(x, y, brush * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      last.current = { x, y };
      started.current = true;

      checkTick.current += 1;
      if (checkTick.current % 8 === 0) measureCleared();
    },
    [measureCleared],
  );

  useEffect(() => {
    const img = new Image();
    img.decoding = 'async';
    img.src = TICKET_SRC;
    const onLoad = () => {
      ticketImg.current = img;
      fillCoating();
    };
    img.addEventListener('load', onLoad);
    if (img.complete && img.naturalWidth) onLoad();
    return () => img.removeEventListener('load', onLoad);
  }, [ticketId, fillCoating]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      if (!started.current && !revealed.current) fillCoating();
    });
    ro.observe(panel);
    return () => ro.disconnect();
  }, [fillCoating, ticketId]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    function overPanel(cx: number, cy: number) {
      const box = panelRef.current?.getBoundingClientRect();
      if (!box) return false;
      const pad = 10;
      return cx >= box.left - pad && cx <= box.right + pad && cy >= box.top - pad && cy <= box.bottom + pad;
    }

    function onMove(event: PointerEvent) {
      const dx = event.clientX - pose.current.x;
      const dy = event.clientY - pose.current.y;
      pose.current.x = event.clientX;
      pose.current.y = event.clientY;
      pose.current.on = true;
      if (Math.hypot(dx, dy) > 0.4) {
        pose.current.rot += dx * 0.35 + dy * 0.08;
      }
      paintCoin();
      if (drawing.current) scratchAt(event.clientX, event.clientY);
    }

    function onDown(event: PointerEvent) {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('button, a, input, textarea, summary')) return;
      pose.current.x = event.clientX;
      pose.current.y = event.clientY;
      pose.current.on = true;
      pose.current.down = true;
      last.current = null;
      drawing.current = true;
      paintCoin();
      if (overPanel(event.clientX, event.clientY) && !revealed.current) {
        setStatus((s) => (s === 'picked' ? s : 'scratching'));
        scratchAt(event.clientX, event.clientY);
      }
      try {
        stageRef.current?.setPointerCapture(event.pointerId);
      } catch {
        /* older safari */
      }
    }

    function onUp(event: PointerEvent) {
      drawing.current = false;
      last.current = null;
      pose.current.down = false;
      paintCoin();
      if (event.pointerType === 'touch' || event.pointerType === 'pen') {
        pose.current.on = false;
        paintCoin();
      }
      measureCleared();
    }

    function onLeave() {
      if (drawing.current) return;
      pose.current.on = false;
      paintCoin();
    }

    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    stage.addEventListener('pointerleave', onLeave);
    return () => {
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      stage.removeEventListener('pointerleave', onLeave);
    };
  }, [measureCleared, paintCoin, scratchAt]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const box = wrap.getBoundingClientRect();
    pose.current = {
      x: box.right - 28,
      y: box.bottom - 64,
      rot: -18,
      down: false,
      on: true,
    };
    paintCoin();
  }, [paintCoin, ticketId]);

  function newTicket() {
    drawing.current = false;
    last.current = null;
    revealed.current = false;
    started.current = false;
    checkTick.current = 0;
    setLine(pickOne(SEER_LINES));
    setStatus('idle');
    setTicketId((n) => n + 1);
  }

  const long = line.length > 54;

  return (
    <div className="scratch-page" ref={stageRef}>
      <div className="scratch-desk" aria-hidden="true" />

      <div className="scratch-hud">
        <button
          className="back"
          type="button"
          onClick={() => {
            window.location.hash = '#/';
          }}
        >
          ← justmyluck.wtf
        </button>
        <p className="ticker-status">
          {status === 'scratching' ? 'scratching' : status === 'picked' ? 'luck picked' : 'use the quarter'}
        </p>
        <button className="ghost names-refresh" onClick={newTicket} type="button">
          New ticket
        </button>
      </div>

      <div className="scratch-stage">
        <div className="scratch-wrap" ref={wrapRef}>
          <img alt="Seer scratch-off ticket" className="scratch-ticket" draggable={false} src={TICKET_SRC} />
          <div
            className="scratch-panel"
            ref={panelRef}
            style={{
              left: `${PANEL.left}%`,
              top: `${PANEL.top}%`,
              width: `${PANEL.width}%`,
              height: `${PANEL.height}%`,
            }}
          >
            <p className={`scratch-line${long ? ' long' : ''}`}>{line}</p>
            <canvas className="scratch-latex" ref={canvasRef} />
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="scratch-coin" ref={coinRef} />
    </div>
  );
}
