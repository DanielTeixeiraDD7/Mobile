import { describe, expect, it } from 'vitest';
import { EXERCICES } from '../src/core/exercices';
import { BALLON_R, SOL, corps, dureeCycle, emprise, image, instant, orientation, placeDecor, troncLocal, type Animation, type Squelette } from '../src/core/figurine';

/** Contrôle des animations : pas de membre sous le sol, et des appuis réellement posés. */
const points = (s: Squelette) => Object.entries(s).filter(([k]) => k !== 'tete') as [string, [number, number]][];
const ex = Object.values(EXERCICES);

describe('animations des exercices', () => {
  it.each(ex.map(e => [e.id, e] as const))('%s : rien sous le sol, rien hors cadre', (_, e) => {
    const c = dureeCycle(e.anim);
    for (let i = 0; i <= 40; i++) {
      const s = image(e.anim, (c * i) / 40);
      for (const [k, [x, y]] of points(s)) {
        expect(y, `${k} à t=${((c * i) / 40).toFixed(2)}`).toBeLessThanOrEqual(SOL + 3.5);
        expect(x).toBeGreaterThan(-5); expect(x).toBeLessThan(205);
      }
      expect(s.tete[1]).toBeGreaterThan(2);
    }
  });

  it.each(ex.map(e => [e.id, e] as const))('%s : un appui touche le sol à chaque pose clé', (_, e) => {
    const c = dureeCycle(e.anim);
    for (let i = 0; i < 40; i++) {
      const s = image(e.anim, (c * i) / 40);
      const bas = Math.max(...points(s).map(([, [, y]]) => y), s.tete[1] + 10);
      // Sur un support (marche) ou au sol, à 3 px près.
      const surMarche = e.anim.decor?.some(d => d.type === 'marche');
      expect(SOL - bas, `t=${((c * i) / 40).toFixed(2)}`).toBeLessThanOrEqual(surMarche ? 30 : 4);
    }
  });
});

// ---- v3 (agent EXERCICES) : exercices bureau / football / progression ----
import { CATEGORIES, MATERIEL } from '../src/core/exercices';

const NOUVEAUX = ['assis_debout', 'etirement_flechisseurs', 'extension_dos', 'ouverture_poitrine', 'etirement_nuque', 'rotation_buste_assis',
  'marche_laterale', 'pont_marche', 'respiration_ventrale', 'marche_course', 'conduite_balle', 'passe_mur', 'controle_semelle',
  'toucher_ballon', 'slalom_plots', 'frappe_lente', 'pas_chasses_plots', 'equilibre_unipodal'];

describe('exercices v3', () => {
  it('existent tous, avec catégorie, matériel et remplaçant valides', () => {
    for (const id of NOUVEAUX) expect(EXERCICES[id], id).toBeDefined();
    for (const e of ex) {
      expect(CATEGORIES, e.id).toContain(e.cat);
      for (const m of e.materiel) expect(MATERIEL[m], `${e.id} : ${m}`).toBeDefined();
      if (e.versionFacile) expect(EXERCICES[e.versionFacile], `${e.id} → ${e.versionFacile}`).toBeDefined();
    }
    expect(ex.some(e => e.cat === 'Bureau')).toBe(true);
    expect(ex.some(e => e.cat === 'Football')).toBe(true);
  });

  it.each(NOUVEAUX)('%s : genoux jamais en hyperextension (profil)', id => {
    const a = EXERCICES[id]!.anim;
    if (a.vue !== 'profil') return;
    for (const p of a.poses) {
      // Pose en miroir (personnage tourné vers la gauche) : pieds explicitement orientés vers la gauche.
      const sens = (p.piedG ?? 1) < 0 && (p.piedD ?? 1) < 0 ? -1 : 1;
      for (const c of ['G', 'D'] as const) {
        const flexion = sens * ((p[`cuisse${c}`] ?? 0) - (p[`tibia${c}`] ?? 0));
        expect(flexion, `${id} genou ${c}`).toBeGreaterThanOrEqual(-1);
      }
    }
  });

  it.each(NOUVEAUX)('%s : objets mobiles cohérents et dans le cadre', id => {
    const a = EXERCICES[id]!.anim;
    for (const d of a.decor ?? []) {
      if (d.xs) expect(d.xs.length, id).toBe(a.poses.length);
      for (const x of d.xs ?? [d.x]) { expect(x).toBeGreaterThan(5); expect(x).toBeLessThan(195); }
    }
  });
});

