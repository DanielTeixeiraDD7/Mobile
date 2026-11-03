<script setup lang="ts">
import { RARITIES, RARITY_COLOR, RARITY_LABEL, type AdminCountryDTO, type AdminStatsDTO, type AdminUserDTO, type Currency, type Rarity } from '@nocturne/shared';
import { computed, onMounted, ref, watch } from 'vue';
import { api } from '@/api';
import type { AdminAuditRow, AdminBanner, AdminCard, AdminLedgerRow, AdminPack } from '@/api/types';
import { LEDGER_REASON, dateTime } from '@/lib/format';
import { useSession } from '@/stores/session';
import { useToast } from '@/stores/toast';

const s = useSession();
const toast = useToast();
const TABS = { stats: 'Stats', users: 'Joueurs', cards: 'Cartes', rates: 'Taux', banners: 'Bannières', countries: 'Pays & réglages', tx: 'Transactions', audit: 'Audit' } as const;
type Tab = keyof typeof TABS;
const tab = ref<Tab>('stats');

const stats = ref<AdminStatsDTO | null>(null);
const users = ref<AdminUserDTO[]>([]);
const q = ref('');
const selected = ref<AdminUserDTO | null>(null);
const userLedger = ref<AdminLedgerRow[]>([]);
const grant = ref<{ currency: Currency; amount: number; note: string }>({ currency: 'EMBERS', amount: 100, note: '' });
const cards = ref<AdminCard[]>([]);
const editCard = ref<AdminCard | null>(null);
const packs = ref<AdminPack[]>([]);
const slots = ref<Partial<Record<Rarity, number>>[]>([]);
const banners = ref<AdminBanner[]>([]);
const editBanner = ref<AdminBanner | null>(null);
const countries = ref<AdminCountryDTO[]>([]);
const newCountry = ref('');
const minorCap = ref(30);
const tx = ref<AdminLedgerRow[]>([]);
const audit = ref<AdminAuditRow[]>([]);

const run = async (fn: () => Promise<unknown>, ok?: string) => {
  try { await fn(); if (ok) toast.push(ok, 'success'); } catch (e) { toast.error(e); }
};

async function load(t: Tab) {
  await run(async () => {
    if (t === 'stats') stats.value = await api.admin.stats();
    if (t === 'users') users.value = await api.admin.users(q.value);
    if (t === 'cards') cards.value = await api.admin.cards();
    if (t === 'rates') { packs.value = await api.admin.packs(); slots.value = JSON.parse(JSON.stringify(packs.value[0]?.slots ?? [])); }
    if (t === 'banners') { banners.value = await api.admin.banners(); if (!cards.value.length) cards.value = await api.admin.cards(); }
    if (t === 'countries') { countries.value = await api.admin.countries(); const st = await api.admin.settings(); minorCap.value = Number(st.minorDefaultCapCents ?? 3000) / 100; }
    if (t === 'tx') tx.value = await api.admin.transactions();
    if (t === 'audit') audit.value = await api.admin.audit();
  });
}
onMounted(() => load(tab.value));
watch(tab, load);

async function pick(u: AdminUserDTO) {
  selected.value = u;
  userLedger.value = await api.admin.userLedger(u.id);
}
const doGrant = () => run(async () => {
  await api.admin.grant(selected.value!.id, grant.value.currency, grant.value.amount, grant.value.note);
  await load('users');
  selected.value = users.value.find(u => u.id === selected.value?.id) ?? null;
  userLedger.value = await api.admin.userLedger(selected.value!.id);
}, 'Ajustement enregistré dans le ledger');
const doBlock = (u: AdminUserDTO) => run(async () => { await api.admin.block(u.id, !u.blocked, 'Décision admin'); await load('users'); }, u.blocked ? 'Débloqué' : 'Bloqué');
const doPass = (u: AdminUserDTO, days: number) => run(() => api.admin.pass(u.id, days), days ? `Pass offert ${days} jours` : 'Pass retiré');

