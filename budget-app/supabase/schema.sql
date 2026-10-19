-- =====================================================================
-- Budget partagé – schéma Supabase (PostgreSQL)
-- À exécuter UNE fois : Supabase → SQL Editor → New query → coller → Run
-- =====================================================================

-- ---------- Tables ----------------------------------------------------

create table public.households (
  id             uuid primary key default gen_random_uuid(),
  name           text not null default 'Foyer' check (char_length(name) between 1 and 40),
  currency       text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  monthly_budget bigint check (monthly_budget is null or monthly_budget > 0),
  created_by     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  role         text not null default 'member' check (role in ('owner', 'member')),
  joined_at    timestamptz not null default now(),
  primary key (household_id, user_id),
  unique (user_id)                       -- un utilisateur = un seul foyer
);

create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  key          text,                     -- clé de traduction des catégories par défaut
  name         text check (name is null or char_length(name) between 1 and 24),
  kind         text not null check (kind in ('expense', 'income')),
  color        text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  budget       bigint check (budget is null or budget > 0),
  position     int not null default 0,
  locked       boolean not null default false,
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  check (key is not null or name is not null)
);

create table public.transactions (
  id           uuid primary key,         -- généré par le téléphone (fonctionne hors-ligne)
  household_id uuid not null references public.households (id) on delete cascade,
  category_id  uuid references public.categories (id) on delete set null,
  type         text not null check (type in ('expense', 'income')),
  amount       bigint not null check (amount > 0 and amount < 100000000000),  -- en centimes
  date         date not null,
  note         text not null default '' check (char_length(note) <= 80),
  created_by   uuid not null default auth.uid() references auth.users (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz               -- suppression « douce » pour la synchronisation
);

create table public.invitations (
  code         text primary key,
  household_id uuid not null references public.households (id) on delete cascade,
  created_by   uuid not null references auth.users (id) on delete cascade,
  expires_at   timestamptz not null default now() + interval '24 hours',
  used_by      uuid references auth.users (id),
  used_at      timestamptz
);

create index transactions_sync_idx on public.transactions (household_id, updated_at);
create index transactions_date_idx on public.transactions (household_id, date);
create index categories_sync_idx   on public.categories (household_id, updated_at);

-- ---------- Fonctions utilitaires ---------------------------------------

-- Vrai si l'utilisateur connecté est membre du foyer.
-- SECURITY DEFINER : lit household_members sans repasser par la RLS (évite la récursion).
create function public.is_member(hid uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = (select auth.uid())
  );
$$;

-- Met à jour updated_at et empêche de déplacer une ligne vers un autre foyer.
create function public.touch_row()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.household_id := old.household_id;
  end if;
  return new;
end;
$$;

create function public.protect_transaction()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  return new;
end;
$$;

create function public.touch_household()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger categories_touch   before insert or update on public.categories   for each row execute function public.touch_row();
create trigger transactions_touch before insert or update on public.transactions for each row execute function public.touch_row();
create trigger transactions_protect before update on public.transactions for each row execute function public.protect_transaction();
create trigger households_touch   before update on public.households for each row execute function public.touch_household();

-- ---------- Actions (appelées par l'app) ---------------------------------

-- Crée un foyer, en fait l'utilisateur propriétaire et ajoute les catégories par défaut.
create function public.create_household(p_display_name text, p_currency text default 'EUR')
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  hid uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from public.household_members where user_id = uid) then
    raise exception 'already in a household';
  end if;

  insert into public.households (created_by, currency) values (uid, coalesce(p_currency, 'EUR')) returning id into hid;
  insert into public.household_members (household_id, user_id, display_name, role)
  values (hid, uid, p_display_name, 'owner');

  insert into public.categories (household_id, key, kind, color, position, locked) values
    (hid, 'cat.groceries',   'expense', '#2f9e6e', 0, false),
    (hid, 'cat.transport',   'expense', '#3478f6', 1, false),
    (hid, 'cat.rent',        'expense', '#e8590c', 2, false),
    (hid, 'cat.leisure',     'expense', '#7048e8', 3, false),
    (hid, 'cat.health',      'expense', '#d6336c', 4, false),
    (hid, 'cat.other',       'expense', '#495057', 5, true),
    (hid, 'cat.salary',      'income',  '#2f9e6e', 6, false),
    (hid, 'cat.otherIncome', 'income',  '#0c8599', 7, true);
  return hid;
end;
$$;

-- Génère un code d'invitation (24 h, usage unique).
create function public.create_invitation()
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  hid uuid;
  new_code text;
begin
  select household_id into hid from public.household_members where user_id = uid;
  if hid is null then raise exception 'not in a household'; end if;

  delete from public.invitations where household_id = hid and (used_at is not null or expires_at < now());
  new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.invitations (code, household_id, created_by) values (new_code, hid, uid);
  return new_code;
end;
$$;

-- Rejoint un foyer avec un code d'invitation.
create function public.join_household(p_code text, p_display_name text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  inv public.invitations;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from public.household_members where user_id = uid) then
    raise exception 'already in a household';
  end if;

  select * into inv from public.invitations
  where code = upper(trim(p_code)) and used_at is null and expires_at > now()
  for update;
  if not found then raise exception 'invalid or expired code'; end if;

  insert into public.household_members (household_id, user_id, display_name, role)
  values (inv.household_id, uid, p_display_name, 'member');
  update public.invitations set used_by = uid, used_at = now() where code = inv.code;
  return inv.household_id;
end;
$$;

-- ---------- Sécurité : Row Level Security --------------------------------

alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.categories        enable row level security;
alter table public.transactions      enable row level security;
alter table public.invitations       enable row level security;

-- Foyer : visible et modifiable seulement par ses membres.
create policy households_select on public.households for select to authenticated
  using ((select public.is_member(id)));
create policy households_update on public.households for update to authenticated
  using ((select public.is_member(id))) with check ((select public.is_member(id)));

-- Membres : on voit les membres de son foyer, on ne modifie que son propre nom, on peut partir.
create policy members_select on public.household_members for select to authenticated
  using ((select public.is_member(household_id)));
create policy members_update_self on public.household_members for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy members_leave on public.household_members for delete to authenticated
  using (user_id = (select auth.uid()));

-- Catégories et opérations : tout est permis, mais uniquement dans son foyer.
create policy categories_all on public.categories for all to authenticated
  using ((select public.is_member(household_id))) with check ((select public.is_member(household_id)));

create policy transactions_select on public.transactions for select to authenticated
  using ((select public.is_member(household_id)));
create policy transactions_insert on public.transactions for insert to authenticated
  with check ((select public.is_member(household_id)) and created_by = (select auth.uid()));
create policy transactions_update on public.transactions for update to authenticated
  using ((select public.is_member(household_id))) with check ((select public.is_member(household_id)));
create policy transactions_delete on public.transactions for delete to authenticated
  using ((select public.is_member(household_id)));

-- invitations : aucune policy → inaccessible directement, seulement via les fonctions.

-- ---------- Droits (en plus de la RLS) -----------------------------------

revoke all on public.households, public.household_members, public.categories,
              public.transactions, public.invitations from anon, authenticated;

grant select on public.households to authenticated;
grant update (name, currency, monthly_budget) on public.households to authenticated;
grant select, delete on public.household_members to authenticated;
grant update (display_name) on public.household_members to authenticated;
grant select, insert, update, delete on public.categories, public.transactions to authenticated;

revoke execute on function public.is_member(uuid), public.create_household(text, text),
  public.create_invitation(), public.join_household(text, text) from public, anon;
grant execute on function public.is_member(uuid), public.create_household(text, text),
  public.create_invitation(), public.join_household(text, text) to authenticated;

-- ---------- Temps réel (mise à jour instantanée entre vos deux téléphones) --

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.transactions, public.categories, public.households;
  end if;
end;
$$;
