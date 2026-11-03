<script setup lang="ts">
import { ADULT_AGE, MIN_AGE, ageOn } from '@nocturne/shared';
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api';
import { COUNTRIES } from '@/lib/countries';
import { useSession } from '@/stores/session';
import { useToast } from '@/stores/toast';

const s = useSession();
const toast = useToast();
const router = useRouter();
const f = reactive({ email: '', password: '', displayName: '', birthDate: '', country: 'FR', acceptTerms: false, ageConfirm: false, parentalConsent: false, parentEmail: '' });
const busy = ref(false);

const age = computed(() => (f.birthDate ? ageOn(new Date(f.birthDate), new Date()) : null));
const minor = computed(() => age.value != null && age.value < ADULT_AGE);
const tooYoung = computed(() => age.value != null && age.value < MIN_AGE);

async function submit() {
  if (!f.ageConfirm) return toast.push('Confirme que ta date de naissance est exacte.', 'error');
  busy.value = true;
  try {
    const me = await api.register({
      email: f.email, password: f.password, displayName: f.displayName, birthDate: f.birthDate, country: f.country, acceptTerms: f.acceptTerms,
      parentalConsent: minor.value ? f.parentalConsent : undefined, parentEmail: minor.value && f.parentalConsent ? f.parentEmail : undefined,
    });
    await s.signedIn(me);
    toast.push('Bienvenue ! 200 Braises et 2 boosters gratuits t’attendent.', 'reward', 5000);
    router.replace('/verifier');
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
      <h1>Rejoindre la Nuit</h1>
      <p class="muted">Crée ton compte : 2 boosters gratuits par jour et 200 Braises de bienvenue.</p>
    </div>
    <form class="panel stack" @submit.prevent="submit">
      <label class="field"><span>Pseudo (visible par les autres joueurs)</span><input v-model="f.displayName" class="input" minlength="3" maxlength="20" autocomplete="nickname" required /></label>
      <label class="field"><span>Email</span><input v-model="f.email" class="input" type="email" autocomplete="email" required /></label>
      <label class="field"><span>Mot de passe (10 caractères minimum)</span><input v-model="f.password" class="input" type="password" minlength="10" autocomplete="new-password" required /></label>
      <div class="row two">
        <label class="field"><span>Date de naissance</span><input v-model="f.birthDate" class="input" type="date" required /></label>
        <label class="field"><span>Pays</span><select v-model="f.country" class="input"><option v-for="[c, n] in COUNTRIES" :key="c" :value="c">{{ n }}</option></select></label>
      </div>
      <p v-if="tooYoung" class="warn">Nocturne est réservé aux joueurs de {{ MIN_AGE }} ans et plus.</p>
      <label class="check"><input v-model="f.ageConfirm" type="checkbox" /> <span>Je confirme que ma date de naissance est exacte ({{ age ?? '—' }} ans).</span></label>
      <template v-if="minor && !tooYoung">
        <div class="note">
          <b>Tu as moins de 18 ans.</b> Tu peux jouer gratuitement. Les achats sont bloqués sans l’accord d’un parent et limités à 30 € par mois.
        </div>
        <label class="check"><input v-model="f.parentalConsent" type="checkbox" /> <span>Un parent ou tuteur légal autorise les achats sur ce compte.</span></label>
        <label v-if="f.parentalConsent" class="field"><span>Email du parent</span><input v-model="f.parentEmail" class="input" type="email" required /></label>
      </template>
      <label class="check"><input v-model="f.acceptTerms" type="checkbox" required /> <span>J’accepte les <RouterLink to="/legal/cgu">CGU</RouterLink> et la <RouterLink to="/legal/confidentialite">politique de confidentialité</RouterLink>.</span></label>
      <button class="btn primary block" :disabled="busy || tooYoung">Créer mon compte</button>
    </form>
    <p class="center">Déjà inscrit ? <RouterLink to="/connexion">Se connecter</RouterLink></p>
  </div>
</template>

<style scoped>
.auth { max-width: 480px; }
.hero { text-align: center; margin: 16px 0; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.note { font-size: .88rem; padding: 10px 12px; border-radius: 10px; background: #f0b43c14; border: 1px solid #f0b43c44; }
.warn { color: #ff8aa4; margin: 0; }
.center { text-align: center; margin-top: 16px; }
</style>
