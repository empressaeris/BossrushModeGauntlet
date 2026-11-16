/* Havenwood Gauntlet — music and sound effects synthesized with the Web Audio API.
 * No audio files are needed. */
const Sound = (() => {
  let ctx = null, master, musicBus, sfxBus, noiseBuf;
  let muted = false;
  try { muted = localStorage.getItem('hg-muted') === '1'; } catch (e) { /* storage unavailable */ }

  let current = null, step = 0, nextTime = 0, timer = null;

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.16; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.32; sfxBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (current) startLoop();
  }

  function tone(freq, t, dur, { type = 'triangle', vol = 0.5, bus = sfxBus, slide = 0, attack = 0.01 } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(t, dur, { vol = 0.4, bus = sfxBus, freq = 1200, q = 0.8, type = 'bandpass', sweep = 1 } = {}) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (sweep !== 1) f.frequency.exponentialRampToValueAtTime(freq * sweep, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus);
    s.start(t); s.stop(t + dur + 0.05);
  }

  /* ---------- music ---------- */
  // chords are MIDI note triads; each chord lasts one bar of 16 steps
  const TRACKS = {
    story: {
      bpm: 88,
      chords: [[57, 60, 64], [53, 57, 60], [48, 55, 60], [55, 59, 62]],
      melody: [76, null, 72, null, 74, null, 71, null, 72, null, 69, null, 71, null, 67, null],
      play(s, t, chord, spb) {
        if (s % 16 === 0) tone(mtof(chord[0] - 12), t, spb * 14, { type: 'sine', vol: 0.55, bus: musicBus, attack: 0.05 });
        if (s % 2 === 0) tone(mtof(chord[(s / 2) % 3] + 12), t, spb * 3, { type: 'triangle', vol: 0.22, bus: musicBus });
        const bar = Math.floor(s / 16) % 4;
        const m = this.melody[(s + bar * 4) % 16];
        if (m && s % 4 === 0) tone(mtof(m), t, spb * 5, { type: 'sine', vol: 0.18, bus: musicBus, attack: 0.04 });
      },
    },
    battle: {
      bpm: 152,
      chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]],
      lead: [69, 72, 76, 74, 72, 71, 72, 74, 76, 79, 77, 76, 74, 72, 71, 68],
      play(s, t, chord, spb) {
        const i = s % 16;
        if (i % 4 === 0 || i === 10) tone(mtof(chord[0] - 24), t, spb * 1.6, { type: 'sawtooth', vol: 0.32, bus: musicBus });
        const arp = [0, 1, 2, 1];
        tone(mtof(chord[arp[i % 4]] + 12), t, spb * 0.9, { type: 'square', vol: 0.08, bus: musicBus });
        if (i % 4 === 0) { // kick
          tone(150, t, 0.18, { type: 'sine', vol: 0.9, bus: musicBus, slide: 0.3, attack: 0.002 });
        }
        if (i % 4 === 2) noise(t, 0.05, { vol: 0.25, bus: musicBus, freq: 8000, type: 'highpass' });
        if (i === 4 || i === 12) noise(t, 0.14, { vol: 0.35, bus: musicBus, freq: 1800 });
        const bar = Math.floor(s / 16) % 4;
        if (i % 2 === 0) {
          const m = this.lead[(i / 2 + bar * 2) % 16];
          if (bar % 2 === 1) tone(mtof(m), t, spb * 1.8, { type: 'triangle', vol: 0.2, bus: musicBus });
        }
      },
    },
    victory: {
      bpm: 120,
      chords: [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]],
      play(s, t, chord, spb) {
        if (s % 16 === 0) tone(mtof(chord[0] - 12), t, spb * 15, { type: 'sine', vol: 0.5, bus: musicBus, attack: 0.05 });
        if (s % 2 === 0) tone(mtof(chord[(s / 2) % 3] + 12), t, spb * 2.5, { type: 'triangle', vol: 0.2, bus: musicBus });
        if (s % 8 === 4) tone(mtof(chord[2] + 12), t, spb * 6, { type: 'sine', vol: 0.15, bus: musicBus, attack: 0.03 });
      },
    },
  };

  function schedule() {
    if (!ctx || !current) return;
    const tr = TRACKS[current];
    const spb = 60 / tr.bpm / 4; // seconds per 16th
    while (nextTime < ctx.currentTime + 0.12) {
      const chord = tr.chords[Math.floor(step / 16) % tr.chords.length];
      tr.play(step, nextTime, chord, spb);
      step++;
      nextTime += spb;
    }
  }

  function startLoop() {
    clearInterval(timer);
    step = 0;
    nextTime = ctx.currentTime + 0.05;
    timer = setInterval(schedule, 25);
  }

  function music(name) {
    if (current === name) return;
    current = name;
    if (!ctx) return;
    if (!name) { clearInterval(timer); return; }
    startLoop();
  }

  /* ---------- sound effects ---------- */
  const SFX = {
    click: (t) => tone(880, t, 0.06, { type: 'square', vol: 0.15 }),
    blip: (t) => tone(1320, t, 0.03, { type: 'square', vol: 0.05 }),
    frost: (t) => {
      tone(1800, t, 0.35, { type: 'triangle', vol: 0.3, slide: 0.4 });
      tone(2400, t + 0.05, 0.3, { type: 'sine', vol: 0.2, slide: 0.5 });
      noise(t, 0.3, { vol: 0.2, freq: 6000, type: 'highpass' });
    },
    fire: (t) => {
      noise(t, 0.45, { vol: 0.6, freq: 400, sweep: 3, q: 0.6, type: 'lowpass' });
      tone(220, t, 0.3, { type: 'sawtooth', vol: 0.2, slide: 0.5 });
    },
    heal: (t) => [0, 4, 7, 12].forEach((n, i) => tone(mtof(72 + n), t + i * 0.07, 0.4, { type: 'sine', vol: 0.3 })),
    barrier: (t) => {
      tone(mtof(64), t, 0.6, { type: 'square', vol: 0.08 });
      tone(mtof(71), t, 0.6, { type: 'square', vol: 0.08 });
      tone(mtof(76), t + 0.05, 0.6, { type: 'sine', vol: 0.2 });
    },
    hit: (t) => {
      tone(180, t, 0.25, { type: 'sawtooth', vol: 0.4, slide: 0.35 });
      noise(t, 0.2, { vol: 0.5, freq: 900 });
    },
    bigHit: (t) => {
      tone(120, t, 0.6, { type: 'sawtooth', vol: 0.5, slide: 0.25 });
      noise(t, 0.5, { vol: 0.7, freq: 500, sweep: 0.3, type: 'lowpass' });
    },
    blocked: (t) => tone(1200, t, 0.2, { type: 'triangle', vol: 0.3, slide: 0.8 }),
    crit: (t) => tone(1600, t, 0.15, { type: 'square', vol: 0.12, slide: 1.5 }),
    warn: (t) => { tone(660, t, 0.14, { type: 'square', vol: 0.12 }); tone(660, t + 0.2, 0.14, { type: 'square', vol: 0.12 }); },
    nope: (t) => tone(160, t, 0.12, { type: 'square', vol: 0.12 }),
    ko: (t) => [0, 3, 7, 12, 15].forEach((n, i) => tone(mtof(60 + n), t + i * 0.09, 0.5, { type: 'triangle', vol: 0.3 })),
    lose: (t) => [12, 7, 3, 0].forEach((n, i) => tone(mtof(57 + n), t + i * 0.18, 0.5, { type: 'triangle', vol: 0.3 })),
    whoosh: (t) => noise(t, 0.4, { vol: 0.4, freq: 300, sweep: 8, q: 1.2 }),
  };

  function sfx(name) {
    if (!ctx || muted || !SFX[name]) return;
    SFX[name](ctx.currentTime + 0.005);
  }

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem('hg-muted', m ? '1' : '0'); } catch (e) { /* ignore */ }
    if (master) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.05);
  }

  return { init, music, sfx, setMuted, isMuted: () => muted };
})();
