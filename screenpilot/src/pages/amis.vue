<script setup lang="ts">
import { classement, type Critere } from '@/domain/classement';
import { bornes, duree } from '@/domain/screentime';
import { TYPE_LABELS, formatNumber } from '@/domain/labels';
import { MEDIA_TYPES } from '@/domain/types';
import { jourLocal, messageSocial } from '@/lib/social';
import { useSocial } from '@/stores/social';
import { toast } from '@/composables/useToast';
import { confirmer } from '@/composables/useConfirm';
import Icone from '@/components/Icone.vue';
import Avatar from '@/components/Avatar.vue';

const social = useSocial();
const route = useRoute();
onMounted(() => { if (social.etat === 'inactif' || social.etat === 'deconnecte') void social.demarrer(); else void social.rafraichir().catch(() => {}); });

// ---------- Connexion / inscription ----------
const mode = ref<'inscription' | 'connexion'>('inscription');
const pseudo = ref('');
const email = ref('');
const mdp = ref('');
const voirMdp = ref(false);
const envoi = ref(false);
const erreurForm = ref<string | null>(null);
const formValide = computed(() => /\S+@\S+\.\S+/.test(email.value) && mdp.value.length >= 8 && (mode.value === 'connexion' || pseudo.value.trim().length >= 2));
async function soumettre() {
  if (!formValide.value || envoi.value) return;
  envoi.value = true; erreurForm.value = null;
  try {
    if (mode.value === 'inscription') await social.inscrire(email.value, mdp.value, pseudo.value);
    else await social.connecter(email.value, mdp.value);
    mdp.value = '';
    if (social.etat === 'connecte') toast(`Bienvenue ${social.profil!.pseudo} !`, { type: 'ok' });
  } catch (e) { erreurForm.value = messageSocial(e); }
  finally { envoi.value = false; }
}
async function choisirPseudo() {
  if (pseudo.value.trim().length < 2) return;
  envoi.value = true; erreurForm.value = null;
  try { await social.creerProfil(pseudo.value); } catch (e) { erreurForm.value = messageSocial(e); } finally { envoi.value = false; }
}

// ---------- Code ami et invitations ----------
const codeSaisi = ref(typeof route.query.code === 'string' ? route.query.code.toUpperCase() : '');
// Lien d'invitation ouvert alors que la page est déjà affichée : on reprend le code de l'adresse.
watch(() => route.query.code, c => { if (typeof c === 'string' && c) codeSaisi.value = c.toUpperCase(); });
const lien = computed(() => (social.profil ? `${location.origin}${location.pathname}#/amis?code=${social.profil.code}` : ''));
const codeValide = computed(() => /^[A-Z0-9]{4}-?[A-Z0-9]{4}$/.test(codeSaisi.value.trim().toUpperCase()));
const ajoutEnCours = ref(false);
function formaterCode() {
  const brut = codeSaisi.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  codeSaisi.value = brut.length > 4 ? `${brut.slice(0, 4)}-${brut.slice(4)}` : brut;
}
async function ajouter() {
  if (!codeValide.value || ajoutEnCours.value) return;
  formaterCode();
  ajoutEnCours.value = true;
  try {
    const r = await social.ajouterAmi(codeSaisi.value);
    toast(r.statut === 'acceptee' ? `Vous êtes amis avec ${r.pseudo} !` : `Demande envoyée à ${r.pseudo}.`, { type: 'ok' });
    codeSaisi.value = '';
  } catch (e) { toast(messageSocial(e), { type: 'danger' }); }
  finally { ajoutEnCours.value = false; }
}
async function copier() {
  try { await navigator.clipboard.writeText(social.profil!.code); toast('Code copié.'); } catch { toast(social.profil!.code); }
}
async function inviter() {
  const texte = `Ajoute-moi sur ScreenPilot (films, séries, anime, manga) : mon code ami est ${social.profil!.code}`;
  if (navigator.share) {
    try { await navigator.share({ title: 'ScreenPilot', text: texte, url: lien.value }); return; }
    catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(`${texte}\n${lien.value}`); toast('Invitation copiée : colle-la dans un message.'); } catch { toast(lien.value); }
}
async function accepter(id: string, nom: string) {
  try { await social.accepter(id); toast(`Vous êtes amis avec ${nom} !`, { type: 'ok' }); } catch (e) { toast(messageSocial(e), { type: 'danger' }); }
}
async function retirer(id: string, nom: string, quoi: 'refuser' | 'annuler') {
  if (quoi === 'refuser' && !(await confirmer(`La demande de ${nom} sera supprimée.`, { titre: 'Refuser ?', ok: 'Refuser', annuler: 'Garder' }))) return;
  try { await social.retirer(id); } catch (e) { toast(messageSocial(e), { type: 'danger' }); }
}

