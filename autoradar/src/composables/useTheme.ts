import { useReglagesStore } from '@/stores/reglages';

/** Applique le thème (clair / sombre / auto selon le système) sur <html>. */
export function useTheme() {
  const reglages = useReglagesStore();
  const media = window.matchMedia?.('(prefers-color-scheme: dark)');
  const systemeSombre = ref(media?.matches ?? false);
  const sombre = computed(() => reglages.theme === 'sombre' || (reglages.theme === 'auto' && systemeSombre.value));
  const surChangement = (e: MediaQueryListEvent) => { systemeSombre.value = e.matches; };
  onMounted(() => media?.addEventListener?.('change', surChangement));
  onBeforeUnmount(() => media?.removeEventListener?.('change', surChangement));
  watch(sombre, v => {
    document.documentElement.classList.toggle('app-dark', v);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', v ? '#0a0f1c' : '#f5f7fb');
  }, { immediate: true });
  return { sombre };
}
