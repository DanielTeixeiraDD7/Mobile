<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/api';
import { useSession } from '@/stores/session';
import { useToast } from '@/stores/toast';

const s = useSession();
const toast = useToast();
const router = useRouter();
const route = useRoute();
const email = ref('');
const password = ref('');
const busy = ref(false);
const forgot = ref(false);

async function submit() {
  busy.value = true;
  try {
    if (forgot.value) {
      await api.forgot(email.value);
      toast.push('Si ce compte existe, un lien de réinitialisation a été envoyé.', 'success');
      forgot.value = false;
      return;
    }
    await s.signedIn(await api.login({ email: email.value, password: password.value }));
    router.replace(String(route.query.next ?? '/'));
  } catch (e) {
    toast.error(e);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="page auth">
    <div class="hero">
      <h1>Bonsoir, voyageur</h1>
      <p class="muted">La nuit t’attendait. Connecte-toi pour retrouver ta collection.</p>
    </div>
    <form class="panel stack" @submit.prevent="submit">
      <label class="field"><span>Email</span><input v-model="email" class="input" type="email" autocomplete="email" required /></label>
      <label v-if="!forgot" class="field"><span>Mot de passe</span><input v-model="password" class="input" type="password" autocomplete="current-password" required /></label>
      <button class="btn primary block" :disabled="busy">{{ forgot ? 'Envoyer le lien' : 'Se connecter' }}</button>
      <button type="button" class="btn ghost sm" @click="forgot = !forgot">{{ forgot ? 'Retour à la connexion' : 'Mot de passe oublié ?' }}</button>
    </form>
    <p class="center">Pas encore de compte ? <RouterLink to="/inscription">Créer un compte</RouterLink></p>
  </div>
</template>

<style scoped>
.auth { max-width: 440px; }
.hero { text-align: center; margin: 24px 0 18px; }
.center { text-align: center; margin-top: 16px; }
</style>
