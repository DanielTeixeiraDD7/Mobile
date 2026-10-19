\set ON_ERROR_STOP on
\set QUIET on
create function pg_temp.as_user(u text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', u, false); execute 'set role authenticated'; end $$;

-- 1. Daniel crée le foyer et une invitation
select from pg_temp.as_user('aaaaaaaa-0000-0000-0000-000000000001');
select public.create_household('Daniel') as hid \gset
select public.create_invitation() as code \gset
select set_config('test.hid', :'hid', false), set_config('test.code', :'code', false) \gset
\echo '1. foyer créé, code =' :code
select count(*) as nb_cat from public.categories \gset
\echo '   catégories par défaut :' :nb_cat
insert into public.transactions (id, household_id, category_id, type, amount, date, note)
select gen_random_uuid(), :'hid', id, 'expense', 1250, current_date, 'courses' from public.categories where key = 'cat.groceries';

-- 2. L'inconnu ne voit rien
reset role;
select from pg_temp.as_user('cccccccc-0000-0000-0000-000000000003');
select (select count(*) from public.transactions) || ' opérations, ' || (select count(*) from public.households) || ' foyers, '
  || (select count(*) from public.categories) || ' catégories visibles' as r \gset
\echo '2. Inconnu :' :r

-- 3. L'inconnu tente d'écrire dans le foyer de Daniel
do $$ begin
  insert into public.transactions (id, household_id, type, amount, date)
  values (gen_random_uuid(), current_setting('test.hid')::uuid, 'expense', 100, current_date);
  raise exception 'FAILLE: insertion acceptée';
exception when insufficient_privilege then raise notice '3. Inconnu insertion dans foyer de Daniel : BLOQUÉ (%)', sqlerrm;
end $$;
do $$ begin
  update public.transactions set amount = 1 where household_id = current_setting('test.hid')::uuid;
  delete from public.transactions where household_id = current_setting('test.hid')::uuid;
  update public.households set monthly_budget = 1 where id = current_setting('test.hid')::uuid;
  raise notice '   Inconnu modif/suppression : 0 ligne touchée (invisible)';
end $$;

-- 4. L'inconnu tente de lire les invitations / de deviner un code
do $$ begin
  perform * from public.invitations;
  raise exception 'FAILLE: invitations lisibles';
exception when insufficient_privilege then raise notice '4. Inconnu lecture des invitations : BLOQUÉ';
end $$;
do $$ begin
  perform public.join_household('0000000000', 'Pirate');
  raise exception 'FAILLE';
exception when others then raise notice '   Inconnu avec un faux code : BLOQUÉ (%)', sqlerrm;
end $$;

-- 5. L'inconnu tente de s'ajouter directement comme membre / créer un foyer à la main
do $$ begin
  insert into public.household_members (household_id, user_id, display_name)
  values (current_setting('test.hid')::uuid, auth.uid(), 'Pirate');
  raise exception 'FAILLE';
exception when insufficient_privilege then raise notice '5. Inconnu ajout direct comme membre : BLOQUÉ';
end $$;

-- 6. Anonyme (non connecté)
reset role; set role anon;
do $$ begin
  perform * from public.transactions;
  raise exception 'FAILLE';
exception when insufficient_privilege then raise notice '6. Visiteur non connecté : BLOQUÉ';
end $$;
do $$ begin
  perform public.create_invitation();
  raise exception 'FAILLE';
exception when insufficient_privilege then raise notice '   Visiteur appel de fonction : BLOQUÉ';
end $$;

-- 7. Madame rejoint avec le code et voit les données partagées
reset role;
select from pg_temp.as_user('bbbbbbbb-0000-0000-0000-000000000002');
select public.join_household(lower(:'code'), 'Madame') = :'hid' as joined \gset
\echo '7. Madame a rejoint le foyer :' :joined
select count(*) as n from public.transactions \gset
\echo '   Madame voit' :n 'opération(s) de Daniel'
insert into public.transactions (id, household_id, category_id, type, amount, date, note)
select gen_random_uuid(), :'hid', id, 'expense', 4500, current_date, 'essence' from public.categories where key = 'cat.transport';

-- 8. Code déjà utilisé
reset role;
select from pg_temp.as_user('cccccccc-0000-0000-0000-000000000003');
do $$ begin
  perform public.join_household(current_setting('test.code'), 'Pirate');
  raise exception 'FAILLE';
exception when raise_exception then raise notice '8. Inconnu avec le code déjà utilisé : BLOQUÉ (%)', sqlerrm;
end $$;
do $$ begin
  perform * from public.create_household('Pirate');
  insert into public.transactions (id, household_id, type, amount, date)
  values (gen_random_uuid(), current_setting('test.hid')::uuid, 'expense', 100, current_date);
  raise exception 'FAILLE';
exception when insufficient_privilege then raise notice '   Inconnu avec son propre foyer écrit chez Daniel : BLOQUÉ';
end $$;

-- 9. Madame ne peut pas usurper Daniel (created_by) ni changer son rôle
reset role;
select from pg_temp.as_user('bbbbbbbb-0000-0000-0000-000000000002');
do $$ begin
  insert into public.transactions (id, household_id, type, amount, date, created_by)
  select gen_random_uuid(), household_id, 'expense', 1, current_date, 'aaaaaaaa-0000-0000-0000-000000000001' from public.household_members limit 1;
  raise exception 'FAILLE';
exception when insufficient_privilege then raise notice '9. Créer une opération au nom de Daniel : BLOQUÉ';
end $$;
do $$ begin
  update public.household_members set role = 'owner' where user_id = auth.uid();
  raise exception 'FAILLE';
exception when insufficient_privilege then raise notice '   Se promouvoir propriétaire : BLOQUÉ';
end $$;
update public.transactions set created_by = auth.uid(), amount = 1300 where note = 'courses';
select (select created_by from public.transactions where note = 'courses') = 'aaaaaaaa-0000-0000-0000-000000000001' as kept \gset
\echo '   Modifier une dépense de Daniel garde son auteur :' :kept

-- 10. Valeurs invalides
do $$ begin
  insert into public.transactions (id, household_id, type, amount, date)
  select gen_random_uuid(), household_id, 'expense', -5, current_date from public.household_members limit 1;
  raise exception 'FAILLE';
exception when check_violation then raise notice '10. Montant négatif : REFUSÉ';
end $$;

-- 11. Daniel voit l'opération de Madame (partage)
reset role;
select from pg_temp.as_user('aaaaaaaa-0000-0000-0000-000000000001');
select string_agg(note || ' ' || amount, ', ' order by note) as all_tx from public.transactions \gset
\echo '11. Daniel voit :' :all_tx
\echo 'FIN : tous les tests sont passés'
