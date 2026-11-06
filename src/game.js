import * as THREE from 'three';
import { clamp, lerp, rand, V3, mergeColored } from './utils.js';
import { createWorld } from './world.js';
import { createPlayer } from './player.js';
import { createEffects } from './effects.js';
import { createAudio } from './audio.js';
import { createMeta, boardQualifies, boardAdd, getName, setName, loadBoard } from './meta.js';

const $ = (id) => document.getElementById(id);
const ui = {
  canvas: $('game'), hud: $('hud'), menu: $('menu'), pause: $('pause'), over: $('over'),
  touch: $('touch'), score: $('score'), coins: $('coins'), dist: $('dist'),
  combo: $('combo'), hearts: $('hearts'), energy: $('energy-fill'), cam: $('btn-cam'),
  powerup: $('powerup'), speedlines: $('speedlines'), flash: $('flash'), damage: $('damage'),
  floatLayer: $('float-layer'), hint: $('hint'),
  menuBest: $('menu-best'), menuSummary: $('menu-summary'),
  rScore: $('r-score'), rCoins: $('r-coins'), rDist: $('r-dist'),
  rBest: $('r-best'), newBest: $('new-best'), overTitle: $('over-title'),
  rAchv: $('r-achv'), nameRow: $('name-row'), playerName: $('player-name'),
  btnSaveScore: $('btn-save-score'), rRank: $('r-rank'),
  rotateHint: $('rotate-hint'), intro: $('intro-text'), sound: $('btn-sound'),
  screenBoard: $('screen-board'), screenAchv: $('screen-achv'),
};

const MAX_HP = 3;
const audio = createAudio();
const meta = createMeta();
meta.setOnUnlock(() => audio.achv());

const coarse = !!(window.matchMedia && window.matchMedia('(pointer:coarse)').matches);

const renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(64, 1, 0.1, 700);
const world = createWorld(scene, { coarse, anisotropy: renderer.capabilities.getMaxAnisotropy() });
const player = createPlayer(scene);
const fx = createEffects(scene);

// ---------- 金币 ----------
const coinGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.085, 18);
const coinMat = new THREE.MeshStandardMaterial({ color: 0xffcf3d, metalness: 0.18, roughness: 0.34, emissive: 0xffa518, emissiveIntensity: 0.42 });
const COIN_N = 64;
const coins = [];
for (let i = 0; i < COIN_N; i++) {
  const pivot = new THREE.Group();
  const mesh = new THREE.Mesh(coinGeo, coinMat);
  mesh.rotation.x = Math.PI / 2;
  mesh.castShadow = true;
  pivot.add(mesh);
  scene.add(pivot);
  coins.push({ pivot, x: 0, y: 1.1, z: -100, state: 'idle', spin: rand(0, 6.28) });
}

// ---------- 障碍 ----------
function obstacleGeometry(kind) {
  if (kind === 0) {
    const c = new THREE.ConeGeometry(0.36, 0.88, 10); c.translate(0, 0.48, 0);
    const s = new THREE.CylinderGeometry(0.235, 0.265, 0.13, 10); s.translate(0, 0.52, 0);
    const b = new THREE.BoxGeometry(0.80, 0.09, 0.80); b.translate(0, 0.045, 0);
    return [{ g: b, color: 0x3a444e }, { g: c, color: 0xef7b24 }, { g: s, color: 0xf7f4e8 }];
  }
  if (kind === 1) {
    const b = new THREE.BoxGeometry(1.05, 0.95, 1.05); b.translate(0, 0.48, 0);
    const l = new THREE.BoxGeometry(1.12, 0.10, 1.12); l.translate(0, 0.98, 0);
    return [{ g: b, color: 0xb47c47 }, { g: l, color: 0x8c5f34 }];
  }
  const r = new THREE.DodecahedronGeometry(0.68, 0); r.scale(1.05, 0.78, 1); r.translate(0, 0.5, 0);
  const r2 = new THREE.DodecahedronGeometry(0.38, 0); r2.scale(1, 0.7, 1); r2.translate(0.55, 0.25, 0.35);
  return [{ g: r, color: 0x7f919b }, { g: r2, color: 0x6c7d87 }];
}
const obstacleGeos = [];
for (let i = 0; i < 3; i++) {
  const parts = obstacleGeometry(i).slice();
  const shade = new THREE.CircleGeometry(0.85, 12);
  shade.rotateX(-Math.PI / 2); shade.translate(0, 0.028, 0);
  parts.push({ g: shade, color: 0x3c4750 });
  obstacleGeos.push(mergeColored(parts));
}
const solidMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
const OBS_N = 16;
const obstacles = [];
for (let i = 0; i < OBS_N; i++) {
  const m = new THREE.Mesh(obstacleGeos[0], solidMat);
  m.castShadow = true;
  scene.add(m);
  obstacles.push({ mesh: m, x: 0, z: -100, type: 0, hitDone: false });
}

