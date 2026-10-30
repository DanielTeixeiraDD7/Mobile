<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/api';
import { useSession } from '@/stores/session';
import { useToast } from '@/stores/toast';

const s = useSession();
const toast = useToast();
const route = useRoute();
const router = useRouter();
const state = ref<'idle' | 'ok' | 'error'>('idle');
const mail = computed(() => api.demo?.lastMail() ?? null);

watch(() => route.query.token, async token => {
  if (typeof token !== 'string') return;
  try {
    s.me = await api.verify(token);
    state.value = 'ok';
    toast.push('Adresse confirmée. Les échanges sont débloqués !', 'success');
    setTimeout(() => router.replace('/'), 1200);
  } catch (e) {
    state.value = 'error';
    toast.error(e);
  }
}, { immediate: true });

async function resend() {
  try {
    await api.resend();
    toast.push('Nouvel email envoyé.', 'success');
  } catch (e) {
    toast.error(e);
  }
}
</script>

<template>
  <div class="page narrow">
    <div class="panel stack center">
      <h1>Vérifie ton adresse</h1>
      <p v-if="state === 'ok'">C’est fait. Bienvenue parmi les veilleurs !</p>
      <template v-else-if="s.me?.emailVerified">
        <p>Ton adresse est déjà confirmée.</p>
        <RouterLink class="btn primary" to="/">Accueil</RouterLink>
      </template>
      <template v-else-if="s.me">
        <p>Un lien de confirmation a été envoyé à <b>{{ s.me.email }}</b>. Il débloque les échanges et les achats.</p>
        <div v-if="mail?.link" class="mailbox">
          <small>Boîte mail simulée (démo)</small>
          <b>{{ mail.subject }}</b>
          <p>{{ mail.text }}</p>
          <a class="btn gold" :href="mail.link">Confirmer mon adresse</a>
        </div>
        <div class="row center-row">
          <button class="btn" @click="resend">Renvoyer l’email</button>
          <RouterLink class="btn ghost" to="/">Plus tard</RouterLink>
        </div>
      </template>
      <p v-else>Connecte-toi pour finaliser la vérification.</p>
    </div>
  </div>
</template>

<style scoped>
.narrow { max-width: 480px; }
.center { text-align: center; align-items: center; margin-top: 24px; }
.center-row { justify-content: center; }
.mailbox { width: 100%; text-align: left; padding: 14px; border-radius: 12px; background: #0e0914; border: 1px dashed var(--line); display: flex; flex-direction: column; gap: 6px; }
.mailbox p { margin: 0; color: var(--muted); }
</style>
