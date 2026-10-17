do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema public, auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
-- comme Supabase : droits par défaut larges, la sécurité vient de la RLS
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
insert into auth.users values
 ('aaaaaaaa-0000-0000-0000-000000000001'), -- Daniel
 ('bbbbbbbb-0000-0000-0000-000000000002'), -- Madame
 ('cccccccc-0000-0000-0000-000000000003'); -- Inconnu