// ---------- 道具 ----------
const pickRingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const pickRingHealthMat = new THREE.MeshBasicMaterial({ color: 0xffa9b8 });
const pickRingGeo = new THREE.TorusGeometry(0.62, 0.05, 6, 20);
const whiteBasic = new THREE.MeshBasicMaterial({ color: 0xffffff });
const PICK_N = 6;
const pickups = [];
for (let i = 0; i < PICK_N; i++) {
  const group = new THREE.Group();
  const health = new THREE.Group();
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 1), new THREE.MeshStandardMaterial({ color: 0xff4f6d, emissive: 0x8b1226, emissiveIntensity: 0.65, roughness: 0.3 }));
  health.add(orb);
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.06), whiteBasic); c1.position.z = 0.34;
  const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.44, 0.06), whiteBasic); c2.position.z = 0.35;
  health.add(c1, c2);
  const magnet = new THREE.Group();
  magnet.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), new THREE.MeshStandardMaterial({ color: 0x18c2dd, emissive: 0x075a70, emissiveIntensity: 0.6, metalness: 0.5, roughness: 0.25 })));
  const ringA = new THREE.Mesh(pickRingGeo, pickRingMat); ringA.rotation.x = 1.1; magnet.add(ringA);
  const ring = new THREE.Mesh(pickRingGeo, pickRingMat); ring.rotation.x = 1.1;
  group.add(health, magnet, ring);
  scene.add(group);
  pickups.push({ group, health, magnet, ring, x: 0, z: -150, alive: true, type: 'health' });
}

let coinSpawnZ = -20, clusterLeft = 0, clusterX = 0, clusterPhase = 0, clusterIdx = 0;
let obsSpawnZ = -30, pickSpawnZ = -55;

function respawnCoin(c) {
  if (clusterLeft <= 0) {
    clusterLeft = 6 + Math.floor(Math.random() * 3);
    clusterX = rand(-4.0, 4.0);
    clusterPhase = rand(0, 6.28);
    clusterIdx = 0;
    coinSpawnZ -= 13;
  }
  clusterLeft--;
  const i = clusterIdx++;
  c.x = clamp(clusterX + Math.sin(clusterPhase + i * 0.52) * 2.1, -5.3, 5.3);
  c.y = 1.08 + Math.sin(i * 0.65) * 0.12;
  c.z = coinSpawnZ;
  coinSpawnZ -= 3.1;
  c.state = 'idle';
  c.pivot.visible = true;
  c.pivot.scale.setScalar(1);
  c.pivot.position.set(c.x, c.y, c.z);
}
function respawnObstacle(o) {
  obsSpawnZ -= rand(15, 24);
  o.z = obsSpawnZ;
  o.x = rand(-5.0, 5.0);
  o.type = Math.floor(Math.random() * 3);
  o.mesh.geometry = obstacleGeos[o.type];
  o.mesh.position.set(o.x, 0.02, o.z);
  o.mesh.rotation.y = rand(0, 6.28);
  o.mesh.visible = true;
  o.hitDone = false;
}
function respawnPickup(p) {
  pickSpawnZ -= rand(52, 92);
  p.z = pickSpawnZ;
  p.x = rand(-4.8, 4.8);
  p.alive = true;
  const wantHealth = hp < MAX_HP ? Math.random() < 0.72 : Math.random() < 0.38;
  p.type = wantHealth ? 'health' : 'magnet';
  p.health.visible = p.type === 'health';
  p.magnet.visible = p.type === 'magnet';
  p.ring.material = p.type === 'health' ? pickRingHealthMat : pickRingMat;
  p.group.position.set(p.x, 1.3, p.z);
  p.group.visible = true;
}
function resetPools() {
  coinSpawnZ = -20; clusterLeft = 0; clusterIdx = 0;
  obsSpawnZ = -30; pickSpawnZ = -55;
  for (const c of coins) respawnCoin(c);
  for (const o of obstacles) respawnObstacle(o);
  for (const p of pickups) respawnPickup(p);
}

