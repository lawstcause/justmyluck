import { useEffect, useRef } from 'react';
import {
  AmbientLight,
  Clock,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { BadTVShader } from './badtv';

type CoinCanvasProps = {
  spinning: boolean;
  face: 'heads' | 'tails' | null;
  onFlip: () => void;
};

const HEADS_X = -Math.PI / 2;
const TAILS_X = Math.PI / 2;
const FLIP_MS = 1150;

function asset(name: string) {
  const base = import.meta.env.BASE_URL;
  return `${base}coin/${name}`;
}

export function CoinCanvas({ spinning, face, onFlip }: CoinCanvasProps) {
  const host = useRef<HTMLButtonElement>(null);
  const spinRef = useRef(spinning);
  const faceRef = useRef(face);
  const strengthRef = useRef(0.14);

  spinRef.current = spinning;
  faceRef.current = face;

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const mount: HTMLElement = node;

    const scene = new Scene();
    scene.background = new Color(0x0b0a09);

    const camera = new PerspectiveCamera(32, 1, 0.1, 40);
    camera.position.set(0, 0.35, 4.6);

    const renderer = new WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0b0a09, 1);
    mount.appendChild(renderer.domElement);

    const loader = new TextureLoader();
    const headsMap = loader.load(asset('heads.jpg'));
    const tailsMap = loader.load(asset('tails.jpg'));
    const edgeMap = loader.load(asset('edge.jpg'));
    headsMap.colorSpace = SRGBColorSpace;
    tailsMap.colorSpace = SRGBColorSpace;
    edgeMap.colorSpace = SRGBColorSpace;
    edgeMap.wrapS = RepeatWrapping;
    edgeMap.wrapT = RepeatWrapping;
    edgeMap.repeat.set(1, 1);

    const geo = new CylinderGeometry(1, 1, 0.085, 96);
    const side = new MeshStandardMaterial({ map: edgeMap, metalness: 0.72, roughness: 0.32 });
    const heads = new MeshStandardMaterial({ map: headsMap, metalness: 0.55, roughness: 0.38 });
    const tails = new MeshStandardMaterial({ map: tailsMap, metalness: 0.55, roughness: 0.38 });
    const coin = new Mesh(geo, [side, heads, tails]);
    coin.rotation.x = HEADS_X;
    scene.add(coin);

    scene.add(new AmbientLight(0xc8b89a, 0.55));
    const key = new DirectionalLight(0xfff4e0, 1.55);
    key.position.set(2.4, 3.2, 4);
    scene.add(key);
    const fill = new DirectionalLight(0x88a0b8, 0.35);
    fill.position.set(-3, -1, 2);
    scene.add(fill);
    const rim = new DirectionalLight(0xffe6b0, 0.45);
    rim.position.set(-1.5, 2.5, -3);
    scene.add(rim);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const badtv = new ShaderPass(BadTVShader);
    composer.addPass(badtv);

    const clock = new Clock();
    let raf = 0;
    let fromX = HEADS_X;
    let toX = HEADS_X;
    let fromZ = 0;
    let toZ = 0;
    let flipStart = -1;
    let lastSpinning = false;

    function resize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      (badtv.uniforms.u_resolution.value as Vector2).set(w, h);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    function tick() {
      const t = clock.getElapsedTime();
      const spinningNow = spinRef.current;

      if (spinningNow && !lastSpinning) {
        fromX = coin.rotation.x;
        fromZ = coin.rotation.z;
        const land = faceRef.current === 'tails' ? TAILS_X : HEADS_X;
        const extra = Math.PI * 2 * (5 + Math.floor(Math.random() * 2));
        toX = land + extra;
        toZ = (Math.random() - 0.5) * 0.7;
        flipStart = t;
      }
      if (!spinningNow && lastSpinning) {
        coin.rotation.x = faceRef.current === 'tails' ? TAILS_X : HEADS_X;
        coin.rotation.z = 0;
        flipStart = -1;
      }
      lastSpinning = spinningNow;

      if (spinningNow && flipStart >= 0) {
        const u = Math.min(1, (t - flipStart) / (FLIP_MS / 1000));
        const ease = 1 - Math.pow(1 - u, 3);
        coin.rotation.x = fromX + (toX - fromX) * ease;
        coin.rotation.z = fromZ + (toZ - fromZ) * Math.sin(u * Math.PI);
        coin.position.y = Math.sin(u * Math.PI) * 0.45;
        strengthRef.current += (0.72 - strengthRef.current) * 0.12;
      } else {
        const rest = faceRef.current === 'tails' ? TAILS_X : HEADS_X;
        coin.rotation.x += (rest - coin.rotation.x) * 0.12;
        coin.rotation.y = Math.sin(t * 0.35) * 0.18;
        coin.rotation.z += (0 - coin.rotation.z) * 0.1;
        coin.position.y += (0 - coin.position.y) * 0.12;
        strengthRef.current += (0.13 - strengthRef.current) * 0.06;
      }

      badtv.uniforms.u_time.value = t;
      badtv.uniforms.u_strength.value = strengthRef.current;
      composer.render();
      raf = window.requestAnimationFrame(tick);
    }

    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      composer.dispose();
      geo.dispose();
      side.dispose();
      heads.dispose();
      tails.dispose();
      headsMap.dispose();
      tailsMap.dispose();
      edgeMap.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <button
      aria-label="Flip the coin"
      className="coin-stage"
      onClick={onFlip}
      ref={host}
      type="button"
    />
  );
}
