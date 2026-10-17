// Générateur pseudo-aléatoire déterministe (mulberry32) : même graine = même course.
export function createRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: list => list[Math.floor(next() * list.length)],
    chance: p => next() < p,
    weighted(items, weight) {
      const total = items.reduce((s, i) => s + weight(i), 0);
      let r = next() * total;
      for (const i of items) if ((r -= weight(i)) <= 0) return i;
      return items[items.length - 1];
    },
  };
}

export const randomSeed = () => (Math.random() * 2 ** 32) >>> 0;
