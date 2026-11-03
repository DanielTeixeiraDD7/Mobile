<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/api';
import { useSession } from '@/stores/session';
import { useToast } from '@/stores/toast';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const s = useSession();
const password = ref('');

async function submit() {
  try {
    await api.reset(String(route.query.token ?? ''), password.value);
    s.me = null;
    toast.push('Mot de passe modifié. Connecte-toi.', 'success');
    router.replace('/connexion');
  } catch (e) {
    toast.error(e);
  }
}
</script>

<template>
  <div class="page" style="max-width: 440px">
    <form class="panel stack" @submit.prevent="submit">
      <h1>Nouveau mot de passe</h1>
      <label class="field"><span>Mot de passe (10 caractères minimum)</span><input v-model="password" class="input" type="password" minlength="10" required /></label>
      <button class="btn primary block">Valider</button>
    </form>
  </div>
</template>
