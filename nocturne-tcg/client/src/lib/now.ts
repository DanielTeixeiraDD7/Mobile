import { onScopeDispose, ref } from 'vue';

export function useNow(ms = 1000) {
  const now = ref(Date.now());
  const t = setInterval(() => { now.value = Date.now(); }, ms);
  onScopeDispose(() => clearInterval(t));
  return now;
}
