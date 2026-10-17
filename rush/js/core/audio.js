// Audio entièrement synthétisé (Web Audio) : effets et musiques originales, aucun fichier.
// Le contexte n'est créé qu'après un geste de l'utilisateur (exigence iOS).

const midi = n => 440 * 2 ** ((n - 69) / 12);

// Musiques originales : boucles de 4 mesures, grille de doubles croches (16 pas par mesure).
// Notes MIDI, null = silence. Accords : basse jouée sur les temps.
const SONGS = {
  greenhill: {
    bpm: 148,
    bass: [48, 48, 55, 55, 57, 57, 53, 55],               // une note par demi-mesure
    chords: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]],
    lead: [
      76, null, 79, null, 81, null, 79, 76, null, null, 74, null, 72, null, null, null,
      74, null, 76, null, 79, null, 76, 74, null, null, 72, null, 69, null, 71, null,
      72, null, 76, null, 77, null, 76, 72, null, null, 69, null, 72, null, null, null,
      71, null, 72, null, 74, null, 76, null, 79, null, 77, null, 76, null, 74, null,
    ],
  },
  chemical: {
    bpm: 156,
    bass: [45, 45, 48, 48, 43, 43, 44, 47],
    chords: [[57, 60, 64], [60, 64, 67], [55, 59, 62], [56, 59, 64]],
    lead: [
      69, 72, 76, null, 69, 72, 76, 79, null, 76, null, 72, null, 74, 76, null,
      72, 76, 79, null, 72, 76, 79, 84, null, 79, null, 76, null, 77, 79, null,
      67, 71, 74, null, 67, 71, 74, 79, null, 74, null, 71, null, 72, 74, null,
      68, 71, 76, null, 68, 71, 76, 80, null, 76, null, 80, 83, null, 81, 80,
    ],
  },
  sky: {
    bpm: 132,
    bass: [50, 50, 54, 54, 55, 55, 57, 57],
    chords: [[62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]],
    lead: [
      74, null, null, 78, null, null, 81, null, 83, null, 81, null, 78, null, null, null,
      71, null, null, 74, null, null, 78, null, 79, null, 78, null, 74, null, null, null,
      79, null, null, 83, null, null, 86, null, 83, null, 81, null, 79, null, 78, null,
      76, null, 78, null, 79, null, 81, null, 76, null, null, null, 73, null, null, null,
    ],
  },
  boss: {
    bpm: 168,
    bass: [40, 40, 40, 41, 40, 40, 43, 42],
    chords: [[64, 67, 71], [64, 67, 71], [65, 69, 72], [63, 66, 71]],
    lead: [
      76, null, 76, 77, null, 76, null, 74, 76, null, null, null, 71, null, 72, null,
      76, null, 76, 77, null, 79, null, 77, 76, null, null, null, 74, null, 71, null,
      77, null, 77, 79, null, 77, null, 76, 77, null, null, null, 72, null, 74, null,
      75, null, 75, 76, null, 75, null, 71, 75, null, 78, null, 83, null, 81, null,
    ],
  },
  menu: {
    bpm: 112,
    bass: [48, 48, 52, 52, 53, 53, 55, 55],
    chords: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]],
    lead: [
      72, null, null, null, 76, null, null, null, 79, null, null, 76, null, null, null, null,
      69, null, null, null, 72, null, null, null, 76, null, null, 72, null, null, null, null,
      65, null, null, null, 69, null, null, null, 72, null, null, 77, null, 76, null, null,
      74, null, null, null, 71, null, null, null, 67, null, null, null, null, null, null, null,
    ],
  },
};

