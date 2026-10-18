<script setup lang="ts">
import { ALL_CARDS, LESSONS, MODULES, lessonById, moduleOf } from '@/content';
import { inline } from '@/lib/highlight';
import ProgressRing from '@/shared/components/ProgressRing.vue';
import ModuleCard from './parcours/components/ModuleCard.vue';
import { useProgressionStore } from '@/stores/progression';

const progression = useProgressionStore();
const router = useRouter();

const prochaine = computed(() => {
  const derniere = progression.last ? lessonById(progression.last) : null;
  if (derniere && !progression.state(derniere.id).done) return derniere;
  return progression.nextLesson;
});
const moduleProchaine = computed(() => (prochaine.value ? moduleOf(prochaine.value.id) : null));
const salutation = computed(() => {
  const h = new Date().getHours();
  return h < 5 ? 'Bonne nuit' : h < 18 ? 'Bonjour' : 'Bonsoir';
});
// Une notion au hasard parmi les cartes, renouvelée chaque jour.
const astuce = computed(() => {
  const d = new Date();
  const i = (d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate()) % ALL_CARDS.length;
  return ALL_CARDS[i]!;
});
</script>

<template>
  <div class="page">
    <section class="hero">
      <div class="hero-text">
        <span class="hero-kicker">{{ salutation }} 👋</span>
        <template v-if="prochaine">
          <h1>{{ progression.doneCount ? $t('accueil.reprendre') : $t('accueil.debuter') }}</h1>
          <p class="hero-lesson">
            <span class="hero-chip" :style="{ background: moduleProchaine?.color }"><i :class="moduleProchaine?.icon" /></span>
            <span><small>Module {{ moduleProchaine?.id }} · {{ moduleProchaine?.title }}</small><b>{{ prochaine.title }}</b></span>
          </p>
          <div class="flex gap-2 flex-wrap">
            <Button :label="progression.state(prochaine.id).read ? $t('commun.continuer') : $t('commun.commencer')" icon="pi pi-play" class="hero-btn"
              @click="router.push('/lecon/' + prochaine.id)" />
            <Button v-if="progression.state(prochaine.id).read" label="Exercice" icon="pi pi-code" severity="contrast" text class="hero-btn2"
              @click="router.push('/lecon/' + prochaine.id + '/exercice')" />
          </div>
        </template>
        <template v-else>
          <h1>{{ $t('accueil.termine') }}</h1>
          <p class="hero-p">Tous les exercices sont validés. Continue les révisions pour tout retenir.</p>
          <Button label="Réviser" icon="pi pi-bolt" class="hero-btn" @click="router.push('/revision')" />
        </template>
      </div>
      <ProgressRing :value="progression.percent" :size="132" :stroke="11" color="#ffffff" class="hero-ring" />
    </section>

    <section class="stats">
      <div class="stat card"><i class="pi pi-star-fill" style="color:#f5b301" /><b>{{ progression.xp }}</b><span>XP</span></div>
      <div class="stat card"><span class="emoji">🔥</span><b>{{ progression.streak }}</b><span>{{ $t('accueil.serie', { n: progression.streak }) }}</span></div>
      <div class="stat card"><i class="pi pi-check-circle" style="color:#42b883" /><b>{{ progression.doneCount }}<small>/{{ LESSONS.length }}</small></b><span>leçons validées</span></div>
      <div class="stat card"><i class="pi pi-bookmark-fill" style="color:#6366f1" /><b>{{ progression.mastered }}</b><span>notions maîtrisées</span></div>
    </section>

    <router-link to="/revision" class="revision card" :class="{ empty: !progression.dueCards.length }">
      <span class="rev-icon"><i class="pi pi-bolt" /></span>
      <span class="grow">
        <b>{{ progression.dueCards.length ? $t('accueil.revisions', { n: progression.dueCards.length }) : $t('accueil.aucuneRevision') }}</b>
        <small class="muted block">{{ progression.dueCards.length ? '2 minutes pour ancrer ce que tu as appris.' : 'Les cartes des leçons lues reviennent au bon moment.' }}</small>
      </span>
      <i class="pi pi-chevron-right muted" />
    </router-link>

    <h2 class="section-title">Le parcours</h2>
    <div class="grid-modules">
      <ModuleCard v-for="m in MODULES" :key="m.id" :module="m" />
    </div>

    <h2 class="section-title"><i class="pi pi-lightbulb" style="color:#f5b301" /> Le saviez-vous ?</h2>
    <div class="card pad inline-code">
      <p class="m-0 font-semibold" v-html="inline(astuce.q)" />
      <p class="mt-2 mb-0 muted" v-html="inline(astuce.explain)" />
    </div>
  </div>
