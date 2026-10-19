<script setup lang="ts">
import { useDemande, repondre } from '@/composables/useConfirm';
import Feuille from './Feuille.vue';
const demande = useDemande();
const ouvert = computed({ get: () => !!demande.value, set: v => { if (!v) repondre(false); } });
</script>

<template>
  <Feuille v-model="ouvert" :titre="demande?.titre">
    <template v-if="demande">
      <p class="msg">{{ demande.message }}</p>
      <div class="actions">
        <button type="button" class="btn full" :class="demande.danger ? 'danger solid' : 'primary'" @click="repondre(true)">{{ demande.ok }}</button>
        <button type="button" class="btn ghost full" @click="repondre(false)">{{ demande.annuler }}</button>
      </div>
    </template>
  </Feuille>
</template>

<style scoped>
.msg { font-size: 16.5px; margin: 4px 0 18px; line-height: 1.45; }
.actions { display: grid; gap: 8px; }
</style>
