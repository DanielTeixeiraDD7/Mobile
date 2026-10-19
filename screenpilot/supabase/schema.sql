-- ============================================================================
-- ScreenPilot : comptes, amis et partage (Supabase).
-- À exécuter UNE fois : Supabase → SQL Editor → New query → coller → Run.
-- Réexécutable sans danger (create if not exists / create or replace).
--
-- Principe : chacun ne lit que ses données et celles de ses amis ACCEPTÉS,
-- selon ce qu'ils ont choisi de partager. Tout est vérifié par la base (RLS),
-- pas seulement par l'app. Les notes personnelles ne sont jamais envoyées.
-- ============================================================================

-- ---------- Profils ----------
create table if not exists public.profils (
  id uuid primary key references auth.users (id) on delete cascade,
  pseudo text not null check (char_length(btrim(pseudo)) between 2 and 24),
  code text not null unique check (code ~ '^[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  couleur text not null default '#ff4d6d' check (couleur ~ '^#[0-9a-fA-F]{6}$'),
  partage_temps boolean not null default true,   -- temps d'écran par jour et catégorie
  partage_biblio boolean not null default false, -- titres suivis (sans notes perso)
  cree_le timestamptz not null default now()
);

-- ---------- Amitiés (une ligne par paire, demande puis acceptation) ----------
create table if not exists public.amities (
  demandeur uuid not null references public.profils (id) on delete cascade,
  destinataire uuid not null references public.profils (id) on delete cascade,
  statut text not null default 'attente' check (statut in ('attente', 'acceptee')),
  cree_le timestamptz not null default now(),
  primary key (demandeur, destinataire),
  check (demandeur <> destinataire)
);
create unique index if not exists amities_paire on public.amities (least(demandeur, destinataire), greatest(demandeur, destinataire));
create index if not exists amities_destinataire on public.amities (destinataire);

-- ---------- Temps d'écran par jour et catégorie (calculé par l'app) ----------
create table if not exists public.stats_jour (
  utilisateur uuid not null references public.profils (id) on delete cascade,
  jour date not null,
  categorie text not null check (categorie in ('MOVIE', 'TV', 'ANIME', 'MANGA')),
  minutes integer not null default 0 check (minutes between 0 and 100000),
  unites numeric(8, 1) not null default 0 check (unites between 0 and 100000),
  maj_le timestamptz not null default now(),
  primary key (utilisateur, jour, categorie)
);

-- ---------- Titres partagés (seulement si partage_biblio) ----------
create table if not exists public.titres (
  utilisateur uuid not null references public.profils (id) on delete cascade,
  id text not null check (id ~ '^(anilist|tmdb):(ANIME|MANGA|MOVIE|TV):[0-9]+$'),
  categorie text not null check (categorie in ('MOVIE', 'TV', 'ANIME', 'MANGA')),
  titre text not null check (char_length(titre) <= 300),
  affiche text check (affiche is null or affiche ~ '^https://(image\.tmdb\.org|s4\.anilist\.co)/'),
  statut text not null check (statut in ('CURRENT', 'PLANNING', 'PAUSED', 'COMPLETED', 'DROPPED', 'REWATCH')),
  progression numeric(8, 1) not null default 0,
  total integer,
  note numeric(3, 1) check (note is null or note between 0 and 10),
  maj_le timestamptz not null default now(),
  primary key (utilisateur, id)
);

-- ---------- Fonctions d'aide (security definer : pas de récursion RLS) ----------
create or replace function public.est_ami(autre uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from amities
    where statut = 'acceptee'
      and ((demandeur = auth.uid() and destinataire = autre) or (demandeur = autre and destinataire = auth.uid()))
  );
$$;

create or replace function public.en_relation(autre uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from amities
    where (demandeur = auth.uid() and destinataire = autre) or (demandeur = autre and destinataire = auth.uid())
  );
$$;

create or replace function public.partage(autre uuid, quoi text) returns boolean
language sql stable security definer set search_path = public as $$
  select case quoi when 'temps' then partage_temps when 'biblio' then partage_biblio else false end
  from profils where id = autre;
$$;

-- Création du profil avec un code ami unique (lettres et chiffres sans ambiguïté : pas de O/0, I/1).
create or replace function public.creer_profil(p_pseudo text) returns public.profils
language plpgsql security definer set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  c text;
  p profils;
begin
  if auth.uid() is null then raise exception 'Connexion requise.'; end if;
  select * into p from profils where id = auth.uid();
  if found then return p; end if;
  loop
    c := '';
    for i in 1..8 loop
      c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
      if i = 4 then c := c || '-'; end if;
    end loop;
    begin
      insert into profils (id, pseudo, code, couleur)
      values (auth.uid(), btrim(p_pseudo), c, (array['#ff4d6d','#ff8a3d','#f5a524','#22c55e','#14b8a6','#3b82f6','#6366f1','#a855f7','#ec4899'])[1 + floor(random() * 9)::int])
      returning * into p;
      return p;
    exception when unique_violation then
      -- Profil créé entre-temps (double appui) : on le renvoie ; sinon code déjà pris : nouveau tirage.
      select * into p from profils where id = auth.uid();
      if found then return p; end if;
    end;
  end loop;
