// Assertions des exercices, sans dépendance lourde (le contenu des leçons les importe).

/** Échec d'une vérification, avec un message lisible par un débutant. */
export class CheckFailed extends Error {
  constructor(message: string) { super(message); this.name = 'CheckFailed'; }
}

const show = (v: unknown) => (typeof v === 'string' ? `« ${v} »` : JSON.stringify(v));

export function expect<T>(actual: T, label = 'La valeur') {
  return {
    toBe(expected: T) { if (actual !== expected) throw new CheckFailed(`${label} : attendu ${show(expected)}, obtenu ${show(actual)}.`); },
    toEqual(expected: unknown) { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new CheckFailed(`${label} : attendu ${show(expected)}, obtenu ${show(actual)}.`); },
    toContain(part: string) { if (typeof actual !== 'string' || !actual.includes(part)) throw new CheckFailed(`${label} devrait contenir ${show(part)} (obtenu ${show(actual)}).`); },
    notToContain(part: string) { if (typeof actual === 'string' && actual.includes(part)) throw new CheckFailed(`${label} ne devrait pas contenir ${show(part)}.`); },
    toBeTruthy() { if (!actual) throw new CheckFailed(`${label} devrait être vrai/présent.`); },
    toBeFalsy() { if (actual) throw new CheckFailed(`${label} devrait être faux/absent.`); },
    toBeGreaterThan(n: number) { if (!(typeof actual === 'number' && actual > n)) throw new CheckFailed(`${label} : attendu plus de ${n}, obtenu ${show(actual)}.`); },
  };
}