// ---------- 相机 ----------
const CAM_MODES = [
  { name: '跟随', fov: 64 }, { name: '第一人称', fov: 78 }, { name: '侧跟拍', fov: 70 },
  { name: '俯视', fov: 58 }, { name: '自由', fov: 62 },
];
function baseCamera() {
  const p = playerX, j = jumpY;
  if (camIndex === 0) return { pos: V3(p * 0.5 + 2.75, 2.55 + j * 0.30, 5.15), look: V3(p * 0.72 + 0.85, 1.82, -5.6) };
  if (camIndex === 1) return { pos: V3(p, 2.58 + j, -0.35), look: V3(p, 2.25 + j, -26) };
  if (camIndex === 2) return { pos: V3(7.2, 1.7, 2.2), look: V3(p * 0.3, 1.6, -5) };
  if (camIndex === 3) return { pos: V3(p * 0.3, 16, 12), look: V3(p * 0.4, 0, -16) };
  return { pos: V3(p, 3.6 + j * 0.3, 10.5), look: V3(p, 1.6 + j, 0) };
}
const qYaw = new THREE.Quaternion();
const qPitch = new THREE.Quaternion();
function cameraFrame() {
  const t = baseCamera();
  let pos = t.pos, look = t.look;
  if (camIndex === 1) {
    const yaw = orbitYaw, pitch = clamp(orbitPitch, -0.45, 0.9);
    const dir = V3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch) * 0.8, -Math.cos(yaw) * Math.cos(pitch));
    look = pos.clone().add(dir.multiplyScalar(28));
  } else {
    const pivot = look.clone();
    const off = pos.clone().sub(pivot);
    qYaw.setFromAxisAngle(V3(0, 1, 0), orbitYaw);
    off.applyQuaternion(qYaw);
    const right = new THREE.Vector3().crossVectors(off, V3(0, 1, 0));
    if (right.lengthSq() > 0.0001) {
      qPitch.setFromAxisAngle(right.normalize(), orbitPitch);
      off.applyQuaternion(qPitch);
    }
    off.multiplyScalar(orbitDist);
    pos = pivot.clone().add(off);
  }
  return { pos, look };
}

// ---------- 状态 ----------
let state = 'menu';
let playerX = 0, lean = 0, speed = 16, distance = 0, score = 0, coinCount = 0;
let energy = 60, hp = MAX_HP, combo = 0, comboTimer = 0, multiplier = 1;
let boosting = false, magnetTime = 0, invuln = 0, shake = 0, elapsed = 0;
let jumpY = 0, jumpVel = 0, grounded = true;
let camIndex = 0, orbitYaw = 0, orbitPitch = 0, orbitDist = 1;
let hudTick = 0, trailTick = 0, damagePulse = 0;
let introT = 0;
let touchLeft = false, touchRight = false, touchBoost = false;
let lastFinal = 0, lastCoins = 0, lastDist = 0;
const keys = Object.create(null);
const camLook = new THREE.Vector3();
let best = 0;
try { best = Number(localStorage.getItem('pelican_ride_best_v1') || 0) || 0; } catch (e) { best = 0; }

