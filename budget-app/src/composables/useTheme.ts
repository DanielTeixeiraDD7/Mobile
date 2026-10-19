import { useBudgetStore } from '@/stores/budget';

export type Theme = 'auto' | 'clair' | 'sombre';

/** Thème clair / sombre / auto. Réglage local à l'appareil (non partagé), copié dans localStorage pour le premier rendu. */
export function useTheme() {
  const budget = useBudgetStore();
  const media = window.matchMedia?.('(prefers-color-scheme: dark)');
  const systeme = ref(media?.matches ?? false);
  const theme = computed<Theme>(() => (budget.settings.theme as Theme | undefined) ?? 'auto');
  const sombre = computed(() => theme.value === 'sombre' || (theme.value === 'auto' && systeme.value));
  const surChangement = (e: MediaQueryListEvent) => { systeme.value = e.matches; };
  onMounted(() => media?.addEventListener?.('change', surChangement));
  onBeforeUnmount(() => media?.removeEventListener?.('change', surChangement));
  watch(sombre, v => {
    document.documentElement.classList.toggle('dark', v);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', v ? '#0a0e0c' : '#f4f6f3');
  }, { immediate: true });
  watch(theme, v => { try { localStorage.setItem('budget2:theme', v); } catch { /* ignoré */ } }, { immediate: true });
  return { theme, sombre };
}
