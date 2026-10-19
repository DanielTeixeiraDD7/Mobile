<script setup lang="ts">
import { signIn, signUp, currentUser } from '@/core/auth.js';
import { resumeHousehold, createHousehold, joinHousehold, createInvitation, disconnect, coupleIds } from '@/core/sync.js';
import { ago } from '@/core/format.js';
import { useBudgetStore } from '@/stores/budget';
import { toast } from '@/composables/useToast';
import { confirmer } from '@/composables/useConfirm';
import { useT } from '@/lib/t';
import Icone from './Icone.vue';

/** Budget partagé (Supabase) : connexion, foyer, invitation — mêmes appels que la v1. */
const budget = useBudgetStore();
const { t } = useT();
const ui = reactive({ email: '', mdp: '', nom: '', code: '', occupe: false, invitation: null as string | null, confirmerEmail: false });
const sync = computed(() => budget.etatSync);
const user = computed(() => (budget.tick, currentUser()));
// Même couleur par personne partout : toi = p0, l'autre = p1.
const couleur = (id: string) => (budget.tick, 'p' + Math.max(0, coupleIds().indexOf(id)));

function messageErreur(e: { status?: number; code?: string; message?: string }) {
  if (e.status === 0) return t('share.err.offline');
  if (e.status === 429 || /rate/i.test(e.code || '')) return t('share.err.rate');
  const parCode: Record<string, string> = {
    invalid_credentials: 'share.err.credentials', email_not_confirmed: 'share.err.notConfirmed',
    user_already_exists: 'share.err.exists', weak_password: 'share.err.weak', signup_disabled: 'share.err.closed',
  };
  if (e.code && parCode[e.code]) return t(parCode[e.code]!);
  if (/invalid or expired code/i.test(e.message ?? '')) return t('share.err.code');
  return t('share.err.generic', { error: e.message ?? '' });
}
async function action(fn: () => Promise<void>) {
  if (ui.occupe) return;
  ui.occupe = true;
  try { await fn(); } catch (e) { toast(messageErreur(e as never), { type: 'danger' }); } finally { ui.occupe = false; budget.bump(); }
}
function identifiants() {
  const email = ui.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast(t('share.err.email'), { type: 'warn' }); return null; }
  if (ui.mdp.length < 6) { toast(t('share.err.weak'), { type: 'warn' }); return null; }
  return { email, mdp: ui.mdp };
}
const apresConnexion = async () => { ui.confirmerEmail = false; ui.mdp = ''; if (await resumeHousehold()) toast(t('share.joined'), { type: 'ok' }); };
function connexion() { const c = identifiants(); if (c) action(async () => { await signIn(c.email, c.mdp); await apresConnexion(); }); }
function inscription() { const c = identifiants(); if (c) action(async () => { if (await signUp(c.email, c.mdp)) await apresConnexion(); else ui.confirmerEmail = true; }); }
function nomValide() { const n = ui.nom.trim(); if (!n) toast(t('share.err.name'), { type: 'warn' }); return n; }
function creer() { const n = nomValide(); if (n) action(async () => { await createHousehold(n); toast(t('share.joined'), { type: 'ok' }); }); }
function rejoindre() {
  const n = nomValide(); if (!n) return;
  const code = ui.code.trim();
  if (code.length < 6) { toast(t('share.err.code'), { type: 'warn' }); return; }
  action(async () => { await joinHousehold(code, n); toast(t('share.joined'), { type: 'ok' }); });
}
const inviter = () => action(async () => { ui.invitation = await createInvitation(); });
function copier() { navigator.clipboard?.writeText(ui.invitation!).then(() => toast(t('share.copied'), { type: 'ok' })).catch(() => {}); }
async function deconnexion() {
  const msg = t('share.signOutConfirm') + (sync.value.pending ? ` ${t('share.signOutPending', { count: sync.value.pending })}` : '');
  if (!(await confirmer(msg, { ok: t('share.signOut'), annuler: t('cancel') }))) return;
  ui.invitation = null;
  await disconnect();
  budget.bump();
}
const ligneStatut = computed(() => ({
  idle: t('share.status.idle', { when: sync.value.lastSync ? ago(sync.value.lastSync) : t('share.never') }),
  syncing: t('share.status.syncing'), offline: t('share.status.offline'), error: t('share.status.error', { error: sync.value.error || '' }), off: '',
}[sync.value.status]));
</script>

