import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Toast { id: number; text: string; kind: 'info' | 'error' | 'success' | 'reward' }

export const useToast = defineStore('toast', () => {
  const list = ref<Toast[]>([]);
  let n = 0;
  function push(text: string, kind: Toast['kind'] = 'info', ms = 3200) {
    const id = ++n;
    list.value.push({ id, text, kind });
    setTimeout(() => { list.value = list.value.filter(t => t.id !== id); }, ms);
  }
  const error = (e: unknown) => push(e instanceof Error ? e.message : String(e), 'error', 4200);
  return { list, push, error };
});
