-- =============================================================================
-- 004_add_locations.sql
-- Per-centre locations for multi-branch organisations (e.g. Zenith's 12 sites).
-- Adds a `locations` table and nullable `location_id` FKs on classes + bookings.
-- =============================================================================

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  name text not null,
  address text,
  postal_code text,
  mrt_nearest text,
  phone text,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_locations_org_active on locations(org_id, is_active);

alter table classes
  add column if not exists location_id uuid references locations(id) on delete set null;

alter table bookings
  add column if not exists location_id uuid references locations(id) on delete set null;

create index if not exists idx_classes_location on classes(location_id);
create index if not exists idx_bookings_location on bookings(location_id);

-- RLS: members manage their own org's locations
alter table locations enable row level security;

drop policy if exists "members manage locations" on locations;
create policy "members manage locations" on locations
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));