describe('décor mobile (xs / ys)', () => {
  const anim: Animation = {
    vue: 'profil', durees: [1, 1], poses: [{}, { cuisseD: 40 }, {}],
    decor: [{ type: 'ballon', x: 120, xs: [120, 134, 120] }, { type: 'plot', x: 160 }, { type: 'ballon', x: 60, xs: [60, 70, 80], ys: [SOL - BALLON_R, SOL - 30, SOL - BALLON_R] }],
  };
  const [ballon, plot, jongle] = anim.decor!;

  it('reprend exactement la position de chaque pose clé', () => {
    expect(placeDecor(anim, ballon!, 0).x).toBeCloseTo(120);
    expect(placeDecor(anim, ballon!, 1).x).toBeCloseTo(134);
    expect(placeDecor(anim, ballon!, 2).x).toBeCloseTo(120);
    expect(placeDecor(anim, jongle!, 1).y).toBeCloseTo(SOL - 30);
  });

  it('suit la même chronologie et le même adoucissement que le corps', () => {
    for (const t of [0.1, 0.25, 0.5, 0.8, 1.3, 1.9]) {
      const { i, j, k } = instant(anim, t);
      const xs = ballon!.xs!;
      expect(placeDecor(anim, ballon!, t).x).toBeCloseTo(xs[i]! + (xs[j]! - xs[i]!) * k);
    }
    // Adouci : à mi-transition on est au milieu, au quart on est encore près du départ.
    expect(placeDecor(anim, ballon!, 0.5).x).toBeCloseTo(127);
    expect(placeDecor(anim, ballon!, 0.25).x).toBeLessThan(123);
  });

  it('boucle avec le cycle de l’animation', () => {
    const c = dureeCycle(anim);
    expect(placeDecor(anim, ballon!, 0.4 + c).x).toBeCloseTo(placeDecor(anim, ballon!, 0.4).x);
  });

  it('par défaut : objet fixe posé au sol, ballon qui touche le sol', () => {
    expect(placeDecor(anim, plot!, 0.7)).toEqual({ x: 160, y: SOL, angle: 0 });
    expect(placeDecor(anim, ballon!, 0.7).y).toBe(SOL - BALLON_R);
  });

  it('le ballon roule sans glisser (un tour pour 2πr parcourus)', () => {
    const p = placeDecor(anim, ballon!, 1);
    expect(p.angle).toBeCloseTo((14 / BALLON_R) * (180 / Math.PI));
    expect(placeDecor(anim, ballon!, 0).angle).toBeCloseTo(0);
  });
});

