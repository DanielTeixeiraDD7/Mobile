'use strict';

/* ================= Stockage ================= */
const STORE_KEY = 'fitmaison_v1';

const defaultState = () => ({
  profile: null,
  weights: [],   // { date: 'YYYY-MM-DD', kg }
  sessions: [],  // { date, type, level, duration (s), kcal, feel }
  days: {},      // 'YYYY-MM-DD' -> { water, steps, habits: {}, food: [] }
  settings: { voice: true, sound: true, vibrate: true },
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return Object.assign(defaultState(), JSON.parse(raw));
  } catch (e) { /* stockage indisponible */ }
  return defaultState();
}

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { toast('⚠️ Sauvegarde impossible'); }
}

/* ================= Utilitaires ================= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function isoDate(d = new Date()) {
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
const today = () => isoDate();
const parseDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const daysBetween = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000);
const fmtDate = s => parseDate(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const fmtDateLong = d => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtKg = n => (Math.round(n * 10) / 10).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtMin = s => `${Math.round(s / 60)} min`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function day(date = today()) {
  if (!state.days[date]) state.days[date] = { water: 0, steps: 0, habits: {}, food: [] };
  return state.days[date];
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ================= Calculs ================= */
function sortedWeights() { return [...state.weights].sort((a, b) => a.date.localeCompare(b.date)); }

function currentWeight() {
  const w = sortedWeights();
  return w.length ? w[w.length - 1].kg : state.profile.startWeight;
}

function bmi(kg) { const h = state.profile.height / 100; return kg / (h * h); }

function bmiLabel(v) {
  if (v < 18.5) return 'Maigreur';
  if (v < 25) return 'Normal';
  if (v < 30) return 'Surpoids';
  if (v < 35) return 'Obésité modérée';
  if (v < 40) return 'Obésité sévère';
  return 'Obésité massive';
}

// Mifflin-St Jeor
function nutrition() {
  const p = state.profile;
  const kg = currentWeight();
  const bmr = 10 * kg + 6.25 * p.height - 5 * p.age + (p.sex === 'h' ? 5 : -161);
  const tdee = bmr * p.activity;
  const floor = p.sex === 'h' ? 1600 : 1300;
  const target = Math.max(floor, Math.round((tdee - 650) / 10) * 10);
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    target,
    protein: Math.round(1.6 * p.goalWeight),
    water: Math.min(3.5, Math.max(2, Math.round(kg * 0.03 * 4) / 4)),
    weeklyLoss: ((tdee - target) * 7) / 7700,
  };
}

// Tendance : régression linéaire sur les 28 derniers jours
function trend() {
  const w = sortedWeights();
  if (w.length < 2) return null;
  const last = w[w.length - 1].date;
  const pts = w.filter(x => daysBetween(x.date, last) <= 28);
  if (pts.length < 2 || daysBetween(pts[0].date, last) < 5) return null;
  const xs = pts.map(x => daysBetween(pts[0].date, x.date));
  const ys = pts.map(x => x.kg);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  const slope = den ? num / den : 0; // kg / jour
  const res = { perWeek: slope * 7 };
  if (slope < -0.005) {
    const daysLeft = (currentWeight() - state.profile.goalWeight) / -slope;
    if (daysLeft > 0 && daysLeft < 1500) res.eta = new Date(Date.now() + daysLeft * 86400000);
  }
  return res;
}

function sessionKcal(steps, kg) {
  return Math.round(steps.reduce((t, s) => t + (s.met || 1.5) * kg * (s.dur / 3600), 0));
}

