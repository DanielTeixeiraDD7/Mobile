// Commandes : glissements tactiles (déclenchés dès le seuil franchi, sans attendre le lever du doigt)
// et clavier pour tester sur ordinateur. Les touches sur l'interface (boutons) ne déclenchent pas de glissement.
const THRESHOLD = 22;     // pixels
const MAX_TIME = 450;     // ms : au-delà, ce n'est plus un glissement

export function createInput(target, onAction) {
  let start = null;

  const isUi = el => !!el?.closest?.('button, input, select, label, .ui-block');

  target.addEventListener('touchstart', e => {
    if (isUi(e.target)) { start = null; return; }
    const t = e.changedTouches[0];
    start = { x: t.clientX, y: t.clientY, time: performance.now(), id: t.identifier };
  }, { passive: true });

  target.addEventListener('touchmove', e => {
    if (!start) return;
    const t = [...e.changedTouches].find(x => x.identifier === start.id);
    if (!t) return;
    e.preventDefault();
    const dx = t.clientX - start.x, dy = t.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < THRESHOLD) return;
    if (performance.now() - start.time > MAX_TIME) { start = { x: t.clientX, y: t.clientY, time: performance.now(), id: t.identifier }; return; }
    onAction(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
    // Le même doigt peut enchaîner un deuxième glissement sans se lever.
    start = { x: t.clientX, y: t.clientY, time: performance.now(), id: t.identifier };
  }, { passive: false });

  const end = () => { start = null; };
  target.addEventListener('touchend', end);
  target.addEventListener('touchcancel', end);

  // Souris (glisser) pour tester sur ordinateur.
  let mouse = null;
  target.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && !isUi(e.target)) mouse = { x: e.clientX, y: e.clientY }; });
  target.addEventListener('pointermove', e => {
    if (!mouse || e.pointerType !== 'mouse') return;
    const dx = e.clientX - mouse.x, dy = e.clientY - mouse.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < THRESHOLD * 1.5) return;
    onAction(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
    mouse = null;
  });
  target.addEventListener('pointerup', () => { mouse = null; });

  const KEYS = {
    ArrowLeft: 'left', KeyA: 'left', KeyQ: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up', KeyZ: 'up', Space: 'up', ArrowDown: 'down', KeyS: 'down',
    ShiftLeft: 'boost', ShiftRight: 'boost', KeyB: 'boost', KeyP: 'pause', Escape: 'pause',
  };
  window.addEventListener('keydown', e => {
    const action = KEYS[e.code];
    if (!action || e.repeat || isUi(document.activeElement)) return;
    e.preventDefault();
    onAction(action);
  });
}
