-- =====================================================================
--  Dangi Samaj Portal — database schema (Supabase / PostgreSQL)
--  Run this ONCE in Supabase → SQL Editor → New query → Run.
--
--  Hierarchy:  state → district → block → panchayat → village
--  Roles:      super_admin (you) → state → district → block → panchayat
--  Rule:       a coordinator sees only members inside their own area.
--              This is enforced by the database itself (Row Level
--              Security), not just by the app screens.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. LOCATIONS  (one table for all five levels)
-- ---------------------------------------------------------------------
create table if not exists public.locations (
  id         bigint generated always as identity primary key,
  level      text   not null check (level in ('state','district','block','panchayat','village')),
  name       text   not null,
  name_hi    text,
  parent_id  bigint references public.locations(id) on delete restrict,
  lgd_code   text,                       -- official Local Government Directory code
  subdivision text,                      -- for blocks: the anumandal (e.g. Sherghati)
  expected_villages int,                 -- for panchayats: number of villages on record
  path       bigint[] not null default '{}',  -- ids of all ancestors + itself (auto-filled)
  created_at timestamptz not null default now()
);

create unique index if not exists locations_lgd_uq   on public.locations(level, lgd_code) where lgd_code is not null;
create unique index if not exists locations_name_uq  on public.locations(coalesce(parent_id,0), level, lower(name));
create index        if not exists locations_parent_i on public.locations(parent_id);
create index        if not exists locations_path_gin on public.locations using gin(path);

-- keep "path" correct and make sure a child sits exactly one level below its parent
create or replace function public.locations_before_write() returns trigger
language plpgsql as $$
declare
  p_level text; p_path bigint[];
  expected text := case new.level
    when 'district' then 'state' when 'block' then 'district'
    when 'panchayat' then 'block' when 'village' then 'panchayat' end;
begin
  new.name := btrim(new.name);
  if new.level = 'state' then
    if new.parent_id is not null then raise exception 'A state cannot have a parent'; end if;
    new.path := array[new.id];
  else
    select level, path into p_level, p_path from public.locations where id = new.parent_id;
    if p_level is null then raise exception 'Parent location not found'; end if;
    if p_level <> expected then
      raise exception 'A % must be inside a %, not a %', new.level, expected, p_level;
    end if;
    new.path := p_path || new.id;
  end if;
  return new;
end $$;

drop trigger if exists trg_locations_before_write on public.locations;
create trigger trg_locations_before_write
  before insert or update of parent_id, level, name on public.locations
  for each row execute function public.locations_before_write();

-- ---------------------------------------------------------------------
-- 2. COORDINATORS  (who can log in, and which area they control)
--    Keyed by email: you add the email here, the person logs in with
--    a one-time code sent to that email, and gets that access.
-- ---------------------------------------------------------------------
create table if not exists public.coordinators (
  email       text primary key check (email = lower(email)),
  full_name   text,
  phone       text,
  role        text not null check (role in ('super_admin','state','district','block','panchayat')),
  location_id bigint references public.locations(id) on delete restrict,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint coordinator_needs_area check (role = 'super_admin' or location_id is not null)
);

create or replace function public.coordinators_before_write() returns trigger
language plpgsql as $$
declare l text;
begin
  new.email := lower(btrim(new.email));
  if new.role <> 'super_admin' then
    select level into l from public.locations where id = new.location_id;
    if l is distinct from new.role then
      raise exception 'A % coordinator must be assigned a % (got %)', new.role, new.role, coalesce(l,'nothing');
    end if;
  else
    new.location_id := null;
  end if;
  return new;
end $$;

drop trigger if exists trg_coordinators_before_write on public.coordinators;
create trigger trg_coordinators_before_write
  before insert or update on public.coordinators
  for each row execute function public.coordinators_before_write();

