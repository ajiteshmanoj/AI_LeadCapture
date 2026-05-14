-- =============================================================================
-- 010_onboarding_and_branding.sql
-- Invite-only onboarding + per-org branding fields.
-- =============================================================================

alter table organisations
  add column if not exists invite_token text unique,
  add column if not exists invite_email text,
  add column if not exists invite_expires_at timestamptz,
  add column if not exists invite_accepted_at timestamptz,
  add column if not exists is_onboarded boolean not null default false,
  add column if not exists onboarding_step text default 'centre_details';

-- Super-admins table: only rows here can access /admin/* routes.
-- Seed manually after applying: insert into super_admins values ('<your-auth-user-id>');
create table if not exists super_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table super_admins enable row level security;
create policy "super admin self read" on super_admins
  for select using (user_id = auth.uid());

-- Storage bucket for org logos. Public read; members write to their own prefix.
insert into storage.buckets (id, name, public)
  values ('org-logos', 'org-logos', true)
  on conflict (id) do nothing;

create policy "logos public read" on storage.objects
  for select using (bucket_id = 'org-logos');

create policy "members upload own logo" on storage.objects
  for insert with check (
    bucket_id = 'org-logos'
    and exists (
      select 1 from org_members
      where user_id = auth.uid()
        and org_id::text = (storage.foldername(name))[1]
    )
  );

create policy "members update own logo" on storage.objects
  for update using (
    bucket_id = 'org-logos'
    and exists (
      select 1 from org_members
      where user_id = auth.uid()
        and org_id::text = (storage.foldername(name))[1]
    )
  );
