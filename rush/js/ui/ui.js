import { ZONES } from '../sim/zones.js';
import { CHARACTERS, characterById } from '../sim/characters.js';
import { MISSIONS, missionById } from '../sim/missions.js';

// Interface en DOM par-dessus le rendu 3D : menus, affichage en course, pause, résultats.
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('fr-FR');

export function createUI(root, h) {
  // h : gestionnaires fournis par main.js (play, selectCharacter, settings…)
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const screens = {};
  let current = null;

  function show(name) {
    current = name;
    for (const [k, node] of Object.entries(screens)) node.hidden = k !== name && !(name === 'pause' && k === 'hud');
  }

  function mount(name, node) {
    screens[name]?.remove();
    screens[name] = node;
    root.append(node);
    node.hidden = current !== name;
    node.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b || b.disabled) return;
      h.click();
      h.action(b.dataset.act, b.dataset);
    });
    return node;
  }

  // --- Menu principal ---
  function renderMenu(save) {
    mount('menu', el(`
      <section class="screen">
        <div class="logo"><div class="sonic">SONIC</div><div class="rush">RUSH <b>3D</b></div></div>
        <div class="best">Record : ${fmt(save.bestScore)} pts · ${fmt(save.bestDistance)} m · ${fmt(save.totalRings)} anneaux</div>
        <div class="spacer"></div>
        <div class="menu-buttons">
          <button class="btn primary" data-act="zones">Jouer</button>
          <button class="btn blue" data-act="chars">Persos</button>
          <button class="btn blue" data-act="missions">Missions</button>
          <button class="btn" data-act="settings" style="grid-column:1/-1">Réglages</button>
        </div>
        <p class="note">Fan game non officiel · Sonic the Hedgehog © SEGA</p>
      </section>`));
  }

  // --- Choix de zone ---
  function renderZones(save, mode) {
    const endlessOk = save.clearedZones.length > 0;
    mount('zones', el(`
      <section class="screen dim">
        <h2>Choisis ta zone</h2>
        <div class="seg">
          <button data-act="mode" data-mode="zone" class="${mode === 'zone' ? 'active' : ''}">Zone + boss</button>
          <button data-act="mode" data-mode="endless" class="${mode === 'endless' ? 'active' : ''}" ${endlessOk ? '' : 'disabled'}>Infini ${endlessOk ? '' : '🔒'}</button>
        </div>
        <div class="zone-list">
          ${ZONES.map(z => {
            const open = save.unlockedZones.includes(z.id);
            return `<button class="card zone-card ${z.id} ${open ? '' : 'locked'}" data-act="play" data-zone="${z.id}" ${open ? '' : 'disabled'}>
              <small>${esc(z.act)} ${save.clearedZones.includes(z.id) ? '· ✅ terminée' : ''}</small>
              <span class="zone-name">${esc(z.name)}</span>
              <small>${open ? `Meilleur : ${fmt(save.bestByZone[z.id] || 0)} pts · boss à ${fmt(z.goal)} m` : '🔒 Bats le boss de la zone précédente'}</small>
            </button>`;
          }).join('')}
        </div>
        ${endlessOk ? '' : '<p class="note">Le mode Infini se débloque en terminant une zone.</p>'}
        <button class="btn small" data-act="menu">Retour</button>
      </section>`));
  }

  // --- Personnages ---
  function renderChars(save) {
    mount('chars', el(`
      <section class="screen dim" style="justify-content:flex-end">
        <h2>Personnages</h2>
        <div class="cards">
          ${CHARACTERS.map(c => `<button class="card ${save.character === c.id ? 'selected' : ''}" data-act="char" data-id="${c.id}">
            <span class="swatch" style="background:${c.color}"></span>
            <b>${esc(c.name)}</b><small>${esc(c.ability)}</small>
          </button>`).join('')}
        </div>
        <p class="note">Modèles 3D en fan-art, construits pour ce jeu.</p>
        <button class="btn small" data-act="menu">Retour</button>
      </section>`));
  }

  // --- Missions ---
  function renderMissions(save) {
    mount('missions', el(`
      <section class="screen dim">
        <h2>Missions</h2>
        <div class="panel">
          ${save.missions.active.map(id => missionById(id)).filter(Boolean).map(m => `<div class="mission">
            <span>${esc(m.text)}</span><small>Récompense : ${fmt(m.reward)} anneaux</small>
          </div>`).join('') || '<p>Toutes les missions sont accomplies !</p>'}
        </div>
        <p class="note">Accomplies : ${save.missions.completed.length} / ${MISSIONS.length}</p>
        <button class="btn small" data-act="menu">Retour</button>
      </section>`));
  }

  // --- Réglages ---
  function renderSettings(save, confirmReset = false) {
    const s = save.settings;
    const node = mount('settings', el(`
      <section class="screen dim">
        <h2>Réglages</h2>
        <div class="panel">
          <label class="setting">Musique <input type="range" min="0" max="1" step="0.05" value="${s.music}" data-set="music"></label>
          <label class="setting">Effets sonores <input type="range" min="0" max="1" step="0.05" value="${s.sfx}" data-set="sfx"></label>
          <label class="setting">Effets visuels réduits <input type="checkbox" ${s.reducedEffects ? 'checked' : ''} data-set="reducedEffects"></label>
          <label class="setting">Qualité
            <select data-set="quality">
              ${[['auto', 'Auto'], ['low', 'Économie'], ['high', 'Haute']].map(([v, l]) => `<option value="${v}" ${s.quality === v ? 'selected' : ''}>${l}</option>`).join('')}
            </select></label>
          <label class="setting">Afficher les FPS <input type="checkbox" ${s.showFps ? 'checked' : ''} data-set="showFps"></label>
        </div>
        <div class="panel" style="text-align:center">
          ${confirmReset
            ? `<p>Effacer records, missions et zones débloquées ?</p><div class="row"><button class="btn small" data-act="reset-yes" style="background:var(--red);color:#fff">Effacer</button><button class="btn small" data-act="settings">Annuler</button></div>`
            : `<button class="btn small" data-act="reset">Réinitialiser la progression</button>`}
        </div>
        <p class="note">Commandes : glisse ← → pour changer de couloir, ↑ pour sauter, ↓ pour rouler (ou plonger en l'air). Bouton BOOST quand la jauge est pleine.</p>
        <button class="btn small" data-act="menu">Retour</button>
      </section>`));
    node.addEventListener('input', e => {
      const key = e.target.dataset.set;
      if (!key) return;
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'range' ? Number(e.target.value) : e.target.value;
      h.setting(key, value);
    });
  }

  // --- Affichage en course ---
  const hud = mount('hud', el(`
    <section class="hud">
      <div class="hud-top">
        <div>
          <div class="hud-rings"><span class="ring-icon"></span><b data-h="rings">0</b></div>
          <div class="combo" data-h="combo"></div>
          <div class="powers" data-h="powers"></div>
        </div>
        <div class="hud-center"><span data-h="dist">0 m</span><small data-h="goal"></small></div>
        <div class="hud-right">
          <button class="pause-btn ui-block" data-act="pause" aria-label="Pause">II</button>
          <div class="hud-score" data-h="score">0</div>
        </div>
      </div>
      <div class="boss-bar" data-h="boss" hidden>DR. EGGMAN<div class="bar"><i data-h="bosshp"></i></div></div>
      <div class="hud-bottom"><button class="boost-btn ui-block" data-act="boost" data-h="boost" style="--p:0"><span>BOOST</span></button></div>
      <div class="fps" data-h="fps" hidden></div>
    </section>`));
  const H = Object.fromEntries([...hud.querySelectorAll('[data-h]')].map(n => [n.dataset.h, n]));
  let lastPowers = '';

  function updateHud(run, { fps, showFps }) {
    const s = run.stats;
    H.rings.textContent = s.rings;
    hud.querySelector('.hud-rings').classList.toggle('empty', s.rings === 0);
    H.dist.textContent = `${fmt(s.distance)} m`;
    H.goal.textContent = run.mode === 'zone' && !run.boss ? `Boss à ${fmt(run.zone.goal)} m` : run.mode === 'endless' ? 'Infini' : '';
    H.score.textContent = fmt(s.score);
    H.combo.textContent = s.combo > 1 ? `×${s.combo} COMBO` : '';
    const p = run.power;
    const powers = [
      p.magnet > 0 && `<div class="power">🧲<i style="width:${(p.magnet / 10) * 100}%"></i></div>`,
      p.shield && '<div class="power">🛡️</div>',
      p.boost > 0 && `<div class="power">⚡<i style="width:${Math.min(100, (p.boost / 4) * 100)}%"></i></div>`,
    ].filter(Boolean).join('');
    if (powers !== lastPowers) { H.powers.innerHTML = powers; lastPowers = powers; }
    H.boost.style.setProperty('--p', Math.round(p.meter * 100));
    H.boost.classList.toggle('ready', p.meter >= 1 && p.boost <= 0);
    const b = run.boss;
    H.boss.hidden = !b || b.phase === 'approach';
    if (b) H.bosshp.style.width = `${(Math.max(0, b.hp) / b.maxHp) * 100}%`;
    H.fps.hidden = !showFps;
    if (showFps) H.fps.textContent = `${fps} FPS`;
  }

  // --- Pause ---
  mount('pause', el(`
    <section class="screen dim">
      <h2>Pause</h2>
      <button class="btn primary" data-act="resume">Reprendre</button>
      <button class="btn" data-act="restart">Recommencer</button>
      <button class="btn blue" data-act="quit">Menu principal</button>
    </section>`));

  // --- Résultats ---
  function renderResults(r) {
    mount('results', el(`
      <section class="screen dim">
        <h2>${r.victory ? `${esc(r.zone.name)} terminée !` : 'Game Over'}</h2>
        <div class="stats">
          <div class="stat wide"><div><span>Score</span><b>${fmt(r.values.score)}</b></div>${r.records.score ? '<span class="record">NOUVEAU RECORD !</span>' : ''}</div>
          <div class="stat"><span>Distance</span><b>${fmt(r.values.distance)} m</b>${r.records.distance ? '<span class="record">RECORD</span>' : ''}</div>
          <div class="stat"><span>Anneaux</span><b>${fmt(r.values.ringsTotal)}</b></div>
          <div class="stat"><span>Ennemis</span><b>${fmt(r.values.enemies)}</b></div>
          <div class="stat"><span>Meilleur score</span><b>${fmt(r.best)}</b></div>
        </div>
        ${r.missions.length ? `<ul class="done-list">${r.missions.map(m => `<li>✅ ${esc(m.text)} (+${fmt(m.reward)} anneaux)</li>`).join('')}</ul>` : ''}
        ${r.unlocked ? `<p class="best">🔓 Nouvelle zone : ${esc(r.unlocked)}</p>` : ''}
        <div class="row">
          <button class="btn primary" data-act="restart">Rejouer</button>
          ${r.next ? `<button class="btn blue" data-act="play" data-zone="${r.next}">Zone suivante</button>` : ''}
          <button class="btn" data-act="quit">Menu</button>
        </div>
      </section>`));
  }

  function banner(text, sub = '', warn = false) {
    const b = el(`<div class="banner ${warn ? 'warn' : ''}">${esc(text)}${sub ? `<small>${esc(sub)}</small>` : ''}</div>`);
    root.append(b);
    setTimeout(() => b.remove(), 1700);
  }

  function toast(text) {
    const t = el(`<div class="toast">${esc(text)}</div>`);
    root.append(t);
    setTimeout(() => t.remove(), 2500);
  }

  function hint(text) {
    const t = el(`<div class="hint">${esc(text)}</div>`);
    root.append(t);
    setTimeout(() => t.remove(), 4100);
  }

  return { show, renderMenu, renderZones, renderChars, renderMissions, renderSettings, renderResults, updateHud, banner, toast, hint, get current() { return current; }, characterById };
}
