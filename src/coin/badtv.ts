import { Vector2 } from 'three';

export const BadTVShader = {
  uniforms: {
    tDiffuse: { value: null },
    u_time: { value: 0 },
    u_strength: { value: 0.12 },
    u_resolution: { value: new Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 v_uv;
    void main() {
      v_uv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float u_time;
    uniform float u_strength;
    uniform vec2 u_resolution;
    varying vec2 v_uv;

    highp float random1d(float dt) {
      highp float c = 43758.5453;
      highp float sn = mod(dt, 3.14);
      return fract(sin(sn) * c);
    }

    highp float noise1d(float value) {
      highp float i = floor(value);
      highp float f = fract(value);
      return mix(random1d(i), random1d(i + 1.0), smoothstep(0.0, 1.0, f));
    }

    highp float random2d(vec2 co) {
      highp float a = 12.9898;
      highp float b = 78.233;
      highp float c = 43758.5453;
      highp float dt = dot(co.xy, vec2(a, b));
      highp float sn = mod(dt, 3.14);
      return fract(sin(sn) * c);
    }

    void main() {
      float strength = (0.3 + 0.7 * noise1d(0.3 * u_time)) * u_strength;
      float jump = 500.0 * floor(0.3 * u_strength * (u_time + noise1d(u_time)));
      vec2 uv = v_uv;
      uv.y += 0.2 * strength * (noise1d(5.0 * v_uv.y + 2.0 * u_time + jump) - 0.5);
      uv.x += 0.1 * strength * (noise1d(100.0 * strength * uv.y + 3.0 * u_time + jump) - 0.5);
      vec3 pixel_color = texture2D(tDiffuse, uv).rgb;
      pixel_color += vec3(5.0 * strength * (random2d(v_uv + 1.133001 * vec2(u_time, 1.13)) - 0.5));
      gl_FragColor = vec4(pixel_color, 1.0);
    }
  `,
};
