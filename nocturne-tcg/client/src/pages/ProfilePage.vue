<script setup lang="ts">
import type { LedgerDTO } from '@nocturne/shared';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api';
import Currency from '@/components/Currency.vue';
import { LEDGER_REASON, dateTime, euros } from '@/lib/format';
import { useSession } from '@/stores/session';
import { useToast } from '@/stores/toast';

const s = useSession();
const toast = useToast();
const router = useRouter();
const ledger = ref<LedgerDTO[]>([]);
const cap = ref<string>(s.me?.monthlySpendCapCents != null ? String(s.me.monthlySpendCapCents / 100) : '');
const delPw = ref('');
const showDelete = ref(false);

onMounted(async () => { ledger.value = await api.ledger().catch(() => []); });

async function saveCap() {
  try {
    s.me = await api.updateSettings({ monthlySpendCapCents: cap.value === '' ? null : Math.round(Number(cap.value) * 100) });
    toast.push('Plafond enregistré.', 'success');
  } catch (e) { toast.error(e); }
}

async function exportData() {
  const data = await api.exportData();
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'nocturne-mes-donnees.json' });
  a.click();
  URL.revokeObjectURL(url);
}

async function del() {
  try {
    await api.deleteAccount(delPw.value);
    await s.logout().catch(() => {});
    toast.push('Compte supprimé. Adieu, voyageur.', 'success');
    router.replace('/');
  } catch (e) { toast.error(e); }
}

async function logout() {
  await s.logout();
  router.replace('/');
}

async function demoAdmin() {
  await api.demo?.setAdmin(!s.isAdmin);
  await s.refreshMe();
  toast.push(s.isAdmin ? 'Mode admin activé (démo)' : 'Mode admin désactivé', 'success');
}
function demoReset() {
  if (!confirm('Effacer toutes les données de la démo sur ce navigateur ?')) return;
  api.demo?.reset();
  location.reload();
}
</script>

<template>
  <div v-if="s.me" class="page">
    <h1>Profil</h1>
    <section class="panel">
      <div class="spread"><h2>{{ s.me.displayName }}</h2><span v-if="s.me.role === 'ADMIN'" class="badge">Admin</span></div>
      <p class="muted">{{ s.me.email }} · {{ s.me.age }} ans · {{ s.me.country }}</p>
      <p>Email : <b :style="{ color: s.me.emailVerified ? 'var(--ok)' : 'var(--gold)' }">{{ s.me.emailVerified ? 'vérifié' : 'non vérifié' }}</b>
        <RouterLink v-if="!s.me.emailVerified" to="/verifier"> · vérifier</RouterLink></p>
      <p>Pass Nocturne : <b>{{ s.me.pass.active ? `actif jusqu’au ${new Date(s.me.pass.until!).toLocaleDateString('fr-FR')}` : 'inactif' }}</b></p>
      <div v-if="s.wallet" class="row"><Currency kind="SHARDS" :value="s.wallet.balances.SHARDS" label /><Currency kind="EMBERS" :value="s.wallet.balances.EMBERS" label /><Currency kind="DUST" :value="s.wallet.balances.DUST" label /></div>
    </section>

    <section class="panel stack">
      <h3>Dépenses</h3>
      <p class="muted" v-if="s.me.isMinor">Compte mineur : achats {{ s.me.parentalConsent ? 'autorisés par un parent' : 'bloqués sans accord parental' }}, plafond maximum 30 € / mois.</p>
      <label class="field"><span>Plafond mensuel (€) — vide = aucun plafond</span>
        <div class="row"><input v-model="cap" class="input" type="number" min="0" step="1" inputmode="numeric" style="max-width: 140px" /><button class="btn" @click="saveCap">Enregistrer</button></div>
      </label>
      <small v-if="s.me.monthlySpendCapCents != null">Plafond actuel : {{ euros(s.me.monthlySpendCapCents) }}</small>
    </section>

    <section class="panel">
      <h3>Historique du solde</h3>
      <p class="muted">Chaque mouvement est enregistré et ne peut pas être modifié.</p>
      <div class="scroll-x">
        <table class="table">
          <tbody>
            <tr v-for="e in ledger" :key="e.id">
              <td><small>{{ dateTime(e.createdAt) }}</small></td>
              <td>{{ LEDGER_REASON[e.reason] ?? e.reason }}<small v-if="e.note"> · {{ e.note }}</small></td>
              <td class="amt" :class="{ neg: e.amount < 0 }">{{ e.amount > 0 ? '+' : '' }}{{ e.amount }} {{ { SHARDS: 'Éclats', EMBERS: 'Braises', DUST: 'Poussière' }[e.currency] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel stack">
      <h3>Mes données (RGPD)</h3>
      <button class="btn" @click="exportData">Télécharger mes données (JSON)</button>
      <button class="btn ghost danger" @click="showDelete = !showDelete">Supprimer mon compte</button>
      <form v-if="showDelete" class="stack" @submit.prevent="del">
        <p class="muted">Suppression définitive : ta collection, tes decks et ton profil sont effacés. L’historique des transactions est conservé de façon anonyme (obligation comptable).</p>
        <input v-model="delPw" class="input" type="password" placeholder="Mot de passe" required />
        <button class="btn primary">Confirmer la suppression</button>
      </form>
    </section>

    <section v-if="api.demo" class="panel stack">
      <h3>Options de démo</h3>
      <button class="btn" @click="demoAdmin">{{ s.isAdmin ? 'Désactiver' : 'Activer' }} le mode admin</button>
      <button class="btn ghost" @click="demoReset">Réinitialiser la démo</button>
    </section>

    <button class="btn block" @click="logout">Se déconnecter</button>
  </div>
</template>

<style scoped>
.amt { text-align: right; white-space: nowrap; color: var(--ok); }
.amt.neg { color: #ff8aa4; }
.danger { color: #ff8aa4; }
section { margin-bottom: 12px; }
</style>