// ---------- Classement ----------
const critere = ref<Critere>('TOTAL');
const semaineDerniere = ref(false);
const periode = computed(() => {
  const { debut, fin } = bornes('semaine', new Date(), semaineDerniere.value ? -1 : 0);
  return { debut: jourLocal(debut.getTime()), fin: jourLocal(fin.getTime()) };
});
const rangs = computed(() => {
  const p = social.profil;
  if (!p) return [];
  return classement(social.stats, [p, ...social.reseau.amis], p.id, periode.value.debut, periode.value.fin, critere.value);
});
const maxRang = computed(() => Math.max(1, ...rangs.value.map(r => r.valeur)));
const valeur = (v: number) => (critere.value === 'MANGA' ? `${formatNumber(v)} ch.` : duree(v));
const MEDAILLES = ['🥇', '🥈', '🥉'];
const semaineAmi = (id: string) => classement(social.stats, social.reseau.amis.filter(a => a.id === id), social.profil?.id ?? '', periode.value.debut, periode.value.fin)[0];

const actualisation = ref(false);
async function actualiser() {
  actualisation.value = true;
  try { await social.synchroniser(); await social.rafraichir(); } catch (e) { toast(messageSocial(e), { type: 'danger' }); }
  finally { actualisation.value = false; }
}
</script>

