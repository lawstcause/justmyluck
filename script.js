const stage = document.getElementById('stage');
const diceEls = [document.getElementById('dice-1'), document.getElementById('dice-2')];

const rotations = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: 0, y: 180 },
  4: { x: 0, y: 90 },
  5: { x: -90, y: 0 },
  6: { x: 90, y: 0 }
};

let lastValue = 1;
let rolling = false;
let audioCtx;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickNewValue() {
  let value = randomInt(1, 6);
  while (value === lastValue) {
    value = randomInt(1, 6);
  }
  lastValue = value;
  return value;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function playRollSound() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  const now = audioCtx.currentTime;

  function makeNoiseBuffer(duration) {
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function rattleBurst(startTime, duration, gainValue, highpassFreq) {
    const noise = audioCtx.createBufferSource();
    noise.buffer = makeNoiseBuffer(duration);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(highpassFreq, startTime);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    noise.connect(filter).connect(gain).connect(audioCtx.destination);
    noise.start(startTime);
    noise.stop(startTime + duration + 0.02);
  }

  function thud(startTime, freq, duration, gainValue) {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, startTime + duration);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain).connect(audioCtx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  // A few quick rattles followed by a couple of thuds feels like dice.
  rattleBurst(now, 0.18, 0.22, 800);
  rattleBurst(now + 0.12, 0.18, 0.18, 1200);
  rattleBurst(now + 0.26, 0.16, 0.14, 1600);

  thud(now + 0.28, 220, 0.14, 0.18);
  thud(now + 0.4, 180, 0.12, 0.14);
}

function pickPosition(dice) {
  const stageRect = stage.getBoundingClientRect();
  const diceRect = dice.getBoundingClientRect();
  const padding = 24;

  const maxX = stageRect.width - diceRect.width - padding;
  const maxY = stageRect.height - diceRect.height - padding;

  const x = randomInt(padding, Math.max(padding, Math.floor(maxX)));
  const y = randomInt(padding, Math.max(padding, Math.floor(maxY)));

  return { x, y };
}

function isTooClose(a, b, minDistance) {
  if (!a || !b) return false;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy) < minDistance;
}

function placeDice(dice, x, y) {
  const tiltX = randomInt(-18, 18);
  const tiltY = randomInt(-18, 18);
  dice.style.transform = `translate3d(${x}px, ${y}px, 0px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  dice.dataset.x = x;
  dice.dataset.y = y;
}

function animateDice(dice, avoidPoint) {
  const stageRect = stage.getBoundingClientRect();
  const diceRect = dice.getBoundingClientRect();
  const padding = 24;

  const maxX = stageRect.width - diceRect.width - padding;
  const maxY = stageRect.height - diceRect.height - padding;

  const currentX = Number(dice.dataset.x || padding);
  const currentY = Number(dice.dataset.y || padding);
  let target = pickPosition(dice);
  const minDistance = diceRect.width * 0.9;
  let attempts = 0;
  while (avoidPoint && isTooClose(target, avoidPoint, minDistance) && attempts < 12) {
    target = pickPosition(dice);
    attempts += 1;
  }
  const targetX = target.x;
  const targetY = target.y;

  const hop1 = {
    x: clamp(targetX + randomInt(-120, 120), padding, Math.max(padding, Math.floor(maxX))),
    y: clamp(currentY + randomInt(-120, 120), padding, Math.max(padding, Math.floor(maxY)))
  };
  const hop2 = {
    x: clamp(targetX + randomInt(-80, 80), padding, Math.max(padding, Math.floor(maxX))),
    y: clamp(targetY + randomInt(-140, 140), padding, Math.max(padding, Math.floor(maxY)))
  };

  const tiltX = randomInt(-25, 25);
  const tiltY = randomInt(-25, 25);
  const spinZ = randomInt(0, 360);

  if (dice._anim) dice._anim.cancel();

  dice._anim = dice.animate(
    [
      { transform: `translate3d(${currentX}px, ${currentY}px, 0px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)` },
      { transform: `translate3d(${hop1.x}px, ${hop1.y}px, 0px) rotateX(${tiltX + 10}deg) rotateY(${tiltY - 10}deg)` },
      { transform: `translate3d(${hop2.x}px, ${hop2.y}px, 0px) rotateX(${tiltX - 8}deg) rotateY(${tiltY + 12}deg)` },
      { transform: `translate3d(${targetX}px, ${targetY}px, 0px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotateZ(${spinZ}deg)` }
    ],
    {
      duration: 900,
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      fill: 'forwards'
    }
  );

  dice.dataset.x = targetX;
  dice.dataset.y = targetY;
}

function setDiceValue(dice, value) {
  const cube = dice.querySelector('.cube');
  const rot = rotations[value];
  cube.style.transform = `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`;
  cube.dataset.rx = String(rot.x);
  cube.dataset.ry = String(rot.y);
}

function animateCubeToValue(dice, value) {
  const cube = dice.querySelector('.cube');
  const rot = rotations[value];
  const fromX = Number(cube.dataset.rx || 0);
  const fromY = Number(cube.dataset.ry || 0);
  const spinsX = 360 * randomInt(2, 3);
  const spinsY = 360 * randomInt(2, 3);

  if (cube._anim) cube._anim.cancel();

  cube._anim = cube.animate(
    [
      { transform: `rotateX(${fromX}deg) rotateY(${fromY}deg)` },
      { transform: `rotateX(${fromX + spinsX}deg) rotateY(${fromY + spinsY}deg)` },
      { transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }
    ],
    {
      duration: 900,
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      fill: 'forwards'
    }
  );

  cube.dataset.rx = String(rot.x);
  cube.dataset.ry = String(rot.y);
}

function rollDice() {
  if (rolling) return;
  rolling = true;

  const value = pickNewValue();
  playRollSound();

  const firstDice = diceEls[0];
  const secondDice = diceEls[1];
  const stageRect = stage.getBoundingClientRect();
  if (stageRect.width < 260) {
    animateDice(firstDice);
    animateDice(secondDice);
  } else {
    animateDice(firstDice);
    const avoidPoint = {
      x: Number(firstDice.dataset.x),
      y: Number(firstDice.dataset.y)
    };
    animateDice(secondDice, avoidPoint);
  }
  diceEls.forEach((dice) => animateCubeToValue(dice, value));

  setTimeout(() => {
    rolling = false;
  }, 900);
}

function seedPositions() {
  const stageRect = stage.getBoundingClientRect();
  const padding = 30;
  const leftX = padding;
  const rightX = Math.max(padding, stageRect.width - 180);
  const midY = Math.max(padding, stageRect.height / 2 - 80);

  placeDice(diceEls[0], leftX, midY);
  placeDice(diceEls[1], rightX, midY - 40);
}

setDiceValue(diceEls[0], 1);
setDiceValue(diceEls[1], 1);
seedPositions();

document.addEventListener('click', () => {
  rollDice();
});

window.addEventListener('resize', () => {
  seedPositions();
});