const saveCard = () => run(async () => {
  const c = editCard.value!;
  await api.admin.updateCard(c.id, { name: c.name, hp: c.hp, attack: c.attack, lore: c.lore, imageUrl: c.imageUrl || null, active: c.active, craftable: c.craftable, abilityValue: c.abilityValue });
  editCard.value = null;
  await Promise.all([load('cards'), s.refreshCards()]);
}, 'Carte mise à jour');

const slotTotal = (sl: Partial<Record<Rarity, number>>) => Object.values(sl).reduce((a, b) => a + (b ?? 0), 0);
const saveRates = () => run(() => api.admin.setRates(packs.value[0]!.code, slots.value), 'Taux enregistrés (affichés immédiatement aux joueurs)');

function newBanner() {
  const now = new Date();
  editBanner.value = { id: '', code: 'NOUVELLE_BANNIERE', name: 'Nouvelle bannière', description: '', startsAt: now.toISOString(), endsAt: new Date(now.getTime() + 7 * 86_400_000).toISOString(), featuredShare: 50_000, epicPityEvery: 10, legendaryPityAt: 100, theme: 'blood', featured: [], active: true, packCode: 'NE1_STANDARD' };
}
const edit = (b: AdminBanner) => { editBanner.value = { ...b, featured: [...b.featured] }; };
const local = (iso: string | null) => (iso ? iso.slice(0, 16) : '');
const saveBanner = () => run(async () => {
  const { id: _, ...b } = editBanner.value!;
  await api.admin.saveBanner({ ...b, startsAt: new Date(b.startsAt).toISOString(), endsAt: b.endsAt ? new Date(b.endsAt).toISOString() : null });
  editBanner.value = null;
  await load('banners');
}, 'Bannière enregistrée');
const toggleFeatured = (id: string) => {
  const f = editBanner.value!.featured;
  const i = f.indexOf(id);
  if (i >= 0) f.splice(i, 1); else f.push(id);
};

const saveCountry = (c: AdminCountryDTO) => run(() => api.admin.setCountry(c), `${c.country} mis à jour`);
const addCountry = () => run(async () => {
  const c = newCountry.value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) throw new Error('Code pays ISO à 2 lettres');
  await api.admin.setCountry({ country: c, paidPacksEnabled: false, purchasesEnabled: true });
  newCountry.value = '';
  await load('countries');
}, 'Pays ajouté');
const saveMinorCap = () => run(() => api.admin.setSetting('minorDefaultCapCents', Math.round(minorCap.value * 100)), 'Plafond mineurs enregistré');
const featuredCards = computed(() => cards.value.filter(c => ['EPIC', 'LEGENDARY', 'SECRET', 'RARE'].includes(c.rarity)));
</script>

