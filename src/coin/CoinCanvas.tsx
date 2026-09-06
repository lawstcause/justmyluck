import { useEffect, useRef } from 'react';
import {
  AmbientLight,
  Clock,
  Color,
  CylinderGeometry,
  DirectionalLight,
  LineBasicMaterial,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { makeBolt, scatterBolts } from './lightning';

type CoinCanvasProps = {
  spinning: boolean;
  face: 'heads' | 'tails' | null;
  onFlip: () => void;
};

const HEADS_X = Math.PI / 2;
const TAILS_X = -Math.PI / 2;
const FLIP_MS = 1150;
const ORANGE = 0xff4d00;

function asset(name: string) {
  return `${import.meta.env.BASE_URL}coin/${name}`;
}

export function CoinCanvas({ spinning, face, onFlip }: CoinCanvasProps) {
  const host = useRef<HTMLButtonElement>(null);
  const spinRef = useRef(spinning);
  const faceRef = useRef(face);

  spinRef.current = spinning;
  faceRef.current = face;

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const mount: HTMLElement = node;

    const scene = new Scene();
    scene.background = new Color(0x0b0a09);

    const camera = new PerspectiveCamera(28, 1, 0.1, 50);
    camera.position.set(0, 0.55, 5.2);

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0b0a09, 1);
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const pmrem = new PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const loader = new TextureLoader();
    const headsMap = loader.load(asset('heads.jpg'));
    const tailsMap = loader.load(asset('tails.jpg'));
    const edgeMap = loader.load(asset('edge.jpg'));
    headsMap.colorSpace = SRGBColorSpace;
    tailsMap.colorSpace = SRGBColorSpace;
    edgeMap.colorSpace = SRGBColorSpace;
    edgeMap.wrapS = RepeatWrapping;
    edgeMap.wrapT = RepeatWrapping;

    const physical = {
      metalness: 0.85,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.15,
    };

    const geo = new CylinderGeometry(1, 1, 0.085, 96);
    const side = new MeshPhysicalMaterial({ map: edgeMap, ...physical });
    const heads = new MeshPhysicalMaterial({
      map: headsMap,
      ...physical,
      emissive: new Color(ORANGE),
      emissiveIntensity: 0,
    });
    const tails = new MeshPhysicalMaterial({
      map: tailsMap,
      ...physical,
      emissive: new Color(ORANGE),
      emissiveIntensity: 0,
    });
    const coin = new Mesh(geo, [side, heads, tails]);
    coin.rotation.x = HEADS_X;
    scene.add(coin);

    scene.add(new AmbientLight(ORANGE, 0.35));
    const key = new DirectionalLight(0xfff4e8, 1.2);
    key.position.set(2.6, 4.2, 3.4);
    scene.add(key);
    const fill = new DirectionalLight(0x6a7c90, 0.28);
    fill.position.set(-3.2, 0.4, 2);
    scene.add(fill);
    const flash = new PointLight(ORANGE, 0, 8, 2);
    flash.position.set(0, 0.6, 1.4);
    scene.add(flash);

    const ground = new Reflector(new PlaneGeometry(22, 22), {
      clipBias: 0.003,
      textureWidth: 1024,
      textureHeight: 1024,
      color: 0x1a1a1a,
    });
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.08;
    scene.add(ground);

    const bolts = Array.from({ length: 7 }, () => makeBolt(new Vector3(), new Vector3(0, 1, 0)));
    bolts.forEach((bolt) => scene.add(bolt));

    const clock = new Clock();
    let raf = 0;
    let fromX = HEADS_X;
    let toX = HEADS_X;
    let fromZ = 0;
    let toZ = 0;
    let flipStart = -1;
    let lastSpinning = false;
    let flashAmt = 0;
    let landed = false;

    function strike(origin: Vector3) {
      flashAmt = 1;
      scatterBolts(bolts, origin);
    }

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
      const spinningNow = spinRef.current;

      if (spinningNow && !lastSpinning) {
        fromX = coin.rotation.x;
        fromZ = coin.rotation.z;
        const land = faceRef.current === 'tails' ? TAILS_X : HEADS_X;
        const extra = Math.PI * 2 * (5 + Math.floor(Math.random() * 2));
        toX = land + extra;
        toZ = (Math.random() - 0.5) * 0.55;
        flipStart = t;
        landed = false;
        strike(coin.position.clone().add(new Vector3(0, 0.2, 0.4)));
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
        coin.position.y = Math.sin(u * Math.PI) * 0.55;
        if (u > 0.82 && !landed) {
          landed = true;
          strike(new Vector3(0, -0.2, 0.3));
        }
      } else {
        const rest = faceRef.current === 'tails' ? TAILS_X : HEADS_X;
        coin.rotation.x += (rest - coin.rotation.x) * 0.12;
        coin.rotation.y = Math.sin(t * 0.32) * 0.16;
        coin.rotation.z += (0 - coin.rotation.z) * 0.1;
        coin.position.y += (0 - coin.position.y) * 0.12;
      }

      flashAmt *= 0.9;
      flash.intensity = flashAmt * 14;
      heads.emissiveIntensity = flashAmt * 1.8;
      tails.emissiveIntensity = flashAmt * 1.8;
      for (const bolt of bolts) {
        (bolt.material as LineBasicMaterial).opacity = flashAmt;
        bolt.visible = flashAmt > 0.04;
      }

      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(tick);
    }

    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      pmrem.dispose();
      geo.dispose();
      side.dispose();
      heads.dispose();
      tails.dispose();
      headsMap.dispose();
      tailsMap.dispose();
      edgeMap.dispose();
      ground.geometry.dispose();
      bolts.forEach((bolt) => {
        bolt.geometry.dispose();
        (bolt.material as LineBasicMaterial).dispose();
      });
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
