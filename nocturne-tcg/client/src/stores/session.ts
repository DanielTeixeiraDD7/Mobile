import type { CardDTO, CollectionDTO, MeDTO, WalletDTO } from '@nocturne/shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api } from '@/api';
import { useToast } from './toast';

export const useSession = defineStore('session', () => {
  const me = ref<MeDTO | null>(null);
  const wallet = ref<WalletDTO | null>(null);
  const cards = ref<CardDTO[]>([]);
  const collection = ref<CollectionDTO>({});
  const ready = ref(false);

  const cardMap = computed(() => new Map(cards.value.map(c => [c.id, c])));
  const card = (id: string) => cardMap.value.get(id);
  const isAdmin = computed(() => me.value?.role === 'ADMIN');

  async function boot() {
    if (ready.value) return;
    const [m, c] = await Promise.all([api.me().catch(() => null), api.cards()]);
    me.value = m;
    cards.value = c;
    if (m) await loadPlayer();
    ready.value = true;
  }

  async function loadPlayer() {
    const [w, col] = await Promise.all([api.wallet(), api.collection()]);
    wallet.value = w;
    collection.value = col;
    if (w.loginReward) useToast().push(`Connexion du jour : +${w.loginReward} Braises (série de ${w.loginStreak} j)`, 'reward', 4500);
  }

  async function signedIn(m: MeDTO) {
    me.value = m;
    await loadPlayer();
  }

  async function logout() {
    await api.logout();
    me.value = null;
    wallet.value = null;
    collection.value = {};
  }

  const refreshWallet = async () => { wallet.value = await api.wallet(); };
  const refreshCollection = async () => { collection.value = await api.collection(); };
  const refreshMe = async () => { me.value = await api.me(); };
  const refreshCards = async () => { cards.value = await api.cards(); };

  return { me, wallet, cards, collection, ready, card, cardMap, isAdmin, boot, loadPlayer, signedIn, logout, refreshWallet, refreshCollection, refreshMe, refreshCards };
});
