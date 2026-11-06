import * as THREE from 'three';

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a, b) => a + Math.random() * (b - a);
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

export function mergeColored(parts) {
  const pos = [], nor = [], col = [], idx = [];
  let offset = 0;
  const c = new THREE.Color();
  for (const part of parts) {
    const g = part.g;
    const p = g.attributes.position, n = g.attributes.normal;
    c.set(part.color);
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(n.getX(i), n.getY(i), n.getZ(i));
      col.push(c.r, c.g, c.b);
    }
    if (g.index) {
      const a = g.index.array;
      for (let i = 0; i < a.length; i++) idx.push(a[i] + offset);
    } else {
      for (let i = 0; i < p.count; i++) idx.push(i + offset);
    }
    offset += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  out.setIndex(idx);
  return out;
}

export function rod(a, b, r, mat) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), 6), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(V3(0, 1, 0), dir.clone().normalize());
  return m;
}

/** 两端半径不同的圆台，用于喙、腿这类自然收细的部件 */
export function taperRod(a, b, r1, r2, mat, radial = 10) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, dir.length(), radial), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(V3(0, 1, 0), dir.clone().normalize());
  return m;
}

/**
 * 沿 -Z 方向逐段放样，截面为椭圆（下半略扁）。
 * sections: [{ z, w, h, cy }] —— 半宽 w、半高 h、中心下沉 cy。
 * 用来生成鸟喙、喉囊这种带曲线锥度的有机形状。
 */
export function loft(sections, radial = 16, opts) {
  const n = sections.length;
  const pos = [], idx = [], col = [];
  const cTop = new THREE.Color(opts && opts.top ? opts.top : 0xffffff);
  const cBot = new THREE.Color(opts && opts.bottom ? opts.bottom : 0xffffff);
  for (let i = 0; i < n; i++) {
    const s = sections[i];
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const cs = Math.cos(a), sn = Math.sin(a);
      pos.push((s.cx || 0) + cs * s.w, (s.cy || 0) + sn * s.h * (sn < 0 ? 0.86 : 1), s.z);
      if (opts) {
        // 上白下奶油：用截面内的纵向位置做柔和过渡
        const u = (sn + 1) * 0.5;
        const f = Math.min(1, Math.max(0, (u - (opts.from || 0.34)) / ((opts.to || 0.62) - (opts.from || 0.34))));
        const k = f * f * (3 - 2 * f);
        col.push(cBot.r + (cTop.r - cBot.r) * k, cBot.g + (cTop.g - cBot.g) * k, cBot.b + (cTop.b - cBot.b) * k);
      }
    }
  }
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const a0 = i * radial + j, b0 = i * radial + ((j + 1) % radial);
      const a1 = (i + 1) * radial + j, b1 = (i + 1) * radial + ((j + 1) % radial);
      idx.push(a0, a1, b0, b0, a1, b1);
    }
  }
  const capA = pos.length / 3;
  pos.push(sections[0].cx || 0, sections[0].cy || 0, sections[0].z);
  if (opts) col.push(cBot.r, cBot.g, cBot.b);
  for (let j = 0; j < radial; j++) idx.push(capA, (j + 1) % radial, j);
  const lastRing = (n - 1) * radial;
  const capB = pos.length / 3;
  pos.push(sections[n - 1].cx || 0, sections[n - 1].cy || 0, sections[n - 1].z);
  if (opts) col.push(cBot.r, cBot.g, cBot.b);
  for (let j = 0; j < radial; j++) idx.push(capB, lastRing + j, lastRing + ((j + 1) % radial));

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (opts) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
