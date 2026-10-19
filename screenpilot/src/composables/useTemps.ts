import { bilan, bornes, joursEcoules, type Periode } from '@/domain/screentime';
import { useBiblio } from '@/stores/biblio';

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const court = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('fr-FR', o);

/** Libellé d'une période : « Aujourd'hui », « Cette semaine », « 13 – 19 oct. », « octobre 2026 ». */
export function libellePeriode(periode: Periode, debut: Date, fin: Date, decalage: number) {
  if (periode === 'jour') {
    if (decalage === 0) return 'Aujourd’hui';
    if (decalage === -1) return 'Hier';
    return court(debut, { weekday: 'long', day: 'numeric', month: 'long' });
  }
  if (periode === 'semaine') {
    if (decalage === 0) return 'Cette semaine';
    if (decalage === -1) return 'Semaine dernière';
    const dernier = new Date(fin.getTime() - 86_400_000);
    return debut.getMonth() === dernier.getMonth()
      ? `${debut.getDate()} – ${court(dernier, { day: 'numeric', month: 'short' })}`
      : `${court(debut, { day: 'numeric', month: 'short' })} – ${court(dernier, { day: 'numeric', month: 'short' })}`;
  }
  if (decalage === 0) return 'Ce mois-ci';
  return court(debut, { month: 'long', year: 'numeric' });
}

/** Libellés des barres : heures (jour), jours de la semaine, jours du mois. */
export function libelleTranche(periode: Periode, debut: number, i: number) {
  if (periode === 'jour') return i % 6 === 0 ? `${i}h` : '';
  if (periode === 'semaine') return JOURS[i] ?? '';
  const j = new Date(debut).getDate();
  return j === 1 || j % 5 === 0 ? String(j) : '';
}

/** Bilan d'une période et de la précédente, recalculé à chaque changement de la bibliothèque. */
export function useBilan(periode: Ref<Periode>, decalage: Ref<number>) {
  const biblio = useBiblio();
  const courant = computed(() => {
    const { debut, fin } = bornes(periode.value, new Date(), decalage.value);
    return { debut, fin, ...bilan(biblio.sessionsVues, periode.value, debut, fin), jours: joursEcoules(debut, fin) };
  });
  const precedent = computed(() => {
    const { debut, fin } = bornes(periode.value, new Date(), decalage.value - 1);
    return { debut, fin, ...bilan(biblio.sessionsVues, periode.value, debut, fin) };
  });
  /** Période précédente arrêtée au même moment (comparaison juste quand la période en cours n'est pas finie). */
  const comparable = computed(() => (decalage.value === 0 ? totalJusqua(periode.value, -1) : precedent.value.total));
  return { courant, precedent, comparable };
}

/** Total de la période décalée, compté seulement jusqu'au même instant relatif qu'aujourd'hui. */
export function totalJusqua(periode: Periode, decalage: number) {
  const biblio = useBiblio();
  const maintenant = new Date();
  const { debut, fin } = bornes(periode, maintenant, decalage);
  const ecoule = maintenant.getTime() - bornes(periode, maintenant).debut.getTime();
  const limite = new Date(Math.min(fin.getTime(), debut.getTime() + ecoule));
  return bilan(biblio.sessionsVues, periode, debut, limite).total;
}

/** Variation en % (null si pas de référence). */
export const variation = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 100) : null);
