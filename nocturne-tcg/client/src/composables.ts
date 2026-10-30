import type { BannerDTO, MissionDTO } from '@nocturne/shared';
import { ref } from 'vue';
import { api } from './api';
import { useToast } from './stores/toast';

export function useBanners() {
  const banners = ref<BannerDTO[]>([]);
  const loading = ref(true);
  const load = async () => {
    try { banners.value = await api.banners(); } catch (e) { useToast().error(e); } finally { loading.value = false; }
  };
  load();
  return { banners, loading, load };
}

export function useMissions() {
  const missions = ref<MissionDTO[]>([]);
  const load = async () => { missions.value = await api.missions(); };
  return { missions, load };
}
