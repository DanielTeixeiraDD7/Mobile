-- Tests de sécurité (base de test locale, pas sur le vrai projet). Échec = arrêt avec message.
\set ON_ERROR_STOP 1
reset role;
truncate public.profils cascade; delete from auth.users;
insert into auth.users values ('aaaaaaaa-0000-4000-a000-000000000001'), ('bbbbbbbb-0000-4000-a000-000000000002'), ('cccccccc-0000-4000-a000-000000000003');
create or replace function pg_temp.en(u text) returns void language sql as $$ select set_config('request.jwt.claim.sub', u, false) $$;
\set A '\'aaaaaaaa-0000-4000-a000-000000000001\''
\set B '\'bbbbbbbb-0000-4000-a000-000000000002\''
\set C '\'cccccccc-0000-4000-a000-000000000003\''

set role authenticated;
select pg_temp.en(:A); select code as code_a from public.creer_profil('Dani') \gset
select pg_temp.en(:A); do $$ begin assert (select count(*) from public.creer_profil('Dani2')) = 1; assert (select pseudo from profils) = 'Dani', 'double création = même profil'; end $$;
select pg_temp.en(:B); select code as code_b from public.creer_profil('Flavien') \gset
select pg_temp.en(:C); select code as code_c from public.creer_profil('Inconnu') \gset

-- Chacun ne voit que son profil tant qu'il n'y a pas de relation
select pg_temp.en(:A); do $$ begin assert (select count(*) from profils) = 1, 'A ne voit que lui'; end $$;

-- Interdit : créer un profil / s'ajouter un ami / changer son code à la main
select pg_temp.en(:A);
do $$ begin
  begin insert into profils (id, pseudo, code) values ('cccccccc-0000-4000-a000-000000000003', 'Pirate', 'AAAA-BBBB'); raise exception 'ÉCHEC insert profil'; exception when insufficient_privilege then null; end;
  begin update profils set code = 'ZZZZ-ZZZZ'; raise exception 'ÉCHEC changement de code'; exception when insufficient_privilege then null; end;
  begin insert into amities values ('aaaaaaaa-0000-4000-a000-000000000001', 'bbbbbbbb-0000-4000-a000-000000000002', 'acceptee'); raise exception 'ÉCHEC amitié forcée'; exception when insufficient_privilege then null; end;
end $$;

-- A demande B ; B voit la demande et le pseudo de A ; C ne voit rien
select pg_temp.en(:A); select public.demander_ami(:'code_b');
do $$ begin begin perform demander_ami('ZZZZ-9999'); raise exception 'ÉCHEC code inconnu'; exception when others then if sqlerrm not like 'Aucun compte%' then raise; end if; end; end $$;
select pg_temp.en(:B); do $$ begin assert (select count(*) from amities) = 1; assert (select count(*) from profils) = 2, 'B voit A (demande)'; end $$;
select pg_temp.en(:C); do $$ begin assert (select count(*) from amities) = 0; assert (select count(*) from profils) = 1; end $$;

-- A ne peut pas accepter sa propre demande ; B peut
select pg_temp.en(:A); update amities set statut = 'acceptee';
reset role; do $$ begin assert (select statut from amities) = 'attente', 'A a accepté sa propre demande'; end $$; set role authenticated;
select pg_temp.en(:B); update amities set statut = 'acceptee';
reset role; do $$ begin assert (select statut from amities) = 'acceptee'; end $$; set role authenticated;

-- Stats : A écrit les siennes, B les voit ; C non ; A ne peut pas écrire pour B
select pg_temp.en(:A);
insert into stats_jour (utilisateur, jour, categorie, minutes, unites) values (:A, current_date, 'TV', 120, 3);
do $$ begin begin insert into stats_jour (utilisateur, jour, categorie, minutes) values ('bbbbbbbb-0000-4000-a000-000000000002', current_date, 'TV', 999); raise exception 'ÉCHEC écriture pour un autre'; exception when insufficient_privilege then null; end; end $$;
select pg_temp.en(:B); do $$ begin assert (select sum(minutes) from stats_jour) = 120, 'B voit les stats de A'; end $$;
select pg_temp.en(:C); do $$ begin assert (select count(*) from stats_jour) = 0, 'C ne voit rien'; end $$;
select pg_temp.en(:B); update stats_jour set minutes = 0; delete from stats_jour;
reset role; do $$ begin assert (select minutes from stats_jour) = 120, 'B a modifié les stats de A'; end $$; set role authenticated;

-- Partage du temps coupé par A → B ne voit plus
select pg_temp.en(:A); update profils set partage_temps = false;
select pg_temp.en(:B); do $$ begin assert (select count(*) from stats_jour) = 0, 'partage coupé'; end $$;
select pg_temp.en(:A); update profils set partage_temps = true;

-- Titres : invisibles tant que partage_biblio = false
select pg_temp.en(:A); insert into titres (utilisateur, id, categorie, titre, statut) values (:A, 'tmdb:TV:136315', 'TV', 'The Bear', 'CURRENT');
select pg_temp.en(:B); do $$ begin assert (select count(*) from titres) = 0, 'biblio non partagée'; end $$;
select pg_temp.en(:A); update profils set partage_biblio = true;
select pg_temp.en(:B); do $$ begin assert (select count(*) from titres) = 1, 'biblio partagée'; end $$;
select pg_temp.en(:C); do $$ begin assert (select count(*) from titres) = 0; end $$;
select pg_temp.en(:A); do $$ begin begin insert into titres (utilisateur, id, categorie, titre, statut, affiche) values ('aaaaaaaa-0000-4000-a000-000000000001', 'tmdb:TV:1', 'TV', 'x', 'CURRENT', 'javascript:alert(1)'); raise exception 'ÉCHEC affiche non filtrée'; exception when check_violation then null; end; end $$;

-- Demande croisée : C demande A, puis A entre le code de C → acceptée directement
select pg_temp.en(:C); select public.demander_ami(:'code_a');
select pg_temp.en(:A); do $$ declare r json; begin r := demander_ami((select code from profils where pseudo = 'Inconnu')); assert r->>'statut' = 'acceptee', 'croisée'; end $$;

-- Retrait d'ami : B retire A → B ne voit plus les stats de A
select pg_temp.en(:B); delete from amities;
do $$ begin assert (select count(*) from stats_jour) = 0, 'ami retiré'; assert (select count(*) from profils) = 1; end $$;

-- Visiteur non connecté : rien
reset role; set role anon; select pg_temp.en('');
do $$ begin begin perform count(*) from profils; raise exception 'ÉCHEC anon lit profils'; exception when insufficient_privilege then null; end; end $$;

-- Suppression du compte de A : tout disparaît en cascade
reset role; set role authenticated; select pg_temp.en(:A); select public.supprimer_mon_compte();
reset role; do $$ begin
  assert not exists (select 1 from profils where pseudo = 'Dani');
  assert (select count(*) from stats_jour) = 0 and (select count(*) from titres) = 0 and (select count(*) from amities) = 0, 'cascade';
end $$;
select 'TOUS LES TESTS RLS PASSENT' as resultat;