<template>
  <div class="page">
    <div class="topbar">
      <h1 class="page-title grow">Amis</h1>
      <button v-if="social.etat === 'connecte'" type="button" class="icon-btn" :class="{ tourne: actualisation }" aria-label="Actualiser" @click="actualiser"><Icone nom="synchro" /></button>
      <router-link v-if="social.etat === 'connecte'" to="/reglages#compte" class="icon-btn" aria-label="Compte et partage"><Icone nom="reglages" /></router-link>
    </div>

    <p v-if="social.etat === 'chargement' || social.etat === 'inactif'" class="muted center">Chargement…</p>

    <!-- ===== Pas de compte ===== -->
    <template v-else-if="social.etat === 'deconnecte'">
      <section class="card intro">
        <div class="avatars" aria-hidden="true">
          <Avatar pseudo="D" couleur="#ff4d6d" :taille="46" /><Avatar pseudo="F" couleur="#3b82f6" :taille="46" /><Avatar pseudo="L" couleur="#a855f7" :taille="46" />
        </div>
        <h2>Compare-toi avec tes amis</h2>
        <ul class="atouts">
          <li><Icone nom="stats" :taille="18" /> Classement du temps d’écran de la semaine</li>
          <li><Icone nom="coeur" :taille="18" /> Titres en commun et compatibilité de goûts</li>
          <li><Icone nom="play" :taille="18" /> Ce que tes amis regardent en ce moment</li>
        </ul>
        <p class="small muted">Compte facultatif : sans compte, tout continue de marcher sur ton téléphone. Tu choisis ce que tu partages, et seulement avec les amis que tu acceptes.</p>
      </section>

      <form class="card pad stack formulaire" @submit.prevent="soumettre">
        <div class="seg">
          <button type="button" :class="{ on: mode === 'inscription' }" @click="mode = 'inscription'; erreurForm = null">Créer un compte</button>
          <button type="button" :class="{ on: mode === 'connexion' }" @click="mode = 'connexion'; erreurForm = null">J’ai un compte</button>
        </div>
        <label v-if="mode === 'inscription'" class="field">
          <span>Pseudo (visible par tes amis)</span>
          <input v-model="pseudo" class="input" maxlength="24" autocomplete="nickname" placeholder="Dani">
        </label>
        <label class="field">
          <span>Email</span>
          <input v-model="email" class="input" type="email" autocomplete="email" inputmode="email" placeholder="toi@exemple.com">
        </label>
        <label class="field">
          <span>Mot de passe (8 caractères minimum)</span>
          <span class="mdp">
            <input v-model="mdp" class="input" :type="voirMdp ? 'text' : 'password'" :autocomplete="mode === 'inscription' ? 'new-password' : 'current-password'" minlength="8">
            <button type="button" class="icon-btn" :aria-label="voirMdp ? 'Masquer' : 'Afficher'" @click="voirMdp = !voirMdp"><Icone nom="oeil" :taille="18" /></button>
          </span>
        </label>
        <p v-if="erreurForm" class="banner error" role="alert">{{ erreurForm }}</p>
        <button type="submit" class="btn primary full" :disabled="!formValide || envoi">{{ envoi ? '…' : mode === 'inscription' ? 'Créer mon compte' : 'Me connecter' }}</button>
        <p class="tiny dim">Ton email sert uniquement à te connecter ; il n’est jamais montré à tes amis.</p>
      </form>
    </template>

    <!-- ===== Compte sans profil (connexion sur un nouvel appareil, profil jamais créé) ===== -->
    <form v-else-if="social.etat === 'sans-profil'" class="card pad stack" @submit.prevent="choisirPseudo">
      <b>Choisis ton pseudo</b>
      <input v-model="pseudo" class="input" maxlength="24" placeholder="Pseudo visible par tes amis">
      <p v-if="erreurForm" class="banner error">{{ erreurForm }}</p>
      <button type="submit" class="btn primary full" :disabled="pseudo.trim().length < 2 || envoi">Continuer</button>
    </form>

    <!-- ===== Connecté ===== -->
    <div v-else-if="social.profil" class="connecte">
      <p v-if="social.erreur" class="banner warn">{{ social.erreur }}</p>

      <section v-if="social.reseau.recues.length" class="card demandes">
        <p class="label">Demandes reçues</p>
        <div v-for="p in social.reseau.recues" :key="p.id" class="personne">
          <Avatar :pseudo="p.pseudo" :couleur="p.couleur" :taille="38" />
          <b class="grow ellipsis">{{ p.pseudo }}</b>
          <button type="button" class="btn small primary" @click="accepter(p.id, p.pseudo)">Accepter</button>
          <button type="button" class="icon-btn" :aria-label="`Refuser ${p.pseudo}`" @click="retirer(p.id, p.pseudo, 'refuser')"><Icone nom="fermer" :taille="18" /></button>
        </div>
      </section>

      <p v-if="!social.reseau.amis.length" class="invite-aide">Invite tes amis : envoie-leur ton code ou le lien. Dès qu’ils acceptent, le classement de la semaine apparaît ici.</p>
      <section class="card pad code-ami">
        <div class="grow">
          <span class="label">Ton code ami</span>
          <b class="code num">{{ social.profil.code }}</b>
        </div>
        <button type="button" class="icon-btn" aria-label="Copier le code" @click="copier"><Icone nom="copier" :taille="18" /></button>
        <button type="button" class="btn small primary" @click="inviter"><Icone nom="envoyer" :taille="16" /> Inviter</button>
      </section>

      <form class="card pad ajout-ami" @submit.prevent="ajouter">
        <label class="field grow">
          <span>Ajouter avec un code</span>
          <input v-model="codeSaisi" class="input num code-input" placeholder="ABCD-1234" maxlength="9" autocapitalize="characters" autocomplete="off" spellcheck="false" @input="formaterCode">
        </label>
        <button type="submit" class="btn primary" :disabled="!codeValide || ajoutEnCours">Ajouter</button>
      </form>

      <section v-if="social.reseau.amis.length" class="card classement">
        <div class="row between">
          <b class="titre-classement">{{ semaineDerniere ? 'Semaine dernière' : 'Cette semaine' }}</b>
          <button type="button" class="lien small" @click="semaineDerniere = !semaineDerniere">{{ semaineDerniere ? 'Cette semaine' : 'Semaine dernière' }}</button>
        </div>
        <div class="chips">
          <button type="button" class="chip" :class="{ on: critere === 'TOTAL' }" @click="critere = 'TOTAL'">Total</button>
          <button v-for="t in MEDIA_TYPES" :key="t" type="button" class="chip" :class="{ on: critere === t }" @click="critere = t"><i class="pt" :style="{ background: TYPE_LABELS[t].couleur }" />{{ TYPE_LABELS[t].plusieurs }}</button>
        </div>
        <ol class="rangs">
          <li v-for="(r, i) in rangs" :key="r.personne.id" :class="{ moi: r.moi, discret: !r.partage }">
            <span class="pos num">{{ r.partage ? (i < 3 && r.valeur ? MEDAILLES[i] : i + 1) : '–' }}</span>
            <Avatar :pseudo="r.personne.pseudo" :couleur="r.personne.couleur" :taille="34" />
            <span class="grow">
              <b class="ellipsis">{{ r.personne.pseudo }}<small v-if="r.moi"> (toi)</small></b>
              <span class="barre"><i :style="{ width: (r.valeur / maxRang) * 100 + '%', background: critere === 'TOTAL' ? 'var(--brand-grad)' : TYPE_LABELS[critere].couleur }" /></span>
            </span>
            <span class="v num">{{ r.partage ? valeur(r.valeur) : 'privé' }}</span>
          </li>
        </ol>
        <p class="tiny dim">Temps d’écran estimé d’après ce que chacun marque comme vu. Manga : chapitres lus.</p>
      </section>

      <section v-if="social.reseau.amis.length" class="section">
        <div class="section-head"><h2>Mes amis</h2><span class="small muted">{{ social.reseau.amis.length }}</span></div>
        <ul class="card liste">
          <li v-for="a in social.reseau.amis" :key="a.id">
            <router-link :to="`/ami/${a.id}`" class="personne">
              <Avatar :pseudo="a.pseudo" :couleur="a.couleur" :taille="40" />
              <span class="grow">
                <b class="ellipsis">{{ a.pseudo }}</b>
                <small class="muted">{{ a.partage_temps ? `${duree(semaineAmi(a.id)?.valeur ?? 0)} cette semaine` : 'Ne partage pas son temps' }}{{ a.partage_biblio ? ' · bibliothèque partagée' : '' }}</small>
              </span>
              <Icone nom="droite" :taille="18" class="dim" />
            </router-link>
          </li>
        </ul>
      </section>

      <section v-if="social.reseau.envoyees.length" class="section">
        <div class="section-head"><h2>En attente</h2></div>
        <ul class="card liste">
          <li v-for="p in social.reseau.envoyees" :key="p.id" class="personne">
            <Avatar :pseudo="p.pseudo" :couleur="p.couleur" :taille="36" />
            <span class="grow"><b class="ellipsis">{{ p.pseudo }}</b><small class="muted">doit accepter ta demande</small></span>
            <button type="button" class="btn small ghost" @click="retirer(p.id, p.pseudo, 'annuler')">Annuler</button>
          </li>
        </ul>
      </section>

      <p class="tiny dim confidentialite">
        Partagé avec tes amis : {{ social.profil.partage_temps ? 'ton temps d’écran par jour' : 'rien de ton temps d’écran' }}{{ social.profil.partage_biblio ? ', tes titres et tes notes /10' : '' }}. Jamais tes notes personnelles.
        <router-link to="/reglages#compte">Modifier</router-link>
      </p>
    </div>
  </div>
