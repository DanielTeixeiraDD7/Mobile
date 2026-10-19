<script setup lang="ts">
import { split } from '@/core/calc.js';
import { coupleIds, memberName } from '@/core/sync.js';
import { money, shortDate, isoDate, currentMonth } from '@/core/format.js';
import { useBudgetStore } from '@/stores/budget';
import { confirmer } from '@/composables/useConfirm';
import { toast, vibrer } from '@/composables/useToast';
import { useT } from '@/lib/t';
import Icone from './Icone.vue';

/** Partage 50/50 (budget à deux) : mêmes calculs que la v1 (calc.split). */
const props = defineProps<{ ym: string }>();
const budget = useBudgetStore();
const { t } = useT();
const ids = computed(() => (budget.tick, coupleIds()));
const s = computed(() => (budget.tick, split(props.ym, ids.value)));
const nom = (id: string) => (budget.tick, memberName(id) ?? '?');
const pct = (id: string) => (s.value.total ? (s.value.paid[id]! / s.value.total) * 100 : 50);

async function regler() {
  const due = s.value.due;
  const ok = await confirmer(t('split.settleConfirm', { debtor: nom(due.debtor), amount: money(due.amount), creditor: nom(due.creditor) }), { ok: t('split.settle'), annuler: t('cancel'), danger: false });
  if (!ok) return;
  await budget.enregistrerReglement({ month: currentMonth(), from: due.debtor, to: due.creditor, amount: due.amount });
  vibrer([20, 40, 20]);
  toast(t('split.allSettled'), { type: 'ok' });
}
async function annuler(id: string) {
  if (!(await confirmer(t('split.undoConfirm'), { ok: t('delete'), annuler: t('cancel') }))) return;
  await budget.supprimerReglement(id);
}
</script>

<template>
  <section class="partage card pad">
    <div class="row between entete">
      <span class="label">{{ $t('split.title') }}</span>
      <span class="small muted">{{ $t('split.common', { amount: money(s.total) }) }}</span>
    </div>

    <template v-if="s.total">
      <div class="barre" role="img" :aria-label="ids.map(id => `${nom(id)} ${money(s.paid[id]!)}`).join(', ')">
        <i v-for="(id, i) in ids" :key="id" :class="'p' + i" :style="{ width: pct(id) + '%' }" />
        <b class="moitie" />
      </div>
      <div class="gens">
        <div v-for="(id, i) in ids" :key="id" :class="'p' + i">
          <span><i class="pt" />{{ $t('split.paid', { name: nom(id) }) }}</span>
          <b class="num">{{ money(s.paid[id]!) }}</b>
        </div>
      </div>
      <p class="small muted center m0">{{ $t('split.share', { amount: money(Math.round(s.total / 2)) }) }} ·
        {{ s.month.amount ? $t('split.monthOwes', { debtor: nom(s.month.debtor), amount: money(s.month.amount), creditor: nom(s.month.creditor) }) : $t('split.monthEven') }}</p>
    </template>
    <p v-else class="small muted">{{ $t('split.empty') }}</p>

    <div class="du" :class="{ ok: !s.due.amount }">
      <span class="label">{{ $t('split.due') }}</span>
      <template v-if="s.due.amount">
        <p class="resultat"><Icone nom="echange" :taille="20" /> {{ $t('split.owes', { debtor: nom(s.due.debtor), amount: money(s.due.amount), creditor: nom(s.due.creditor) }) }}</p>
        <button type="button" class="btn primary full" @click="regler"><Icone nom="check" :taille="18" /> {{ $t('split.settle') }}</button>
      </template>
      <p v-else class="resultat"><Icone nom="check" :taille="20" /> {{ $t('split.allSettled') }}</p>
    </div>

    <div v-if="s.settlements.length" class="remb">
      <span class="label">{{ $t('split.refunds') }}</span>
      <div v-for="r in s.settlements" :key="r.id" class="row between">
        <span>{{ nom(r.from) }} → {{ nom(r.to) }} · <b class="num">{{ money(r.amount) }}</b> <small class="muted">{{ shortDate(isoDate(new Date(r.createdAt))) }}</small></span>
        <button type="button" class="icon-btn petit" :aria-label="$t('delete')" @click="annuler(r.id)"><Icone nom="fermer" :taille="16" /></button>
      </div>
    </div>

    <div class="extra">
      <span />
      <b v-for="id in ids" :key="'n' + id">{{ nom(id) }}</b>
      <span>{{ $t('split.income') }}</span>
      <span v-for="id in ids" :key="'r' + id" class="num">{{ money(s.income[id]!) }}</span>
      <span>{{ $t('split.personal') }}</span>
      <span v-for="id in ids" :key="'p' + id" class="num">{{ money(s.personal[id]!) }}</span>
    </div>
  </section>
</template>

<style scoped>
.partage { display: grid; gap: 14px; }
.entete { flex-wrap: wrap; gap: 4px 10px; }
.entete .label { white-space: nowrap; }
.barre { position: relative; display: flex; height: 16px; border-radius: 99px; overflow: hidden; background: var(--surface-2); }
.barre i { display: block; height: 100%; transition: width .8s var(--ease); }
.barre .p0 { background: var(--p0); } .barre .p1 { background: var(--p1); }
.moitie { position: absolute; left: 50%; top: -3px; bottom: -3px; width: 3px; margin-left: -1.5px; background: var(--surface); border-radius: 2px; }
.gens { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.gens div { display: grid; gap: 2px; padding: 10px 12px; border-radius: 14px; background: var(--surface-2); }
.gens div:last-child { text-align: right; }
.gens span { font-size: 13px; color: var(--muted); font-weight: 700; display: flex; align-items: center; gap: 6px; }
.gens div:last-child span { justify-content: flex-end; }
.gens b { font-size: 19px; }
.pt { width: 8px; height: 8px; border-radius: 50%; background: var(--p0); }
.p1 .pt { background: var(--p1); }
.m0 { margin: 0; }
.du { display: grid; gap: 8px; padding: 14px; border-radius: 16px; background: color-mix(in srgb, var(--p1) 9%, var(--surface-2)); }
.du.ok { background: var(--brand-soft); }
.resultat { margin: 0; display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 16px; }
.du.ok .resultat { color: var(--brand-2); }
.dark .du.ok .resultat { color: var(--brand); }
.remb { display: grid; gap: 6px; font-size: 14px; }
.petit { width: 30px; height: 30px; }
.extra { display: grid; grid-template-columns: 1fr auto auto; gap: 6px 16px; font-size: 13px; color: var(--muted); padding-top: 10px; border-top: 1px solid var(--border); }
.extra b { color: var(--text); text-align: right; }
.extra span.num { text-align: right; color: var(--text); }
</style>
