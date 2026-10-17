\set ON_ERROR_STOP on
\set QUIET on
-- À lancer après 10-rls-test.sql et ../002_partage_50_50.sql
create function pg_temp.as_user(u text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', u, false); execute 'set role authenticated'; end $$;

select household_id as hid from public.household_members where user_id = 'aaaaaaaa-0000-0000-0000-000000000001' \gset
select set_config('test.hid', :'hid', false) \gset

-- 1. Valeurs par défaut : payé par la personne qui saisit, dépense commune
select from pg_temp.as_user('bbbbbbbb-0000-0000-0000-000000000002');
insert into public.transactions (id, household_id, type, amount, date, note)
values (gen_random_uuid(), :'hid', 'expense', 6000, current_date, 'resto');
select (paid_by = 'bbbbbbbb-0000-0000-0000-000000000002' and shared) as ok from public.transactions where note = 'resto' \gset
\echo '1. Par défaut payé par Madame et commun :' :ok

-- 2. Madame saisit une dépense payée par Daniel (membre) : accepté
insert into public.transactions (id, household_id, type, amount, date, note, paid_by, shared)
values (gen_random_uuid(), :'hid', 'expense', 2500, current_date, 'ticket Daniel', 'aaaaaaaa-0000-0000-0000-000000000001', false);
\echo '2. Payé par un autre membre : accepté'

-- 3. Payé par quelqu'un hors du foyer : refusé
do $$ begin
  insert into public.transactions (id, household_id, type, amount, date, paid_by)
  values (gen_random_uuid(), current_setting('test.hid')::uuid, 'expense', 100, current_date, 'cccccccc-0000-0000-0000-000000000003');
  raise exception 'FAILLE';
exception when raise_exception then
  if sqlerrm = 'FAILLE' then raise; end if;
  raise notice '3. Payé par un inconnu : REFUSÉ (%)', sqlerrm;
end $$;

-- 4. Remboursement Madame → Daniel
insert into public.settlements (id, household_id, month, from_user, to_user, amount)
values (gen_random_uuid(), :'hid', to_char(current_date, 'YYYY-MM'),
        'bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 20000);
\echo '4. Remboursement enregistré'
do $$ begin
  insert into public.settlements (id, household_id, month, from_user, to_user, amount)
  values (gen_random_uuid(), current_setting('test.hid')::uuid, '2026-10',
          'bbbbbbbb-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000003', 100);
  raise exception 'FAILLE';
exception when raise_exception then
  if sqlerrm = 'FAILLE' then raise; end if;
  raise notice '   Remboursement vers un inconnu : REFUSÉ';
end $$;
do $$ begin
  perform public.is_household_user(current_setting('test.hid')::uuid, auth.uid());
  raise exception 'FAILLE';
exception when insufficient_privilege then raise notice '   Appel direct de la fonction de contrôle : BLOQUÉ';
end $$;

-- 5. L'inconnu ne voit pas les remboursements et ne peut pas en créer chez Daniel
reset role;
select from pg_temp.as_user('cccccccc-0000-0000-0000-000000000003');
select count(*) as n from public.settlements \gset
\echo '5. Inconnu voit' :n 'remboursement(s)'
do $$ begin
  insert into public.settlements (id, household_id, month, from_user, to_user, amount)
  values (gen_random_uuid(), current_setting('test.hid')::uuid, '2026-10',
          'bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 100);
  raise exception 'FAILLE';
exception when insufficient_privilege then raise notice '   Inconnu crée un remboursement chez Daniel : BLOQUÉ';
end $$;

-- 6. Daniel voit le remboursement
reset role;
select from pg_temp.as_user('aaaaaaaa-0000-0000-0000-000000000001');
select count(*) as n from public.settlements \gset
\echo '6. Daniel voit' :n 'remboursement(s)'
\echo 'FIN : tests du partage 50/50 passés'
