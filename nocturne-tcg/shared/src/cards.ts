import type { AbilityKey, CardDef, Faction, Form, Rarity, Variant } from './types';

export const SET1 = { code: 'NE1', name: 'Nuit Éternelle', releasedAt: '2026-10-01T00:00:00Z' };

interface Opts { variant?: Variant; form?: Form; pair?: string; craftable?: boolean; base?: number }

type Row = [name: string, rarity: Rarity, faction: Faction, hp: number, atk: number, key: AbilityKey, value: number, abilityName: string, silhouette: string, lore: string, opts?: Opts];

const C = 'COMMON', U = 'UNCOMMON', R = 'RARE', E = 'EPIC', L = 'LEGENDARY', S = 'SECRET';

const rows: Row[] = [
  ['Chauve-souris Sanguine', C, 'SANG', 40, 14, 'DRAIN', 4, 'Morsure vive', 'bat', "Elles tournoient par milliers au-dessus des clochers. Une seule suffit à annoncer qu'un maître s'éveille."],
  ['Goule des Cryptes', C, 'SANG', 55, 12, 'REGEN', 5, 'Festin funèbre', 'skull', 'Elle gratte les dalles des caveaux depuis des siècles, sans jamais se rassasier.'],
  ['Rat des Catacombes', C, 'SANG', 35, 16, 'POISON', 4, 'Peste noire', 'rat', "Sous Paris, les rats portent un collier de sang séché : la marque de ceux qui ont goûté au vampire."],
  ['Fiancée Pâle', U, 'SANG', 65, 22, 'STUN', 25, 'Valse hypnotique', 'vampiress', "Trois sœurs dansent dans le château désert. Quiconque accepte la valse oublie le chemin du retour."],
  ['Renfield, l’Affamé', U, 'SANG', 60, 20, 'RALLY', 6, 'Dévotion', 'gentleman', "Il mange des mouches, puis des araignées, puis des oiseaux. Il attend le maître qui lui promettra davantage."],
  ['Varney l’Errant', U, 'SANG', 70, 21, 'DRAIN', 6, 'Soif lasse', 'vampire', "Il a voulu mourir cent fois. La lune l'a toujours relevé, plus las et plus affamé."],
  ['Lord Ruthven', U, 'SANG', 68, 24, 'CURSE', 5, 'Serment de silence', 'vampire', "Un aristocrate charmant, un serment juré à un ami mourant… et une nuit de noces qui finit dans le sang."],
  ['Carmilla Karnstein', R, 'SANG', 85, 28, 'DRAIN', 8, 'Baiser de Styrie', 'vampiress', "Une invitée languide, un portrait vieux de deux siècles et un nom dont les lettres se mélangent."],
  ['Comte Dracula', R, 'SANG', 90, 30, 'STUN', 30, 'Regard du Comte', 'vampire', "Hôte courtois des Carpates, il parle six langues et ne projette aucune ombre.", { form: 'HUMAN', pair: 'DRAC' }],
  ['Comtesse Báthory', R, 'SANG', 92, 29, 'REGEN', 9, 'Bain écarlate', 'vampiress', "Elle a cru que le sang des autres effacerait les années. Les miroirs du château ont fini par se briser."],
  ['Carmilla, Rose de Sang', E, 'SANG', 110, 38, 'DRAIN', 14, 'Étreinte éternelle', 'vampiress', 'Les pétales tombent en spirale autour d’elle : chacun est une goutte de vie volée.', { variant: 'FULL_ART', craftable: false, base: 8 }],
  ['Dracula, Bête de la Nuit', L, 'SANG', 160, 50, 'DRAIN', 18, 'Nuée pourpre', 'batlord', "Quand le comte jette son masque d'homme, la nuit tout entière bat des ailes.", { form: 'MONSTER', pair: 'DRAC' }],

  ['Loup des Brumes', C, 'CROC', 50, 16, 'FURY', 6, 'Hurlement', 'wolf', 'On ne le voit jamais arriver. On entend seulement le brouillard grogner.'],
  ['Chien Noir des Landes', C, 'CROC', 48, 15, 'CURSE', 3, 'Présage', 'hound', 'Croiser ses yeux de braise sur la lande annonce un deuil dans l’année.'],
  ['Armand, Forestier Maudit', U, 'CROC', 70, 20, 'SHIELD', 5, 'Lame d’argent', 'gentleman', "Garde-chasse taciturne, il s'enchaîne lui-même chaque soir de pleine lune.", { form: 'HUMAN', pair: 'ARM' }],
  ['Wendigo', R, 'CROC', 95, 30, 'FURY', 12, 'Faim glacée', 'antler', "Né d'un hiver où l'on mangea ce qu'il ne fallait pas. Plus il dévore, plus il maigrit."],
  ['Bête du Gévaudan', E, 'CROC', 120, 40, 'FURY', 15, 'Terreur du Gévaudan', 'wolf', "1764. Des dizaines de victimes, des battues royales… et une bête que personne n'a jamais vraiment tuée."],
  ['Armand, Loup-garou', E, 'CROC', 125, 42, 'REGEN', 12, 'Chair lunaire', 'wolf', "Les chaînes ont cédé. Ce qui reste d'Armand ne reconnaît plus que l'odeur de la peur.", { form: 'MONSTER', pair: 'ARM' }],
  ['Fenrir, Dévoreur de Lune', L, 'CROC', 170, 48, 'SPLASH', 14, 'Ragnarök', 'wolf', 'Le lien magique se fissure. Au dernier jour, ses mâchoires engloutiront la lune elle-même.'],

  ['Cultiste de l’Abîme', C, 'ABIME', 45, 14, 'RALLY', 5, 'Psalmodie', 'hooded', 'Ses prières ne s’adressent à aucun dieu du ciel, mais à quelque chose qui rêve sous la mer.'],
  ['Habitant des Profondeurs', C, 'ABIME', 58, 13, 'SHIELD', 4, 'Écailles', 'fishman', 'Un village côtier où personne ne vieillit vraiment… et où chacun finit par rejoindre la mer.'],
  ['Sirène Noyée', U, 'ABIME', 62, 22, 'STUN', 25, 'Chant des récifs', 'siren', 'Elle chante pour les marins comme on chante une berceuse. Les récifs font le reste.'],
  ['Dagon', R, 'ABIME', 100, 28, 'SHIELD', 8, 'Monolithe', 'tentacle', "Un dieu-poisson colossal, aperçu une seule fois, enlaçant un monolithe au fond d'une fosse oubliée."],
  ['Nyarlathotep, le Pharaon Noir', R, 'ABIME', 88, 31, 'CURSE', 7, 'Mille masques', 'pharaoh', "Il vient d'Égypte, dit-on, montrer aux foules des merveilles électriques. Ensuite, les villes se taisent."],
  ['Kraken', E, 'ABIME', 130, 38, 'SPLASH', 10, 'Étau des abysses', 'tentacle', 'Les cartographes dessinaient des monstres aux bords du monde. Ils avaient oublié de dessiner celui-là.'],
  ['Cthulhu, Rêveur de R’lyeh', L, 'ABIME', 175, 46, 'STUN', 35, 'Rêve fou', 'cthulhu', "Dans sa cité engloutie, il rêve. Et ceux qui partagent ses rêves ne se réveillent jamais tout à fait."],

  ['Feu Follet', C, 'SPECTRE', 35, 15, 'POISON', 5, 'Égarement', 'wisp', "Une lueur bleue au-dessus du marais. Suis-la, et le marais te gardera."],
  ['Âme Errante', C, 'SPECTRE', 45, 13, 'LAST_WORDS', 10, 'Soupir', 'ghost', 'Elle cherche une porte qui n’existe plus, dans une maison démolie depuis un siècle.'],
  ['Poltergeist', C, 'SPECTRE', 40, 15, 'STUN', 20, 'Vaisselle volante', 'sheet', "Les assiettes tremblent, les portes claquent. Il n'est pas méchant, seulement très, très en colère."],
  ['Corbeau Funèbre', C, 'SPECTRE', 38, 16, 'CURSE', 3, 'Plus jamais', 'raven', "Perché sur le buste de marbre, il ne connaît qu'un mot. C'est le seul qui compte."],
  ['Yūrei du Puits', U, 'SPECTRE', 60, 21, 'POISON', 7, 'Assiettes comptées', 'ghost', 'Chaque nuit, elle compte neuf assiettes dans le puits. Il en manque toujours une.'],
  ['La Llorona', U, 'SPECTRE', 64, 22, 'CURSE', 5, 'Lamentation', 'ghost', 'Ses pleurs remontent le fleuve. Les enfants rentrent avant la nuit pour ne pas les entendre.'],
  ['Banshee', R, 'SPECTRE', 82, 30, 'SPLASH', 7, 'Cri funèbre', 'banshee', 'Son cri ne tue pas. Il annonce seulement, avec une précision terrible, qui va mourir.'],
  ['Le Fantôme de l’Opéra', R, 'SPECTRE', 86, 29, 'STUN', 30, 'Lustre fatal', 'mask', "Loge n°5, toujours réservée. Sous le palais Garnier, un génie défiguré compose son dernier opéra."],
  ['Le Cavalier sans Tête', R, 'SPECTRE', 95, 31, 'FURY', 10, 'Charge de Sleepy Hollow', 'rider', 'Il galope chaque nuit vers le pont de l’église, à la recherche de ce qu’un boulet de canon lui a pris.'],
  ['La Dame Blanche', E, 'SPECTRE', 115, 37, 'LAST_WORDS', 30, 'Auto-stop d’outre-tombe', 'ghost', "Elle attend au bord des routes de France. Prends-la en voiture, et elle disparaîtra au virage où elle est morte."],
  ['L’Ankou', L, 'SPECTRE', 165, 47, 'LAST_WORDS', 40, 'Charrette grinçante', 'reaper', "Le dernier mort de l'année conduit la charrette de Bretagne. Quand tu entends l'essieu grincer, il est trop tard."],

  ['Homoncule', C, 'ALCHIMIE', 38, 14, 'RALLY', 4, 'Servitude', 'imp', 'Né dans un flacon chauffé quarante jours. Il sait tout et ne comprend rien.'],
  ['Gargouille', C, 'ALCHIMIE', 60, 12, 'SHIELD', 5, 'Peau de pierre', 'gargoyle', 'Elle crache l’eau de pluie le jour et chasse les pigeons la nuit. Surtout les pigeons.'],
  ['Mandragore Hurlante', C, 'ALCHIMIE', 42, 15, 'STUN', 20, 'Cri des racines', 'mandrake', "Arrachée à la terre sous un gibet, elle hurle si fort que l'on en tombe raide."],
  ['Dr Henry Jekyll', U, 'ALCHIMIE', 65, 18, 'REGEN', 6, 'Sérum blanc', 'gentleman', 'Médecin respecté de Londres. Son laboratoire sent le sel et le remords.', { form: 'HUMAN', pair: 'JH' }],
  ['La Compagne Inachevée', U, 'ALCHIMIE', 72, 20, 'LAST_WORDS', 15, 'Œuvre détruite', 'stitched', "Son créateur l'a détruite avant son premier souffle. Elle s'est relevée quand même."],
  ['L’Homme Invisible', U, 'ALCHIMIE', 58, 24, 'SHIELD', 6, 'Insaisissable', 'bandage', "Un brillant chimiste qui a rendu sa chair transparente. Il n'a jamais trouvé l'antidote."],
  ['Golem de Prague', R, 'ALCHIMIE', 110, 26, 'SHIELD', 10, 'Emet', 'golem', "Façonné dans l'argile de la Vltava pour protéger le ghetto. Efface une lettre, et il retourne à la poussière."],
  ['Dorian Gray', R, 'ALCHIMIE', 85, 28, 'REGEN', 10, 'Jeunesse volée', 'gentleman', 'Il a gardé son visage d’ange. Dans le grenier, un tableau vieillit pour lui.', { form: 'HUMAN', pair: 'DG' }],
  ['Mr Edward Hyde', E, 'ALCHIMIE', 115, 42, 'FURY', 14, 'Rage nocturne', 'brute', "Plus petit, plus jeune, plus cruel. Chaque nuit, il revient plus facilement.", { form: 'MONSTER', pair: 'JH' }],
  ['La Créature de Frankenstein', E, 'ALCHIMIE', 135, 36, 'REGEN', 12, 'Étincelle de vie', 'stitched', "Il a lu Plutarque et Milton. Il voulait seulement qu'on ne le fuie pas."],
  ['Le Portrait de Dorian', E, 'ALCHIMIE', 120, 40, 'CURSE', 9, 'Toile corrompue', 'frame', "Chaque péché a laissé une trace sur la toile. Le tableau, lui, ne pardonne rien.", { form: 'MONSTER', pair: 'DG' }],

  ['Harpie', C, 'MYTHE', 42, 16, 'POISON', 4, 'Serres souillées', 'harpy', 'Elle vole les repas des rois et ne laisse derrière elle que l’odeur de la pourriture.'],
  ['Lamia', U, 'MYTHE', 66, 22, 'DRAIN', 6, 'Étreinte du serpent', 'serpent', "Reine déchue de Libye, mi-femme mi-serpent, elle envie chaque berceau qu'elle croise."],
  ['Krampus', U, 'MYTHE', 70, 23, 'FURY', 8, 'Fouet de bouleau', 'horned', 'Le 5 décembre, il fait sonner ses chaînes dans les Alpes. Les enfants sages dorment. Les autres, non.'],
  ['Minotaure', R, 'MYTHE', 105, 30, 'FURY', 10, 'Labyrinthe', 'horned', 'Enfermé au cœur du labyrinthe de Crète, il compte les jeunes gens envoyés chaque année par Athènes.'],
  ['Baba Yaga', R, 'MYTHE', 90, 28, 'CURSE', 7, 'Isba sur pattes', 'witch', 'Sa maison tourne sur des pattes de poule. Pose la bonne question, ou finis dans le four.'],
  ['Cerbère', E, 'MYTHE', 130, 39, 'SPLASH', 9, 'Triple morsure', 'hound', 'Trois têtes, une seule consigne : nul ne sort des Enfers. Seule la musique l’endort.'],
  ['Méduse', L, 'MYTHE', 160, 45, 'STUN', 40, 'Regard de pierre', 'serpent', "Une prêtresse punie pour un crime qui n'était pas le sien. Son regard a figé une armée entière."],

  ['Jackalope', C, 'CRYPTIDE', 36, 15, 'FURY', 5, 'Coup de bois', 'jackalope', "Un lièvre à bois de cerf qui imite la voix des cow-boys. Personne ne l'a jamais attrapé vivant."],
  ['Homme-Lézard des Marais', C, 'CRYPTIDE', 55, 14, 'REGEN', 5, 'Mue', 'lizard', 'Il a griffé une voiture en 1988 et n’a plus jamais été revu. Officiellement.'],
  ['Chupacabra', C, 'CRYPTIDE', 44, 17, 'DRAIN', 4, 'Saignée', 'lizard', 'Les chèvres retrouvées vidées de leur sang, deux petits trous au cou. Rien d’autre.'],
  ['Diable du Jersey', U, 'CRYPTIDE', 62, 23, 'SPLASH', 4, 'Cri des Pine Barrens', 'winged', "Treizième enfant d'une mère épuisée, il s'est envolé par la cheminée le soir de sa naissance."],
  ['Monstre du Loch', U, 'CRYPTIDE', 80, 19, 'SHIELD', 6, 'Plongée', 'nessie', 'Une bosse, une photo floue, un siècle de rumeurs. Il s’amuse beaucoup.'],
  ['Bigfoot', R, 'CRYPTIDE', 110, 29, 'SHIELD', 9, 'Empreinte géante', 'ape', 'Deux mètres cinquante de fourrure et une timidité légendaire. Toutes ses photos sont floues.'],
  ['Mothman', E, 'CRYPTIDE', 112, 40, 'STUN', 35, 'Yeux rouges', 'moth', "Vu au-dessus d'un pont de Virginie-Occidentale juste avant la catastrophe. Il prévient, il ne cause pas."],

  ['Dracula, Nuit Sans Fin', S, 'SANG', 180, 52, 'DRAIN', 22, 'Règne écarlate', 'batlord', "La version que l'on raconte à voix basse : un comte qui n'a jamais dormi, et une nuit qui n'a jamais fini.", { variant: 'ALTERNATE', craftable: false, base: 12 }],
  ['Cthulhu, l’Éveil', S, 'ABIME', 190, 50, 'SPLASH', 16, 'Quand les étoiles s’alignent', 'cthulhu', "Les étoiles sont alignées. R'lyeh remonte. Le rêveur ouvre enfin les yeux.", { variant: 'ALTERNATE', craftable: false, base: 26 }],
];