// ---------- 工具 ----------
function floatText(x, y, z, text, color) {
  camera.updateMatrixWorld();
  const v = V3(x, y, z).project(camera);
  if (v.z > 1 || v.z < -1) return;
  const el = document.createElement('div');
  el.className = 'float-text';
  el.style.left = ((v.x * 0.5 + 0.5) * 100) + '%';
  el.style.top = ((-v.y * 0.5 + 0.5) * 100) + '%';
  el.textContent = text;
  if (color) el.style.color = color;
  ui.floatLayer.appendChild(el);
  setTimeout(() => el.remove(), 940);
}

function renderHearts() {
  ui.hearts.innerHTML = '';
  for (let i = 0; i < MAX_HP; i++) {
    const s = document.createElement('span');
    s.className = 'heart' + (i < hp ? '' : ' empty');
    s.textContent = '♥';
    ui.hearts.appendChild(s);
  }
}
function setState(s) {
  state = s;
  ui.menu.classList.toggle('hidden', s !== 'menu');
  ui.pause.classList.toggle('hidden', s !== 'paused');
  ui.over.classList.toggle('hidden', s !== 'gameover');
  ui.hud.classList.toggle('hidden', s === 'menu' || s === 'gameover');
  ui.touch.classList.toggle('hidden', s !== 'playing');
  if (s === 'menu') updateMenuStats();
}
function updateMenuStats() {
  ui.menuBest.textContent = best.toLocaleString('zh-CN');
  if (ui.menuSummary) ui.menuSummary.textContent = meta.summary();
}
function resetGame() {
  playerX = 0; lean = 0; speed = 16; distance = 0; score = 0; coinCount = 0;
  energy = 60; hp = MAX_HP; combo = 0; comboTimer = 0; multiplier = 1;
  boosting = false; magnetTime = 0; invuln = 0; shake = 0;
  jumpY = 0; jumpVel = 0; grounded = true;
  camIndex = 0; orbitYaw = 0; orbitPitch = 0; orbitDist = 1;
  damagePulse = 0;
  world.reset(); fx.reset(); resetPools(); renderHearts();
  meta.resetRun();
  const f = cameraFrame();
  camera.position.copy(f.pos);
  camLook.copy(f.look);
  camera.fov = CAM_MODES[0].fov;
  camera.updateProjectionMatrix();
  updateHUD();
}
function startGame() {
  audio.ensure();
  keys.Space = false;
  resetGame();
  setState('playing');
  // 开场镜头：从侧前方绕到跟随位
  introT = 1.25;
  camera.position.set(playerX + 7.5, 5.2, -13);
  camLook.set(playerX, 1.8, 0);
  if (ui.intro) {
    ui.intro.classList.remove('show');
    void ui.intro.offsetWidth;
    ui.intro.classList.add('show');
  }
  audio.start();
}
function gameOver() {
  setState('gameover');
  lastFinal = Math.floor(score);
  lastCoins = coinCount;
  lastDist = distance;
  const isNew = lastFinal > best;
  if (isNew) { best = lastFinal; try { localStorage.setItem('pelican_ride_best_v1', String(best)); } catch (e) { /* ignore */ } }
  ui.rScore.textContent = lastFinal.toLocaleString('zh-CN');
  ui.rCoins.textContent = String(lastCoins);
  ui.rDist.textContent = Math.floor(lastDist) + 'm';
  ui.rBest.textContent = best.toLocaleString('zh-CN');
  ui.newBest.classList.toggle('hidden', !isNew);
  ui.overTitle.textContent = isNew ? '新纪录！' : (lastFinal > best * 0.6 ? '骑得不错！' : '再来一局？');
  // 本局新解锁的成就
  const newly = meta.endRun();
  if (ui.rAchv) {
    ui.rAchv.innerHTML = newly.length
      ? '<div class="r-achv-title">本局解锁成就</div>' + newly.map((a) => '<span class="achv-chip">' + a.icon + ' ' + a.name + '</span>').join('')
      : '';
  }
  // 排行榜：达到门槛时可留名
  if (ui.nameRow && ui.rRank) {
    const qualifies = boardQualifies(lastFinal);
    ui.nameRow.classList.toggle('hidden', !qualifies);
    ui.rRank.classList.add('hidden');
    if (qualifies) ui.playerName.value = getName();
  }
  updateMenuStats();
  audio.over();
}
function saveScore() {
  const name = (ui.playerName.value || '').trim().slice(0, 8) || '无名骑手';
  setName(name);
  const rank = boardAdd({ name, score: lastFinal, coins: lastCoins, dist: lastDist, date: Date.now() });
  ui.nameRow.classList.add('hidden');
  ui.rRank.classList.remove('hidden');
  ui.rRank.textContent = rank > 0 ? '已登上海岸榜 · 当前第 ' + rank + ' 名' : '距离上榜还差一点';
  audio.ui();
}
function toMenu() {
  setState('menu');
}
function togglePause() {
  if (state === 'playing') setState('paused');
  else if (state === 'paused') setState('playing');
}
function cycleCamera() {
  camIndex = (camIndex + 1) % CAM_MODES.length;
  orbitYaw = 0; orbitPitch = 0;
  meta.viewMode(camIndex);
  audio.ui();
  updateHUD();
}
function tryJump() {
  if (state !== 'playing' || !grounded) return;
  jumpVel = 8.6; grounded = false;
  meta.event('jump');
  fx.burst(playerX, 0.25, 0.5, 0xe9d8ae, 10, { speed: 2.2, life: 0.5, size: 0.14, gravity: 6, up: 0.6 });
  audio.jump();
}
function updateHUD() {
  ui.score.textContent = Math.floor(score).toLocaleString('zh-CN');
  ui.coins.textContent = String(coinCount);
  ui.dist.textContent = Math.floor(distance) + 'm';
  ui.combo.textContent = '倍率 ×' + multiplier.toFixed(1).replace('.0', '') + (combo > 1 ? ' · ' + combo + ' 连' : '');
  ui.energy.style.width = clamp(energy, 0, 100).toFixed(1) + '%';
  ui.energy.classList.toggle('boost', boosting);
  ui.cam.textContent = '视角 · ' + CAM_MODES[camIndex].name;
  ui.powerup.classList.toggle('hidden', magnetTime <= 0);
  if (magnetTime > 0) ui.powerup.textContent = '磁铁 ' + magnetTime.toFixed(1) + 's';
  ui.speedlines.style.opacity = boosting ? '0.55' : (speed > 24 ? '0.13' : '0');
}

