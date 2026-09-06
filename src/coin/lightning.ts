import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  Vector3,
} from 'three';

const ORANGE = new Color('#ff4d00');

export function makeBolt(from: Vector3, toward: Vector3, segments = 9): Line {
  const positions: number[] = [];
  const p = from.clone();
  positions.push(p.x, p.y, p.z);
  const step = toward.clone().sub(from).multiplyScalar(1 / segments);

  for (let i = 0; i < segments; i += 1) {
    p.add(step);
    p.x += (Math.random() - 0.5) * 0.22;
    p.y += (Math.random() - 0.5) * 0.22;
    p.z += (Math.random() - 0.5) * 0.12;
    positions.push(p.x, p.y, p.z);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  const material = new LineBasicMaterial({
    color: ORANGE,
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const line = new Line(geometry, material);
  line.visible = false;
  return line;
}

export function scatterBolts(bolts: Line[], origin: Vector3) {
  for (const bolt of bolts) {
    const dir = new Vector3(
      (Math.random() - 0.5) * 2.4,
      0.4 + Math.random() * 1.6,
      (Math.random() - 0.5) * 1.4,
    );
    const target = origin.clone().add(dir);
    const positions = bolt.geometry.getAttribute('position');
    const p = origin.clone();
    const step = target.clone().sub(origin).multiplyScalar(1 / (positions.count - 1));
    for (let i = 0; i < positions.count; i += 1) {
      if (i > 0) {
        p.add(step);
        p.x += (Math.random() - 0.5) * 0.2;
        p.y += (Math.random() - 0.5) * 0.2;
        p.z += (Math.random() - 0.5) * 0.1;
      }
      positions.setXYZ(i, p.x, p.y, p.z);
    }
    positions.needsUpdate = true;
    bolt.visible = true;
  }
}