-- ---------------------------------------------------------------------
-- 2b. POLLING BOOTHS  (from the assembly booth lists; each booth sits in one panchayat)
-- ---------------------------------------------------------------------
create table if not exists public.booths (
  id           bigint generated always as identity primary key,
  assembly     text   not null,                 -- e.g. '227-Imamganj'
  number       int    not null check (number > 0),
  name         text   not null,                 -- polling station, e.g. 'Madhya Vidyalay, Hurmeth'
  panchayat_id bigint not null references public.locations(id) on delete restrict,
  block_id     bigint references public.locations(id),   -- auto-filled
  path         bigint[] not null default '{}',            -- panchayat's path (auto-filled)
  created_at   timestamptz not null default now(),
  unique (assembly, number)
);
create index if not exists booths_panchayat_i on public.booths(panchayat_id);
create index if not exists booths_path_gin    on public.booths using gin(path);

create or replace function public.booths_before_write() returns trigger
language plpgsql as $$
declare l text; p bigint[];
begin
  select level, path into l, p from public.locations where id = new.panchayat_id;
  if l is distinct from 'panchayat' then raise exception 'A booth must be linked to a panchayat'; end if;
  new.name := btrim(new.name);
  new.path := p; new.block_id := p[3];
  return new;
end $$;
drop trigger if exists trg_booths_before_write on public.booths;
create trigger trg_booths_before_write before insert or update on public.booths
  for each row execute function public.booths_before_write();

-- ---------------------------------------------------------------------
-- 3. MEMBERS
-- ---------------------------------------------------------------------
create table if not exists public.members (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null check (length(btrim(full_name)) >= 2),
  guardian_name text,                                   -- father / husband
  gender        text check (gender in ('M','F','O')),
  age           int  check (age between 0 and 120),
  phone         text not null,
  whatsapp      text,
  education     text,
  occupation    text,
  family_size   int  check (family_size between 1 and 100),
  address       text,                                   -- tola / mohalla / ward
  notes         text,
  place_id      bigint not null references public.locations(id) on delete restrict,  -- panchayat, or village if listed
  village_name  text not null,                          -- village / gaon as the member names it
  location_path bigint[] not null default '{}',         -- auto-filled from place_id
  booth_id      bigint references public.booths(id) on delete set null,   -- optional
  booth_no      int,                                    -- auto-filled from booth
  consent       boolean not null check (consent),       -- must be true to save
  consent_at    timestamptz not null default now(),
  status        text not null default 'pending' check (status in ('pending','verified','rejected')),
  source        text not null default 'self' check (source in ('self','coordinator')),
  created_by    uuid,                                   -- coordinator's auth user id
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists members_phone_name_uq on public.members(phone, lower(btrim(full_name)));
create index        if not exists members_path_gin      on public.members using gin(location_path);
create index        if not exists members_status_i      on public.members(status);
create index        if not exists members_created_i     on public.members(created_at desc);
create index        if not exists members_village_i     on public.members(place_id, lower(village_name));
-- for databases created before booths were added
alter table public.members add column if not exists booth_id bigint references public.booths(id) on delete set null;
alter table public.members add column if not exists booth_no int;
create index        if not exists members_booth_i       on public.members(booth_id);

create or replace function public.clean_phone(p text) returns text
language sql immutable as $$
  select case when p is null or btrim(p) = '' then null
              else right(regexp_replace(p, '\D', '', 'g'), 10) end
$$;

create or replace function public.members_before_write() returns trigger
language plpgsql as $$
declare v_level text; v_path bigint[]; v_name text; b_panch bigint;
begin
  new.full_name := btrim(new.full_name);
  new.phone     := public.clean_phone(new.phone);
  new.whatsapp  := coalesce(public.clean_phone(new.whatsapp), new.phone);
  if new.phone !~ '^[6-9][0-9]{9}$' then
    raise exception 'Mobile number must be a valid 10-digit Indian number';
  end if;
  select level, path, name into v_level, v_path, v_name from public.locations where id = new.place_id;
  if v_level is null or v_level not in ('panchayat','village') then
    raise exception 'Choose the panchayat (and village) where the member lives';
  end if;
  if v_level = 'village' then new.village_name := v_name; end if;
  new.village_name := initcap(regexp_replace(btrim(coalesce(new.village_name, '')), '\s+', ' ', 'g'));
  if length(new.village_name) < 2 then
    raise exception 'Enter the village name';
  end if;
  new.location_path := v_path;
  if new.booth_id is not null then
    select panchayat_id, number into b_panch, new.booth_no from public.booths where id = new.booth_id;
    if b_panch is distinct from v_path[4] then
      raise exception 'This booth is not in the chosen panchayat';
    end if;
  else
    new.booth_no := null;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_members_before_write on public.members;
create trigger trg_members_before_write
  before insert or update on public.members
  for each row execute function public.members_before_write();

-- ---------------------------------------------------------------------
-- 4. ACCESS HELPERS
-- ---------------------------------------------------------------------
create or replace function public.my_email() returns text
language sql stable as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

-- the logged-in coordinator's row (or nothing)
create or replace function public.me()
returns table(email text, full_name text, role text, location_id bigint, location_name text, location_level text)
language sql stable security definer set search_path = public as $$
  select c.email, c.full_name, c.role, c.location_id, l.name, l.level
  from public.coordinators c left join public.locations l on l.id = c.location_id
  where c.email = public.my_email() and c.active
$$;

create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.coordinators
                 where email = public.my_email() and active and role = 'super_admin')