function smashObstacle(o) {
  const x = o.x, z = o.z;
  fx.burst(x, 0.65, z, 0xffae45, 20, { speed: 6.5, life: 0.95, size: 0.26, gravity: 11, spread: 0.7 });
  fx.burst(x, 0.55, z, 0x8b989e, 14, { speed: 5.2, life: 1.1, size: 0.21, gravity: 12, spread: 0.6 });
  const gain = Math.round(30 * multiplier);
  score += gain;
  meta.event('smash');
  floatText(x, 1.5, z, '撞碎 +' + gain, '#ffd166');
  shake = Math.max(shake, 0.24);
  audio.smash();
  respawnObstacle(o);
}
function takeDamage() {
  hp--;
  invuln = 1.5;
  combo = 0; comboTimer = 0; multiplier = 1;
  energy = Math.max(0, energy - 20);
  speed *= 0.55;
  shake = 0.62;
  damagePulse = 1;
  meta.run.noHitDist = 0;
  ui.flash.style.opacity = '0.42';
  setTimeout(() => { ui.flash.style.opacity = '0'; }, 90);
  fx.burst(playerX, 1.2, 0, 0xff6b6b, 12, { speed: 3.5, life: 0.6, size: 0.20, gravity: 8 });
  floatText(playerX, 2.2, 0, '-1 ♥', '#ff6b6b');
  audio.hurt();
  renderHearts();
  if (hp <= 0) gameOver();
}

