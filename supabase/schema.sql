-- Opskrifter — databaseskema.
--
-- Køres i SQL-editoren på Supabase-projektet. Filen kan køres igen oven på en
-- database der allerede har den: hver politik droppes før den oprettes, og
-- tabeller og kolonner tilføjes betinget. Fremgangsmåden med den første
-- invitationskode står i docs/PLAN.md, fase 3.
--
-- Ingredienser og trin ligger som jsonb frem for i egne tabeller. Det er et
-- bevidst valg: de læses og skrives altid sammen med opskriften, rækkefølgen
-- betyder noget, og der er fem brugere. En join-model ville koste mere end
-- den gav.

-- ---------------------------------------------------------------------------
-- Profiler
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  display_name text not null,
  created_at  timestamptz not null default now()
);

alter table profiles enable row level security;

-- Lukket kreds: alle må se hinandens navne, ellers kan man ikke dele.
drop policy if exists "profiler kan læses af indloggede" on profiles;
create policy "profiler kan læses af indloggede"
  on profiles for select
  to authenticated
  using (true);

drop policy if exists "man kan rette sin egen profil" on profiles;
create policy "man kan rette sin egen profil"
  on profiles for update
  to authenticated
  using (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Invitationskoder
-- ---------------------------------------------------------------------------

create table if not exists invite_codes (
  code       text primary key,
  created_by uuid references auth.users on delete set null,
  max_uses   int not null default 1,
  uses       int not null default 0,
  created_at timestamptz not null default now()
);

alter table invite_codes enable row level security;

-- Ingen politikker: tabellen er utilgængelig for både anon og authenticated.
-- Kun triggeren nedenfor rører den, og den kører som security definer.

-- ---------------------------------------------------------------------------
-- Oprettelse af bruger
-- ---------------------------------------------------------------------------

-- Koden valideres her, ikke i klienten. Klienten sender den med som
-- user metadata ved signUp; fejler triggeren, fejler oprettelsen.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  submitted text := nullif(trim(new.raw_user_meta_data ->> 'invite_code'), '');
  matched   invite_codes%rowtype;
begin
  if submitted is null then
    raise exception 'Der mangler en invitationskode.';
  end if;

  select * into matched
  from invite_codes
  where upper(code) = upper(submitted)
  for update;

  if not found then
    raise exception 'Invitationskoden findes ikke.';
  end if;

  if matched.uses >= matched.max_uses then
    raise exception 'Invitationskoden er brugt op.';
  end if;

  update invite_codes
  set uses = uses + 1
  where code = matched.code;

  insert into profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    )
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Opskrifter
-- ---------------------------------------------------------------------------

create table if not exists recipes (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users on delete cascade,
  title          text not null,
  description    text not null default '',
  notes          text not null default '',
  tags           text[] not null default '{}',
  servings       int  not null default 4 check (servings between 1 and 24),
  prep_minutes   int  not null default 0 check (prep_minutes >= 0),
  cook_minutes   int  not null default 0 check (cook_minutes >= 0),
  kcal           int,
  protein        int,
  visibility     text not null default 'private'
                 check (visibility in ('private', 'public')),
  image_path     text,
  image_label    text not null default '',
  ingredients    jsonb not null default '[]'::jsonb,
  steps          jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists recipes_owner_idx on recipes (owner_id);
create index if not exists recipes_visibility_idx on recipes (visibility);

alter table recipes enable row level security;

-- ---------------------------------------------------------------------------
-- Deling
-- ---------------------------------------------------------------------------

create table if not exists recipe_shares (
  recipe_id uuid not null references recipes on delete cascade,
  person_id uuid not null references auth.users on delete cascade,
  primary key (recipe_id, person_id)
);

create index if not exists recipe_shares_person_idx on recipe_shares (person_id);

alter table recipe_shares enable row level security;

-- Hjælper der bryder den cirkulære afhængighed mellem politikkerne på
-- recipes og recipe_shares. security definer omgår RLS ét sted, kontrolleret.
create or replace function can_read_recipe(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from recipes r
    where r.id = target
      and (
        r.owner_id = (select auth.uid())
        or r.visibility = 'public'
        or exists (
          select 1 from recipe_shares s
          where s.recipe_id = r.id
            and s.person_id = (select auth.uid())
        )
      )
  );
$$;

drop policy if exists
  "opskrifter kan læses af ejer, alle, eller den de er delt med" on recipes;
create policy "opskrifter kan læses af ejer, alle, eller den de er delt med"
  on recipes for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or visibility = 'public'
    or exists (
      select 1 from recipe_shares s
      where s.recipe_id = recipes.id
        and s.person_id = (select auth.uid())
    )
  );

