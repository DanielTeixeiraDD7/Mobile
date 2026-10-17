-- =====================================================================
-- Mise à jour 002 : partage 50/50 (payé par, commun/perso, remboursements)
-- À exécuter UNE fois si schema.sql a déjà été exécuté avant cette version.
-- =====================================================================

-- Qui a payé (par défaut : la personne qui saisit) et si la dépense est commune.
alter table public.transactions add column paid_by uuid references auth.users (id);
update public.transactions set paid_by = created_by;
alter table public.transactions
  alter column paid_by set not null,
  alter column paid_by set default auth.uid(),
  add column shared boolean not null default true;

-- Remboursements entre membres pour équilibrer un mois.
create table public.settlements (
  id           uuid primary key,
  household_id uuid not null references public.households (id) on delete cascade,
  month        text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  from_user    uuid not null references auth.users (id),
  to_user      uuid not null references auth.users (id),
  amount       bigint not null check (amount > 0 and amount < 100000000000),
  created_by   uuid not null default auth.uid() references auth.users (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  check (from_user <> to_user)
);
create index settlements_sync_idx on public.settlements (household_id, updated_at);

-- Vrai si l'utilisateur appartient au foyer (utilisé pour valider paid_by, from_user, to_user).
create function public.is_household_user(hid uuid, uid uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.household_members where household_id = hid and user_id = uid);
$$;

create function public.check_people()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_table_name = 'transactions' then
    if not public.is_household_user(new.household_id, new.paid_by) then
      raise exception 'paid_by must be a household member';
    end if;
  else
    if not (public.is_household_user(new.household_id, new.from_user)
            and public.is_household_user(new.household_id, new.to_user)) then
      raise exception 'from_user and to_user must be household members';
    end if;
  end if;
  return new;
end;
$$;

create trigger transactions_people before insert or update on public.transactions
  for each row execute function public.check_people();
create trigger settlements_people before insert or update on public.settlements
  for each row execute function public.check_people();
create trigger settlements_touch before insert or update on public.settlements
  for each row execute function public.touch_row();
create trigger settlements_protect before update on public.settlements
  for each row execute function public.protect_transaction();

alter table public.settlements enable row level security;

create policy settlements_select on public.settlements for select to authenticated
  using ((select public.is_member(household_id)));
create policy settlements_insert on public.settlements for insert to authenticated
  with check ((select public.is_member(household_id)) and created_by = (select auth.uid()));
create policy settlements_update on public.settlements for update to authenticated
  using ((select public.is_member(household_id))) with check ((select public.is_member(household_id)));
create policy settlements_delete on public.settlements for delete to authenticated
  using ((select public.is_member(household_id)));

revoke all on public.settlements from anon, authenticated;
grant select, insert, update, delete on public.settlements to authenticated;
revoke execute on function public.is_household_user(uuid, uuid), public.check_people() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.settlements;
  end if;
end;
$$;
