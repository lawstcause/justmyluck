const stage = document.getElementById('stage');
const diceEls = [document.getElementById('dice-1'), document.getElementById('dice-2')];

const rotations = {
  1: 'rotateX(0deg) rotateY(0deg)',
  2: 'rotateY(-90deg)',
  3: 'rotateY(180deg)',
  4: 'rotateY(90deg)',
  5: 'rotateX(-90deg)',
  6: 'rotateX(90deg)'
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
  const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.35, audioCtx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i += 1) {
    noiseData[i] = Math.random() * 2 - 1;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;

  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.setValueAtTime(600, now);

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

  const tone = audioCtx.createOscillator();
  tone.type = 'triangle';
  tone.frequency.setValueAtTime(520, now);
  tone.frequency.exponentialRampToValueAtTime(260, now + 0.22);

  const toneGain = audioCtx.createGain();
  toneGain.gain.setValueAtTime(0.0001, now);
  toneGain.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

  noise.connect(noiseFilter).connect(noiseGain).connect(audioCtx.destination);
  tone.connect(toneGain).connect(audioCtx.destination);

  noise.start(now);
  tone.start(now);
  noise.stop(now + 0.36);
  tone.stop(now + 0.32);
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

function animateDice(dice) {
  const stageRect = stage.getBoundingClientRect();
  const diceRect = dice.getBoundingClientRect();
  const padding = 24;

  const maxX = stageRect.width - diceRect.width - padding;
  const maxY = stageRect.height - diceRect.height - padding;

  const currentX = Number(dice.dataset.x || padding);
  const currentY = Number(dice.dataset.y || padding);
  const { x: targetX, y: targetY } = pickPosition(dice);

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
  cube.style.transform = rotations[value];
}

function rollDice() {
  if (rolling) return;
  rolling = true;

  const value = pickNewValue();
  playRollSound();

  diceEls.forEach((dice) => {
    animateDice(dice);
    const cube = dice.querySelector('.cube');
    cube.classList.add('spinning');
  });

  setTimeout(() => {
    diceEls.forEach((dice) => {
      const cube = dice.querySelector('.cube');
      cube.classList.remove('spinning');
      setDiceValue(dice, value);
    });
    rolling = false;
  }, 900);
}

setDiceValue(diceEls[0], 1);
setDiceValue(diceEls[1], 1);

animateDice(diceEls[0]);
animateDice(diceEls[1]);

document.addEventListener('click', () => {
  rollDice();
});

window.addEventListener('resize', () => {
  diceEls.forEach((dice) => animateDice(dice));
});