drop policy if exists "man opretter i eget navn" on recipes;
create policy "man opretter i eget navn"
  on recipes for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "kun ejeren retter" on recipes;
create policy "kun ejeren retter"
  on recipes for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "kun ejeren sletter" on recipes;
create policy "kun ejeren sletter"
  on recipes for delete
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "delinger kan læses af ejer og modtager" on recipe_shares;
create policy "delinger kan læses af ejer og modtager"
  on recipe_shares for select
  to authenticated
  using (
    person_id = (select auth.uid())
    or exists (
      select 1 from recipes r
      where r.id = recipe_shares.recipe_id
        and r.owner_id = (select auth.uid())
    )
  );

drop policy if exists "kun ejeren deler" on recipe_shares;
create policy "kun ejeren deler"
  on recipe_shares for insert
  to authenticated
  with check (
    exists (
      select 1 from recipes r
      where r.id = recipe_shares.recipe_id
        and r.owner_id = (select auth.uid())
    )
  );

drop policy if exists "kun ejeren fjerner deling" on recipe_shares;
create policy "kun ejeren fjerner deling"
  on recipe_shares for delete
  to authenticated
  using (
    exists (
      select 1 from recipes r
      where r.id = recipe_shares.recipe_id
        and r.owner_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Favoritter
-- ---------------------------------------------------------------------------

create table if not exists favorites (
  user_id   uuid not null references auth.users on delete cascade,
  recipe_id uuid not null references recipes on delete cascade,
  primary key (user_id, recipe_id)
);

alter table favorites enable row level security;

drop policy if exists "egne favoritter kan læses" on favorites;
create policy "egne favoritter kan læses"
  on favorites for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "egne favoritter kan tilføjes" on favorites;
create policy "egne favoritter kan tilføjes"
  on favorites for insert
  to authenticated
  with check (user_id = (select auth.uid()) and can_read_recipe(recipe_id));

drop policy if exists "egne favoritter kan fjernes" on favorites;
create policy "egne favoritter kan fjernes"
  on favorites for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recipes_touch on recipes;
create trigger recipes_touch
  before update on recipes
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- Keepalive
-- ---------------------------------------------------------------------------

-- .github/workflows/keepalive.yml læser denne tabel dagligt, så gratis-
-- projektet ikke sættes på pause efter syv dages stilhed.
--
-- Bemærk at "if not exists" ikke retter en tabel der allerede står der. Findes
-- den i forvejen med en anden form, skal forskellen tilføjes eksplicit som
-- nedenfor - ellers driver filen og databasen fra hinanden i stilhed.
create table if not exists ping (
  id int primary key
);

alter table ping
  add column if not exists last_seen timestamptz not null default now();

insert into ping (id) values (1) on conflict do nothing;

alter table ping enable row level security;

drop policy if exists "ping kan læses af alle" on ping;
create policy "ping kan læses af alle"
  on ping for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Rettigheder
-- ---------------------------------------------------------------------------

-- RLS afgør hvem der må se hvad. GRANT afgør om rollen overhovedet må røre
-- tabellen, og det er et separat lag: uden GRANT svarer PostgREST 42501
-- "permission denied" i stedet for at RLS filtrerer, og appen ser brudt ud
-- selvom hver eneste politik er rigtig.
--
-- Supabase giver normalt disse rettigheder automatisk til nye tabeller i
-- public, men det afhænger af hvilken rolle der oprettede dem. Vi sætter dem
-- eksplicit, så filen står på egne ben på et hvilket som helst projekt.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on profiles, recipes, recipe_shares, favorites
  to authenticated;

-- anon får kun ping. invite_codes får ingen roller overhovedet - kun
-- handle_new_user rører den, og den er security definer.
grant select on ping to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Billeder
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', false)
on conflict (id) do nothing;

drop policy if exists
  "billeder kan ses af dem der må se opskriften" on storage.objects;
create policy "billeder kan ses af dem der må se opskriften"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'recipe-images'
    and exists (
      select 1 from recipes r
      where r.image_path = storage.objects.name
        and can_read_recipe(r.id)
    )
  );

drop policy if exists
  "man lægger billeder i sin egen mappe" on storage.objects;
create policy "man lægger billeder i sin egen mappe"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists
  "man sletter billeder i sin egen mappe" on storage.objects;
create policy "man sletter billeder i sin egen mappe"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
