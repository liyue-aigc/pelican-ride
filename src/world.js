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
    vec3 base = mix(uDeep, uShallow, clamp(diff * 0.60 + fres * 0.80, 0.0, 1.0));
    vec3 H = normalize(L + V);
    float nh = max(dot(N, H), 0.0);
    float spec = pow(nh, 80.0) * 0.50 + pow(nh, 320.0) * 0.95;
    float twinkle = 0.62 + 0.38 * sin(vW.x * 2.1 + uTime * 5.0) * sin(vW.z * 1.7 - uTime * 3.6);
    base += vec3(1.0, 0.94, 0.76) * spec * twinkle;
    float crest = smoothstep(-0.36, 0.08, vW.y);
    float streak = sin(vW.z * 1.15 + uTime * 2.0 + sin(vW.x * 0.42) * 2.1 + sin(vW.z * 0.37) * 0.9);
    float foam = smoothstep(0.82, 0.99, streak) * crest * 0.34;
    float shore = smoothstep(-24.0, -10.0, vW.x);
    float breakW = sin((vW.x + 10.0) * 0.58 + uTime * 2.3 + sin(vW.z * 0.09) * 2.0 + sin(vW.z * 0.33) * 0.8);
    float shoreFoam = shore * smoothstep(0.50, 0.97, breakW) * 0.72;
    base = mix(base, vec3(0.94, 0.985, 1.0), clamp(foam + shoreFoam, 0.0, 0.88));
    float d = length(cameraPosition - vW);
    base = mix(base, uFogColor, smoothstep(100.0, 300.0, d));
    gl_FragColor = vec4(base, 1.0);
  }`;

const GROUND_VERT = 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';

export function createWorld(scene) {
  scene.fog = new THREE.Fog(FOG, 100, 305);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x86aec0, 1.65));
  const sun = new THREE.DirectionalLight(0xffe7be, 1.8);
  sun.position.copy(SUN_DIR).multiplyScalar(120);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xaad9ff, 0.45);
  fill.position.set(-45, 32, 65);
  scene.add(fill);

  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
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
  for (const [size, color, opacity] of [[160, 0xffd394, 0.32], [52, 0xffe9bb, 0.50], [15, 0xfffdf2, 0.88]]) {
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

  const landMat = new THREE.ShaderMaterial({
    uniforms: { uDry: { value: new THREE.Color(0xebd9a8) }, uWet: { value: new THREE.Color(0xbea67a) }, uFogColor: { value: new THREE.Color(FOG) } },
    vertexShader: GROUND_VERT,
    fragmentShader: `
      uniform vec3 uDry; uniform vec3 uWet; uniform vec3 uFogColor; varying vec3 vW;
      void main(){
        float t = smoothstep(-11.0, -1.0, vW.x);
        vec3 c = mix(uWet, uDry, t);
        float n = fract(sin(dot(floor(vW.xz * 2.5), vec2(12.9898, 78.233))) * 43758.5453);
        c += (n - 0.5) * 0.055;
        float d = length(cameraPosition - vW);
        c = mix(c, uFogColor, smoothstep(100.0, 305.0, d));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const landGeo = new THREE.PlaneGeometry(80, 1200, 1, 1);
  landGeo.rotateX(-Math.PI / 2);
  const land = new THREE.Mesh(landGeo, landMat);
  land.position.set(29, -0.02, 0);
  scene.add(land);

  const roadMat = new THREE.ShaderMaterial({
    uniforms: { uFogColor: { value: new THREE.Color(FOG) } },
    vertexShader: GROUND_VERT,
    fragmentShader: `
      uniform vec3 uFogColor; varying vec3 vW;
      void main(){
        float n = fract(sin(dot(floor(vW.xz * 6.0), vec2(12.9898, 78.233))) * 43758.5453);
        vec3 c = vec3(0.275, 0.315, 0.355) + (n - 0.5) * 0.032;
        float rut = exp(-pow((abs(vW.x) - 3.1) * 2.1, 2.0));
        c *= 1.0 - rut * 0.06;
        float d = length(cameraPosition - vW);
        c = mix(c, uFogColor, smoothstep(100.0, 305.0, d));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const road = new THREE.Mesh(new THREE.BoxGeometry(14, 0.16, 1200), roadMat);
  road.position.set(0, 0.02, 0);
  scene.add(road);

  const whiteLine = new THREE.MeshBasicMaterial({ color: 0xf4f6f0 });
  for (const x of [-6.82, 6.82]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.02, 1200), whiteLine);
    e.position.set(x, 0.112, 0);
    scene.add(e);
  }
  const kerbMat = new THREE.MeshLambertMaterial({ color: 0xd9d3bf });
  for (const x of [-7.42, 7.42]) {
    const k = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 1200), kerbMat);
    k.position.set(x, 0.06, 0);
    scene.add(k);
  }

  const RAIL_N = 64, RAIL_STEP = 5, RAIL_LOOP = RAIL_N * RAIL_STEP;
  const railMat = new THREE.MeshLambertMaterial({ color: 0xe2ebed });
  for (const y of [0.70, 1.02]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.09, 1200), railMat);
    bar.position.set(-7.9, y, 0);
    scene.add(bar);
  }
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.20, 1200), new THREE.MeshLambertMaterial({ color: 0xc8cdc9 }));
  base.position.set(-7.9, 0.08, 0);
  scene.add(base);
  const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.078, 0.078, 1.2, 8), new THREE.MeshLambertMaterial({ color: 0xeef3f4 }), RAIL_N);
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

  const palmGeo = palmGeometry();
  const solidMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const PALM_N = 22, PALM_STEP = 15, PALM_LOOP = PALM_N * PALM_STEP;
  const palms = [];
  for (let i = 0; i < PALM_N; i++) {
    const m = new THREE.Mesh(palmGeo, solidMat);
    m.position.set(rand(11, 27), 0.02, -i * PALM_STEP);
    m.scale.setScalar(rand(0.85, 1.3));
    m.rotation.y = rand(0, 6.28);
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
    scene.add(m);
    rocks.push(m);
  }

  const islandMat = new THREE.MeshLambertMaterial({ color: 0x6e9c88 });
  const islandTop = new THREE.MeshLambertMaterial({ color: 0x8fb59b });
  for (let i = 0; i < 7; i++) {
    const r = rand(18, 34);
    const isl = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), islandMat);
    isl.scale.set(1, rand(0.42, 0.72), 0.75);
    isl.position.set(rand(-210, -62), rand(1, 5), rand(-280, -175));
    scene.add(isl);
    const peak = new THREE.Mesh(new THREE.SphereGeometry(r * 0.55, 10, 7), islandTop);
    peak.scale.set(1, rand(0.6, 0.95), 0.8);
    peak.position.set(isl.position.x + rand(-8, 8), isl.position.y + r * 0.28, isl.position.z + rand(-6, 6));
    scene.add(peak);
  }

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

  const boat = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.7, 1.5), new THREE.MeshLambertMaterial({ color: 0x44545e }));
  boat.add(hull);
  const sail1 = new THREE.Mesh(new THREE.ConeGeometry(2.1, 5.2, 3), new THREE.MeshLambertMaterial({ color: 0xfbf8ee, side: THREE.DoubleSide }));
  sail1.rotation.y = Math.PI / 2;
  sail1.position.set(-0.5, 2.8, 0);
  boat.add(sail1);
  const sail2 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.6, 3), new THREE.MeshLambertMaterial({ color: 0xe9f3f6, side: THREE.DoubleSide }));
  sail2.rotation.y = Math.PI / 2;
  sail2.position.set(1.4, 2.1, 0);
  boat.add(sail2);
  boat.position.set(-98, 0.1, -155);
  scene.add(boat);

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
    } else {
      list.position.x = Math.random() < 0.34 ? rand(-11.5, -9.2) : rand(8, 30);
    }
  }

  function reset() {
    for (let i = 0; i < RAIL_N; i++) railZ[i] = -i * RAIL_STEP;
    for (let i = 0; i < DASH_N; i++) dashZ[i] = -i * DASH_STEP;
    for (let i = 0; i < PALM_N; i++) { palms[i].position.z = -i * PALM_STEP; randomize(palms[i], 'palm'); }
    for (let i = 0; i < BUSH_N; i++) { bushes[i].position.z = -i * BUSH_STEP; randomize(bushes[i], 'bush'); }
    for (let i = 0; i < ROCK_N; i++) { rocks[i].position.z = -i * ROCK_STEP; randomize(rocks[i], 'rock'); }
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
      dummy.position.set(0, 0.113, dashZ[i]);
      dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1);
      dummy.updateMatrix();
      dashes.setMatrixAt(i, dummy.matrix);
    }
    dashes.instanceMatrix.needsUpdate = true;
    const scroll = (list, n, step, loop, mode) => {
      for (const m of list) {
        m.position.z += v * dt;
        if (m.position.z > 20) { m.position.z -= loop; randomize(m, mode); }
      }
    };
    scroll(palms, PALM_N, PALM_STEP, PALM_LOOP, 'palm');
    scroll(bushes, BUSH_N, BUSH_STEP, BUSH_LOOP, 'bush');
    scroll(rocks, ROCK_N, ROCK_STEP, ROCK_LOOP, 'rock');
    for (const c of clouds) {
      c.position.x += dt * 0.9;
      if (c.position.x > 175) c.position.x = -175;
    }
    beamGroup.rotation.y += dt * 0.42;
    boat.position.x += dt * 1.1;
    if (boat.position.x > -35) boat.position.x = -160;
    boat.rotation.z = Math.sin(elapsed * 0.8) * 0.045;
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