$$;

-- true if the current coordinator's area contains this location path
create or replace function public.can_access(p_path bigint[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.coordinators c
                 where c.email = public.my_email() and c.active
                   and (c.role = 'super_admin' or c.location_id = any(p_path)))
$$;

-- ---------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.locations    enable row level security;
alter table public.members      enable row level security;
alter table public.coordinators enable row level security;
alter table public.booths       enable row level security;

-- BOOTHS: public list, everyone can read; only super admin changes it
drop policy if exists booth_read on public.booths;
create policy booth_read on public.booths for select using (true);
drop policy if exists booth_write on public.booths;
create policy booth_write on public.booths for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- LOCATIONS: everyone can read (needed for the public form)
drop policy if exists loc_read on public.locations;
create policy loc_read on public.locations for select using (true);

-- super admin manages everything; coordinators may add villages inside their own area
drop policy if exists loc_insert on public.locations;
create policy loc_insert on public.locations for insert to authenticated
  with check (public.is_super_admin() or (level = 'village' and public.can_access(path)));

drop policy if exists loc_update on public.locations;
create policy loc_update on public.locations for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists loc_delete on public.locations;
create policy loc_delete on public.locations for delete to authenticated
  using (public.is_super_admin());

-- MEMBERS
-- public self-registration (no login): can only ADD a pending, self-sourced record; cannot read anything
drop policy if exists mem_public_insert on public.members;
create policy mem_public_insert on public.members for insert to anon
  with check (status = 'pending' and source = 'self' and created_by is null and consent);

-- coordinators: full access inside their area only
drop policy if exists mem_coord_select on public.members;
create policy mem_coord_select on public.members for select to authenticated
  using (public.can_access(location_path));

drop policy if exists mem_coord_insert on public.members;
create policy mem_coord_insert on public.members for insert to authenticated
  with check (public.can_access(location_path));

drop policy if exists mem_coord_update on public.members;
create policy mem_coord_update on public.members for update to authenticated
  using (public.can_access(location_path)) with check (public.can_access(location_path));

drop policy if exists mem_admin_delete on public.members;
create policy mem_admin_delete on public.members for delete to authenticated
  using (public.is_super_admin());

-- COORDINATORS: you see your own row; super admin manages all
drop policy if exists coord_select on public.coordinators;
create policy coord_select on public.coordinators for select to authenticated
  using (email = public.my_email() or public.is_super_admin());

drop policy if exists coord_write on public.coordinators;
create policy coord_write on public.coordinators for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------------
-- 6. DASHBOARD COUNTS  (respects each coordinator's area automatically)
--    p_parent = null → states; otherwise the children of that location
-- ---------------------------------------------------------------------
drop function if exists public.member_counts(bigint);
create or replace function public.member_counts(p_parent bigint)
returns table(location_id bigint, name text, level text, subdivision text,
              total bigint, verified bigint, pending bigint,
              villages_reached bigint, expected_villages bigint)
language sql stable security invoker set search_path = public as $$
  select l.id, l.name, l.level, l.subdivision,
         count(m.id),
         count(m.id) filter (where m.status = 'verified'),
         count(m.id) filter (where m.status = 'pending'),
         count(distinct (m.location_path[4]::text || ':' || lower(m.village_name))),
         (select sum(p.expected_villages) from public.locations p
           where p.level = 'panchayat' and p.path @> array[l.id])
  from public.locations l
  left join public.members m on m.location_path @> array[l.id] and m.status <> 'rejected'
  where l.parent_id is not distinct from p_parent
  group by l.id, l.name, l.level, l.subdivision
  order by count(m.id) desc, l.name
$$;

-- inside one panchayat: members grouped by the village name they gave
create or replace function public.village_breakdown(p_panchayat bigint)
returns table(village_name text, total bigint, verified bigint, pending bigint)
language sql stable security invoker set search_path = public as $$
  select min(m.village_name), count(*),
         count(*) filter (where m.status = 'verified'),
         count(*) filter (where m.status = 'pending')
  from public.members m
  where m.location_path @> array[p_panchayat] and m.status <> 'rejected'
  group by lower(m.village_name)
  order by count(*) desc, 1
$$;

-- village names already used in a panchayat (listed villages + names members typed);
-- powers the suggestions on the form so spellings stay consistent. No personal data.
create or replace function public.village_names(p_panchayat bigint)
returns table(village_name text, listed boolean)
language sql stable security definer set search_path = public as $$
  select name, true from public.locations where parent_id = p_panchayat and level = 'village'
  union
  select distinct m.village_name, false from public.members m
  where m.location_path @> array[p_panchayat] and m.status <> 'rejected'
    and not exists (select 1 from public.locations v where v.parent_id = p_panchayat and v.level = 'village' and lower(v.name) = lower(m.village_name))
  order by 1
$$;

-- booths inside an area (block or panchayat) with member counts for the viewer's area
create or replace function public.booth_breakdown(p_location bigint)
returns table(booth_id bigint, number int, name text, assembly text, panchayat text,
              total bigint, verified bigint, pending bigint)
language sql stable security invoker set search_path = public as $$
  select b.id, b.number, b.name, b.assembly, p.name,
         count(m.id),
         count(m.id) filter (where m.status = 'verified'),
         count(m.id) filter (where m.status = 'pending')
  from public.booths b
  join public.locations p on p.id = b.panchayat_id
  left join public.members m on m.booth_id = b.id and m.status <> 'rejected'
  where b.path @> array[p_location]
  group by b.id, b.number, b.name, b.assembly, p.name
  order by b.assembly, b.number
$$;

-- ---------------------------------------------------------------------
-- 7. PERMISSIONS for Supabase API roles
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.locations to anon, authenticated;
grant select on public.booths to anon, authenticated;
grant insert, update, delete on public.booths to authenticated;
grant insert, update, delete on public.locations to authenticated;
grant insert on public.members to anon;
grant select, insert, update, delete on public.members to authenticated;
grant select, insert, update, delete on public.coordinators to authenticated;
grant execute on function public.me(), public.is_super_admin(), public.can_access(bigint[]),
  public.member_counts(bigint), public.village_breakdown(bigint), public.village_names(bigint), public.booth_breakdown(bigint), public.my_email(), public.clean_phone(text) to anon, authenticated;

-- =====================================================================
--  AFTER RUNNING: make yourself super admin (change the email):
--    insert into public.coordinators(email, full_name, role)
--    values ('you@example.com', 'Your Name', 'super_admin');
-- =====================================================================
