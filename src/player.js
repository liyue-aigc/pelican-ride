import * as THREE from 'three';
import { clamp, lerp, loft, rod, taperRod, V3 } from './utils.js';

export function createPlayer(scene) {
  const root = new THREE.Group();
  const bike = new THREE.Group();
  const bird = new THREE.Group();
  root.add(bike, bird);
  bird.rotation.y = -0.08;  // 身体基本朝前，靠头部转向露出大嘴剪影
  scene.add(root);

  // ---------- 材质 ----------
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xe0503f, metalness: 0.42, roughness: 0.38 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x27303a, roughness: 0.85 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xcdd6dd, metalness: 0.75, roughness: 0.25 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xfcfaf2, roughness: 0.9 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xeee1c6, roughness: 0.94 });
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xf7a02c, roughness: 0.46, side: THREE.DoubleSide });
  const pouchMat = new THREE.MeshStandardMaterial({ color: 0xef8c3c, roughness: 0.66, side: THREE.DoubleSide });
  const hookMat = new THREE.MeshStandardMaterial({ color: 0xd07c26, roughness: 0.55 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0xf39a2e, roughness: 0.62 });
  const footMat = new THREE.MeshStandardMaterial({ color: 0xe2832a, roughness: 0.7 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1d232b, roughness: 0.3 });
  const eyeRingMat = new THREE.MeshStandardMaterial({ color: 0xf4e6c9, roughness: 0.85 });
  const scarfMat = new THREE.MeshStandardMaterial({ color: 0x2e9bd0, roughness: 0.85 });
  const wickerMat = new THREE.MeshStandardMaterial({ color: 0xb0894f, roughness: 0.95 });
  const fishMat = new THREE.MeshStandardMaterial({ color: 0xa8cfdf, metalness: 0.3, roughness: 0.42 });

  // ---------- 自行车 ----------
  const wheels = [];
  for (const z of [-0.80, 0.80]) {
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.075, 12, 26), darkMat);
    tire.position.set(0, 0.63, z);
    tire.rotation.y = Math.PI / 2;
    bike.add(tire);
    wheels.push(tire);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.475, 0.02, 8, 26), metalMat);
    rim.position.set(0, 0.63, z);
    rim.rotation.y = Math.PI / 2;
    bike.add(rim);
    wheels.push(rim);
    for (let i = 0; i < 6; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.95, 0.018), metalMat);
      spoke.rotation.z = i * Math.PI / 6;
      const holder = new THREE.Group();
      holder.position.set(0, 0.63, z);
      holder.rotation.y = Math.PI / 2;
      holder.add(spoke);
      bike.add(holder);
      wheels.push(holder);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.13, 10), metalMat);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(0, 0.63, z);
    bike.add(hub);
    const fender = new THREE.Mesh(new THREE.TorusGeometry(0.63, 0.042, 8, 16, Math.PI * 0.9), frameMat);
    fender.position.set(0, 0.63, z);
    fender.rotation.y = Math.PI / 2;
    bike.add(fender);
  }
  const rear = V3(0, 0.63, 0.80), front = V3(0, 0.63, -0.80);
  const seat = V3(0, 1.34, 0.24), headTube = V3(0, 1.42, -0.60);
  bike.add(rod(rear, seat, 0.045, frameMat));
  bike.add(rod(seat, headTube, 0.045, frameMat));
  bike.add(rod(seat, front, 0.040, frameMat));
  bike.add(rod(rear, headTube, 0.038, frameMat));
  bike.add(rod(V3(0, 0.63, 0), V3(0, 1.34, 0.24), 0.038, frameMat));
  bike.add(rod(V3(-0.42, 1.48, -0.60), V3(0.42, 1.48, -0.60), 0.040, metalMat));
  bike.add(rod(V3(0, 1.42, -0.60), front, 0.045, metalMat));
  for (const sx of [-1, 1]) {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.13, 8), darkMat);
    grip.rotation.z = Math.PI / 2;
    grip.position.set(sx * 0.44, 1.48, -0.60);
    bike.add(grip);
  }
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.085, 0.34), darkMat);
  saddle.position.set(0, 1.40, 0.26);
  bike.add(saddle);
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.22, 8), new THREE.MeshStandardMaterial({ color: 0x2e9bd0, roughness: 0.5 }));
  bottle.rotation.x = 0.65;
  bottle.position.set(0, 1.02, 0.12);
  bike.add(bottle);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), new THREE.MeshStandardMaterial({ color: 0xfff0b8, emissive: 0xffc44d, emissiveIntensity: 0.8, roughness: 0.3 }));
  lamp.position.set(0, 1.28, -0.84);
  bike.add(lamp);
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), metalMat);
  bell.position.set(0.28, 1.55, -0.58);
  bike.add(bell);

  const crankGroup = new THREE.Group();
  crankGroup.position.set(0, 0.63, 0);
  const chainring = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.024, 20), metalMat);
  chainring.rotation.z = Math.PI / 2;
  crankGroup.add(chainring);
  const pedals = [];
  for (const sx of [-1, 1]) {
    // 左右脚踏相差 180°，蹬起来才像真的在骑车
    const side = new THREE.Group();
    if (sx > 0) side.rotation.x = Math.PI;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.045), darkMat);
    arm.position.set(sx * 0.095, -0.13, 0);
    side.add(arm);
    const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.032, 0.10), darkMat);
    pedal.position.set(sx * 0.115, -0.25, 0);
    side.add(pedal);
    crankGroup.add(side);
    pedals.push({ mesh: pedal, phase: sx > 0 ? Math.PI : 0 });
  }
  bike.add(crankGroup);
  const CRANK_R = 0.25;

  // 前车筐 + 小鱼
  const basket = new THREE.Group();
  basket.position.set(0, 1.24, -1.02);
  const bBottom = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.38), wickerMat);
  bBottom.position.y = -0.14;
  basket.add(bBottom);
  const walls = [
    [0.46, 0.28, 0.045, 0, 0, 0.18],
    [0.46, 0.28, 0.045, 0, 0, -0.18],
    [0.045, 0.28, 0.36, -0.21, 0, 0],
    [0.045, 0.28, 0.36, 0.21, 0, 0],
  ];
  for (const [w, h, d, x, y, z] of walls) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wickerMat);
    side.position.set(x, y, z);
    basket.add(side);
  }
  const fish = new THREE.Group();
  const fBody = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), fishMat);
  fBody.scale.set(1.2, 0.55, 0.6);
  fish.add(fBody);
  const fTail = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 6), fishMat);
  fTail.rotation.z = -Math.PI / 2;
  fTail.position.x = -0.20;
  fish.add(fTail);
  const fEye = new THREE.Mesh(new THREE.SphereGeometry(0.024, 6, 5), eyeMat);
  fEye.position.set(0.10, 0.035, 0.068);
  fish.add(fEye);
  fish.position.set(-0.02, 0.0, 0);
  fish.rotation.y = -0.45;
  basket.add(fish);
  bike.add(basket);

  // ---------- 鹈鹕本体 ----------
  // 躯干用一条放样曲线从尾尖到前胸，避免多个球体拼装的“葫芦感”
  const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
  const body = new THREE.Mesh(loft([
    { z: 0.50, w: 0.045, h: 0.060, cy: 0.030 },
    { z: 0.42, w: 0.135, h: 0.150, cy: 0.025 },
    { z: 0.30, w: 0.205, h: 0.225, cy: 0.015 },
    { z: 0.18, w: 0.245, h: 0.265, cy: 0.005 },
    { z: 0.04, w: 0.275, h: 0.300, cy: 0.000 },
    { z: -0.10, w: 0.272, h: 0.300, cy: -0.005 },
    { z: -0.22, w: 0.245, h: 0.285, cy: -0.012 },
    { z: -0.32, w: 0.195, h: 0.235, cy: -0.020 },
    { z: -0.40, w: 0.130, h: 0.165, cy: -0.025 },
    { z: -0.45, w: 0.060, h: 0.085, cy: -0.020 },
  ], 20, { top: 0xfcfaf2, bottom: 0xecdcbd, from: 0.30, to: 0.72 }), bodyMat);
  body.position.set(0, 1.74, 0.06);
  body.rotation.x = -0.10;
  bird.add(body);

  // 尾羽：短扇形，藏进尾尖
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 1.80, 0.46);
  tailGroup.rotation.x = 0.30;
  for (let i = -2; i <= 2; i++) {
    const feather = new THREE.Mesh(new THREE.SphereGeometry(0.10, 10, 8), creamMat);
    feather.scale.set(0.55, 0.16, 0.95 - Math.abs(i) * 0.10);
    feather.position.set(i * 0.05, -0.02 * Math.abs(i), 0.07);
    feather.rotation.y = i * 0.20;
    feather.rotation.z = i * 0.05;
    tailGroup.add(feather);
  }
  bird.add(tailGroup);

  // 翅膀：肩部圆球 + 伸向车把的两段翼臂 + 向后收拢的飞羽
  const wings = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * 0.225, 1.87, -0.06);
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.155, 16, 12), creamMat);
    shoulder.scale.set(0.80, 1.02, 1.10);
    pivot.add(shoulder);
    pivot.add(taperRod(V3(0, -0.02, -0.06), V3(sx * 0.085, -0.19, -0.30), 0.088, 0.062, creamMat, 10));
    pivot.add(taperRod(V3(sx * 0.085, -0.19, -0.30), V3(sx * 0.155, -0.33, -0.46), 0.060, 0.032, creamMat, 10));
    // 初级飞羽：从腕部向后掠，末端向体侧收拢
    for (let k = 0; k < 3; k++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), creamMat);
      f.scale.set(0.24, 0.30 - k * 0.03, 1.7 - k * 0.12);
      f.position.set(sx * (0.055 + k * 0.012), -0.20 + k * 0.035, 0.05 + k * 0.03);
      f.rotation.x = -0.18 + k * 0.06;
      f.rotation.y = sx * (0.10 + k * 0.11);
      pivot.add(f);
    }
    bird.add(pivot);
    wings.push({ pivot, sx });
  }

  // 脖子：沿前探弧线排布的一串渐变球，和身体、头部自然相接
  const neckPts = [
    [0, 1.94, -0.30, 0.170],
    [0, 2.05, -0.38, 0.150],
    [0, 2.16, -0.44, 0.134],
    [0, 2.26, -0.48, 0.122],
  ];
  for (const [x, y, z, r] of neckPts) {
    const seg = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), whiteMat);
    seg.position.set(x, y, z);
    seg.scale.set(1, 1.15, 1.05);
    bird.add(seg);
  }

  // 围巾：绕在颈中段，飘带被风吹向斜后方
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.158, 0.050, 10, 20), scarfMat);
  scarf.rotation.x = 1.98;
  scarf.position.set(0, 2.14, -0.44);
  bird.add(scarf);
  const scarfSegs = [];
  let parent = new THREE.Group();
  parent.position.set(0.05, 2.17, -0.36);
  parent.rotation.x = -0.72;
  bird.add(parent);
  for (let i = 0; i < 3; i++) {
    const seg = new THREE.Group();
    if (i > 0) seg.position.z = 0.25;
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.024, 0.25), scarfMat);
    band.position.z = 0.125;
    seg.add(band);
    parent.add(seg);
    scarfSegs.push(seg);
    parent = seg;
  }

  // 头
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.36, -0.52);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.230, 22, 16), whiteMat);
  head.scale.set(0.94, 0.90, 1.08);
  head.position.set(0, 0.02, -0.01);
  headGroup.add(head);
  // 枕部短冠羽
  const crest = new THREE.Group();
  crest.position.set(0, 0.15, 0.10);
  for (let i = -1; i <= 1; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 6), creamMat);
    f.scale.set(0.45, 1.4, 0.8);
    f.position.set(i * 0.046, 0.01, -Math.abs(i) * 0.01);
    f.rotation.z = i * 0.30;
    f.rotation.x = -0.55;
    crest.add(f);
  }
  headGroup.add(crest);
  const eyes = [];
  for (const sx of [-1, 1]) {
    const ring = new THREE.Mesh(new THREE.SphereGeometry(0.066, 12, 10), eyeRingMat);
    ring.position.set(sx * 0.152, 0.060, -0.070);
    ring.scale.set(0.55, 1, 1);
    headGroup.add(ring);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), eyeMat);
    eye.position.set(sx * 0.190, 0.060, -0.080);
    eye.scale.set(0.62, 1, 1);
    headGroup.add(eye);
    eyes.push(eye);
  }

  // 喙：截面渐缩的放样体 + 下方喉囊，可张合
  const beakGroup = new THREE.Group();
  beakGroup.position.set(0, -0.010, -0.14);
  const upperBeak = new THREE.Mesh(loft([
    { z: 0.07, w: 0.140, h: 0.078, cy: 0.000 },
    { z: -0.09, w: 0.137, h: 0.074, cy: -0.008 },
    { z: -0.23, w: 0.124, h: 0.067, cy: -0.020 },
    { z: -0.37, w: 0.105, h: 0.058, cy: -0.036 },
    { z: -0.49, w: 0.081, h: 0.055, cy: -0.052 },
    { z: -0.59, w: 0.055, h: 0.042, cy: -0.066 },
    { z: -0.655, w: 0.027, h: 0.026, cy: -0.074 },
    { z: -0.69, w: 0.011, h: 0.013, cy: -0.078 },
  ], 16), beakMat);
  beakGroup.add(upperBeak);

  const pouchPivot = new THREE.Group();
  pouchPivot.position.set(0, -0.01, 0.02);
  const pouch = new THREE.Mesh(loft([
    { z: 0.05, w: 0.096, h: 0.032, cy: -0.074 },
    { z: -0.05, w: 0.132, h: 0.072, cy: -0.120 },
    { z: -0.18, w: 0.150, h: 0.104, cy: -0.152 },
    { z: -0.32, w: 0.144, h: 0.100, cy: -0.156 },
    { z: -0.45, w: 0.120, h: 0.082, cy: -0.140 },
    { z: -0.57, w: 0.082, h: 0.056, cy: -0.114 },
    { z: -0.65, w: 0.030, h: 0.026, cy: -0.082 },
  ], 16), pouchMat);
  pouchPivot.add(pouch);
  beakGroup.add(pouchPivot);

  const hook = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 7), hookMat);
  hook.scale.set(0.9, 1.1, 1.5);
  hook.position.set(0, -0.090, -0.668);
  beakGroup.add(hook);
  headGroup.add(beakGroup);
  bird.add(headGroup);

  // 两段式腿：髋-膝-踝，脚掌由 IK 踩在脚踏上
  const L1 = 0.58, L2 = 0.55;
  const legs = [];
  for (const sx of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(sx * 0.230, 1.47, 0.11);
    const hipTuft = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), creamMat);
    hipTuft.scale.set(0.85, 0.75, 0.95);
    hipTuft.position.set(sx * -0.02, 0.02, 0.0);
    bird.add(hipTuft);
    hipTuft.position.x += hip.position.x;
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.055, L1, 12), legMat);
    thigh.position.y = -L1 / 2;
    hip.add(thigh);
    const kneeBall = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 8), legMat);
    kneeBall.position.y = -L1;
    hip.add(kneeBall);
    const knee = new THREE.Group();
    knee.position.y = -L1;
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.038, L2, 12), legMat);
    shin.position.y = -L2 / 2;
    knee.add(shin);
    const ankle = new THREE.Group();
    ankle.position.y = -L2;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.175, 0.045, 0.24), footMat);
    foot.position.set(0, -0.022, -0.055);
    ankle.add(foot);
    const toe = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.032, 0.11), footMat);
    toe.position.set(0, -0.028, -0.21);
    toe.rotation.x = 0.14;
    ankle.add(toe);
    knee.add(ankle);
    hip.add(knee);
    bird.add(hip);
    legs.push({ hip, knee, ankle, sx });
  }

  // 两骨骼 IK：踝关节落在脚踏上，膝盖朝前
  function solveLeg(leg, targetY, targetZ) {
    const dz = targetZ - leg.hip.position.z;
    const dy = targetY - leg.hip.position.y;
    const d = Math.min(Math.hypot(dy, dz), L1 + L2 - 0.002);
    const phi = Math.atan2(-dz, -dy);
    const ca = clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1);
    const cb = clamp((L2 * L2 + d * d - L1 * L1) / (2 * L2 * d), -1, 1);
    const al = Math.acos(ca), be = Math.acos(cb);
    leg.hip.rotation.x = phi + al;
    leg.knee.rotation.x = -(al + be);
    leg.ankle.rotation.x = -(leg.hip.rotation.x + leg.knee.rotation.x);
  }

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.0, 24),
    new THREE.MeshBasicMaterial({ color: 0x163a4e, transparent: true, opacity: 0.10, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.125, 0.1);
  scene.add(shadow);

  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  shadow.castShadow = false;

  // ---------- 动画 ----------
  let pedal = 0;
  let blinkTimer = 2 + Math.random() * 2.4;
  let blinkT = 0;
  let chirpTimer = 3 + Math.random() * 4;
  let chirpT = 0;
  let fishTimer = 4 + Math.random() * 5;
  let fishT = 0;
  let squashT = 0;
  let prevAir = false;

  function update(dt, o) {
    const v = o.v, lean = o.lean, boosting = o.boosting, jumpY = o.jumpY, elapsed = o.elapsed;
    const airborne = jumpY > 0.04;
    // 曲柄比车轮慢（齿比），不然腿转得像陀螺
    if (airborne) pedal += dt * 1.6;
    else pedal += v * dt / 0.53 / 2.6;

    const spin = airborne ? dt * 2.0 : v * dt / 0.53;
    for (const w of wheels) w.rotation.z -= spin;
    crankGroup.rotation.x = -pedal;
    for (const p of pedals) p.mesh.rotation.x = -crankGroup.rotation.x - p.phase;

    // 踩踏：脚踝锁在脚踏上，左右相差半圈；腾空时收腿
    for (const leg of legs) {
      const th = crankGroup.rotation.x + (leg.sx > 0 ? Math.PI : 0);
      const ty = airborne ? 1.04 : 0.63 - CRANK_R * Math.cos(th) + 0.048;
      const tz = airborne ? 0.22 : -CRANK_R * Math.sin(th);
      leg.ty = leg.ty === undefined ? ty : lerp(leg.ty, ty, 1 - Math.exp(-22 * dt));
      leg.tz = leg.tz === undefined ? tz : lerp(leg.tz, tz, 1 - Math.exp(-22 * dt));
      solveLeg(leg, leg.ty, leg.tz);
    }

    // 落地挤压
    if (prevAir && !airborne) squashT = 0.20;
    prevAir = airborne;
    if (squashT > 0) squashT = Math.max(0, squashT - dt);
    const sq = squashT > 0 ? Math.sin((squashT / 0.20) * Math.PI) * 0.065 : 0;
    bird.scale.set(1 + sq * 0.45, 1 - sq, 1 + sq * 0.45);

    // 身体起伏 / 前倾 / 转向
    bird.position.y = Math.sin(pedal * 2) * 0.03 + (airborne ? 0.05 : 0);
    bird.rotation.x = lerp(bird.rotation.x, boosting ? -0.14 : (airborne ? 0.07 : 0), 1 - Math.exp(-6 * dt));
    bird.rotation.y = -0.08 + lean * 0.08;

    // 翅膀：平时搭在车把上 → 加速收翼 → 腾空展开拍打
    const flap = Math.sin(elapsed * 9.5);
    for (const w of wings) {
      const sx = w.sx;
      let rz, rx;
      if (airborne) { rz = sx * (1.10 + flap * 0.20); rx = -0.48 + flap * 0.16; }
      else if (boosting) { rz = sx * 0.46; rx = 0.34; }
      else { rz = sx * (0.02 + Math.sin(elapsed * 1.6) * 0.02); rx = 0; }
      w.pivot.rotation.z = lerp(w.pivot.rotation.z, rz, 1 - Math.exp(-9 * dt));
      w.pivot.rotation.x = lerp(w.pivot.rotation.x, rx, 1 - Math.exp(-9 * dt));
    }

    // 头：注视转向 + 呼吸
    headGroup.rotation.y = -0.34 + lean * 0.26;
    headGroup.rotation.x = 0.04 + Math.sin(pedal * 2) * 0.022 + (boosting ? -0.09 : 0);
    headGroup.rotation.z = -lean * 0.09;

    // 眨眼
    blinkTimer -= dt;
    if (blinkTimer <= 0) { blinkT = 0.13; blinkTimer = 2.2 + Math.random() * 2.6; }
    if (blinkT > 0) {
      blinkT = Math.max(0, blinkT - dt);
      const s = blinkT > 0.06 ? 0.12 : (0.12 + (0.13 - blinkT) / 0.07 * 0.88);
      for (const e of eyes) e.scale.y = Math.max(0.1, s);
    } else for (const e of eyes) e.scale.y = 1;

    // 张嘴 / 加速喘气
    chirpTimer -= dt;
    if (chirpTimer <= 0) { chirpT = 0.38; chirpTimer = 3.5 + Math.random() * 5; }
    if (chirpT > 0) chirpT = Math.max(0, chirpT - dt);
    const open = boosting
      ? 0.10 + Math.sin(elapsed * 12) * 0.06
      : chirpT > 0 ? Math.sin((chirpT / 0.38) * Math.PI) * 0.30 : 0;
    beakGroup.rotation.x = -open * 0.55;
    pouchPivot.rotation.x = open * 0.45;
    pouch.scale.z = 1 + Math.sin(elapsed * 11) * (boosting ? 0.10 : 0.03);

    // 尾羽
    tailGroup.rotation.y = Math.sin(elapsed * 3.2) * 0.12 + lean * 0.16;
    tailGroup.rotation.x = 0.52 + Math.sin(elapsed * 2.4) * 0.04 + (boosting ? 0.10 : 0);

    // 围巾
    for (let i = 0; i < scarfSegs.length; i++) {
      scarfSegs[i].rotation.z = Math.sin(elapsed * (6 + i * 1.6) + i * 1.2) * (0.16 + i * 0.06) + lean * 0.08;
      scarfSegs[i].rotation.x = (boosting ? -0.10 : 0.16 + i * 0.10) + Math.sin(elapsed * 5 + i) * 0.07 + (airborne ? -0.12 : 0);
    }

    // 小鱼扑腾
    fishTimer -= dt;
    if (fishTimer <= 0) { fishT = 0.6; fishTimer = 4.5 + Math.random() * 5; }
    if (fishT > 0) {
      fishT = Math.max(0, fishT - dt);
      fish.rotation.z = Math.sin(fishT * 22) * 0.35 * (fishT / 0.6);
      fish.position.y = Math.abs(Math.sin(fishT * 22)) * 0.05 * (fishT / 0.6);
    } else {
      fish.rotation.z = 0;
      fish.position.y = 0;
    }

    crest.rotation.z = Math.sin(elapsed * 4) * 0.10;
    root.position.y = jumpY;
    root.rotation.z = -lean * 0.30;
    root.rotation.y = lean * 0.14;
    shadow.position.x = root.position.x;
    const s = Math.max(0.4, 1 - jumpY * 0.28);
    shadow.scale.setScalar(s);
    shadow.material.opacity = 0.10 * s;
  }

  return { root, shadow, update };
}