/** Autres versions d'une carte classique : mêmes stats, illustration et rareté différentes. */
const VERSIONS: [base: number, variant: Variant, rarity: Rarity, lore: string][] = [
  [9, 'FULL_ART', E, 'Le comte tend la main. Accepter l’invitation, c’est déjà lui appartenir.'],
  [16, 'FULL_ART', E, 'Dans la tempête de neige, seuls ses bois dépassent des sapins. Puis plus rien.'],
  [33, 'FULL_ART', E, 'Sur la lande irlandaise, son cri traverse les murs et les années.'],
  [34, 'FULL_ART', E, 'Le rideau se lève sur sa dernière représentation. Le public ne repartira pas.'],
  [53, 'FULL_ART', E, 'L’isba s’est arrêtée de marcher. La vieille t’attendait.'],
  [61, 'FULL_ART', E, 'Une silhouette immense entre les séquoias, qui te regarde plus longtemps que tu ne la regardes.'],
  [36, 'FULL_ART', L, 'Les phares éclairent une robe blanche au bord de la route. Elle lève le pouce.'],
  [62, 'FULL_ART', L, 'Les ailes déployées au-dessus du pont, il fixe la ville de ses yeux rouges.'],
  [37, 'ALTERNATE', S, 'Couronné de faux et de lanternes, le serviteur de la Mort parcourt toute la Bretagne en une nuit.'],
  [55, 'ALTERNATE', S, 'Le temple d’or s’effondre autour d’elle. Ceux qui l’ont punie sont devenus statues.'],
];
for (const [base, variant, rarity, lore] of VERSIONS) {
  const b = rows[base - 1]!;
  rows.push([b[0], rarity, b[2], b[3], b[4], b[5], b[6], b[7], b[8], lore, { ...b[10], variant, craftable: false, base }]);
}


