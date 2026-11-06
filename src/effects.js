import * as THREE from 'three';

export function createEffects(scene) {
  const MAX = 520;
  const pos = new Float32Array(MAX * 3);
  const col = new Float32Array(MAX * 3);
  const size = new Float32Array(MAX);
  const alpha = new Float32Array(MAX);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
      varying vec3 vC; varying float vA;
      void main(){
        vC = aColor; vA = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        // 贴近镜头时限制最大尺寸，否则粒子会糊成一大团
        gl_PointSize = clamp(aSize * (320.0 / max(0.9, -mv.z)), 1.0, 64.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vC; varying float vA;
      void main(){
        float d = length(gl_PointCoord - vec2(0.5));
        float a = smoothstep(0.5, 0.10, d) * vA;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vC, a);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 3;
  scene.add(points);

  const P = [];
  for (let i = 0; i < MAX; i++) {
    P.push({ life: 0, maxLife: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 0, gravity: 9, drag: 1.5, cr: 1, cg: 1, cb: 1 });
  }
  let cursor = 0;
  const tmp = new THREE.Color();

  function burst(x, y, z, colorHex, count, opt) {
    const o = opt || {};
    tmp.set(colorHex);
    for (let i = 0; i < count; i++) {
      const p = P[cursor];
      cursor = (cursor + 1) % MAX;
      const a = Math.random() * 6.283;
      const e = Math.random() * 1.4 - 0.15;
      const sp = (o.speed === undefined ? 4 : o.speed) * (0.45 + Math.random() * 0.85);
      p.x = x + (Math.random() - 0.5) * (o.spread || 0.4);
      p.y = y + (Math.random() - 0.5) * (o.spread || 0.4);
      p.z = z + (Math.random() - 0.5) * (o.spread || 0.4);
      p.vx = Math.cos(a) * sp * Math.cos(e);
      p.vz = Math.sin(a) * sp * Math.cos(e);
      p.vy = (o.up || 0) + Math.sin(e) * sp * 0.65 + Math.random() * 1.8;
      p.maxLife = (o.life || 0.75) * (0.7 + Math.random() * 0.6);
      p.life = p.maxLife;
      p.size = (o.size || 0.20) * (0.6 + Math.random() * 0.8);
      p.gravity = o.gravity === undefined ? 9 : o.gravity;
      p.drag = o.drag === undefined ? 1.4 : o.drag;
      p.cr = tmp.r; p.cg = tmp.g; p.cb = tmp.b;
    }
  }

  function update(dt, v) {
    for (let i = 0; i < MAX; i++) {
      const p = P[i];
      if (p.life <= 0) { alpha[i] = 0; size[i] = 0; continue; }
      p.life -= dt;
      const k = Math.exp(-p.drag * dt);
      p.vx *= k; p.vz *= k;
      p.vy -= p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += (p.vz + v) * dt;
      if (p.y < 0.10) { p.y = 0.10; p.vy *= -0.28; p.vx *= 0.72; p.vz *= 0.72; }
      const t = Math.max(0, p.life / p.maxLife);
      const i3 = i * 3;
      pos[i3] = p.x; pos[i3 + 1] = p.y; pos[i3 + 2] = p.z;
      col[i3] = p.cr; col[i3 + 1] = p.cg; col[i3 + 2] = p.cb;
      size[i] = p.size * (0.45 + t * 0.55);
      alpha[i] = Math.min(1, t * 1.7);
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aColor.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;
    geo.attributes.aAlpha.needsUpdate = true;
  }

  function reset() {
    for (const p of P) p.life = 0;
    for (let i = 0; i < MAX; i++) { alpha[i] = 0; size[i] = 0; }
    geo.attributes.aAlpha.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;
  }

  return { burst, update, reset };
}