</template>

<route>
{ "meta": { "titre": "Vue Express" } }
</route>

<style scoped>
.hero {
  position: relative; overflow: hidden; display: flex; align-items: center; justify-content: space-between; gap: 24px;
  padding: 30px 32px; border-radius: 26px; color: #fff;
  background: radial-gradient(120% 140% at 0% 0%, #4fcf96 0%, #2f9a6c 38%, #23493f 75%, #35495e 100%);
  box-shadow: 0 18px 40px -16px rgba(47, 154, 108, .55);
}
.hero::after { content: ""; position: absolute; right: -60px; top: -60px; width: 260px; height: 260px; border-radius: 50%; background: rgba(255,255,255,.07); }
.hero-kicker { font-weight: 700; opacity: .85; }
.hero h1 { font-size: 30px; line-height: 1.15; letter-spacing: -.025em; margin: 6px 0 14px; }
.hero-p { opacity: .9; margin: 0 0 18px; }
.hero-lesson { display: flex; align-items: center; gap: 12px; margin: 0 0 20px; }
.hero-lesson small { display: block; opacity: .8; font-size: 12.5px; font-weight: 600; }
.hero-lesson b { font-size: 18px; }
.hero-chip { width: 42px; height: 42px; border-radius: 13px; display: grid; place-items: center; box-shadow: inset 0 0 0 2px rgba(255,255,255,.35); }
.hero-chip i { font-size: 18px; color: #fff; }
:deep(.hero-btn) { background: #fff !important; color: #1f513d !important; border: 0 !important; padding: .7rem 1.2rem; border-radius: 12px; }
:deep(.hero-btn2) { color: #fff !important; }
.hero-ring { color: #fff; position: relative; z-index: 1; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 18px 0 14px; }
.stat { padding: 14px 16px; display: grid; gap: 2px; }
.stat i, .stat .emoji { font-size: 20px; line-height: 24px; height: 24px; }
.stat b { font-size: 24px; letter-spacing: -.02em; }
.stat b small { font-size: 14px; color: var(--ve-dim); margin-left: 2px; }
.stat span:last-child { font-size: 12.5px; color: var(--ve-muted); }
.revision { display: flex; align-items: center; gap: 14px; padding: 16px 18px; text-decoration: none; color: var(--ve-text); transition: transform .15s, box-shadow .15s; }
.revision:hover { transform: translateY(-1px); }
.rev-icon { width: 46px; height: 46px; border-radius: 14px; display: grid; place-items: center; background: linear-gradient(135deg, #f5b301, #f59e0b); color: #fff; font-size: 20px; flex: none; }
.revision.empty .rev-icon { background: var(--ve-surface-2); color: var(--ve-dim); }
.grow { flex: 1; min-width: 0; }
.block { display: block; }
.grid-modules { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
@media (max-width: 991px) {
  .hero { padding: 22px; border-radius: 22px; }
  .hero h1 { font-size: 23px; }
  .hero-ring { display: none; }
  .stats { grid-template-columns: repeat(2, 1fr); }
  .grid-modules { grid-template-columns: 1fr; }
}
</style>