<template>
  <div class="page admin">
    <h1>Administration</h1>
    <div class="chips tabs"><button v-for="(l, k) in TABS" :key="k" class="chip" :class="{ on: tab === k }" @click="tab = k">{{ l }}</button></div>

    <section v-if="tab === 'stats' && stats" class="grid4">
      <div class="panel kpi"><small>Joueurs</small><b>{{ stats.users }}</b></div>
      <div class="panel kpi"><small>Boosters aujourd’hui</small><b>{{ stats.pullsToday }}</b></div>
      <div class="panel kpi"><small>Boosters total</small><b>{{ stats.pullsTotal }}</b></div>
      <div class="panel kpi"><small>Échanges conclus</small><b>{{ stats.trades }}</b></div>
      <div class="panel wide">
        <h3>Cartes tirées par rareté (observé)</h3>
        <div v-for="r in RARITIES" :key="r" class="dist">
          <span :style="{ color: RARITY_COLOR[r] }">{{ RARITY_LABEL[r] }}</span>
          <div class="bar"><i :style="{ width: `${(stats.byRarity[r] / Math.max(1, stats.pullsTotal * 5)) * 100}%`, background: RARITY_COLOR[r] }" /></div>
          <small>{{ stats.byRarity[r] }} · {{ ((stats.byRarity[r] / Math.max(1, stats.pullsTotal * 5)) * 100).toFixed(2) }} %</small>
        </div>
      </div>
    </section>

    <section v-if="tab === 'users'" class="stack">
      <form class="row" @submit.prevent="load('users')"><input v-model="q" class="input grow" placeholder="Email ou pseudo" /><button class="btn">Chercher</button></form>
      <div class="scroll-x panel">
        <table class="table">
          <thead><tr><th>Joueur</th><th>Pays / âge</th><th>Éclats</th><th>Braises</th><th>Poussière</th><th>Boosters</th><th /></tr></thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" :class="{ blocked: u.blocked }">
              <td><b>{{ u.displayName }}</b><br /><small>{{ u.email }}</small></td>
              <td>{{ u.country }} · {{ u.age }}</td>
              <td>{{ u.balances.SHARDS }}</td><td>{{ u.balances.EMBERS }}</td><td>{{ u.balances.DUST }}</td><td>{{ u.pulls }}</td>
              <td class="row"><button class="btn sm" @click="pick(u)">Gérer</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="selected" class="panel stack">
        <div class="spread"><h3>{{ selected.displayName }}</h3><button class="btn sm ghost" @click="selected = null">Fermer</button></div>
        <div class="row">
          <button class="btn sm" @click="doBlock(selected)">{{ selected.blocked ? 'Débloquer' : 'Bloquer' }}</button>
          <button class="btn sm" @click="doPass(selected, 30)">Offrir 30 j de Pass</button>
          <button class="btn sm ghost" @click="doPass(selected, 0)">Retirer le Pass</button>
        </div>
        <form class="row" @submit.prevent="doGrant">
          <select v-model="grant.currency" class="input w"><option value="EMBERS">Braises</option><option value="SHARDS">Éclats</option><option value="DUST">Poussière</option></select>
          <input v-model.number="grant.amount" class="input w" type="number" />
          <input v-model="grant.note" class="input grow" placeholder="Motif (obligatoire)" minlength="3" required />
          <button class="btn primary">Ajuster</button>
        </form>
        <table class="table"><tbody>
          <tr v-for="e in userLedger.slice(0, 30)" :key="e.id"><td><small>{{ dateTime(e.createdAt) }}</small></td><td>{{ LEDGER_REASON[e.reason] ?? e.reason }} <small>{{ e.note }}</small></td><td>{{ e.amount > 0 ? '+' : '' }}{{ e.amount }} {{ e.currency }}</td></tr>
        </tbody></table>
      </div>
    </section>

    <section v-if="tab === 'cards'" class="stack">
      <div v-if="editCard" class="panel stack">
        <h3>{{ editCard.code }}</h3>
        <label class="field"><span>Nom</span><input v-model="editCard.name" class="input" /></label>
        <div class="row"><label class="field"><span>PV</span><input v-model.number="editCard.hp" class="input w" type="number" /></label>
          <label class="field"><span>ATQ</span><input v-model.number="editCard.attack" class="input w" type="number" /></label>
          <label class="field"><span>Valeur capacité</span><input v-model.number="editCard.abilityValue" class="input w" type="number" /></label></div>
        <label class="field"><span>Illustration (image_url)</span><input v-model="editCard.imageUrl" class="input" placeholder="https://…" /></label>
        <label class="field"><span>Lore</span><textarea v-model="editCard.lore" class="input" rows="3" /></label>
        <label class="check"><input v-model="editCard.active" type="checkbox" /> Active (présente dans les boosters)</label>
        <label class="check"><input v-model="editCard.craftable" type="checkbox" /> Invocable avec la poussière</label>
        <div class="row"><button class="btn primary" @click="saveCard">Enregistrer</button><button class="btn ghost" @click="editCard = null">Annuler</button></div>
      </div>
      <div class="panel scroll-x">
        <table class="table">
          <thead><tr><th>#</th><th>Nom</th><th>Rareté</th><th>PV/ATQ</th><th>Image</th><th /></tr></thead>
          <tbody><tr v-for="c in cards" :key="c.id" :class="{ blocked: !c.active }">
            <td>{{ c.code }}</td><td>{{ c.name }}</td><td :style="{ color: RARITY_COLOR[c.rarity] }">{{ RARITY_LABEL[c.rarity] }}</td><td>{{ c.hp }}/{{ c.attack }}</td>
            <td>{{ c.imageUrl ? '✓' : '—' }}</td><td><button class="btn sm" @click="editCard = { ...c }">Éditer</button></td>
          </tr></tbody>
        </table>
      </div>
    </section>

    <section v-if="tab === 'rates'" class="stack">
      <p class="muted">Poids relatifs par emplacement (sur 100 000). Les pourcentages sont recalculés et publiés automatiquement sur la page des taux.</p>
      <div class="slots">
        <div v-for="(sl, i) in slots" :key="i" class="panel slot">
          <b>Carte {{ i + 1 }}</b>
          <label v-for="r in RARITIES" :key="r" class="rate"><span :style="{ color: RARITY_COLOR[r] }">{{ RARITY_LABEL[r] }}</span>
            <input v-model.number="sl[r]" class="input" type="number" min="0" /><small>{{ slotTotal(sl) ? (((sl[r] ?? 0) / slotTotal(sl)) * 100).toFixed(3) : 0 }} %</small></label>
        </div>
      </div>
      <button class="btn primary" :disabled="!slots.length" @click="saveRates">Enregistrer les taux</button>
    </section>

    <section v-if="tab === 'banners'" class="stack">
      <button class="btn sm primary" style="align-self: flex-start" @click="newBanner">Nouvelle bannière</button>
      <div v-if="editBanner" class="panel stack">
        <div class="row"><label class="field grow"><span>Code</span><input v-model="editBanner.code" class="input" /></label><label class="field grow"><span>Nom</span><input v-model="editBanner.name" class="input" /></label></div>
        <label class="field"><span>Description</span><input v-model="editBanner.description" class="input" /></label>
        <div class="row">
          <label class="field"><span>Début</span><input class="input" type="datetime-local" :value="local(editBanner.startsAt)" @input="editBanner.startsAt = ($event.target as HTMLInputElement).value" /></label>
          <label class="field"><span>Fin (vide = permanente)</span><input class="input" type="datetime-local" :value="local(editBanner.endsAt)" @input="editBanner.endsAt = ($event.target as HTMLInputElement).value || null" /></label>
        </div>
        <div class="row">
          <label class="field"><span>Part mise en avant (/100 000)</span><input v-model.number="editBanner.featuredShare" class="input w" type="number" /></label>
          <label class="field"><span>Pitié Épique tous les</span><input v-model.number="editBanner.epicPityEvery" class="input w" type="number" /></label>
          <label class="field"><span>Légendaire garanti à</span><input v-model.number="editBanner.legendaryPityAt" class="input w" type="number" /></label>
          <label class="field"><span>Thème</span><select v-model="editBanner.theme" class="input w"><option value="night">Nuit</option><option value="blood">Sang</option><option value="abyss">Abîme</option></select></label>
        </div>
        <label class="check"><input v-model="editBanner.active" type="checkbox" /> Active</label>
        <div><small class="muted">Cartes mises en avant</small>
          <div class="chips wrap"><button v-for="c in featuredCards" :key="c.id" class="chip" :class="{ on: editBanner.featured.includes(c.id) }" :style="{ color: RARITY_COLOR[c.rarity] }" @click="toggleFeatured(c.id)">{{ c.name }}</button></div></div>
        <div class="row"><button class="btn primary" @click="saveBanner">Enregistrer</button><button class="btn ghost" @click="editBanner = null">Annuler</button></div>
      </div>
      <div v-for="b in banners" :key="b.id" class="panel">
        <div class="spread"><b>{{ b.name }}</b><button class="btn sm" @click="edit(b)">Éditer</button></div>
        <small>{{ b.code }} · {{ dateTime(b.startsAt) }} → {{ b.endsAt ? dateTime(b.endsAt) : 'permanente' }} · {{ b.active ? 'active' : 'inactive' }} · pitié {{ b.epicPityEvery }}/{{ b.legendaryPityAt }}</small>
      </div>
    </section>

    <section v-if="tab === 'countries'" class="stack">
      <div class="panel stack">
        <h3>Restrictions par pays</h3>
        <p class="muted">Pays non listés : tout est autorisé. La Belgique interdit les boosters payants par défaut.</p>
        <div v-for="c in countries" :key="c.country" class="row cty">
          <b>{{ c.country }}</b>
          <label class="check"><input v-model="c.paidPacksEnabled" type="checkbox" @change="saveCountry(c)" /> Boosters payants</label>
          <label class="check"><input v-model="c.purchasesEnabled" type="checkbox" @change="saveCountry(c)" /> Achats</label>
        </div>
        <form class="row" @submit.prevent="addCountry"><input v-model="newCountry" class="input w" maxlength="2" placeholder="NL" /><button class="btn sm">Ajouter (boosters payants désactivés)</button></form>
      </div>
      <div class="panel stack">
        <h3>Plafond par défaut des mineurs</h3>
        <form class="row" @submit.prevent="saveMinorCap"><input v-model.number="minorCap" class="input w" type="number" min="0" /> € / mois <button class="btn sm">Enregistrer</button></form>
      </div>
    </section>

    <section v-if="tab === 'tx'" class="panel scroll-x">
      <table class="table"><thead><tr><th>Date</th><th>Joueur</th><th>Motif</th><th>Montant</th></tr></thead><tbody>
        <tr v-for="e in tx" :key="e.id"><td><small>{{ dateTime(e.createdAt) }}</small></td><td>{{ e.user?.displayName }}</td><td>{{ LEDGER_REASON[e.reason] ?? e.reason }} <small>{{ e.note }}</small></td><td>{{ e.amount > 0 ? '+' : '' }}{{ e.amount }} {{ e.currency }}</td></tr>
      </tbody></table>
    </section>

    <section v-if="tab === 'audit'" class="panel scroll-x">
      <div v-if="!audit.length" class="empty">Aucune action admin.</div>
      <table v-else class="table"><thead><tr><th>Date</th><th>Admin</th><th>Action</th><th>Cible</th></tr></thead><tbody>
        <tr v-for="a in audit" :key="a.id"><td><small>{{ dateTime(a.createdAt) }}</small></td><td>{{ a.actor?.displayName }}</td><td>{{ a.action }}</td><td>{{ a.target }}</td></tr>
      </tbody></table>
    </section>
  </div>
</template>

<style scoped>
.tabs { margin-bottom: 14px; }
.grid4 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
@media (min-width: 720px) { .grid4 { grid-template-columns: repeat(4, 1fr); } }
.grid4 .panel { margin: 0 !important; }
.kpi b { display: block; font-size: 1.6rem; font-family: 'Cinzel', serif; }
.wide { grid-column: 1 / -1; }
.dist { display: grid; grid-template-columns: 100px 1fr 120px; gap: 10px; align-items: center; font-size: .85rem; margin-top: 6px; }
.grow { flex: 1; min-width: 0; }
.input.w { width: 120px; }
.blocked { opacity: .5; }
.slots { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
.slot { margin: 0 !important; display: flex; flex-direction: column; gap: 6px; }
.rate { display: grid; grid-template-columns: 1fr 90px 60px; gap: 6px; align-items: center; font-size: .85rem; }
.rate .input { min-height: 34px; padding: 4px 6px; }
.wrap { flex-wrap: wrap; }
.cty { gap: 16px; }
</style>