// ---------- 主循环 ----------
function update(dt) {
  elapsed += dt;
  const active = state === 'playing';
  const ambient = state === 'menu' ? 7 : state === 'paused' ? 0 : 2.5;

  if (active) {
    const dir = ((keys.KeyD || keys.ArrowRight || touchRight) ? 1 : 0) - ((keys.KeyA || keys.ArrowLeft || touchLeft) ? 1 : 0);
    playerX = clamp(playerX + dir * 9.2 * dt, -5.6, 5.6);
    lean = lerp(lean, dir, 1 - Math.exp(-9 * dt));

    const wantBoost = !!(keys.ShiftLeft || keys.ShiftRight || touchBoost) && energy > 1;
    if (wantBoost && !boosting) audio.boost();
    boosting = wantBoost;
    energy = clamp(energy + (boosting ? -20 : 0.9) * dt, 0, 100);
    magnetTime = Math.max(0, magnetTime - dt);
    invuln = Math.max(0, invuln - dt);
    comboTimer -= dt;
    if (comboTimer <= 0 && combo > 0) combo = 0;

    if (!grounded) {
      jumpVel -= 20 * dt;
      jumpY += jumpVel * dt;
      if (jumpY <= 0) {
        jumpY = 0; jumpVel = 0; grounded = true;
        fx.burst(playerX, 0.18, 0.4, 0xe9d8ae, 12, { speed: 2.6, life: 0.55, size: 0.16, gravity: 7, up: 0.4 });
        audio.land();
      }
    }

    const baseSpeed = 16 + Math.min(distance * 0.008, 12);
    const target = baseSpeed * (boosting ? 1.72 : 1);
    speed = lerp(speed, target, 1 - Math.exp(-3.2 * dt));
    distance += speed * dt;
    score += speed * dt * 0.8;
    multiplier = Math.min(1 + Math.floor(combo / 6) * 0.5, 4) * (boosting ? 2 : 1);

    // 成就数据
    meta.run.score = score;
    meta.run.dist = distance;
    if (combo > meta.run.bestCombo) meta.run.bestCombo = combo;
    if (boosting) meta.run.boostTime += dt;
    meta.run.noHitDist += speed * dt;

    trailTick += dt;
    if (boosting && trailTick > 0.07) {
      trailTick = 0;
      fx.burst(playerX + rand(-0.35, 0.35), rand(0.3, 1.3), rand(1.0, 2.3), 0xffe3a0, 2,
        { speed: 1.2, life: 0.5, size: 0.13, gravity: 1.0, up: 0.5, spread: 0.25 });
    }
    audio.setWind(clamp((speed - 14) / 26, 0, 1) * (boosting ? 1 : 0.35));
  } else {
    boosting = false;
    lean = lerp(lean, 0, 1 - Math.exp(-4 * dt));
    audio.setWind(0.05);
  }

  const v = active ? speed : ambient;
  const pickupRadius = (boosting ? 5.0 : 3.2) * (magnetTime > 0 ? 1.9 : 1);
  coinSpawnZ += v * dt; obsSpawnZ += v * dt; pickSpawnZ += v * dt;
  world.update(dt, v, elapsed);
  player.root.position.x = playerX;
  player.update(dt, { v, lean, boosting, jumpY, elapsed });

  for (const c of coins) {
    if (c.state === 'idle') {
      c.z += v * dt;
      c.spin += dt * 3.2;
      if (c.z > 20) { respawnCoin(c); continue; }
      const dx = c.x - playerX;
      if (active && dx * dx + c.z * c.z < pickupRadius * pickupRadius) c.state = 'flying';
      c.pivot.position.set(c.x, c.y, c.z);
    } else {
      const k = 1 - Math.exp(-13 * dt);
      c.x = lerp(c.x, playerX, k);
      c.z = lerp(c.z, 0, k);
      c.y = lerp(c.y, 1.9 + jumpY, k);
      c.spin += dt * 9;
      c.pivot.position.set(c.x, c.y, c.z);
      c.pivot.scale.setScalar(Math.max(0.15, c.pivot.scale.x - dt * 1.3));
      const dx = c.x - playerX;
      if (dx * dx + c.z * c.z < 0.6) {
        const gain = Math.round(10 * multiplier);
        score += gain; coinCount++;
        combo++; comboTimer = 2.1;
        energy = clamp(energy + 4.2, 0, 100);
        meta.event('coin');
        fx.burst(c.x, c.y, c.z, 0xffd54a, 7, { speed: 2.8, life: 0.55, size: 0.15, gravity: 3, spread: 0.25 });
        floatText(c.x, c.y, c.z, '+' + gain);
        audio.coin(combo);
        respawnCoin(c);
        continue;
      }
    }
    c.pivot.rotation.y = c.spin;
  }

  for (const o of obstacles) {
    o.z += v * dt;
    o.mesh.position.z = o.z;
    if (o.z > 20) { respawnObstacle(o); continue; }
    if (active && invuln <= 0 && jumpY < 0.95 && !o.hitDone && Math.abs(o.z) < 1.15 && Math.abs(o.x - playerX) < 0.95) {
      o.hitDone = true;
      if (boosting) smashObstacle(o);
      else takeDamage();
    }
  }

  for (const p of pickups) {
    p.z += v * dt;
    p.group.position.z = p.z;
    p.group.rotation.y += dt * 1.5;
    p.ring.rotation.z += dt * 2.2;
    if (p.z > 20 || !p.alive) { respawnPickup(p); continue; }
    if (active && p.alive && Math.abs(p.z) < 1.5 && Math.abs(p.x - playerX) < 1.5) {
      const isHealth = p.type === 'health';
      const px = p.x, pz = p.z;
      p.alive = false;
      if (isHealth) {
        meta.event('health');
        if (hp < MAX_HP) {
          hp++;
          floatText(px, 1.7, pz, '+1 ♥', '#7be08a');
          fx.burst(px, 1.3, pz, 0x6fdd92, 16, { speed: 3.2, life: 0.9, size: 0.19, gravity: -1.2, up: 1.4 });
          audio.heal();
          renderHearts();
        } else {
          score += 50;
          floatText(px, 1.7, pz, '+50', '#ffd166');
          audio.heal();
        }
      } else {
        magnetTime = 8;
        meta.event('magnet');
        floatText(px, 1.7, pz, '磁铁!', '#7ff0ff');
        fx.burst(px, 1.3, pz, 0x6fe4ff, 14, { speed: 3.0, life: 0.8, size: 0.18, gravity: 2 });
        audio.magnet();
      }
      respawnPickup(p);
    }
  }

  fx.update(dt, v);

  // 相机：开场慢速滑入，之后正常跟随
  const f = cameraFrame();
  if (introT > 0) introT = Math.max(0, introT - dt);
  const k = 1 - Math.exp(-(introT > 0 ? 2.2 : 6) * dt);
  camera.position.lerp(f.pos, k);
  if (shake > 0.002) {
    camera.position.x += (Math.random() - 0.5) * shake;
    camera.position.y += (Math.random() - 0.5) * shake;
    shake *= Math.exp(-7 * dt);
  }
  camLook.lerp(f.look, k);
  camera.lookAt(camLook);
  camera.rotateZ(-lean * 0.035);
  const fovTarget = CAM_MODES[camIndex].fov + (boosting ? 6 : 0);
  camera.fov = lerp(camera.fov, fovTarget, k);
  camera.updateProjectionMatrix();
  const fp = camIndex === 1;
  player.root.visible = !fp;
  player.shadow.visible = !fp;
  if (damagePulse > 0) {
    damagePulse = Math.max(0, damagePulse - dt * 1.6);
    ui.damage.style.opacity = (damagePulse * 0.75).toFixed(2);
  }

  hudTick += dt;
  if (hudTick > 0.07) {
    hudTick = 0;
    updateHUD();
    meta.evaluate();
  }
}