describe('rendu du coach', () => {
  const valide = (d: string) => d.length > 0 && !/NaN|Infinity|undefined/.test(d);
  it.each(ex.map(e => [e.id, e] as const))('%s : contours valides sur tout le mouvement (deux corpulences)', (_, e) => {
    const c = dureeCycle(e.anim);
    for (const sil of ['standard', 'robuste'] as const) {
      for (let i = 0; i < 12; i++) {
        const s = image(e.anim, (c * i) / 12);
        const k = corps(s, e.anim.vue, sil, e.anim.zones ?? []);
        for (const cal of [...k.arriere, ...k.cou, ...k.avant]) expect(valide(cal.d), cal.p).toBe(true);
        const o = orientation(s);
        expect(Number.isFinite(o.tronc) && Number.isFinite(o.tete)).toBe(true);
        for (const d of e.anim.decor ?? []) {
          const p = placeDecor(e.anim, d, (c * i) / 12);
          expect(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.angle)).toBe(true);
          if (d.type === 'ballon') expect(p.y + BALLON_R).toBeLessThanOrEqual(SOL + 0.5);
        }
      }
    }
    expect(valide(troncLocal(e.anim.vue, 'robuste').contour)).toBe(true);
  });

  it('les zones d’effort ajoutent un halo sur les muscles concernés', () => {
    const s = image(EXERCICES.squat!.anim, 0);
    const avec = corps(s, 'profil', 'standard', ['cuisseD']).avant.filter(c => c.p === 'zone' || c.p === 'halo');
    const sans = corps(s, 'profil', 'standard', []).avant.filter(c => c.p === 'zone' || c.p === 'halo');
    expect(avec).toHaveLength(2);
    expect(sans).toHaveLength(0);
  });

  it('le cadrage contient tout le corps pendant le mouvement', () => {
    for (const e of ex) {
      const [x, y, w, h] = emprise(e.anim);
      const c = dureeCycle(e.anim);
      for (let i = 0; i < 10; i++) {
        const s = image(e.anim, (c * i) / 10);
        for (const [px, py] of Object.values(s)) {
          expect(px).toBeGreaterThanOrEqual(x - 0.01); expect(px).toBeLessThanOrEqual(x + w + 0.01);
          expect(py).toBeGreaterThanOrEqual(y - 0.01); expect(py).toBeLessThanOrEqual(y + h + 0.01);
        }
      }
    }
  });
});

// ---- Appuis réalistes : ce qui doit toucher le sol y reste, la tête ne sert jamais d'appui ----
const AU_SOL = 4;
/** Pour chaque exercice : groupes de points dont au moins un doit toucher le sol dans TOUTES les images. */
const APPUIS: Record<string, (keyof Squelette)[][]> = {
  pont: [['chevilleG'], ['chevilleD']],
  pont_marche: [['chevilleG', 'chevilleD']],
  planche: [['coudeG', 'coudeD'], ['piedG', 'piedD']],
  planche_genoux: [['coudeG', 'coudeD'], ['genouG', 'genouD']],
  pompes_genoux: [['mainG', 'mainD'], ['genouG', 'genouD']],
  bird_dog: [['mainG', 'mainD'], ['genouG', 'genouD']],
  etirement_dos: [['genouG', 'genouD'], ['chevilleG', 'chevilleD']],
  burpee_sans_saut: [['piedG', 'piedD']],
  // Talons au sol (cheville posée) pendant tout le squat / l'assis-debout.
  squat: [['chevilleG'], ['chevilleD']],
  squat_chaise: [['chevilleG'], ['chevilleD']],
  assis_debout: [['chevilleG'], ['chevilleD']],
  chaise_mur: [['chevilleG'], ['chevilleD']],
  dips_chaise: [['chevilleG'], ['chevilleD']],
};

describe('appuis au sol', () => {
  it.each(Object.entries(APPUIS))('%s : les appuis prévus restent au sol', (id, groupes) => {
    const e = EXERCICES[id]!;
    const c = dureeCycle(e.anim);
    for (let i = 0; i < 40; i++) {
      const s = image(e.anim, (c * i) / 40);
      for (const g of groupes) {
        const h = Math.min(...g.map(k => SOL - s[k][1]));
        expect(h, `${id} ${g.join('/')} à t=${((c * i) / 40).toFixed(2)}`).toBeLessThanOrEqual(AU_SOL);
      }
    }
  });

  it.each(ex.map(e => [e.id, e] as const))('%s : la tête ne porte jamais le poids du corps', (_, e) => {
    const c = dureeCycle(e.anim);
    for (let i = 0; i < 40; i++) {
      const s = image(e.anim, (c * i) / 40);
      if (SOL - (s.tete[1] + 10) > 1.5) continue;
      // Tête posée : les épaules sont au sol elles aussi (allongé) et la tête ne passe pas sous les épaules.
      const t = `t=${((c * i) / 40).toFixed(2)}`;
      expect(SOL - s.cou[1], `épaules ${t}`).toBeLessThanOrEqual(11);
      expect(s.tete[1] - s.cou[1], `tête sous les épaules ${t}`).toBeLessThanOrEqual(2);
    }
  });
});
