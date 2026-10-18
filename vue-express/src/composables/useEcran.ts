/** Largeur d'écran et seuil mobile/bureau (992 px, comme au travail). */
export const BREAKPOINT = 992;

export function useEcran() {
  const largeur = ref(typeof window === 'undefined' ? 1280 : window.innerWidth);
  const estMobile = computed(() => largeur.value < BREAKPOINT);
  const maj = () => { largeur.value = window.innerWidth; };
  onMounted(() => window.addEventListener('resize', maj, { passive: true }));
  onBeforeUnmount(() => window.removeEventListener('resize', maj));
  return { largeur, estMobile };
}
