<script setup lang="ts">
import type { Category } from '@/core/types';
import { PALETTE, fallbackCategory } from '@/core/store.js';
import { t as tCore } from '@/core/i18n.js';
import { useBudgetStore } from '@/stores/budget';
import { toast } from '@/composables/useToast';
import { confirmer } from '@/composables/useConfirm';
import { useT } from '@/lib/t';
import Feuille from './Feuille.vue';
import PastilleCategorie from './PastilleCategorie.vue';

/** Créer / modifier une catégorie (nom, couleur) ; même règles que la v1. */
const cat = defineModel<Partial<Category> & Pick<Category, 'kind' | 'color'> | null>({ required: true });
const budget = useBudgetStore();
const { t, nomCat } = useT();
const ouvert = computed({ get: () => !!cat.value, set: v => { if (!v) cat.value = null; } });
const nom = ref('');
const couleur = ref('');
watch(cat, c => { if (c) { nom.value = c.id ? nomCat(c as Category) : ''; couleur.value = c.color; } }, { immediate: true });
const apercu = computed(() => ({ ...(cat.value as Category), name: nom.value || null, color: couleur.value }));

async function enregistrer() {
  const c = cat.value!;
  const n = nom.value.trim();
  if (!n) { toast(t('cat.nameRequired'), { type: 'warn' }); return; }
  const garderDefaut = !!c.key && n === tCore(c.key);
  await budget.enregistrerCategorie({ ...c, color: couleur.value, name: garderDefaut ? null : n });
  cat.value = null;
}
async function supprimer() {
  const c = cat.value as Category;
  const nb = budget.transactions.filter(x => x.categoryId === c.id).length;
  const repli = fallbackCategory(c.kind);
  cat.value = null;
  if (!(await confirmer(t('cat.deleteConfirm', { name: nomCat(c), count: nb, fallback: nomCat(repli) }), { ok: t('delete'), annuler: t('cancel') }))) return;
  await budget.supprimerCategorie(c.id);
}
</script>

<template>
  <Feuille v-model="ouvert" :titre="cat?.id ? $t('cat.editTitle') : $t('cat.new')">
    <form v-if="cat" class="form" novalidate @submit.prevent="enregistrer">
      <div class="apercu"><PastilleCategorie :cat="apercu" :taille="64" /></div>
      <label class="field"><span>{{ $t('cat.name') }}</span><input v-model="nom" class="input" maxlength="24" required></label>
      <div class="field"><span>{{ $t('cat.color') }}</span>
        <div class="nuancier">
          <button v-for="c in PALETTE" :key="c" type="button" :style="{ '--c': c }" :class="{ on: c === couleur }" :aria-label="c" @click="couleur = c" />
        </div>
      </div>
      <p v-if="cat.locked" class="small muted m0">{{ $t('cat.locked') }}</p>
      <button type="submit" class="btn primary full">{{ $t('save') }}</button>
      <button v-if="cat.id && !cat.locked" type="button" class="btn danger full" @click="supprimer">{{ $t('delete') }}</button>
    </form>
  </Feuille>
</template>

<style scoped>
.form { display: grid; gap: 14px; }
.apercu { display: grid; place-items: center; padding: 4px 0; }
.nuancier { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
.nuancier button { aspect-ratio: 1; border-radius: 14px; border: 0; background: var(--c); transition: transform .15s; }
.nuancier button.on { box-shadow: 0 0 0 3px var(--surface), 0 0 0 5px var(--c); transform: scale(.9); }
.m0 { margin: 0; }
</style>