end;
$$;

-- Ajout d'un ami par son code. Si l'autre t'avait déjà invité, l'amitié est acceptée directement.
create or replace function public.demander_ami(p_code text) returns json
language plpgsql security definer set search_path = public as $$
declare
  cible profils;
  existante amities;
  en_attente integer;
begin
  if auth.uid() is null or not exists (select 1 from profils where id = auth.uid()) then
    raise exception 'Crée d''abord ton profil.';
  end if;
  select * into cible from profils where code = upper(btrim(p_code));
  if not found then raise exception 'Aucun compte avec ce code.'; end if;
  if cible.id = auth.uid() then raise exception 'C''est ton propre code.'; end if;

  select * into existante from amities
  where (demandeur = auth.uid() and destinataire = cible.id) or (demandeur = cible.id and destinataire = auth.uid());
  if found then
    if existante.statut = 'attente' and existante.destinataire = auth.uid() then
      update amities set statut = 'acceptee' where demandeur = cible.id and destinataire = auth.uid();
      return json_build_object('pseudo', cible.pseudo, 'statut', 'acceptee');
    end if;
    return json_build_object('pseudo', cible.pseudo, 'statut', existante.statut);
  end if;

  select count(*) into en_attente from amities where demandeur = auth.uid() and statut = 'attente';
  if en_attente >= 30 then raise exception 'Trop de demandes en attente.'; end if;
  insert into amities (demandeur, destinataire) values (auth.uid(), cible.id);
  return json_build_object('pseudo', cible.pseudo, 'statut', 'attente');
end;
$$;

-- Suppression définitive du compte (profil, amitiés, stats et titres partent en cascade).
create or replace function public.supprimer_mon_compte() returns void
language sql security definer set search_path = public as $$
  delete from auth.users where id = auth.uid();
$$;

-- ---------- Sécurité des lignes ----------
alter table public.profils enable row level security;
alter table public.amities enable row level security;
alter table public.stats_jour enable row level security;
alter table public.titres enable row level security;

drop policy if exists profils_lecture on public.profils;
create policy profils_lecture on public.profils for select to authenticated
  using (id = auth.uid() or en_relation(id));
drop policy if exists profils_modif on public.profils;
create policy profils_modif on public.profils for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists amities_lecture on public.amities;
create policy amities_lecture on public.amities for select to authenticated
  using (auth.uid() in (demandeur, destinataire));
drop policy if exists amities_accepter on public.amities;
create policy amities_accepter on public.amities for update to authenticated
  using (destinataire = auth.uid() and statut = 'attente') with check (destinataire = auth.uid() and statut = 'acceptee');
drop policy if exists amities_retirer on public.amities;
create policy amities_retirer on public.amities for delete to authenticated
  using (auth.uid() in (demandeur, destinataire));

drop policy if exists stats_lecture on public.stats_jour;
create policy stats_lecture on public.stats_jour for select to authenticated
  using (utilisateur = auth.uid() or (est_ami(utilisateur) and partage(utilisateur, 'temps')));
drop policy if exists stats_ecriture on public.stats_jour;
create policy stats_ecriture on public.stats_jour for all to authenticated
  using (utilisateur = auth.uid()) with check (utilisateur = auth.uid());

drop policy if exists titres_lecture on public.titres;
create policy titres_lecture on public.titres for select to authenticated
  using (utilisateur = auth.uid() or (est_ami(utilisateur) and partage(utilisateur, 'biblio')));
drop policy if exists titres_ecriture on public.titres;
create policy titres_ecriture on public.titres for all to authenticated
  using (utilisateur = auth.uid()) with check (utilisateur = auth.uid());

-- ---------- Droits : rien pour les visiteurs non connectés, colonnes limitées ----------
revoke all on public.profils, public.amities, public.stats_jour, public.titres from anon;
revoke insert, update, delete on public.profils from authenticated;
grant select on public.profils to authenticated;
grant update (pseudo, couleur, partage_temps, partage_biblio) on public.profils to authenticated;
revoke insert, update on public.amities from authenticated;
grant select, delete on public.amities to authenticated;
grant update (statut) on public.amities to authenticated;
grant select, insert, update, delete on public.stats_jour, public.titres to authenticated;

revoke execute on function public.est_ami(uuid), public.en_relation(uuid), public.partage(uuid, text),
  public.creer_profil(text), public.demander_ami(text), public.supprimer_mon_compte() from public, anon;
grant execute on function public.est_ami(uuid), public.en_relation(uuid), public.partage(uuid, text),
  public.creer_profil(text), public.demander_ami(text), public.supprimer_mon_compte() to authenticated;