/** Illustrations disponibles : code de carte → fichier dans `client/public/cards/`. */
export const ILLUSTRATIONS: Record<string, string> = { 'NE1-001': 'NE1-001.webp', 'NE1-002': 'NE1-002.webp', 'NE1-009': 'NE1-009.webp', 'NE1-065': 'NE1-009.webp' };

export function abilityText(key: AbilityKey, v: number): string {
  switch (key) {
    case 'DRAIN': return `Récupère ${v} PV à chaque attaque.`;
    case 'FURY': return `+${v} ATQ quand ses PV sont sous la moitié.`;
    case 'SHIELD': return `Subit ${v} dégâts de moins par attaque.`;
    case 'POISON': return `Empoisonne la cible : ${v} dégâts au début de chacun de ses tours.`;
    case 'STUN': return `${v} % de chances de paralyser la cible pour son prochain tour.`;
    case 'REGEN': return `Récupère ${v} PV au début de chacun de ses tours.`;
    case 'SPLASH': return `Inflige aussi ${v} dégâts à chaque carte du banc adverse.`;
    case 'LAST_WORDS': return `Quand elle est vaincue, inflige ${v} dégâts à la carte active adverse.`;
    case 'CURSE': return `Chaque attaque réduit l'ATQ de la cible de ${v} (min. 5).`;
    case 'RALLY': return `En entrant sur le banc, donne +${v} ATQ à la carte active alliée.`;
  }
}

const codeOf = (n: number) => `${SET1.code}-${String(n).padStart(3, '0')}`;

export const SET1_CARDS: CardDef[] = rows.map(([name, rarity, faction, hp, attack, abilityKey, abilityValue, abilityName, silhouette, lore, o = {}], i) => ({
  code: codeOf(i + 1),
  number: i + 1,
  name, rarity, faction, hp, attack, abilityKey, abilityValue, abilityName, silhouette, lore,
  variant: o.variant ?? 'NORMAL',
  form: o.form ?? null,
  pairCode: o.pair ?? null,
  baseCode: o.base ? codeOf(o.base) : null,
  craftable: o.craftable ?? true,
  imageUrl: ILLUSTRATIONS[codeOf(i + 1)] ? `cards/${ILLUSTRATIONS[codeOf(i + 1)]}` : null,
}));