<template>
  <section class="card pad compte">
    <template v-if="!user">
      <p class="small muted m0">{{ $t('share.intro') }}</p>
      <p v-if="ui.confirmerEmail" class="notice">{{ $t('share.confirmEmail') }}</p>
      <form class="form" novalidate @submit.prevent="connexion">
        <label class="field"><span>{{ $t('share.email') }}</span><input v-model="ui.email" class="input" type="email" autocomplete="email" inputmode="email"></label>
        <label class="field"><span>{{ $t('share.password') }}</span><input v-model="ui.mdp" class="input" type="password" autocomplete="current-password" minlength="6"></label>
        <button type="submit" class="btn primary" :disabled="ui.occupe">{{ $t('share.signIn') }}</button>
        <button type="button" class="btn" :disabled="ui.occupe" @click="inscription">{{ $t('share.signUp') }}</button>
        <p class="small muted m0">{{ $t('share.passwordHelp') }}</p>
      </form>
    </template>

    <template v-else-if="!sync.householdId">
      <p class="small muted m0"><Icone nom="mail" :taille="15" /> {{ user.email }}</p>
      <div class="form">
        <label class="field"><span>{{ $t('share.name') }}</span><input v-model="ui.nom" class="input" maxlength="30" autocomplete="given-name"></label>
        <button type="button" class="btn primary" :disabled="ui.occupe" @click="creer">{{ $t('share.create') }}</button>
        <p class="small muted m0">{{ $t('share.createHelp') }}</p>
        <p class="label center">{{ $t('share.or') }}</p>
        <div class="row">
          <input v-model="ui.code" class="input code" :placeholder="$t('share.inviteCode')" maxlength="10" autocapitalize="characters" autocomplete="off">
          <button type="button" class="btn" :disabled="ui.occupe" @click="rejoindre">{{ $t('share.join') }}</button>
        </div>
      </div>
      <button type="button" class="btn ghost full" @click="deconnexion">{{ $t('share.signOut') }}</button>
    </template>

    <template v-else>
      <p class="statut" :class="sync.status"><i />{{ ligneStatut }}<template v-if="sync.pending"> · {{ $t('share.pending', { count: sync.pending }) }}</template></p>
      <span class="label">{{ $t('share.members') }}</span>
      <ul class="membres">
        <li v-for="m in sync.members" :key="m.user_id"><i class="avatar" :class="couleur(m.user_id)">{{ m.display_name.slice(0, 1).toUpperCase() }}</i>{{ m.display_name }}
          <small v-if="m.user_id === user.id" class="muted">{{ $t('share.you') }}</small></li>
      </ul>
      <div v-if="ui.invitation" class="invitation">
        <output class="code-inv num">{{ ui.invitation }}</output>
        <p class="small muted m0">{{ $t('share.inviteHelp') }}</p>
        <button type="button" class="btn" @click="copier"><Icone nom="copier" :taille="18" /> {{ $t('share.copy') }}</button>
      </div>
      <button v-else-if="sync.members.length < 2" type="button" class="btn" :disabled="ui.occupe" @click="inviter"><Icone nom="plus" :taille="18" /> {{ $t('share.invite') }}</button>
      <div class="deux">
        <button type="button" class="btn" :disabled="sync.status === 'syncing'" @click="budget.synchroniser()"><Icone nom="synchro" :taille="18" /> {{ $t('share.syncNow') }}</button>
        <button type="button" class="btn ghost" @click="deconnexion"><Icone nom="sortie" :taille="18" /> {{ $t('share.signOut') }}</button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.compte, .form { display: grid; gap: 12px; }
.m0 { margin: 0; }
.notice { margin: 0; padding: 12px 14px; border-radius: 14px; background: var(--brand-soft); font-size: 14px; }
.code { text-transform: uppercase; letter-spacing: .15em; font-weight: 800; }
.statut { margin: 0; display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 14px; }
.statut i { width: 9px; height: 9px; border-radius: 50%; background: var(--brand); }
.statut.syncing i { background: var(--warn); } .statut.offline i, .statut.error i { background: var(--expense); }
.membres { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.membres li { display: flex; align-items: center; gap: 10px; font-weight: 700; }
.avatar { width: 34px; height: 34px; border-radius: 12px; display: grid; place-items: center; font-style: normal; color: #fff; background: var(--p0); font-weight: 800; }
.avatar.p1 { background: var(--p1); }
.invitation { display: grid; gap: 10px; padding: 14px; border-radius: 16px; background: var(--surface-2); text-align: center; }
.code-inv { font-size: 30px; font-weight: 900; letter-spacing: .2em; }
.deux { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
</style>