function streak() {
  // jours consécutifs avec une séance (aujourd'hui ou hier comme point de départ)
  const dates = new Set(state.sessions.map(s => s.date));
  let d = new Date();
  if (!dates.has(isoDate(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (dates.has(isoDate(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function weekStart(d = new Date()) {
  const r = new Date(d);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7));
  return isoDate(r);
}

function weekSessions() {
  const start = weekStart();
  return state.sessions.filter(s => s.date >= start);
}

/* ================= Construction des séances ================= */
function buildWorkout(type, level) {
  const L = LEVELS[level];
  const steps = [];
  const add = (key, dur, phase, extra = {}) => {
    const ex = EXERCISES[key];
    steps.push({ key, name: ex.name, icon: ex.icon, met: ex.met, desc: ex.desc, tip: ex.tip, easier: ex.easier, dur, phase, ...extra });
  };
  const rest = (dur, label = 'Récupération') =>
    steps.push({ key: 'rest', name: label, icon: '⏸️', met: 1.5, dur, phase: 'rest', desc: 'Respire, bois une gorgée d’eau.' });

  if (type === 'marche') {
    add('marche', 120, 'warmup');
    const total = L.walk * 60 - 120 - 60;
    const blocks = Math.max(2, Math.round(total / 300));
    for (let i = 0; i < blocks; i++) {
      add('marche_normale', 180, 'work', { round: i + 1, rounds: blocks });
      add('marche_rapide', 120, 'work', { round: i + 1, rounds: blocks });
    }
    add('respiration', 60, 'cool');
    return steps;
  }

  if (type === 'mobilite') {
    MOBILITY.forEach(k => add(k, 60, 'cool'));
    return steps;
  }

  WARMUP.forEach(k => add(k, 45, 'warmup'));
  const circuit = WORKOUTS[type].circuit[level];
  for (let r = 1; r <= L.rounds; r++) {
    circuit.forEach((k, i) => {
      add(k, L.work, 'work', { round: r, rounds: L.rounds });
      if (i < circuit.length - 1) rest(L.rest);
    });
    if (r < L.rounds) rest(L.roundRest, `Pause – tour ${r + 1}/${L.rounds} ensuite`);
  }
  COOLDOWN.forEach(k => add(k, 30, 'cool'));
  return steps;
}

const workoutDuration = (type, level) => buildWorkout(type, level).reduce((t, s) => t + s.dur, 0);

/* ================= Navigation ================= */
let currentTab = 'home';

function go(tab) {
  currentTab = tab;
  $$('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  render();
  window.scrollTo(0, 0);
}

function render() {
  const main = $('#main');
  if (!state.profile) { $('.tabbar').hidden = true; main.innerHTML = viewOnboarding(); bindOnboarding(); return; }
  $('.tabbar').hidden = false;
  const views = { home: viewHome, workouts: viewWorkouts, weight: viewWeight, food: viewFood, profile: viewProfile };
  main.innerHTML = views[currentTab]();
  if (currentTab === 'weight') drawChart();
}

/* ================= Onboarding ================= */
function profileForm(p = {}) {
  const v = (k, d = '') => esc(p[k] ?? d);
  return `
    <label>Prénom<input name="name" value="${v('name')}" placeholder="Ton prénom" autocomplete="given-name"></label>
    <div class="grid2">
      <label>Sexe
        <select name="sex">
          <option value="h" ${p.sex !== 'f' ? 'selected' : ''}>Homme</option>
          <option value="f" ${p.sex === 'f' ? 'selected' : ''}>Femme</option>
        </select></label>
      <label>Âge<input name="age" type="number" inputmode="numeric" min="14" max="99" value="${v('age', 30)}" required></label>
    </div>
    <div class="grid2">
      <label>Taille (cm)<input name="height" type="number" inputmode="numeric" min="120" max="230" value="${v('height', 178)}" required></label>
      <label>Objectif (kg)<input name="goalWeight" type="number" inputmode="decimal" step="0.1" min="40" max="250" value="${v('goalWeight', 99)}" required></label>
    </div>
    <label>Activité au quotidien (hors séances)
      <select name="activity">
        ${[[1.2, 'Sédentaire (bureau, peu de marche)'], [1.375, 'Légère (marche régulière)'], [1.55, 'Modérée (métier debout)'], [1.725, 'Élevée (métier physique)']]
          .map(([val, l]) => `<option value="${val}" ${Number(p.activity || 1.2) === val ? 'selected' : ''}>${l}</option>`).join('')}
      </select></label>`;
}

function viewOnboarding() {
  return `
  <section class="onboard">
    <div class="hero">
      <div class="logo">🔥</div>
      <h1>FitMaison</h1>
      <p>Perds du poids avec des séances au poids du corps, à la maison ou au jardin. Sans matériel, sans saut, adapté à ton niveau.</p>
    </div>
    <form id="onboard" class="card">
      <h2>Faisons connaissance</h2>
      <label>Poids actuel (kg)<input name="startWeight" type="number" inputmode="decimal" step="0.1" min="40" max="300" value="125" required></label>
      ${profileForm()}
      <button class="btn primary big" type="submit">C’est parti 🚀</button>
      <p class="muted small">Conseil : demande l’avis de ton médecin avant de commencer si tu as des problèmes de santé (cœur, tension, articulations). Tes données restent uniquement sur ton téléphone.</p>
    </form>
  </section>`;
}

function readProfile(form) {
  const f = new FormData(form);
  return {
    name: (f.get('name') || '').trim(),
    sex: f.get('sex'),
    age: Number(f.get('age')),
    height: Number(f.get('height')),
    goalWeight: Number(String(f.get('goalWeight')).replace(',', '.')),
    activity: Number(f.get('activity')),
  };
}

function bindOnboarding() {
  $('#onboard').addEventListener('submit', e => {
    e.preventDefault();
    const start = Number(String(new FormData(e.target).get('startWeight')).replace(',', '.'));
    state.profile = { ...readProfile(e.target), startWeight: start, level: 1, createdAt: today() };
    state.weights = [{ date: today(), kg: start }];
    save();
    go('home');
    toast('Profil créé, bienvenue ! 💪');
  });
}

/* ================= Accueil ================= */
function viewHome() {
  const p = state.profile;
  const kg = currentWeight();
  const lost = p.startWeight - kg;
  const total = p.startWeight - p.goalWeight;
  const pct = Math.max(0, Math.min(100, total > 0 ? (lost / total) * 100 : 0));
  const t = trend();
  const n = nutrition();
  const d = day();
  const todayType = WEEK_PLAN[new Date().getDay()];
  const doneToday = state.sessions.some(s => s.date === today());
  const ws = weekSessions();
  const glasses = Math.round(n.water / 0.25);
  const lastW = sortedWeights().slice(-1)[0];
  const weighedToday = lastW && lastW.date === today();
  const tip = TIPS[(new Date().getDate()) % TIPS.length];

  return `
  <header class="top">
    <div>
      <p class="muted cap">${fmtDateLong(new Date())}</p>
      <h1>Salut${p.name ? ' ' + esc(p.name) : ''} 👋</h1>
    </div>
    <div class="streak" title="Jours consécutifs avec une séance">🔥 ${streak()}</div>
  </header>

  <section class="card progress-card">
    <div class="row between">
      <div>
        <p class="muted small">Poids actuel</p>
        <p class="bignum">${fmtKg(kg)} <span>kg</span></p>
      </div>
      <div class="right">
        <p class="muted small">Objectif</p>
        <p class="midnum">${fmtKg(p.goalWeight)} kg</p>
      </div>
    </div>
    <div class="bar"><div style="width:${pct}%"></div></div>
    <div class="row between small">
      <span>${lost >= 0 ? '−' : '+'}${fmtKg(Math.abs(lost))} kg depuis le début</span>
      <span>encore ${fmtKg(Math.max(0, kg - p.goalWeight))} kg</span>
    </div>
    ${t ? `<p class="small muted mt">Tendance : <b class="${t.perWeek <= 0 ? 'good' : 'bad'}">${t.perWeek <= 0 ? '' : '+'}${fmtKg(t.perWeek)} kg/sem</b>${t.eta ? ` · objectif estimé vers <b>${t.eta.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</b>` : ''}</p>` : ''}
    ${!weighedToday ? `<button class="btn ghost full mt" data-action="quick-weigh">⚖️ Me peser aujourd’hui</button>` : ''}
  </section>

  <section class="card today">
    <p class="muted small">Séance du jour</p>
    ${doneToday
      ? `<h2>✅ Séance faite, bravo !</h2><p class="muted">Pense à marcher et à bien t’hydrater. Tu peux faire une séance mobilité en bonus.</p>
         <button class="btn ghost full" data-start="mobilite">🧘 Mobilité bonus (10 min)</button>`
      : todayType
        ? `<h2>${WORKOUTS[todayType].icon} ${WORKOUTS[todayType].name}</h2>
           <p class="muted">${WORKOUTS[todayType].desc} · ${fmtMin(workoutDuration(todayType, p.level))} · niveau ${p.level}</p>
           <button class="btn primary big full" data-start="${todayType}">▶ Commencer</button>`
        : `<h2>😌 Jour de repos</h2><p class="muted">Récupère ! Une petite marche reste une excellente idée.</p>
           <button class="btn ghost full" data-start="marche">🌳 Marche active quand même</button>`}
  </section>

  <section class="stats">
    <div class="stat"><b>${ws.length}</b><span>séances<br>cette semaine</span></div>
    <div class="stat"><b>${ws.reduce((t, s) => t + s.kcal, 0)}</b><span>kcal brûlées<br>cette semaine</span></div>
    <div class="stat"><b>${state.sessions.length}</b><span>séances<br>au total</span></div>
  </section>

  <section class="card">
    <div class="row between"><h3>💧 Eau</h3><span class="muted small">${(d.water * 0.25).toLocaleString('fr-FR')} / ${n.water.toLocaleString('fr-FR')} L</span></div>
    <div class="glasses">
      ${Array.from({ length: glasses }, (_, i) => `<button class="glass ${i < d.water ? 'full' : ''}" data-water="${i + 1}" aria-label="${i + 1} verre(s)"></button>`).join('')}
    </div>
  </section>

  <section class="card">
    <div class="row between"><h3>👟 Pas du jour</h3><span class="muted small">objectif 8 000</span></div>
    <div class="row gap">
      <input id="steps" type="number" inputmode="numeric" min="0" placeholder="0" value="${d.steps || ''}">
      <button class="btn" data-action="save-steps">OK</button>
    </div>
    <div class="bar thin"><div style="width:${Math.min(100, (d.steps / 8000) * 100)}%"></div></div>
  </section>

  <section class="card">
    <h3>✅ Habitudes du jour</h3>
    <ul class="checklist">
      ${HABITS.map(h => `<li><label><input type="checkbox" data-habit="${h.id}" ${d.habits[h.id] ? 'checked' : ''}><span>${h.icon} ${h.label}</span></label></li>`).join('')}
    </ul>
  </section>

  <section class="card tip"><p>💡 ${tip}</p></section>`;
}

/* ================= Séances ================= */
function viewWorkouts() {
  const lvl = state.profile.level;
  const todayIdx = new Date().getDay();
  const order = [1, 2, 3, 4, 5, 6, 0];
  const start = weekStart();
  const doneDates = new Set(state.sessions.map(s => s.date));
  const history = [...state.sessions].reverse().slice(0, 15);
  const cats = {};
  Object.entries(EXERCISES).forEach(([k, e]) => (cats[e.cat] = cats[e.cat] || []).push([k, e]));

  return `
  <header class="top"><h1>Séances</h1></header>

  <section class="card">
    <h3>Ton niveau</h3>
    <div class="seg">
      ${[1, 2, 3].map(l => `<button class="${l === lvl ? 'active' : ''}" data-level="${l}"><b>${l}</b><span>${LEVELS[l].name}</span></button>`).join('')}
    </div>
    <p class="muted small mt">${LEVELS[lvl].work}s d’effort / ${LEVELS[lvl].rest}s de repos · ${LEVELS[lvl].rounds} tours. Passe au niveau suivant quand les séances te semblent faciles.</p>
  </section>

  <section class="card">
    <h3>Planning de la semaine</h3>
    <div class="week">
      ${order.map(i => {
        const t = WEEK_PLAN[i];
        const date = new Date(parseDate(start)); date.setDate(date.getDate() + ((i + 6) % 7));
        const done = doneDates.has(isoDate(date));
        return `<div class="wday ${i === todayIdx ? 'today' : ''} ${done ? 'done' : ''}">
          <span>${DAY_NAMES[i]}</span><b>${done ? '✅' : t ? WORKOUTS[t].icon : '😌'}</b><small>${t ? WORKOUTS[t].name.split(' ')[0] : 'Repos'}</small></div>`;
      }).join('')}
    </div>
  </section>

  <h3 class="section-title">Lancer une séance</h3>
  ${Object.entries(WORKOUTS).map(([k, w]) => `
    <button class="card workout" data-start="${k}">
      <span class="wicon">${w.icon}</span>
      <span class="wtext"><b>${w.name}</b><small>${w.desc}</small></span>
      <span class="wdur">${fmtMin(workoutDuration(k, lvl))}<br><small>~${sessionKcal(buildWorkout(k, lvl), currentWeight())} kcal</small></span>
    </button>`).join('')}

  <h3 class="section-title">Bibliothèque d’exercices</h3>
  ${Object.entries(cats).map(([cat, list]) => `
    <details class="card lib">
      <summary>${cat} <span class="muted">(${list.length})</span></summary>
      ${list.map(([, e]) => `<div class="ex"><b>${e.icon} ${e.name}</b><p>${e.desc}</p><p class="muted small">💡 ${e.tip}${e.easier ? `<br>⬇️ Plus facile : ${e.easier}` : ''}</p></div>`).join('')}
    </details>`).join('')}

  <h3 class="section-title">Historique</h3>
  <section class="card">
    ${history.length ? `<ul class="list">${history.map(s => `
      <li><span>${WORKOUTS[s.type].icon} ${WORKOUTS[s.type].name} <small class="muted">niv. ${s.level}</small></span>
      <span class="muted small">${fmtDate(s.date)} · ${fmtMin(s.duration)} · ${s.kcal} kcal ${s.feel ? ['', '😎', '🙂', '🥵'][s.feel] : ''}</span></li>`).join('')}</ul>`
      : '<p class="muted">Aucune séance pour l’instant. La première est la plus importante !</p>'}
  </section>`;
}

/* ================= Poids ================= */
const MILESTONES = [120, 115, 110, 105, 100, 99];

function viewWeight() {
  const p = state.profile;
  const w = sortedWeights();
  const kg = currentWeight();
  const b = bmi(kg);
  const t = trend();
  const min = w.reduce((m, x) => Math.min(m, x.kg), Infinity);
  const ms = [...new Set([...MILESTONES.filter(m => m < p.startWeight && m > p.goalWeight), p.goalWeight])].sort((a, b) => b - a);

  return `
  <header class="top"><h1>Poids</h1></header>

  <form id="weigh" class="card">
    <h3>Nouvelle pesée</h3>
    <div class="row gap">
      <input name="kg" type="number" inputmode="decimal" step="0.1" min="40" max="300" placeholder="${fmtKg(kg)}" required>
      <input name="date" type="date" value="${today()}" max="${today()}" required>
      <button class="btn primary" type="submit">+</button>
    </div>
    <p class="muted small">Pèse-toi le matin à jeun, 1 à 2 fois par semaine suffit.</p>
  </form>

  <section class="card">
    <div class="row between"><h3>Évolution</h3><span class="muted small"><i class="dot a"></i>poids <i class="dot b"></i>moyenne 7 j <i class="dot c"></i>objectif</span></div>
    <canvas id="chart" height="220"></canvas>
  </section>

  <section class="stats">
    <div class="stat"><b>${fmtKg(p.startWeight - kg)}</b><span>kg perdus</span></div>
    <div class="stat"><b>${b.toFixed(1)}</b><span>IMC<br>${bmiLabel(b)}</span></div>
    <div class="stat"><b>${t ? fmtKg(t.perWeek) : '–'}</b><span>kg / semaine<br>(4 sem.)</span></div>
  </section>

  <section class="card">
    <h3>🏆 Paliers</h3>
    <div class="milestones">
      ${ms.map(m => `<div class="ms ${min <= m ? 'won' : ''}"><b>${min <= m ? '🏅' : '🔒'}</b><span>${m === p.goalWeight ? 'Objectif ' : 'Sous '}${m}</span></div>`).join('')}
    </div>
  </section>

  <section class="card">
    <h3>Historique</h3>
    <ul class="list">
      ${[...w].reverse().map((x, i, arr) => {
        const prev = arr[i + 1];
        const diff = prev ? x.kg - prev.kg : 0;
        return `<li><span>${fmtDate(x.date)}</span><span><b>${fmtKg(x.kg)} kg</b> ${prev ? `<small class="${diff <= 0 ? 'good' : 'bad'}">${diff <= 0 ? '' : '+'}${fmtKg(diff)}</small>` : ''}
          <button class="icon-btn" data-del-weight="${x.date}" aria-label="Supprimer">✕</button></span></li>`;
      }).join('')}
    </ul>
  </section>`;
}

function drawChart() {
  const c = $('#chart');
  if (!c) return;
  const w = sortedWeights();
  const dpr = window.devicePixelRatio || 1;
  const W = c.clientWidth, H = 220;
  c.width = W * dpr; c.height = H * dpr;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  const col = n => css.getPropertyValue(n).trim();
  const goal = state.profile.goalWeight;

  if (w.length < 2) {
    ctx.fillStyle = col('--muted'); ctx.font = '14px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Ajoute au moins 2 pesées pour voir la courbe', W / 2, H / 2);
    return;
  }
  const t0 = parseDate(w[0].date).getTime();
  const xs = w.map(p => (parseDate(p.date).getTime() - t0) / 86400000);
  const span = Math.max(1, xs[xs.length - 1]);
  const vals = w.map(p => p.kg).concat(goal);
  const lo = Math.floor(Math.min(...vals) - 1), hi = Math.ceil(Math.max(...vals) + 1);
  const pad = { l: 34, r: 10, t: 10, b: 22 };
  const X = x => pad.l + (x / span) * (W - pad.l - pad.r);
  const Y = y => pad.t + (1 - (y - lo) / (hi - lo)) * (H - pad.t - pad.b);

  // grille
  ctx.strokeStyle = col('--line'); ctx.fillStyle = col('--muted'); ctx.font = '11px system-ui'; ctx.lineWidth = 1;
  const stepY = Math.max(1, Math.ceil((hi - lo) / 5));
  ctx.textAlign = 'right';
  for (let y = lo; y <= hi; y += stepY) {
    ctx.beginPath(); ctx.moveTo(pad.l, Y(y)); ctx.lineTo(W - pad.r, Y(y)); ctx.stroke();
    ctx.fillText(y, pad.l - 5, Y(y) + 4);
  }
  ctx.textAlign = 'center';
  [0, Math.floor(w.length / 2), w.length - 1].forEach(i => ctx.fillText(fmtDate(w[i].date), Math.min(W - 25, Math.max(pad.l + 15, X(xs[i]))), H - 5));

  // objectif
  ctx.setLineDash([5, 5]); ctx.strokeStyle = col('--good');
  ctx.beginPath(); ctx.moveTo(pad.l, Y(goal)); ctx.lineTo(W - pad.r, Y(goal)); ctx.stroke();
  ctx.setLineDash([]);

  // moyenne glissante 7 jours
  ctx.strokeStyle = col('--accent2'); ctx.lineWidth = 2.5; ctx.beginPath();
  w.forEach((p, i) => {
    const win = w.filter((q, j) => j <= i && xs[i] - xs[j] < 7);
    const avg = win.reduce((a, q) => a + q.kg, 0) / win.length;
    i ? ctx.lineTo(X(xs[i]), Y(avg)) : ctx.moveTo(X(xs[i]), Y(avg));
  });
  ctx.stroke();

  // poids brut
  ctx.strokeStyle = col('--accent'); ctx.lineWidth = 1.5; ctx.beginPath();
  w.forEach((p, i) => i ? ctx.lineTo(X(xs[i]), Y(p.kg)) : ctx.moveTo(X(xs[i]), Y(p.kg)));
  ctx.stroke();
  ctx.fillStyle = col('--accent');
  w.forEach((p, i) => { ctx.beginPath(); ctx.arc(X(xs[i]), Y(p.kg), 3, 0, Math.PI * 2); ctx.fill(); });
}

function addWeight(kg, date = today()) {
  if (!(kg >= 30 && kg <= 350)) { toast('Poids invalide'); return; }
  const before = Math.min(...state.weights.map(w => w.kg), Infinity);
  state.weights = state.weights.filter(w => w.date !== date);
  state.weights.push({ date, kg: Math.round(kg * 10) / 10 });
  save();
  const passed = [...MILESTONES, state.profile.goalWeight].filter(m => kg <= m && before > m);
  if (passed.length) celebrate(`🏅 Palier atteint : sous les ${Math.min(...passed)} kg !`);
  else toast('Pesée enregistrée ✅');
}

/* ================= Nutrition ================= */
function viewFood() {
  const n = nutrition();
  const d = day();
  const eaten = d.food.reduce((t, f) => t + f.kcal, 0);
  const burned = state.sessions.filter(s => s.date === today()).reduce((t, s) => t + s.kcal, 0);
  const left = n.target + burned - eaten;
  const pct = Math.min(100, (eaten / (n.target + burned)) * 100);

  return `
  <header class="top"><h1>Nutrition</h1></header>

  <section class="card">
    <div class="ring-row">
      <div class="ring" style="--p:${pct}">
        <div><b>${Math.abs(left)}</b><small>${left >= 0 ? 'kcal restantes' : 'kcal en trop'}</small></div>
      </div>
      <ul class="kv">
        <li><span>Objectif</span><b>${n.target}</b></li>
        <li><span>Mangé</span><b>${eaten}</b></li>
        <li><span>Sport</span><b class="good">+${burned}</b></li>
      </ul>
    </div>
  </section>

  <section class="card">
    <h3>Ajouter un repas</h3>
    <form id="food" class="row gap">
      <input name="label" placeholder="Ex : poulet riz" maxlength="40">
      <input name="kcal" type="number" inputmode="numeric" min="1" max="5000" placeholder="kcal" required style="max-width:90px">
      <button class="btn primary" type="submit">+</button>
    </form>
    <div class="chips">
      ${FOOD_PRESETS.map((f, i) => `<button class="chip" data-preset="${i}">${f.label} <small>${f.kcal}</small></button>`).join('')}
    </div>
    ${d.food.length ? `<ul class="list mt">${d.food.map((f, i) => `<li><span>${esc(f.label)}</span><span><b>${f.kcal}</b> kcal <button class="icon-btn" data-del-food="${i}" aria-label="Supprimer">✕</button></span></li>`).join('')}</ul>` : ''}
  </section>

  <section class="card">
    <h3>Tes repères quotidiens</h3>
    <ul class="kv wide">
      <li><span>🎯 Calories pour maigrir</span><b>${n.target} kcal</b></li>
      <li><span>🍗 Protéines</span><b>${n.protein} g</b></li>
      <li><span>💧 Eau</span><b>${n.water.toLocaleString('fr-FR')} L</b></li>
      <li><span>🔋 Dépense estimée (sans sport)</span><b>${n.tdee} kcal</b></li>
      <li><span>📉 Perte attendue</span><b>~${fmkSafe(n.weeklyLoss)} kg / sem</b></li>
    </ul>
    <p class="muted small mt">Calcul Mifflin-St Jeor, déficit modéré (~650 kcal) pour une perte durable sans fonte musculaire. Recalculé automatiquement quand ton poids baisse.</p>
  </section>

  <section class="card">
    <h3>Assiette type</h3>
    <div class="plate">
      <div class="veg">½<br>Légumes</div>
      <div class="prot">¼<br>Protéines</div>
      <div class="carb">¼<br>Féculents</div>
    </div>
    <ul class="tips">${TIPS.slice(0, 6).map(t => `<li>${t}</li>`).join('')}</ul>
  </section>`;
}
const fmkSafe = n => fmtKg(Math.max(0, n));

/* ================= Profil ================= */
const BADGES = [
  { id: 'first', icon: '🎉', label: 'Première séance', test: () => state.sessions.length >= 1 },
  { id: 's10', icon: '💪', label: '10 séances', test: () => state.sessions.length >= 10 },
  { id: 's50', icon: '🦾', label: '50 séances', test: () => state.sessions.length >= 50 },
  { id: 'streak3', icon: '🔥', label: '3 jours de suite', test: () => streak() >= 3 },
  { id: 'week4', icon: '📅', label: '4 séances en 1 semaine', test: () => weekSessions().length >= 4 },
  { id: 'kg5', icon: '⚖️', label: '−5 kg', test: () => state.profile.startWeight - minWeight() >= 5 },
  { id: 'kg10', icon: '🏅', label: '−10 kg', test: () => state.profile.startWeight - minWeight() >= 10 },
  { id: 'kg20', icon: '🏆', label: '−20 kg', test: () => state.profile.startWeight - minWeight() >= 20 },
  { id: 'goal', icon: '👑', label: 'Objectif atteint', test: () => minWeight() <= state.profile.goalWeight },
];
const minWeight = () => Math.min(state.profile.startWeight, ...state.weights.map(w => w.kg));

function viewProfile() {
  const s = state.settings;
  return `
  <header class="top"><h1>Profil</h1></header>

  <section class="card">
    <h3>Badges</h3>
    <div class="badges">${BADGES.map(b => { const ok = b.test(); return `<div class="badge ${ok ? 'won' : ''}"><b>${ok ? b.icon : '🔒'}</b><span>${b.label}</span></div>`; }).join('')}</div>
  </section>

  <form id="profile" class="card">
    <h3>Mes informations</h3>
    ${profileForm(state.profile)}
    <label>Poids de départ (kg)<input name="startWeight" type="number" inputmode="decimal" step="0.1" value="${state.profile.startWeight}" required></label>
    <button class="btn primary full" type="submit">Enregistrer</button>
  </form>

  <section class="card">
    <h3>Séances guidées</h3>
    <ul class="checklist">
      <li><label><input type="checkbox" data-setting="voice" ${s.voice ? 'checked' : ''}><span>🗣️ Annonce vocale des exercices</span></label></li>
      <li><label><input type="checkbox" data-setting="sound" ${s.sound ? 'checked' : ''}><span>🔔 Bips de décompte</span></label></li>
      <li><label><input type="checkbox" data-setting="vibrate" ${s.vibrate ? 'checked' : ''}><span>📳 Vibrations</span></label></li>
    </ul>
  </section>

  <section class="card">
    <h3>Mes données</h3>
    <p class="muted small">Tout est stocké uniquement sur ce téléphone. Fais une sauvegarde de temps en temps.</p>
    <div class="row gap wrap">
      <button class="btn" data-action="export">⬇️ Exporter</button>
      <label class="btn">⬆️ Importer<input type="file" accept="application/json" id="import" hidden></label>
      <button class="btn danger" data-action="reset">🗑️ Tout effacer</button>
    </div>
  </section>

  <section class="card">
    <h3>Installer l’application</h3>
    <p class="small"><b>iPhone (Safari)</b> : bouton Partager ⬆️ → « Sur l’écran d’accueil ».<br>
    <b>Android (Chrome)</b> : menu ⋮ → « Installer l’application ».</p>
    ${deferredInstall ? '<button class="btn primary full mt" data-action="install">📲 Installer maintenant</button>' : ''}
  </section>
  <p class="muted small center">FitMaison · ne remplace pas un avis médical</p>`;
}

/* ================= Lecteur de séance ================= */
const player = { steps: [], i: 0, left: 0, running: false, timer: null, type: null, started: 0, elapsed: 0, wakeLock: null, last: 0 };
let audioCtx = null;

function beep(freq = 880, ms = 120) {
  if (!state.settings.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.25, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + ms / 1000);
    o.start(); o.stop(audioCtx.currentTime + ms / 1000);
  } catch (e) { /* audio indisponible */ }
}

function say(text) {
  if (!state.settings.voice || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith('fr'));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch (e) { /* synthèse vocale indisponible */ }
}

function vibrate(p) { if (state.settings.vibrate && navigator.vibrate) navigator.vibrate(p); }

async function lockScreen() {
  try { if ('wakeLock' in navigator) player.wakeLock = await navigator.wakeLock.request('screen'); } catch (e) { /* ignoré */ }
}

function startWorkout(type) {
  player.type = type;
  player.steps = buildWorkout(type, state.profile.level);
  player.i = 0;
  player.elapsed = 0;
  player.left = player.steps[0].dur;
  $('#player').hidden = false;
  document.body.classList.add('noscroll');
  beep(660, 1); // débloque l'audio sur iOS (geste utilisateur)
  lockScreen();
  renderPlayer();
  announce();
  resume();
}

function announce() {
  const s = player.steps[player.i];
  if (s.phase === 'rest') {
    const nx = player.steps[player.i + 1];
    say(`Repos. Ensuite : ${nx ? nx.name : 'fin'}`);
  } else say(s.name);
  vibrate(200);
}

function resume() {
  if (player.running) return;
  player.running = true;
  player.last = Date.now();
  player.timer = setInterval(tick, 250);
  renderPlayer();
}

function pause() {
  player.running = false;
  clearInterval(player.timer);
  renderPlayer();
}

function tick() {
  const now = Date.now();
  const dt = (now - player.last) / 1000;
  player.last = now;
  const before = Math.ceil(player.left);
  player.left -= dt;
  player.elapsed += dt;
  const cur = player.steps[player.i];
  cur.spent = (cur.spent || 0) + dt;
  const after = Math.ceil(player.left);
  if (after !== before && after <= 3 && after > 0) beep(880);
  if (player.left <= 0) {
    beep(1320, 300);
    next();
  } else updateTimer();
}

function next() {
  if (player.i >= player.steps.length - 1) return finishWorkout();
  player.i++;
  player.left = player.steps[player.i].dur;
  renderPlayer();
  announce();
}

function prev() {
  if (player.i > 0) player.i--;
  player.left = player.steps[player.i].dur;
  renderPlayer();
  announce();
}

function closePlayer() {
  pause();
  try { speechSynthesis.cancel(); } catch (e) { /* ignoré */ }
  if (player.wakeLock) { player.wakeLock.release().catch(() => {}); player.wakeLock = null; }
  $('#player').hidden = true;
  document.body.classList.remove('noscroll');
}

function finishWorkout() {
  pause();
  const done = player.steps.map(s => ({ met: s.met, dur: Math.min(s.dur, s.spent || 0) }));
  const kcal = sessionKcal(done, currentWeight());
  const session = { date: today(), type: player.type, level: state.profile.level, duration: Math.round(player.elapsed), kcal, feel: 0 };
  state.sessions.push(session);
  save();
  say('Séance terminée. Bravo !');
  vibrate([200, 100, 200, 100, 400]);
  $('#player').innerHTML = `
    <div class="pl-end">
      <div class="big-emoji">🎉</div>
      <h1>Séance terminée !</h1>
      <div class="stats">
        <div class="stat"><b>${fmtMin(session.duration)}</b><span>durée</span></div>
        <div class="stat"><b>${kcal}</b><span>kcal</span></div>
        <div class="stat"><b>${streak()}</b><span>jours de suite</span></div>
      </div>
      <h3>Comment c’était ?</h3>
      <div class="feel">
        <button data-feel="1">😎<span>Facile</span></button>
        <button data-feel="2">🙂<span>Correct</span></button>
        <button data-feel="3">🥵<span>Difficile</span></button>
      </div>
    </div>`;
}

function rateSession(feel) {
  const s = state.sessions[state.sessions.length - 1];
  s.feel = feel;
  const lvl = state.profile.level;
  const recent = state.sessions.filter(x => x.level === lvl && WORKOUTS[x.type].circuit).slice(-3);
  let msg = 'Séance enregistrée 💪';
  if (feel === 1 && lvl < 3 && recent.length === 3 && recent.every(x => x.feel === 1)) {
    state.profile.level++;
    msg = `🚀 Trop facile ! Tu passes au niveau ${state.profile.level}`;
  } else if (feel === 3 && lvl > 1 && recent.length === 3 && recent.every(x => x.feel === 3)) {
    state.profile.level--;
    msg = `On ralentit un peu : niveau ${state.profile.level}. Aucune honte, c’est la régularité qui compte !`;
  }
  save();
  closePlayer();
  go('home');
  toast(msg);
}

function renderPlayer() {
  const s = player.steps[player.i];
  const nx = player.steps[player.i + 1];
  const total = player.steps.reduce((t, x) => t + x.dur, 0);
  const doneDur = player.steps.slice(0, player.i).reduce((t, x) => t + x.dur, 0) + (s.dur - player.left);
  const phaseLabel = { warmup: 'Échauffement', work: s.round ? `Tour ${s.round}/${s.rounds}` : 'Effort', rest: 'Repos', cool: 'Retour au calme' }[s.phase];
  $('#player').innerHTML = `
    <div class="pl ${s.phase}">
      <div class="pl-top">
        <button class="icon-btn" data-pl="close" aria-label="Quitter">✕</button>
        <span>${phaseLabel}</span>
        <span>${player.i + 1}/${player.steps.length}</span>
      </div>
      <div class="bar thin"><div id="pl-progress" style="width:${(doneDur / total) * 100}%"></div></div>
      <div class="pl-body">
        <div class="big-emoji">${s.icon}</div>
        <h1>${s.name}</h1>
        <div class="timer">
          <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" class="track"/><circle id="pl-ring" cx="60" cy="60" r="54" class="prog" pathLength="100" stroke-dasharray="100" stroke-dashoffset="0"/></svg>
          <b id="pl-time">${Math.ceil(player.left)}</b>
        </div>
        <p class="pl-desc">${s.desc}</p>
        ${s.tip ? `<p class="pl-tip">💡 ${s.tip}</p>` : ''}
        ${s.easier ? `<p class="pl-tip">⬇️ Trop dur ? ${s.easier}</p>` : ''}
      </div>
      <p class="pl-next">${nx ? `Ensuite : <b>${nx.icon} ${nx.name}</b>` : 'Dernier exercice !'}</p>
      <div class="pl-ctrl">
        <button class="icon-btn lg" data-pl="prev" aria-label="Précédent">⏮</button>
        <button class="play" data-pl="toggle" aria-label="${player.running ? 'Pause' : 'Reprendre'}">${player.running ? '⏸' : '▶'}</button>
        <button class="icon-btn lg" data-pl="next" aria-label="Suivant">⏭</button>
      </div>
    </div>`;
  updateTimer();
}

function updateTimer() {
  const s = player.steps[player.i];
  const t = $('#pl-time'), r = $('#pl-ring');
  if (!t) return;
  t.textContent = Math.max(0, Math.ceil(player.left));
  r.setAttribute('stroke-dashoffset', String(100 - (player.left / s.dur) * 100));
  const total = player.steps.reduce((a, x) => a + x.dur, 0);
  const doneDur = player.steps.slice(0, player.i).reduce((a, x) => a + x.dur, 0) + (s.dur - player.left);
  $('#pl-progress').style.width = `${(doneDur / total) * 100}%`;
}

/* ================= Célébration ================= */
function celebrate(msg) {
  const el = document.createElement('div');
  el.className = 'confetti';
  el.innerHTML = Array.from({ length: 40 }, () =>
    `<i style="left:${Math.random() * 100}%;animation-delay:${Math.random() * 0.6}s;background:hsl(${Math.random() * 360},90%,60%)"></i>`).join('');
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
  vibrate([100, 50, 100]);
  toast(msg);
}

/* ================= Événements ================= */
document.addEventListener('click', e => {
  const t = e.target.closest('button, [data-water]');
  if (!t) return;
  const ds = t.dataset;

  if (ds.tab) return go(ds.tab);
  if (ds.start) return startWorkout(ds.start);
  if (ds.pl) {
    if (ds.pl === 'toggle') return player.running ? pause() : resume();
    if (ds.pl === 'next') return next();
    if (ds.pl === 'prev') return prev();
    if (ds.pl === 'close') {
      if (player.elapsed > 120 && confirm('Arrêter la séance ? Tu peux enregistrer ce qui a été fait.')) return finishWorkout();
      return closePlayer();
    }
  }
  if (ds.feel) return rateSession(Number(ds.feel));
  if (ds.water) {
    const d = day(), n = Number(ds.water);
    d.water = d.water === n ? n - 1 : n;
    save(); render();
    if (d.water === Math.round(nutrition().water / 0.25)) celebrate('💧 Objectif hydratation atteint !');
    return;
  }
  if (ds.level) { state.profile.level = Number(ds.level); save(); render(); return toast(`Niveau ${ds.level} : ${LEVELS[ds.level].name}`); }
  if (ds.delWeight) {
    if (state.weights.length <= 1) return toast('Garde au moins une pesée');
    if (confirm('Supprimer cette pesée ?')) { state.weights = state.weights.filter(w => w.date !== ds.delWeight); save(); render(); }
    return;
  }
  if (ds.delFood) { day().food.splice(Number(ds.delFood), 1); save(); return render(); }
  if (ds.preset) { const f = FOOD_PRESETS[Number(ds.preset)]; day().food.push({ ...f }); save(); render(); return toast(`+${f.kcal} kcal`); }

  switch (ds.action) {
    case 'quick-weigh': {
      const v = prompt('Ton poids ce matin (kg) :', fmtKg(currentWeight()).replace(',', '.'));
      if (v) { addWeight(Number(v.replace(',', '.'))); render(); }
      break;
    }
    case 'save-steps': {
      const v = Number($('#steps').value) || 0;
      day().steps = Math.max(0, Math.min(100000, v)); save(); render();
      if (v >= 8000) celebrate('👟 Objectif de pas atteint !'); else toast('Pas enregistrés');
      break;
    }
    case 'export': {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `fitmaison-${today()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      break;
    }
    case 'reset':
      if (confirm('Effacer toutes tes données ? Action irréversible.')) { state = defaultState(); save(); go('home'); }
      break;
    case 'install':
      if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; }
      break;
  }
});

document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.habit) {
    const d = day();
    d.habits[t.dataset.habit] = t.checked;
    save();
    if (HABITS.every(h => d.habits[h.id])) celebrate('✅ Journée parfaite !');
  } else if (t.dataset.setting) {
    state.settings[t.dataset.setting] = t.checked;
    save();
  } else if (t.id === 'import' && t.files[0]) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!data.profile || !Array.isArray(data.weights)) throw new Error('format');
        state = Object.assign(defaultState(), data);
        save(); go('home'); toast('Données importées ✅');
      } catch (err) { toast('Fichier invalide'); }
    };
    r.readAsText(t.files[0]);
  }
});

document.addEventListener('submit', e => {
  const f = e.target;
  if (f.id === 'weigh') {
    e.preventDefault();
    const fd = new FormData(f);
    addWeight(Number(String(fd.get('kg')).replace(',', '.')), fd.get('date') || today());
    render();
  } else if (f.id === 'food') {
    e.preventDefault();
    const fd = new FormData(f);
    const kcal = Math.round(Number(fd.get('kcal')));
    if (kcal > 0) { day().food.push({ label: (fd.get('label') || 'Repas').trim() || 'Repas', kcal }); save(); render(); }
  } else if (f.id === 'profile') {
    e.preventDefault();
    const start = Number(String(new FormData(f).get('startWeight')).replace(',', '.'));
    state.profile = { ...state.profile, ...readProfile(f), startWeight: start };
    save(); render(); toast('Profil mis à jour ✅');
  }
});

// Reprise propre après mise en veille / changement d'app
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (!$('#player').hidden) lockScreen();
    else render(); // la date a pu changer
  }
});
window.addEventListener('resize', () => { if (currentTab === 'weight') drawChart(); });

/* ================= PWA ================= */
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
if ('speechSynthesis' in window) speechSynthesis.getVoices();

render();
