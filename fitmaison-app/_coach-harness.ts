import { createApp, h } from 'vue';
import './src/styles/app.css';
import Figurine from './src/components/Figurine.vue';
import { EXERCICES } from './src/core/exercices';
import { dureeCycle } from './src/core/figurine';
const q = new URLSearchParams(location.search);
if (q.get('theme') === 'dark') document.documentElement.classList.add('dark');
const ids = (q.get('ids') ?? 'squat,pompes_mur,planche,bird_dog,pont').split(',');
const fr = (q.get('f') ?? '0,0.25,0.5,0.75').split(',').map(Number);
const taille = Number(q.get('t') ?? 200);
const scene = (q.get('scene') ?? null) as any;
const sil = (q.get('sil') ?? 'standard') as any;
createApp({ render: () => h('div', { style: 'display:grid;gap:6px;padding:6px;background:var(--bg);grid-template-columns:repeat(' + fr.length + ',' + taille + 'px)' },
  ids.flatMap(id => fr.map(f => h('div', { style: 'background:var(--surface);border-radius:8px;position:relative' }, [
    h(Figurine, { anim: EXERCICES[id]!.anim, taille, temps: dureeCycle(EXERCICES[id]!.anim) * f, scene, silhouette: sil }),
    h('small', { style: 'position:absolute;top:2px;left:4px;color:var(--muted);font:10px sans-serif' }, id + ' ' + f)]))))
}).mount('#app');