export function createAudio(settings) {
  let ctx = null, master, musicBus, sfxBus, noiseBuffer;
  let song = null, step = 0, nextTime = 0, timer = null;
  const lastPlayed = {};

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    applyVolumes();
    return true;
  }

  function applyVolumes() {
    if (!ctx) return;
    musicBus.gain.value = settings.music * 0.35;
    sfxBus.gain.value = settings.sfx * 0.6;
  }

  function tone({ type = 'square', freq, to, start = 0, dur = 0.1, vol = 0.3, bus = sfxBus, attack = 0.005 }) {
    const t = ctx.currentTime + start;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise({ start = 0, dur = 0.2, vol = 0.3, filter = 2000, type = 'lowpass', to, bus = sfxBus }) {
    const t = ctx.currentTime + start;
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(filter, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }

  // Effets : chaque son a un délai minimal pour éviter l'empilement (ex. 30 anneaux d'un coup).
  const SFX = {
    ring: [0.045, () => { tone({ type: 'square', freq: 1568, dur: 0.07, vol: 0.12 }); tone({ type: 'square', freq: 2093, start: 0.05, dur: 0.16, vol: 0.12 }); }],
    jump: [0.05, () => tone({ type: 'square', freq: 260, to: 780, dur: 0.16, vol: 0.18 })],
    fly: [0.1, () => { for (let i = 0; i < 3; i++) tone({ type: 'triangle', freq: 600 + i * 120, start: i * 0.05, dur: 0.06, vol: 0.15 }); }],
    slide: [0.08, () => noise({ dur: 0.3, vol: 0.25, filter: 800, to: 3000, type: 'bandpass' })],
    stomp: [0.1, () => tone({ type: 'sawtooth', freq: 500, to: 120, dur: 0.18, vol: 0.18 })],
    land: [0.08, () => tone({ type: 'sine', freq: 140, to: 60, dur: 0.1, vol: 0.25 })],
    lane: [0.03, () => noise({ dur: 0.07, vol: 0.08, filter: 3000, type: 'highpass' })],
    boost: [0.2, () => { noise({ dur: 0.7, vol: 0.35, filter: 400, to: 5000, type: 'bandpass' }); tone({ type: 'sawtooth', freq: 120, to: 900, dur: 0.6, vol: 0.12 }); }],
    pad: [0.2, () => tone({ type: 'square', freq: 400, to: 1600, dur: 0.25, vol: 0.14 })],
    spring: [0.2, () => { tone({ type: 'sine', freq: 300, to: 1200, dur: 0.25, vol: 0.3 }); tone({ type: 'triangle', freq: 600, to: 900, start: 0.1, dur: 0.2, vol: 0.12 }); }],
    hurt: [0.2, () => { noise({ dur: 0.35, vol: 0.4, filter: 1200 }); tone({ type: 'square', freq: 300, to: 80, dur: 0.3, vol: 0.2 }); }],
    ringLoss: [0.3, () => { for (let i = 0; i < 6; i++) tone({ type: 'square', freq: 2093 - i * 180, start: i * 0.04, dur: 0.08, vol: 0.09 }); }],
    shieldBreak: [0.2, () => { noise({ dur: 0.4, vol: 0.3, filter: 5000, type: 'highpass' }); tone({ type: 'sine', freq: 900, to: 200, dur: 0.3, vol: 0.2 }); }],
    enemy: [0.06, () => { noise({ dur: 0.25, vol: 0.35, filter: 1800 }); tone({ type: 'square', freq: 700, to: 200, dur: 0.15, vol: 0.12 }); }],
    smash: [0.06, () => noise({ dur: 0.3, vol: 0.4, filter: 900 })],
    power: [0.2, () => { [0, 4, 7, 12].forEach((n, i) => tone({ type: 'square', freq: midi(72 + n), start: i * 0.06, dur: 0.1, vol: 0.12 })); }],
    death: [0.5, () => { tone({ type: 'square', freq: 600, to: 60, dur: 0.9, vol: 0.2 }); noise({ dur: 0.6, vol: 0.3, filter: 600 }); }],
    ui: [0.04, () => tone({ type: 'square', freq: 1200, dur: 0.05, vol: 0.1 })],
    bossTelegraph: [0.2, () => { tone({ type: 'square', freq: 880, dur: 0.12, vol: 0.12 }); tone({ type: 'square', freq: 880, start: 0.2, dur: 0.12, vol: 0.12 }); }],
    bossFire: [0.1, () => noise({ dur: 0.5, vol: 0.35, filter: 300, to: 2000 })],
    bossHit: [0.2, () => { tone({ type: 'sawtooth', freq: 220, dur: 0.25, vol: 0.25 }); tone({ type: 'square', freq: 1760, to: 440, dur: 0.3, vol: 0.12 }); noise({ dur: 0.3, vol: 0.3, filter: 2500 }); }],
    explosion: [0.1, () => noise({ dur: 0.8, vol: 0.45, filter: 700, to: 100 })],
  };

  const JINGLES = {
    gameover: [[67, 0], [64, 0.15], [60, 0.3], [55, 0.5]],
    victory: [[72, 0], [72, 0.12], [72, 0.24], [76, 0.36], [79, 0.6], [76, 0.84], [79, 0.96], [84, 1.2]],
    mission: [[79, 0], [84, 0.1], [88, 0.2]],
  };

  function play(name) {
    if (!ctx || settings.sfx <= 0) return;
    const [gap, fn] = SFX[name] || [];
    if (!fn) return;
    const now = ctx.currentTime;
    if (now - (lastPlayed[name] ?? -1) < gap) return;
    lastPlayed[name] = now;
    fn();
  }

  function jingle(name) {
    if (!ctx) return;
    for (const [n, t] of JINGLES[name]) {
      tone({ type: 'square', freq: midi(n), start: t, dur: 0.22, vol: 0.16 });
      tone({ type: 'triangle', freq: midi(n - 12), start: t, dur: 0.24, vol: 0.18 });
    }
  }

  // Séquenceur avec anticipation : les notes sont programmées 120 ms à l'avance.
  function schedule() {
    if (!song) return;
    const spb = 60 / song.bpm / 4;
    while (nextTime < ctx.currentTime + 0.12) {
      const s = step % 64;
      const bar = Math.floor(s / 16);
      if (s % 8 === 0) tone({ type: 'triangle', freq: midi(song.bass[Math.floor(s / 8)] - 12), start: nextTime - ctx.currentTime, dur: spb * 7, vol: 0.5, bus: musicBus, attack: 0.01 });
      if (s % 4 === 2) tone({ type: 'triangle', freq: midi(song.bass[Math.floor(s / 8)]), start: nextTime - ctx.currentTime, dur: spb * 1.5, vol: 0.25, bus: musicBus });
      if (s % 4 === 0) song.chords[bar].forEach(n => tone({ type: 'square', freq: midi(n), start: nextTime - ctx.currentTime, dur: spb * 2, vol: 0.035, bus: musicBus }));
      const note = song.lead[s];
      if (note) tone({ type: 'square', freq: midi(note), start: nextTime - ctx.currentTime, dur: spb * 1.8, vol: 0.1, bus: musicBus });
      if (s % 8 === 0) tone({ type: 'sine', freq: 150, to: 45, start: nextTime - ctx.currentTime, dur: 0.12, vol: 0.6, bus: musicBus });
      if (s % 8 === 4) noise({ start: nextTime - ctx.currentTime, dur: 0.12, vol: 0.25, filter: 1800, bus: musicBus });
      if (s % 2 === 0) noise({ start: nextTime - ctx.currentTime, dur: 0.03, vol: 0.08, filter: 8000, type: 'highpass', bus: musicBus });
      nextTime += spb;
      step++;
    }
  }

  // La musique demandée avant le premier geste démarre au moment du déverrouillage.
  let wanted = null;
  function music(name) {
    wanted = name;
    if (!ctx) return;
    if (song === SONGS[name]) return;
    song = SONGS[name] || null;
    step = 0;
    nextTime = ctx.currentTime + 0.1;
    clearInterval(timer);
    if (song) timer = setInterval(schedule, 25);
  }

  function stopMusic() { song = null; wanted = null; clearInterval(timer); }

  function unlock() {
    const fresh = !ctx;
    if (!ensure()) return;
    if (fresh && wanted) music(wanted);
  }

  return {
    unlock,
    play,
    jingle,
    music,
    stopMusic,
    setVolumes(music, sfx) { settings.music = music; settings.sfx = sfx; applyVolumes(); },
    suspend() { ctx?.suspend(); },
    resume() { ctx?.resume(); },
  };
}
