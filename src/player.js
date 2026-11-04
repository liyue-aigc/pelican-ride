import * as THREE from 'three';
import { lerp, rod, V3 } from './utils.js';

export function createPlayer(scene) {
  const root = new THREE.Group();
  const bike = new THREE.Group();
  const bird = new THREE.Group();
  root.add(bike, bird);
  bird.rotation.y = -0.42;
  scene.add(root);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0xe8534b, metalness: 0.38, roughness: 0.42 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2b343e, roughness: 0.8 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xc8d2d9, metalness: 0.7, roughness: 0.28 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xfaf7ed, roughness: 0.86 });
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xf8a92b, roughness: 0.58 });
  const pouchMat = new THREE.MeshStandardMaterial({ color: 0xef8b3c, roughness: 0.72 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x22282f, roughness: 0.35 });
  const scarfMat = new THREE.MeshStandardMaterial({ color: 0x2e9bd0, roughness: 0.85 });

  const wheels = [];
  for (const z of [-0.80, 0.80]) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.078, 8, 22), darkMat);
    w.position.set(0, 0.63, z);
    w.rotation.y = Math.PI / 2;
    bike.add(w);
    wheels.push(w);
    for (let i = 0; i < 4; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.96, 0.022), metalMat);
      spoke.rotation.z = i * Math.PI / 4;
      const holder = new THREE.Group();
      holder.position.set(0, 0.63, z);
      holder.rotation.y = Math.PI / 2;
      holder.add(spoke);
      bike.add(holder);
      wheels.push(holder);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.16, 8), metalMat);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(0, 0.63, z);
    bike.add(hub);
  }
  const rear = V3(0, 0.63, 0.80), front = V3(0, 0.63, -0.80);
  const seat = V3(0, 1.34, 0.26), headTube = V3(0, 1.42, -0.60);
  bike.add(rod(rear, seat, 0.048, frameMat));
  bike.add(rod(seat, headTube, 0.048, frameMat));
  bike.add(rod(seat, front, 0.042, frameMat));
  bike.add(rod(rear, headTube, 0.040, frameMat));
  bike.add(rod(V3(-0.43, 1.48, -0.60), V3(0.43, 1.48, -0.60), 0.042, metalMat));
  bike.add(rod(V3(0, 1.42, -0.60), front, 0.048, metalMat));
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.10, 0.36), darkMat);
  saddle.position.set(0, 1.40, 0.28);
  bike.add(saddle);
  const crank = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.54, 8), metalMat);
  crank.rotation.z = Math.PI / 2;
  crank.position.set(0, 0.63, 0);
  bike.add(crank);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff0b8, emissive: 0xffc44d, emissiveIntensity: 0.8, roughness: 0.3 }));
  lamp.position.set(0, 1.28, -0.78);
  bike.add(lamp);
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), metalMat);
  bell.position.set(0.30, 1.52, -0.60);
  bike.add(bell);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 14), whiteMat);
  body.scale.set(0.96, 0.86, 1.20);
  body.position.set(0, 1.78, 0.12);
  bird.add(body);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.60, 7), whiteMat);
  tail.rotation.x = -Math.PI / 2;
  tail.position.set(0, 1.76, 0.88);
  bird.add(tail);
  for (const sx of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.40, 14, 10), whiteMat);
    wing.scale.set(0.33, 0.72, 1.10);
    wing.position.set(sx * 0.50, 1.80, 0.20);
    wing.rotation.z = sx * 0.20;
    bird.add(wing);
  }

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.23, 0.82, 10), whiteMat);
  neck.rotation.x = -0.28;
  neck.position.set(0, 2.25, -0.33);
  bird.add(neck);
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.215, 0.075, 8, 14), scarfMat);
  scarf.rotation.x = Math.PI / 2;
  scarf.position.set(0, 2.32, -0.34);
  bird.add(scarf);
  const scarfTail = new THREE.Group();
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.06, 0.85), scarfMat);
  band.position.set(0.16, 0, 0.44);
  scarfTail.add(band);
  scarfTail.position.set(0.10, 2.28, 0.12);
  bird.add(scarfTail);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 16, 12), whiteMat);
  head.position.set(0, 2.63, -0.55);
  bird.add(head);
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.34, 6), whiteMat);
  crest.rotation.x = -0.35;
  crest.position.set(0, 2.94, -0.45);
  bird.add(crest);
  const upperBeak = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.095, 1.22), beakMat);
  upperBeak.position.set(0, 2.58, -1.14);
  upperBeak.rotation.x = 0.06;
  bird.add(upperBeak);
  const beakTip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.26, 4), beakMat);
  beakTip.rotation.x = -Math.PI / 2;
  beakTip.position.set(0, 2.60, -1.82);
  bird.add(beakTip);
  const pouch = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 10), pouchMat);
  pouch.scale.set(0.92, 0.62, 1.95);
  pouch.position.set(0, 2.40, -1.08);
  bird.add(pouch);
  for (const sx of [-1, 1]) {
    const eyeRing = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), new THREE.MeshStandardMaterial({ color: 0xe8d9b8, roughness: 0.9 }));
    eyeRing.position.set(sx * 0.235, 2.70, -0.64);
    bird.add(eyeRing);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 8), eyeMat);
    eye.position.set(sx * 0.275, 2.70, -0.69);
    bird.add(eye);
  }
  const legs = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * 0.24, 1.38, 0.16);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.066, 0.62, 8), beakMat);
    shin.position.set(0, -0.31, 0);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.32), beakMat);
    foot.position.set(0, -0.62, -0.08);
    pivot.add(shin, foot);
    bird.add(pivot);
    legs.push(pivot);
  }

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.25, 24),
    new THREE.MeshBasicMaterial({ color: 0x163a4e, transparent: true, opacity: 0.22, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.125, 0.1);
  scene.add(shadow);

  let pedal = 0;
  function update(dt, o) {
    const v = o.v, lean = o.lean, boosting = o.boosting, jumpY = o.jumpY, elapsed = o.elapsed;
    pedal += v * dt / 0.53;
    for (const w of wheels) w.rotation.z -= v * dt / 0.53;
    legs[0].rotation.x = Math.sin(pedal) * 0.44;
    legs[1].rotation.x = Math.sin(pedal + Math.PI) * 0.44;
    bird.position.y = Math.sin(pedal * 2) * 0.035;
    bird.rotation.x = lerp(bird.rotation.x, boosting ? -0.15 : 0, 1 - Math.exp(-6 * dt));
    pouch.scale.z = 1.95 + Math.sin(elapsed * 11) * (boosting ? 0.22 : 0.08);
    scarfTail.rotation.z = Math.sin(elapsed * 7) * 0.16 + (boosting ? 0.32 : 0.05);
    scarfTail.rotation.x = boosting ? -0.35 : -0.08;
    crest.rotation.z = Math.sin(elapsed * 4) * 0.12;
    root.position.y = jumpY;
    root.rotation.z = -lean * 0.30;
    root.rotation.y = lean * 0.13;
    shadow.position.x = root.position.x;
    const s = Math.max(0.4, 1 - jumpY * 0.28);
    shadow.scale.setScalar(s);
    shadow.material.opacity = 0.22 * s;
  }

  return { root, shadow, update };
}