</template>

<route>
{ "meta": { "titre": "Amis" } }
</route>

<style scoped>
.intro { padding: 20px 18px; text-align: center; background: radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--brand) 18%, transparent), transparent 65%), var(--surface); }
.avatars { display: flex; justify-content: center; margin-bottom: 10px; }
.avatars > * + * { margin-left: -10px; box-shadow: 0 0 0 3px var(--surface); }
.intro h2 { margin: 4px 0 12px; font-size: 22px; letter-spacing: -.03em; }
.atouts { list-style: none; margin: 0 auto 14px; padding: 0; display: grid; gap: 8px; text-align: left; max-width: 340px; font-weight: 600; font-size: 14.5px; }
.atouts li { display: flex; gap: 10px; align-items: center; }
.atouts :deep(.ic) { color: var(--brand); }
.intro p { margin: 0; }
.formulaire { margin-top: 14px; }
.formulaire p { margin: 0; }
.mdp { display: flex; gap: 8px; align-items: center; }
.demandes { padding: 12px 14px; margin-bottom: 12px; border-color: color-mix(in srgb, var(--brand) 40%, var(--border)); }
.demandes .label { margin: 0 0 4px; }
.personne { display: flex; align-items: center; gap: 12px; padding: 8px 4px; color: inherit; text-decoration: none; }
.personne b { display: block; font-size: 15px; }
.personne small { display: block; font-size: 12.5px; }
.classement { padding: 14px 16px 12px; }
.titre-classement { font-size: 17px; letter-spacing: -.02em; }
.classement .chips { margin: 8px -16px 4px; }
.rangs { list-style: none; margin: 4px 0 6px; padding: 0; display: grid; gap: 4px; }
.rangs li { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 14px; }
.rangs li.moi { background: var(--brand-soft); }
.rangs li.discret { opacity: .55; }
.pos { width: 24px; text-align: center; font-weight: 850; color: var(--muted); font-size: 15px; }
.rangs b { display: block; font-size: 15px; }
.rangs small { color: var(--muted); font-weight: 600; }
.barre { display: block; height: 5px; margin-top: 5px; border-radius: 3px; background: var(--surface-3); overflow: hidden; }
.barre i { display: block; height: 100%; border-radius: 3px; transition: width .6s var(--ease); }
.v { font-weight: 800; white-space: nowrap; font-size: 15px; }
.code-ami { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.invite-aide { margin: 0 6px 12px; color: var(--muted); font-size: 14.5px; font-weight: 600; }
.connecte { display: flex; flex-direction: column; }
.connecte > .banner, .demandes { order: -3; }
/* Avec des amis, le classement passe avant le code d'invitation. */
.classement { order: -2; margin: 0 0 12px; }
.code { display: block; font-size: 22px; letter-spacing: .04em; margin-top: 2px; white-space: nowrap; }
.ajout-ami { display: flex; align-items: flex-end; gap: 10px; margin-top: 12px; }
.code-input { letter-spacing: .08em; text-transform: uppercase; font-weight: 700; }
.liste { list-style: none; margin: 0; padding: 4px 10px; }
.liste li + li { border-top: 1px solid var(--border); }
.confidentialite { margin: 22px 6px 0; text-align: center; }
.tourne :deep(.ic) { animation: tour 1s linear infinite; }
@keyframes tour { to { transform: rotate(360deg); } }
</style>
