import * as THREE from 'three';
import { mergeColored, rand, V3 } from './utils.js';

export const FOG = 0xcfe9f5;
export const SUN_DIR = V3(76, 56, -240).normalize();

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.22, 'rgba(255,255,255,0.78)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.20)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- 程序化纹理 ----------
function asphaltTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#48525c';
  x.fillRect(0, 0, 512, 512);
  // 骨料颗粒
  for (let i = 0; i < 5200; i++) {
    const v = Math.random();
    x.fillStyle = v < 0.5 ? 'rgba(255,255,255,' + (0.02 + Math.random() * 0.05) + ')'
      : 'rgba(10,20,30,' + (0.03 + Math.random() * 0.06) + ')';
    const s = 1 + Math.random() * 2.4;
    x.fillRect(Math.random() * 512, Math.random() * 512, s, s);
  }
  // 修补斑块
  for (let i = 0; i < 7; i++) {
    x.fillStyle = 'rgba(30,38,46,' + (0.10 + Math.random() * 0.12) + ')';
    x.beginPath();
    x.ellipse(Math.random() * 512, Math.random() * 512, 24 + Math.random() * 60, 16 + Math.random() * 40, Math.random() * 3, 0, 7);
    x.fill();
  }
  // 车辙磨亮（x=±3.1m → 一块砖覆盖 14m 宽）
  for (const px of [128 - 57, 128 + 57]) {
    const g = x.createLinearGradient(px - 26, 0, px + 26, 0);
    g.addColorStop(0, 'rgba(90,100,110,0)');
    g.addColorStop(0.5, 'rgba(96,106,116,0.30)');
    g.addColorStop(1, 'rgba(90,100,110,0)');
    x.fillStyle = g;
    x.fillRect(px - 26, 0, 52, 512);
  }
  // 裂缝
  x.strokeStyle = 'rgba(20,26,32,0.5)';
  x.lineWidth = 1.6;
  for (let i = 0; i < 5; i++) {
    x.beginPath();
    let px = Math.random() * 512, py = Math.random() * 512;
    x.moveTo(px, py);
    for (let k = 0; k < 5; k++) { px += (Math.random() - 0.5) * 70; py += (Math.random() - 0.5) * 70; x.lineTo(px, py); }
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function sandTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 512, 0);
  g.addColorStop(0, '#ab9068');   // 湿沙（靠海一侧）
  g.addColorStop(0.28, '#cbb587');
  g.addColorStop(1, '#e2cfa2');   // 干沙
  x.fillStyle = g;
  x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3600; i++) {
    const v = Math.random();
    x.fillStyle = v < 0.5 ? 'rgba(255,250,235,' + (0.05 + Math.random() * 0.08) + ')'
      : 'rgba(120,95,60,' + (0.04 + Math.random() * 0.07) + ')';
    const s = 1 + Math.random() * 2;
    x.fillRect(Math.random() * 512, Math.random() * 512, s, s);
  }
  // 贝壳与卵石
  for (let i = 0; i < 26; i++) {
    x.fillStyle = ['rgba(240,235,225,0.85)', 'rgba(180,160,140,0.7)', 'rgba(150,130,115,0.6)'][i % 3];
    x.beginPath();
    x.ellipse(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 3.5, 1.5 + Math.random() * 2.5, Math.random() * 3, 0, 7);
    x.fill();
  }
  // 沙纹
  x.strokeStyle = 'rgba(120,95,60,0.10)';
  x.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    x.beginPath();
    const y0 = Math.random() * 512;
    x.moveTo(0, y0);
    for (let px = 0; px <= 512; px += 64) x.lineTo(px, y0 + Math.sin(px * 0.02 + i) * 7);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function signTexture(kind) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  if (kind === 'curve') {
    x.save();
    x.translate(128, 128); x.rotate(Math.PI / 4);
    x.fillStyle = '#f5c243'; x.fillRect(-86, -86, 172, 172);
    x.strokeStyle = '#8a6a10'; x.lineWidth = 7; x.strokeRect(-86, -86, 172, 172);
    x.restore();
    x.strokeStyle = '#1c2733'; x.lineWidth = 17; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(92, 152); x.quadraticCurveTo(150, 152, 150, 84); x.stroke();
    x.beginPath(); x.moveTo(150, 84); x.lineTo(126, 106); x.moveTo(150, 84); x.lineTo(174, 106); x.stroke();
  } else if (kind === 'coast') {
    x.fillStyle = '#0f6f4f';
    x.beginPath();
    const r = 18;
    x.moveTo(14 + r, 44); x.arcTo(242, 44, 242, 212, r); x.arcTo(242, 212, 14, 212, r);
    x.arcTo(14, 212, 14, 44, r); x.arcTo(14, 44, 242, 44, r); x.closePath(); x.fill();
    x.strokeStyle = '#fff'; x.lineWidth = 4;
    x.beginPath();
    x.moveTo(30, 184); x.quadraticCurveTo(60, 172, 90, 184); x.quadraticCurveTo(120, 196, 150, 184);
    x.quadraticCurveTo(180, 172, 210, 184); x.stroke();
    x.fillStyle = '#fff'; x.textAlign = 'center';
    x.font = 'bold 46px "Arial", sans-serif';
    x.fillText('COAST', 128, 110);
    x.font = 'bold 28px "Arial", sans-serif';
    x.fillText('LINE  →', 128, 152);
  } else {
    x.fillStyle = '#fdfdf8';
    x.beginPath(); x.arc(128, 128, 106, 0, 7); x.fill();
    x.strokeStyle = '#d84b40'; x.lineWidth = 24; x.stroke();
    x.fillStyle = '#1c2733'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = 'bold 88px "Arial", sans-serif';
    x.fillText('60', 128, 134);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// ---------- 几何 ----------
function palmGeometry() {
  const parts = [];
  let x = 0, y = 0;
  for (let i = 0; i < 6; i++) {
    const h = 0.78;
    const r0 = 0.29 - i * 0.031, r1 = 0.255 - i * 0.031;
    const seg = new THREE.CylinderGeometry(r1, r0, h, 8);
    seg.translate(x, y + h / 2, 0);
    parts.push({ g: seg, color: i % 2 ? 0x9c7749 : 0x88663f });
    x += 0.12;
    y += h;
  }
  const shade = new THREE.CircleGeometry(1.55, 16);
  shade.rotateX(-Math.PI / 2); shade.translate(0, 0.028, 0);
  parts.push({ g: shade, color: 0xd5bf8d });
  for (let i = 0; i < 9; i++) {
    const a = i * Math.PI * 2 / 9;
    for (let s = 0; s < 3; s++) {
      const leaf = new THREE.ConeGeometry(0.31 - s * 0.065, 1.20, 4);
      leaf.rotateZ(-Math.PI / 2 + 0.42 - s * 0.36);
      leaf.translate(x + 0.72 + s * 0.98, y + 0.24 - s * 0.36, 0);
      leaf.rotateY(a);
      parts.push({ g: leaf, color: (i + s) % 2 ? 0x2e8a56 : 0x43ab6c });
    }
    const tip = new THREE.ConeGeometry(0.10, 0.72, 4);
    tip.rotateZ(-Math.PI / 2 - 0.52);
    tip.translate(x + 3.20, y - 0.78, 0);
    tip.rotateY(a);
    parts.push({ g: tip, color: 0x28794b });
  }
  for (let i = 0; i < 3; i++) {
    const co = new THREE.IcosahedronGeometry(0.19, 0);
    co.translate(x + 0.20 * Math.cos(i * 2.1), y - 0.14, 0.20 * Math.sin(i * 2.1));
    parts.push({ g: co, color: 0x7c5a34 });
  }
  return mergeColored(parts);
}

function bushGeometry() {
  const parts = [];
  const blobs = [[0, 0.38, 0, 0.58], [0.48, 0.30, 0.12, 0.42], [-0.44, 0.32, -0.14, 0.44], [0.12, 0.55, -0.32, 0.38]];
  for (let i = 0; i < blobs.length; i++) {
    const [x, y, z, r] = blobs[i];
    const g = new THREE.IcosahedronGeometry(r, 0);
    g.scale(1, 0.76, 1); g.translate(x, y, z);
    parts.push({ g, color: i % 2 ? 0x5c9a58 : 0x4b8a4d });
  }
  const shade = new THREE.CircleGeometry(0.9, 12);
  shade.rotateX(-Math.PI / 2); shade.translate(0, 0.024, 0);
  parts.push({ g: shade, color: 0xd5bf8d });
  return mergeColored(parts);
}

function rockGeometry() {
  const parts = [];
  const a = new THREE.DodecahedronGeometry(0.58, 0);
  a.scale(1.25, 0.68, 1); a.translate(0, 0.36, 0);
  parts.push({ g: a, color: 0x8b989e });
  const b = new THREE.DodecahedronGeometry(0.33, 0);
  b.scale(1, 0.8, 1); b.translate(0.62, 0.20, 0.26);
  parts.push({ g: b, color: 0x74848c });
  const shade = new THREE.CircleGeometry(0.95, 12);
  shade.rotateX(-Math.PI / 2); shade.translate(0, 0.022, 0);
  parts.push({ g: shade, color: 0xd5bf8d });
  return mergeColored(parts);
}

function cloudGeometry() {
  const parts = [];
  const specs = [[-2.7, -0.05, 1.45, 0.60], [-0.95, 0.28, 1.85, 0.82], [1.05, 0.12, 1.65, 0.72], [2.65, -0.12, 1.25, 0.54], [0.05, -0.30, 3.0, 0.50]];
  for (const [x, y, sx, sy] of specs) {
    const g = new THREE.SphereGeometry(1, 10, 7);
    g.scale(sx, sy, 1); g.translate(x, y, 0);
    parts.push({ g, color: y < 0 ? 0xdceaf3 : 0xfbfdff });
  }
  return mergeColored(parts);
}

function gullGeometry() {
  const a = new THREE.BoxGeometry(1.15, 0.055, 0.16);
  a.rotateZ(0.26); a.translate(-0.56, 0, 0);
  const b = new THREE.BoxGeometry(1.15, 0.055, 0.16);
  b.rotateZ(-0.26); b.translate(0.56, 0, 0);
  return mergeColored([{ g: a, color: 0xfbfdff }, { g: b, color: 0xeef6fb }]);
}

function lampGeometry() {
  const parts = [];
  const pole = new THREE.CylinderGeometry(0.055, 0.085, 5.4, 8);
  pole.translate(0, 2.7, 0);
  parts.push({ g: pole, color: 0x3d4a52 });
  const cap = new THREE.SphereGeometry(0.09, 8, 6);
  cap.translate(0, 5.42, 0);
  parts.push({ g: cap, color: 0x2c363d });
  const arm = new THREE.CylinderGeometry(0.042, 0.048, 1.5, 6);
  arm.rotateZ(Math.PI / 2);
  arm.translate(-0.72, 5.18, 0);
  parts.push({ g: arm, color: 0x3d4a52 });
  const head = new THREE.BoxGeometry(0.52, 0.13, 0.24);
  head.translate(-1.42, 5.12, 0);
  parts.push({ g: head, color: 0x2c363d });
  const lens = new THREE.BoxGeometry(0.42, 0.05, 0.17);
  lens.translate(-1.42, 5.04, 0);
  parts.push({ g: lens, color: 0xfff0b0 });
  const base = new THREE.CylinderGeometry(0.14, 0.18, 0.24, 8);
  base.translate(0, 0.12, 0);
  parts.push({ g: base, color: 0x59666e });
  return mergeColored(parts);
}

function beachSpotGeometry(variant) {
  const parts = [];
  const pole = new THREE.CylinderGeometry(0.045, 0.05, 2.7, 6);
  pole.translate(0.6, 1.35, 0.3);
  parts.push({ g: pole, color: 0xd8d2c4 });
  const canopy = new THREE.ConeGeometry(1.55, 0.72, 12);
  canopy.translate(0.6, 2.55, 0.3);
  parts.push({ g: canopy, color: variant ? 0xe85d4a : 0x2e9bd0 });
  const tip = new THREE.SphereGeometry(0.09, 8, 6);
  tip.translate(0.6, 2.95, 0.3);
  parts.push({ g: tip, color: 0xf5f2e8 });
  const towel = new THREE.BoxGeometry(1.1, 0.045, 1.8);
  towel.rotateY(0.5); towel.translate(-0.9, 0.05, 0.9);
  parts.push({ g: towel, color: variant ? 0xf2d144 : 0x8fd4b8 });
  const board = new THREE.CapsuleGeometry(0.26, 1.5, 4, 10);
  board.rotateZ(0.30); board.translate(1.7, 0.92, -0.55);
  parts.push({ g: board, color: 0xfdf6e3 });
  const stripe = new THREE.CapsuleGeometry(0.262, 0.5, 4, 10);
  stripe.rotateZ(0.30); stripe.translate(1.7, 0.92, -0.55);
  parts.push({ g: stripe, color: variant ? 0xe85d4a : 0x2e9bd0 });
  const shade = new THREE.CircleGeometry(1.7, 12);
  shade.rotateX(-Math.PI / 2); shade.translate(0, 0.02, 0);
  parts.push({ g: shade, color: 0xd5bf8d });
  return mergeColored(parts);
}

function houseGeometry(variant) {
  const palettes = [
    { wall: 0xf2e3c8, roof: 0xb55b45 },
    { wall: 0xe3ecdf, roof: 0x6b7d8c },
    { wall: 0xf0dcd0, roof: 0x8c6b5a },
  ];
  const p = palettes[variant % 3];
  const parts = [];
  const base = new THREE.BoxGeometry(6, 4, 7);
  base.translate(0, 2, 0);
  parts.push({ g: base, color: p.wall });
  const roof = new THREE.ConeGeometry(5.4, 3, 4);
  roof.rotateY(Math.PI / 4);
  roof.translate(0, 5.5, 0);
  parts.push({ g: roof, color: p.roof });
  const door = new THREE.BoxGeometry(1.1, 1.9, 0.14);
  door.translate(0, 0.95, 3.55);
  parts.push({ g: door, color: 0x4a3a2c });
  for (const sx of [-1.7, 1.7]) {
    const win = new THREE.BoxGeometry(1.1, 1.0, 0.1);
    win.translate(sx, 2.3, 3.55);
    parts.push({ g: win, color: 0xffe9a8 });
    const frame = new THREE.BoxGeometry(1.24, 1.14, 0.08);
    frame.translate(sx, 2.3, 3.52);
    parts.push({ g: frame, color: 0xfdfcf6 });
  }
  const chimney = new THREE.BoxGeometry(0.8, 1.7, 0.8);
  chimney.translate(2, 6.1, 0);
  parts.push({ g: chimney, color: 0x8c8378 });
  return mergeColored(parts);
}

function boatGeometry() {
  const parts = [];
  const hull = new THREE.BoxGeometry(4.2, 0.7, 1.5);
  parts.push({ g: hull, color: 0x44545e });
  const deck = new THREE.BoxGeometry(3.6, 0.16, 1.2);
  deck.translate(0, 0.42, 0);
  parts.push({ g: deck, color: 0xd9c9a8 });
  const sail1 = new THREE.ConeGeometry(2.1, 5.2, 3);
  sail1.rotateY(Math.PI / 2); sail1.translate(-0.5, 2.8, 0);
  parts.push({ g: sail1, color: 0xfbf8ee });
  const sail2 = new THREE.ConeGeometry(1.4, 3.6, 3);
  sail2.rotateY(Math.PI / 2); sail2.translate(1.4, 2.1, 0);
  parts.push({ g: sail2, color: 0xe9f3f6 });
  const mast = new THREE.CylinderGeometry(0.06, 0.06, 6, 6);
  mast.translate(-0.5, 3, 0);
  parts.push({ g: mast, color: 0x8a8f94 });
  return mergeColored(parts);
}

// ---------- 海面着色器 ----------
const SEA_VERT = `
  uniform float uTime;
  varying vec3 vW;
  varying vec3 vN;
  float wave(vec2 p, float t){
    float h = 0.0;
    h += 0.26 * sin(dot(p, vec2(0.075, 0.045)) + t * 0.90);
    h += 0.17 * sin(dot(p, vec2(-0.041, 0.095)) + t * 1.30);
    h += 0.10 * sin(dot(p, vec2(0.140, -0.080)) + t * 1.90);
    h += 0.05 * sin(dot(p, vec2(0.290, 0.230)) + t * 2.80);
    return h;
  }
  void main(){
    vec2 p = position.xz + modelMatrix[3].xz;
    float t = uTime;
    float h = wave(p, t);
    vec3 pos = position;
    pos.y += h;
    float e = 1.5;
    float hx = wave(p + vec2(e, 0.0), t) - wave(p - vec2(e, 0.0), t);
    float hz = wave(p + vec2(0.0, e), t) - wave(p - vec2(0.0, e), t);
    vN = normalize(vec3(-hx / (2.0 * e), 1.0, -hz / (2.0 * e)));
    vec4 wp = modelMatrix * vec4(pos, 1.0);
    vW = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;

const SEA_FRAG = `
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uFogColor;
  uniform vec3 uSun;
  varying vec3 vW;
  varying vec3 vN;
  void main(){
    vec3 N = normalize(vN);
    vec3 V = normalize(cameraPosition - vW);
    vec3 L = normalize(uSun);
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    float diff = max(dot(N, L), 0.0);
    float shoreTint = smoothstep(-68.0, -12.0, vW.x) * 0.55;
    vec3 base = mix(uDeep, uShallow, clamp(diff * 0.60 + fres * 0.80 + shoreTint, 0.0, 1.0));
    vec3 H = normalize(L + V);
    float nh = max(dot(N, H), 0.0);
    float spec = pow(nh, 80.0) * 0.50 + pow(nh, 320.0) * 0.95;
    float twinkle = 0.62 + 0.38 * sin(vW.x * 2.1 + uTime * 5.0) * sin(vW.z * 1.7 - uTime * 3.6);
    base += vec3(1.0, 0.94, 0.76) * spec * twinkle;
    float crest = smoothstep(-0.36, 0.08, vW.y);
    float streak = sin(vW.z * 1.15 + uTime * 2.0 + sin(vW.x * 0.42) * 2.1 + sin(vW.z * 0.37) * 0.9);
    float foam = smoothstep(0.80, 0.99, streak) * crest * 0.42;
    float streak2 = sin(vW.z * 2.7 - uTime * 3.1 + sin(vW.x * 0.85) * 2.4);
    float foam2 = smoothstep(0.94, 1.0, streak2) * smoothstep(-0.12, 0.16, vW.y) * 0.32;
    float shore = smoothstep(-24.0, -10.0, vW.x);
    float breakW = sin((vW.x + 10.0) * 0.58 + uTime * 2.3 + sin(vW.z * 0.09) * 2.0 + sin(vW.z * 0.33) * 0.8);
    float shoreFoam = shore * smoothstep(0.50, 0.97, breakW) * 0.72;
    base = mix(base, vec3(0.94, 0.985, 1.0), clamp(foam + foam2 + shoreFoam, 0.0, 0.90));
    float d = length(cameraPosition - vW);
    base = mix(base, uFogColor, smoothstep(100.0, 300.0, d));
    gl_FragColor = vec4(base, 1.0);
  }`;

const GROUND_VERT = 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';

export function createWorld(scene, opts) {
  const o = opts || {};
  const coarse = !!o.coarse;
  const anisotropy = Math.min(8, o.anisotropy || 4);

  scene.fog = new THREE.Fog(FOG, 100, 305);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x86aec0, 1.65));
  const sun = new THREE.DirectionalLight(0xffe7be, 1.8);
  sun.position.copy(SUN_DIR).multiplyScalar(120);
  // 真实阴影
  sun.castShadow = true;
  sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
  sun.shadow.camera.left = -16; sun.shadow.camera.right = 26;
  sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
  sun.shadow.camera.near = 10; sun.shadow.camera.far = 400;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  scene.add(sun.target);
  const fill = new THREE.DirectionalLight(0xaad9ff, 0.45);
  fill.position.set(-45, 32, 65);
  scene.add(fill);

  // 天空
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uTop: { value: new THREE.Color('#3a86c4') },
      uMid: { value: new THREE.Color('#9ccfee') },
      uBottom: { value: new THREE.Color('#f6e7cd') },
      uSun: { value: SUN_DIR },
    },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `
      uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uBottom; uniform vec3 uSun; varying vec3 vP;
      void main(){
        vec3 d = normalize(vP);
        vec3 c = mix(uBottom, uMid, smoothstep(-0.14, 0.18, d.y));
        c = mix(c, uTop, smoothstep(0.14, 0.78, d.y));
        float s = max(dot(d, normalize(uSun)), 0.0);
        c += vec3(1.0, 0.79, 0.50) * (pow(s, 10.0) * 0.16 + pow(s, 110.0) * 0.48);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(460, 32, 20), skyMat));

  const glow = glowTexture();
  const sunPos = SUN_DIR.clone().multiplyScalar(280);
  for (const [size, color, opacity] of [[148, 0xffd394, 0.22], [46, 0xffe9bb, 0.36], [13, 0xfffdf2, 0.80]]) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color, opacity, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    s.scale.setScalar(size);
    s.position.copy(sunPos);
    scene.add(s);
  }

  const cloudGeo = cloudGeometry();
  const cloudMat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false });
  const clouds = [];
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(cloudGeo, cloudMat);
    m.position.set(rand(-150, 150), rand(38, 90), rand(-280, -110));
    m.scale.setScalar(rand(1.2, 2.6));
    scene.add(m);
    clouds.push(m);
  }

  // 海面
  const seaMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color('#12567e') },
      uShallow: { value: new THREE.Color('#49b6d2') },
      uFogColor: { value: new THREE.Color(FOG) },
      uSun: { value: SUN_DIR },
    },
    vertexShader: SEA_VERT,
    fragmentShader: SEA_FRAG,
  });
  const seaGeo = new THREE.PlaneGeometry(600, 1200, 180, 180);
  seaGeo.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(seaGeo, seaMat);
  sea.position.set(-310, -0.42, 0);
  scene.add(sea);

  // 沙滩（带纹理，可受影）
  const sandTex = sandTexture();
  sandTex.repeat.set(1, 120);
  sandTex.anisotropy = anisotropy;
  const land = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 1200),
    new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.96, metalness: 0 }));
  land.rotation.x = -Math.PI / 2;
  land.position.set(29, -0.02, 0);
  land.receiveShadow = true;
  scene.add(land);

  // 柏油路面（带纹理，可受影）
  const roadTex = asphaltTexture();
  roadTex.repeat.set(1, 120);
  roadTex.anisotropy = anisotropy;
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 1200),
    new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.94, metalness: 0 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.105, 0);
  road.receiveShadow = true;
  scene.add(road);
  const roadBase = new THREE.Mesh(new THREE.BoxGeometry(14, 0.18, 1200), new THREE.MeshStandardMaterial({ color: 0x3a444d, roughness: 0.95 }));
  roadBase.position.set(0, 0.0, 0);
  scene.add(roadBase);

  const whiteLine = new THREE.MeshBasicMaterial({ color: 0xf4f6f0 });
  for (const x of [-6.82, 6.82]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.02, 1200), whiteLine);
    e.position.set(x, 0.118, 0);
    scene.add(e);
  }
  const kerbMat = new THREE.MeshStandardMaterial({ color: 0xd9d3bf, roughness: 0.9 });
  for (const x of [-7.42, 7.42]) {
    const k = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.18, 1200), kerbMat);
    k.position.set(x, 0.06, 0);
    k.receiveShadow = true;
    scene.add(k);
  }

  // 护栏（海侧）
  const RAIL_N = 64, RAIL_STEP = 5, RAIL_LOOP = RAIL_N * RAIL_STEP;
  const railMat = new THREE.MeshStandardMaterial({ color: 0xe2ebed, roughness: 0.5, metalness: 0.3 });
  for (const y of [0.70, 1.02]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.09, 1200), railMat);
    bar.position.set(-7.9, y, 0);
    scene.add(bar);
  }
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.20, 1200), new THREE.MeshStandardMaterial({ color: 0xc8cdc9, roughness: 0.85 }));
  base.position.set(-7.9, 0.08, 0);
  scene.add(base);
  const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.078, 0.078, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0xeef3f4, roughness: 0.6 }), RAIL_N);
  posts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  posts.frustumCulled = false;
  scene.add(posts);
  const reflectors = new THREE.InstancedMesh(new THREE.BoxGeometry(0.17, 0.13, 0.055), new THREE.MeshBasicMaterial({ color: 0xff943d }), RAIL_N);
  reflectors.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  reflectors.frustumCulled = false;
  scene.add(reflectors);
  const railZ = [];
  for (let i = 0; i < RAIL_N; i++) railZ.push(-i * RAIL_STEP);

  const DASH_N = 45, DASH_STEP = 8, DASH_LOOP = DASH_N * DASH_STEP;
  const dashes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.19, 0.02, 3.6), new THREE.MeshBasicMaterial({ color: 0xf3cb55 }), DASH_N);
  dashes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  dashes.frustumCulled = false;
  scene.add(dashes);
  const dashZ = [];
  for (let i = 0; i < DASH_N; i++) dashZ.push(-i * DASH_STEP);

  // 植被与礁石
  const solidMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 });
  const palmGeo = palmGeometry();
  const PALM_N = 22, PALM_STEP = 15, PALM_LOOP = PALM_N * PALM_STEP;
  const palms = [];
  for (let i = 0; i < PALM_N; i++) {
    const m = new THREE.Mesh(palmGeo, solidMat);
    m.position.set(rand(11, 27), 0.02, -i * PALM_STEP);
    m.scale.setScalar(rand(0.85, 1.3));
    m.rotation.y = rand(0, 6.28);
    m.castShadow = true;
    scene.add(m);
    palms.push(m);
  }
  const bushGeo = bushGeometry();
  const BUSH_N = 26, BUSH_STEP = 12, BUSH_LOOP = BUSH_N * BUSH_STEP;
  const bushes = [];
  for (let i = 0; i < BUSH_N; i++) {
    const m = new THREE.Mesh(bushGeo, solidMat);
    m.position.set(rand(9, 34), 0.02, -i * BUSH_STEP);
    m.scale.setScalar(rand(0.7, 1.5));
    m.castShadow = true;
    scene.add(m);
    bushes.push(m);
  }
  const rockGeo = rockGeometry();
  const ROCK_N = 14, ROCK_STEP = 20, ROCK_LOOP = ROCK_N * ROCK_STEP;
  const rocks = [];
  for (let i = 0; i < ROCK_N; i++) {
    const m = new THREE.Mesh(rockGeo, solidMat);
    m.position.set(i % 3 === 0 ? rand(-11.5, -9.2) : rand(8, 30), 0.02, -i * ROCK_STEP);
    m.scale.setScalar(rand(0.7, 1.35));
    m.castShadow = true;
    scene.add(m);
    rocks.push(m);
  }

  // 路灯（陆侧）
  const lampGeo = lampGeometry();
  const LAMP_N = 14, LAMP_STEP = 38, LAMP_LOOP = LAMP_N * LAMP_STEP;
  const lamps = [];
  for (let i = 0; i < LAMP_N; i++) {
    const g = new THREE.Group();
    const m = new THREE.Mesh(lampGeo, solidMat);
    m.castShadow = true;
    g.add(m);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xfff0b0, opacity: 0.30, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    halo.scale.setScalar(2.4);
    halo.position.set(-1.42, 5.05, 0);
    g.add(halo);
    g.position.set(8.6, 0.02, -i * LAMP_STEP - 8);
    scene.add(g);
    lamps.push(g);
  }

  // 路牌
  const signMats = [signTexture('curve'), signTexture('coast'), signTexture('speed')];
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x9aa4ab, metalness: 0.6, roughness: 0.4 });
  const SIGN_N = 6, SIGN_STEP = 55, SIGN_LOOP = SIGN_N * SIGN_STEP;
  const signs = [];
  for (let i = 0; i < SIGN_N; i++) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 8), poleMat);
    pole.position.y = 1.2;
    pole.castShadow = true;
    g.add(pole);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15), new THREE.MeshStandardMaterial({ map: signMats[i % 3], transparent: true, roughness: 0.6 }));
    board.position.y = 2.1;
    board.castShadow = true;
    g.add(board);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15), new THREE.MeshStandardMaterial({ color: 0x8a9298, roughness: 0.8 }));
    back.position.y = 2.1;
    back.rotation.y = Math.PI;
    g.add(back);
    g.position.set(8.15, 0.02, -20 - i * SIGN_STEP);
    g.rotation.y = -0.18;
    scene.add(g);
    signs.push(g);
  }

  // 海滩遮阳伞
  const spotGeos = [beachSpotGeometry(0), beachSpotGeometry(1)];
  const SPOT_N = 7, SPOT_STEP = 34, SPOT_LOOP = SPOT_N * SPOT_STEP;
  const spots = [];
  for (let i = 0; i < SPOT_N; i++) {
    const m = new THREE.Mesh(spotGeos[i % 2], solidMat);
    m.position.set(rand(14, 30), 0.02, -12 - i * SPOT_STEP);
    m.scale.setScalar(rand(0.85, 1.25));
    m.rotation.y = rand(0, 6.28);
    m.castShadow = true;
    scene.add(m);
    spots.push(m);
  }

  // 远处海景房
  const houseGeos = [houseGeometry(0), houseGeometry(1), houseGeometry(2)];
  const HOUSE_N = 9, HOUSE_STEP = 70, HOUSE_LOOP = HOUSE_N * HOUSE_STEP;
  const houses = [];
  for (let i = 0; i < HOUSE_N; i++) {
    const m = new THREE.Mesh(houseGeos[i % 3], solidMat);
    m.position.set(rand(56, 96), 0.0, -i * HOUSE_STEP - 30);
    m.rotation.y = rand(-0.25, 0.1);
    scene.add(m);
    houses.push(m);
  }

  // 岛屿
  const islandMat = new THREE.MeshStandardMaterial({ color: 0x83a8a6, roughness: 0.95 });
  const islandTop = new THREE.MeshStandardMaterial({ color: 0x9dbdb2, roughness: 0.95 });
  for (let i = 0; i < 7; i++) {
    const r = rand(14, 26);
    const isl = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), islandMat);
    isl.scale.set(1, rand(0.55, 0.90), 0.80);
    isl.position.set(rand(-210, -70), rand(-4, -1), rand(-245, -172));
    scene.add(isl);
    const peak = new THREE.Mesh(new THREE.SphereGeometry(r * 0.55, 10, 7), islandTop);
    peak.scale.set(1, rand(0.6, 0.95), 0.8);
    peak.position.set(isl.position.x + rand(-5, 5), isl.position.y + r * 0.26, isl.position.z + rand(-4, 4));
    scene.add(peak);
  }

  // 灯塔
  const lighthouse = new THREE.Group();
  const towerParts = [];
  for (let i = 0; i < 6; i++) {
    const seg = new THREE.CylinderGeometry(1.05 - i * 0.055, 1.12 - i * 0.055, 2.0, 12);
    seg.translate(0, 1.0 + i * 2.0, 0);
    towerParts.push({ g: seg, color: i % 2 ? 0xf3f1e8 : 0xd9544b });
  }
  const gallery = new THREE.CylinderGeometry(1.35, 1.35, 0.35, 12);
  gallery.translate(0, 12.3, 0);
  towerParts.push({ g: gallery, color: 0x36454f });
  const lantern = new THREE.CylinderGeometry(0.85, 0.85, 1.6, 10);
  lantern.translate(0, 13.2, 0);
  towerParts.push({ g: lantern, color: 0xffe9a8 });
  const roof = new THREE.ConeGeometry(1.15, 1.1, 10);
  roof.translate(0, 14.5, 0);
  towerParts.push({ g: roof, color: 0x36454f });
  lighthouse.add(new THREE.Mesh(mergeColored(towerParts), solidMat));
  const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xfff0b0, opacity: 0.85, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  lampGlow.scale.setScalar(9);
  lampGlow.position.set(0, 13.2, 0);
  lighthouse.add(lampGlow);
  lighthouse.position.set(-64, -0.3, -190);
  scene.add(lighthouse);
  const beamGroup = new THREE.Group();
  beamGroup.position.set(-64, 13.2, -190);
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(4.5, 40, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.075, side: THREE.DoubleSide, depthWrite: false, fog: false }));
  beam.rotation.z = Math.PI / 2;
  beam.position.x = 20;
  beamGroup.add(beam);
  scene.add(beamGroup);

  // 帆船
  const boatGeo = boatGeometry();
  const boats = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(boatGeo, solidMat);
    m.position.set(-70 - i * 42, 0.1, -130 - i * 35);
    m.scale.setScalar(0.9 + i * 0.15);
    scene.add(m);
    boats.push({ m, sp: 0.9 + i * 0.5 });
  }

  // 海鸥
  const gullGeo = gullGeometry();
  const gulls = [];
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(gullGeo, cloudMat);
    m.userData = { r: rand(16, 38), a: rand(0, 6.28), y: rand(15, 30), z: rand(-110, -35), sp: rand(0.12, 0.28) };
    m.scale.setScalar(rand(0.8, 1.5));
    scene.add(m);
    gulls.push(m);
  }

  const dummy = new THREE.Object3D();

  function randomize(list, mode) {
    if (mode === 'palm') {
      list.position.x = rand(11, 27);
      list.rotation.y = rand(0, 6.28);
    } else if (mode === 'bush') {
      list.position.x = rand(9, 34);
    } else if (mode === 'rock') {
      list.position.x = Math.random() < 0.34 ? rand(-11.5, -9.2) : rand(8, 30);
    } else if (mode === 'spot') {
      list.position.x = rand(14, 30);
      list.rotation.y = rand(0, 6.28);
    } else if (mode === 'house') {
      list.position.x = rand(56, 96);
      list.rotation.y = rand(-0.25, 0.1);
    }
  }

  function reset() {
    for (let i = 0; i < RAIL_N; i++) railZ[i] = -i * RAIL_STEP;
    for (let i = 0; i < DASH_N; i++) dashZ[i] = -i * DASH_STEP;
    for (let i = 0; i < PALM_N; i++) { palms[i].position.z = -i * PALM_STEP; randomize(palms[i], 'palm'); }
    for (let i = 0; i < BUSH_N; i++) { bushes[i].position.z = -i * BUSH_STEP; randomize(bushes[i], 'bush'); }
    for (let i = 0; i < ROCK_N; i++) { rocks[i].position.z = -i * ROCK_STEP; randomize(rocks[i], 'rock'); }
    for (let i = 0; i < LAMP_N; i++) lamps[i].position.z = -i * LAMP_STEP - 8;
    for (let i = 0; i < SIGN_N; i++) signs[i].position.z = -20 - i * SIGN_STEP;
    for (let i = 0; i < SPOT_N; i++) { spots[i].position.z = -12 - i * SPOT_STEP; randomize(spots[i], 'spot'); }
    for (let i = 0; i < HOUSE_N; i++) { houses[i].position.z = -i * HOUSE_STEP - 30; randomize(houses[i], 'house'); }
  }

  function update(dt, v, elapsed) {
    seaMat.uniforms.uTime.value = elapsed;
    for (let i = 0; i < RAIL_N; i++) {
      railZ[i] += v * dt;
      if (railZ[i] > 20) railZ[i] -= RAIL_LOOP;
      dummy.position.set(-7.9, 0.62, railZ[i]);
      dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1);
      dummy.updateMatrix();
      posts.setMatrixAt(i, dummy.matrix);
      dummy.position.set(-7.9, 1.02, railZ[i] + 0.065);
      dummy.updateMatrix();
      reflectors.setMatrixAt(i, dummy.matrix);
    }
    posts.instanceMatrix.needsUpdate = true;
    reflectors.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < DASH_N; i++) {
      dashZ[i] += v * dt;
      if (dashZ[i] > 20) dashZ[i] -= DASH_LOOP;
      dummy.position.set(0, 0.119, dashZ[i]);
      dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1);
      dummy.updateMatrix();
      dashes.setMatrixAt(i, dummy.matrix);
    }
    dashes.instanceMatrix.needsUpdate = true;
    const scroll = (list, loop, mode) => {
      for (const m of list) {
        m.position.z += v * dt;
        if (m.position.z > 24) { m.position.z -= loop; randomize(m, mode); }
      }
    };
    scroll(palms, PALM_LOOP, 'palm');
    scroll(bushes, BUSH_LOOP, 'bush');
    scroll(rocks, ROCK_LOOP, 'rock');
    scroll(lamps, LAMP_LOOP, null);
    scroll(signs, SIGN_LOOP, null);
    scroll(spots, SPOT_LOOP, 'spot');
    scroll(houses, HOUSE_LOOP, 'house');
    for (const c of clouds) {
      c.position.x += dt * 0.9;
      if (c.position.x > 175) c.position.x = -175;
    }
    beamGroup.rotation.y += dt * 0.42;
    for (const b of boats) {
      b.m.position.x += dt * b.sp;
      if (b.m.position.x > -35) b.m.position.x = -175;
      b.m.rotation.z = Math.sin(elapsed * 0.8 + b.sp) * 0.045;
    }
    for (let i = 0; i < gulls.length; i++) {
      const g = gulls[i], u = g.userData;
      u.a += dt * u.sp;
      g.position.set(-45 + Math.cos(u.a) * u.r, u.y + Math.sin(u.a * 2.0) * 1.4, u.z + Math.sin(u.a) * u.r * 0.65);
      g.rotation.y = -u.a;
      g.rotation.z = Math.sin(elapsed * 5 + i) * 0.22;
    }
  }

  reset();
  return { update, reset, sunDir: SUN_DIR };
}