// ---------- 输入 ----------
function bindHold(el, on, off) {
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (el.setPointerCapture) { try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
    on(); el.classList.add('active');
  });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) {
    el.addEventListener(ev, (e) => { e.preventDefault(); if (off) off(); el.classList.remove('active'); });
  }
}
bindHold($('t-left'), () => { touchLeft = true; }, () => { touchLeft = false; });
bindHold($('t-right'), () => { touchRight = true; }, () => { touchRight = false; });
bindHold($('t-boost'), () => { touchBoost = true; }, () => { touchBoost = false; });
bindHold($('t-jump'), () => { tryJump(); }, null);

let dragging = false, lastX = 0, lastY = 0;
ui.canvas.addEventListener('pointerdown', (e) => {
  dragging = true; lastX = e.clientX; lastY = e.clientY;
  if (ui.canvas.setPointerCapture) { try { ui.canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
});
ui.canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastX, dy = e.clientY - lastY;
  lastX = e.clientX; lastY = e.clientY;
  orbitYaw -= dx * 0.005;
  orbitPitch = clamp(orbitPitch + dy * 0.004, -0.55, 1.0);
});
for (const ev of ['pointerup', 'pointercancel']) {
  window.addEventListener(ev, () => { dragging = false; });
}
ui.canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  orbitDist = clamp(orbitDist + e.deltaY * 0.0012, 0.55, 2.4);
}, { passive: false });

