import { useBiblio } from '@/stores/biblio';

/** Thème sombre (défaut) / clair / auto, copié dans localStorage pour le premier rendu. */
export function useTheme() {
  const biblio = useBiblio();
  const media = window.matchMedia?.('(prefers-color-scheme: dark)');
  const systeme = ref(media?.matches ?? true);
  const theme = computed(() => biblio.settings.theme ?? 'sombre');
  const sombre = computed(() => theme.value === 'sombre' || (theme.value === 'auto' && systeme.value));
  const surChangement = (e: MediaQueryListEvent) => { systeme.value = e.matches; };
  onMounted(() => media?.addEventListener?.('change', surChangement));
  onBeforeUnmount(() => media?.removeEventListener?.('change', surChangement));
  watch(sombre, v => {
    document.documentElement.classList.toggle('dark', v);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', v ? '#07080c' : '#f5f5f8');
  }, { immediate: true });
  watch(theme, v => { try { localStorage.setItem('screenpilot:theme', v); } catch { /* ignoré */ } }, { immediate: true });
  return { theme, sombre };
}
