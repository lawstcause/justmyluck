import { useEffect, useRef } from 'react';
import {
  AmbientLight,
  Clock,
  CylinderGeometry,
  DirectionalLight,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer,
} from 'three';
import { pickOne } from '../rng';
import { playCoinLand, playCoinToss } from '../sound';

type CoinCanvasProps = {
  pack: 'quarter' | 'yesno';
  onLand: (face: 'heads' | 'tails', strength: number) => void;
};

const HEADS = 0;
const TAILS = Math.PI;
const REST_Y = 0.048;
const THICK = 0.09;

function asset(pack: 'quarter' | 'yesno', name: string) {
  const folder = pack === 'yesno' ? 'coin/yesno' : 'coin';
  const file =
    pack === 'yesno'
      ? { 'heads.jpg': 'yes.jpg', 'tails.jpg': 'no.jpg', 'edge.jpg': 'rim.jpg' }[name] ?? name
      : name;
  return `${import.meta.env.BASE_URL}${folder}/${file}`;
}

function deskUrl() {
  return `${import.meta.env.BASE_URL}desk/wood.jpg`;
}

export function CoinCanvas({ pack, onLand }: CoinCanvasProps) {
  const host = useRef<HTMLDivElement>(null);
  const landRef = useRef(onLand);
  landRef.current = onLand;

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const mount: HTMLElement = node;

    const scene = new Scene();
    const camera = new PerspectiveCamera(32, 1, 0.1, 80);
    camera.position.set(0, 3.6, 4.4);
    camera.lookAt(0, 0.05, 0);

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    const loader = new TextureLoader();
    const woodMap = loader.load(deskUrl());
    woodMap.colorSpace = SRGBColorSpace;
    woodMap.wrapS = RepeatWrapping;
    woodMap.wrapT = RepeatWrapping;
    woodMap.repeat.set(3, 3);

    const headsMap = loader.load(asset(pack, 'heads.jpg'));
    const tailsMap = loader.load(asset(pack, 'tails.jpg'));
    const edgeMap = loader.load(asset(pack, 'edge.jpg'));
    headsMap.colorSpace = SRGBColorSpace;
    tailsMap.colorSpace = SRGBColorSpace;
    edgeMap.colorSpace = SRGBColorSpace;
    edgeMap.wrapS = RepeatWrapping;
    edgeMap.wrapT = RepeatWrapping;

    const desk = new Mesh(
      new PlaneGeometry(28, 28),
      new MeshStandardMaterial({ map: woodMap, roughness: 0.82, metalness: 0.04 }),
    );
    desk.rotation.x = -Math.PI / 2;
    desk.receiveShadow = true;
    scene.add(desk);

    const physical = {
      metalness: 0.7,
      roughness: 0.28,
      clearcoat: 0.65,
      clearcoatRoughness: 0.2,
    };
    const geo = new CylinderGeometry(1, 1, THICK, 96);
    const side = new MeshPhysicalMaterial({ map: edgeMap, ...physical });
    const headsMat = new MeshPhysicalMaterial({ map: headsMap, ...physical });
    const tailsMat = new MeshPhysicalMaterial({ map: tailsMap, ...physical });
    const coin = new Mesh(geo, [side, headsMat, tailsMat]);
    coin.position.y = REST_Y;
    coin.castShadow = true;
    scene.add(coin);

    scene.add(new AmbientLight(0xffe6c4, 0.55));
    const key = new DirectionalLight(0xfff1d6, 1.35);
    key.position.set(3, 8, 4);
    key.castShadow = true;
    scene.add(key);
    const fill = new DirectionalLight(0x6d5a44, 0.35);
    fill.position.set(-4, 3, -2);
    scene.add(fill);

    type Toss = {
      start: number;
      duration: number;
      fromX: number;
      toX: number;
      height: number;
      face: 'heads' | 'tails';
      strength: number;
    };

    const clock = new Clock();
    let raf = 0;
    let toss: Toss | null = null;
    let restFace: 'heads' | 'tails' = 'heads';
    let pointer: { x: number; y: number; t: number } | null = null;
    let lastMove = { x: 0, y: 0, t: 0 };

    function currentX() {
      return restFace === 'heads' ? HEADS : TAILS;
    }

    function launch(strength: number, dir: number) {
      if (toss) return;
      const power = Math.min(1, Math.max(0.25, strength));
      const face = pickOne(['heads', 'tails'] as const);
      let halfTurns = 3 + Math.round(power * 8);
      const same = face === restFace;
      if (same && halfTurns % 2 === 1) halfTurns += 1;
      if (!same && halfTurns % 2 === 0) halfTurns += 1;
      const sign = dir < 0 ? -1 : 1;
      const fromX = currentX();
      toss = {
        start: clock.getElapsedTime(),
        duration: 0.65 + power * 0.7,
        fromX,
        toX: fromX + sign * Math.PI * halfTurns,
        height: 1.28 + power * 1.35,
        face,
        strength: power,
      };
      playCoinToss(power, toss.duration);
    }

    function isUi(target: EventTarget | null) {
      return target instanceof Element && Boolean(target.closest('a, .back, input, textarea'));
    }

    function onDown(event: PointerEvent) {
      if (isUi(event.target) || toss) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointer = { x: event.clientX, y: event.clientY, t: performance.now() };
      lastMove = { ...pointer };
    }

    function onMove(event: PointerEvent) {
      if (!pointer) return;
      if (event.pointerType === 'mouse' && event.buttons === 0) {
        pointer = null;
        return;
      }
      lastMove = { x: event.clientX, y: event.clientY, t: performance.now() };
    }

    function onUp() {
      if (!pointer || toss) {
        pointer = null;
        return;
      }
      const dt = Math.max(16, lastMove.t - pointer.t);
      const dx = lastMove.x - pointer.x;
      const dy = lastMove.y - pointer.y;
      const dist = Math.hypot(dx, dy);
      const speed = dist / dt;
      pointer = null;
      if (dist < 12) {
        launch(0.45 + Math.random() * 0.25, -1);
        return;
      }
      launch(Math.min(1, speed / 1.8), dy);
    }

    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    function resize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    function tick() {
      const t = clock.getElapsedTime();
      if (toss) {
        const u = Math.min(1, (t - toss.start) / toss.duration);
        const ease = 1 - Math.pow(1 - u, 2.4);
        coin.rotation.x = toss.fromX + (toss.toX - toss.fromX) * ease;
        coin.rotation.z = 0;
        coin.rotation.y = 0;
        coin.position.y = REST_Y + Math.sin(u * Math.PI) * toss.height;
        coin.position.x = Math.sin(u * Math.PI) * 0.12 * toss.strength * (toss.toX < toss.fromX ? -1 : 1);
        if (u >= 1) {
          restFace = toss.face;
          coin.rotation.x = restFace === 'heads' ? HEADS : TAILS;
          coin.rotation.z = 0;
          coin.position.y = REST_Y;
          playCoinLand(toss.strength);
          landRef.current(toss.face, toss.strength);
          toss = null;
        }
      } else if (pointer) {
        const dx = lastMove.x - pointer.x;
        const dy = lastMove.y - pointer.y;
        coin.rotation.set(currentX(), 0, 0);
        coin.position.x += (dx * 0.006 - coin.position.x) * 0.4;
        coin.position.z += (dy * 0.006 - coin.position.z) * 0.4;
        coin.position.y += (0.16 - coin.position.y) * 0.3;
      } else {
        coin.rotation.set(currentX(), 0, 0);
        coin.position.x += (0 - coin.position.x) * 0.16;
        coin.position.z += (0 - coin.position.z) * 0.16;
        coin.position.y = REST_Y;
      }
      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(tick);
    }
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      ro.disconnect();
      renderer.dispose();
      geo.dispose();
      side.dispose();
      headsMat.dispose();
      tailsMat.dispose();
      desk.geometry.dispose();
      (desk.material as MeshStandardMaterial).dispose();
      woodMap.dispose();
      headsMap.dispose();
      tailsMap.dispose();
      edgeMap.dispose();
      renderer.domElement.remove();
    };
  }, [pack]);

  return <div className="desk-stage" ref={host} />;
}
