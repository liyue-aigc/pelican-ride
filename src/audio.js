// 全部音频由 WebAudio 实时合成：海浪、风、海鸥、轻音乐与游戏音效，零音频文件。

export function createAudio() {
  let ctx = null, master = null, windGain = null, windFilter = null;
  let enabled = true;
  let gullTimer = null, musicTimer = null;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = enabled ? 1 : 0;
    master.connect(ctx.destination);
    startOcean();
    startWind();
    startGulls();
    startMusic();
  }

  function noiseBuffer(sec) {
    const len = Math.floor(ctx.sampleRate * sec);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.2;
    }
    return buf;
  }

  // 海浪：布朗噪声 + 低通 + 两个慢速 LFO 起伏
  function startOcean() {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(3);
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 380;
    const g = ctx.createGain();
    g.gain.value = 0.10;
    const lfo1 = ctx.createOscillator(); lfo1.frequency.value = 0.09;
    const lg1 = ctx.createGain(); lg1.gain.value = 0.05;
    lfo1.connect(lg1); lg1.connect(g.gain);
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.23;
    const lg2 = ctx.createGain(); lg2.gain.value = 0.028;
    lfo2.connect(lg2); lg2.connect(g.gain);
    src.connect(lp); lp.connect(g); g.connect(master);
    src.start(); lfo1.start(); lfo2.start();
  }

  // 风：带通噪声，增益由 setWind 控制
  function startWind() {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(2.5);
    src.loop = true;
    windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass'; windFilter.frequency.value = 620; windFilter.Q.value = 0.7;
    windGain = ctx.createGain();
    windGain.gain.value = 0.035;
    src.connect(windFilter); windFilter.connect(windGain); windGain.connect(master);
    src.start();
  }
  function setWind(level) {
    if (!ctx || !windGain) return;
    const t = ctx.currentTime;
    windGain.gain.setTargetAtTime(0.028 + level * 0.12, t, 0.25);
    if (windFilter) windFilter.frequency.setTargetAtTime(480 + level * 500, t, 0.3);
  }

  // 海鸥
  function chirp(t0, f0, f1, dur, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    const v = ctx.createOscillator(); v.frequency.value = 26;
    const vg = ctx.createGain(); vg.gain.value = 90;
    v.connect(vg); vg.connect(o.detune);
    v.start(t0); v.stop(t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.22);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function gullCry() {
    if (!ctx) return;
    const t = ctx.currentTime;
    chirp(t, 1500, 900, 0.26, 0.024);
    chirp(t + 0.30, 1380, 800, 0.24, 0.02);
  }
  function startGulls() {
    const next = () => {
      gullTimer = setTimeout(() => { if (enabled) gullCry(); next(); }, 7000 + Math.random() * 9000);
    };
    next();
  }

  // 轻音乐：缓慢和弦垫 + 偶发拨音
  function startMusic() {
    const chords = [
      [130.81, 164.81, 196.0, 246.94],
      [110.0, 130.81, 164.81, 196.0],
      [87.31, 130.81, 174.61, 220.0],
      [98.0, 146.83, 196.0, 246.94],
    ];
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0];
    let idx = 0;
    const playChord = () => {
      if (!ctx) return;
      const t = ctx.currentTime + 0.05;
      for (const f of chords[idx]) {
        const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.016, t + 1.4);
        g.gain.setValueAtTime(0.016, t + 3.4);
        g.gain.linearRampToValueAtTime(0.0001, t + 5.2);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + 5.4);
      }
      if (Math.random() < 0.8) {
        const f = scale[Math.floor(Math.random() * scale.length)];
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        const g = ctx.createGain();
        const tt = t + Math.random() * 2.2;
        g.gain.setValueAtTime(0.0001, tt);
        g.gain.exponentialRampToValueAtTime(0.014, tt + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, tt + 1.3);
        o.connect(g); g.connect(master);
        o.start(tt); o.stop(tt + 1.5);
      }
      idx = (idx + 1) % chords.length;
      musicTimer = setTimeout(playChord, 4800);
    };
    playChord();
  }

  // ---------- 音效 ----------
  function tone(freq, dur, type, vol, slide, delay) {
    if (!ctx) return;
    const t = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(60, freq + slide), t + dur);
    g.gain.setValueAtTime(vol || 0.07, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  const sfx = {
    coin(combo) { tone(760 + Math.min(combo, 20) * 26, 0.13, 'triangle', 0.05, 320); },
    jump() { tone(420, 0.16, 'triangle', 0.05, 380); },
    land() { tone(170, 0.12, 'sine', 0.04, -60); },
    hurt() { tone(150, 0.32, 'square', 0.08, -80); },
    heal() { tone(660, 0.22, 'sine', 0.06, 340); },
    magnet() { tone(880, 0.28, 'sine', 0.06, 420); },
    smash() { tone(170, 0.20, 'sawtooth', 0.06, -95); tone(540, 0.13, 'square', 0.03, 240); },
    boost() { tone(240, 0.22, 'sawtooth', 0.03, 360); },
    ui() { tone(560, 0.09, 'sine', 0.045, 120); },
    start() { tone(520, 0.16, 'triangle', 0.06, 260); },
    over() { tone(330, 0.55, 'triangle', 0.08, -190); },
    achv() { [660, 880, 990, 1320].forEach((f, i) => tone(f, 0.15, 'triangle', 0.05, 0, i * 0.09)); },
  };

  function setEnabled(b) {
    enabled = b;
    if (master && ctx) master.gain.setTargetAtTime(b ? 1 : 0, ctx.currentTime, 0.08);
    if (b && ctx && ctx.state === 'suspended') ctx.resume();
  }

  return Object.assign({
    ensure, setWind, setEnabled,
    get enabled() { return enabled; },
    toggle() { setEnabled(!enabled); return enabled; },
  }, sfx);
}