// ---------- 按钮 ----------
$('btn-start').addEventListener('click', startGame);
$('btn-restart').addEventListener('click', startGame);
$('btn-resume').addEventListener('click', togglePause);
$('btn-quit').addEventListener('click', toMenu);
$('btn-menu').addEventListener('click', toMenu);
$('btn-cam').addEventListener('click', cycleCamera);
$('btn-pause').addEventListener('click', togglePause);
$('btn-save-score').addEventListener('click', saveScore);
ui.playerName.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.key === 'Enter') saveScore();
});

function toggleSound() {
  audio.ensure();
  const on = audio.toggle();
  ui.sound.textContent = on ? '🔊' : '🔇';
}
ui.sound.addEventListener('click', toggleSound);

// 排行榜 / 成就面板（可从首页或暂停中打开）
function openPanel(which) {
  audio.ui();
  if (which === 'board') {
    meta.renderBoardPanel();
    ui.screenBoard.classList.remove('hidden');
  } else {
    meta.renderAchvPanel();
    ui.screenAchv.classList.remove('hidden');
  }
}
function closePanel(which) {
  audio.ui();
  if (which === 'board') ui.screenBoard.classList.add('hidden');
  else ui.screenAchv.classList.add('hidden');
}
$('btn-board').addEventListener('click', () => openPanel('board'));
$('btn-achv').addEventListener('click', () => openPanel('achv'));
$('btn-pause-board').addEventListener('click', () => openPanel('board'));
$('btn-pause-achv').addEventListener('click', () => openPanel('achv'));
$('btn-board-back').addEventListener('click', () => closePanel('board'));
$('btn-achv-back').addEventListener('click', () => closePanel('achv'));

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  if (e.code === 'Space') tryJump();
  else if (e.code === 'KeyC') cycleCamera();
  else if (e.code === 'KeyM') toggleSound();
  else if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
  else if (e.code === 'KeyR' && state === 'gameover') startGame();
  else if (e.code === 'Enter' && state === 'menu') startGame();
  audio.ensure();
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
window.addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  touchLeft = touchRight = touchBoost = false;
  if (state === 'playing') togglePause();
});

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  ui.rotateHint.classList.toggle('hidden', w >= h);
}
window.addEventListener('resize', resize);
resize();

resetPools();
resetGame();
setState('menu');
ui.menuBest.textContent = best.toLocaleString('zh-CN');
if (ui.menuSummary) ui.menuSummary.textContent = meta.summary();
ui.damage.style.opacity = '0';

// ---------- 调试钩子（自动化验证用） ----------
window.__pelicanDebug = () => ({
  state, camIndex, hp, score: Math.floor(score), boosting,
  achv: meta.unlockedCount(), boardLen: loadBoard().length,
  orbitYaw: +orbitYaw.toFixed(3), orbitPitch: +orbitPitch.toFixed(3),
  orbitDist: +orbitDist.toFixed(3), jumpY: +jumpY.toFixed(2),
  camX: +camera.position.x.toFixed(2), camZ: +camera.position.z.toFixed(2),
});
window.__pelicanTest = {
  end: () => gameOver(),
  unlock: () => { meta.run.coins = 999; meta.run.smashed = 999; meta.evaluate(); },
  board: () => loadBoard(),
};

const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  update(dt);
  renderer.render(scene, camera);
}
frame();
