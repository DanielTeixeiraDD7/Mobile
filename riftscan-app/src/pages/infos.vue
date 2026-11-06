<script setup lang="ts">
import { useRift } from '@/stores/rift';

const rift = useRift();
const d = computed(() => rift.donnees);
const date = (s?: string) => (s ? new Date(s).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }) : '—');
</script>

<template>
  <div class="page">
    <p class="kicker">À propos</p>
    <h1 class="titre">Rift<span class="or">Scan</span></h1>
    <section class="carte-ui pad section">
      <h2 class="h2">Les prix</h2>
      <ul class="points small">
        <li><b>Source :</b> prix du marché TCGplayer (États-Unis), d’après la copie quotidienne publiée par TCGCSV.</li>
        <li><b>Mise à jour des prix :</b> {{ date(d?.prix.maj) }}<span v-if="d?.horsLigne"> (copie locale, hors-ligne)</span>.</li>
        <li><b>Conversion :</b> 1 € = {{ d?.prix.usdParEur.toLocaleString('fr-FR') ?? '—' }} $ (taux de référence de la BCE du {{ d?.prix.dateTaux ?? '—' }}).</li>
        <li>Le « prix du marché » est calculé par TCGplayer à partir des ventes récentes. Sans vente récente, on affiche le prix le plus bas proposé.</li>
        <li>Les prix européens (Cardmarket) peuvent être différents : compare avec le lien « Chercher sur Cardmarket » de chaque carte.</li>
        <li>L’état de la carte (abîmée, gradée…) change beaucoup sa valeur : ces prix concernent des cartes en bon état.</li>
      </ul>
    </section>
    <section class="carte-ui pad section">
      <h2 class="h2">Le scan</h2>
      <ul class="points small">
        <li>La photo est analysée <b>sur ton téléphone</b> : rien n’est envoyé.</li>
        <li>Pose la carte à plat, bien éclairée, et fais-la remplir le cadre. Les cartes de champ de bataille (format paysage) se scannent tournées.</li>
        <li>Plusieurs versions d’une carte (illustration alternative, signée…) se ressemblent : vérifie la version proposée et choisis l’autre si besoin.</li>
      </ul>
    </section>
    <section class="carte-ui pad section">
      <h2 class="h2">Mentions</h2>
      <p class="small muted">Application de fan, non officielle. RiftScan n’est ni approuvée ni affiliée à Riot Games, TCGplayer ou Cardmarket. Riftbound, League of Legends et les illustrations des cartes appartiennent à Riot Games. Les images de cartes sont affichées depuis TCGplayer. Ta collection est enregistrée uniquement sur cet appareil.</p>
    </section>
  </div>
</template>

<style scoped>
.h2 { margin: 0 0 8px; font-size: 15px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; color: var(--or-vif); }
.points { margin: 0; padding-left: 18px; display: grid; gap: 8px; color: var(--muted); }
.points b { color: var(--text); }
</style>
