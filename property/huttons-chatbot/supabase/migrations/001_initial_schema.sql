-- =============================================================================
-- 001_initial_schema.sql
-- Tuition Chatbot — initial database schema
-- =============================================================================

create extension if not exists vector;
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- organisations: one row per tuition centre client
-- -----------------------------------------------------------------------------
create table if not exists organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  address text,
  phone text,
  email text,
  operating_hours jsonb,
  google_calendar_id text,
  google_refresh_token text,
  whatsapp_number text,
  telegram_bot_token text,
  stripe_account_id text,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- org_members: link Supabase auth users to organisations
-- -----------------------------------------------------------------------------
create table if not exists org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz default now(),
  unique (org_id, user_id)
);

create index if not exists idx_org_members_user on org_members(user_id);

-- -----------------------------------------------------------------------------
-- documents + document_chunks (RAG store)
-- -----------------------------------------------------------------------------
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  filename text not null,
  file_type text,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_documents_org on documents(org_id);

create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  org_id uuid not null references organisations(id) on delete cascade,
  chunk_text text not null,
  chunk_index integer not null,
  embedding vector(1536),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_chunks_org on document_chunks(org_id);
create index if not exists idx_chunks_embedding
  on document_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- -----------------------------------------------------------------------------
-- classes
-- -----------------------------------------------------------------------------
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  subject text not null,
  level text not null,
  class_type text default 'group',
  day_of_week text not null,
  start_time time not null,
  end_time time not null,
  teacher_name text,
  max_capacity integer default 8,
  current_enrollment integer default 0,
  monthly_fee numeric(10,2) not null,
  registration_fee numeric(10,2) default 0,
  material_fee numeric(10,2) default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_classes_org_active on classes(org_id, is_active);

-- -----------------------------------------------------------------------------
-- students
-- -----------------------------------------------------------------------------
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  student_name text not null,
  parent_name text,
  parent_phone text not null,
  parent_email text,
  level text,
  school text,
  status text default 'lead',
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_students_org_phone on students(org_id, parent_phone);

-- -----------------------------------------------------------------------------
-- bookings
-- -----------------------------------------------------------------------------
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  student_id uuid references students(id) on delete set null,
  class_id uuid references classes(id) on delete set null,
  booking_type text default 'trial',
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  status text default 'confirmed',
  google_calendar_event_id text,
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_bookings_org_date on bookings(org_id, booking_date);

-- -----------------------------------------------------------------------------
-- waitlist
-- -----------------------------------------------------------------------------
create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  position integer not null,
  status text default 'waiting',
  notified_at timestamptz,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- payments
-- -----------------------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  student_id uuid references students(id) on delete set null,
  amount numeric(10,2) not null,
  payment_type text,
  payment_method text,
  stripe_payment_id text,
  status text default 'pending',
  month_for text,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- conversations + messages
-- -----------------------------------------------------------------------------
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  channel text not null,
  channel_user_id text,
  student_id uuid references students(id) on delete set null,
  started_at timestamptz default now(),
  last_message_at timestamptz default now(),
  status text default 'active',
  metadata jsonb default '{}'::jsonb
);

create index if not exists idx_conversations_org on conversations(org_id, last_message_at desc);
create index if not exists idx_conversations_channel_user on conversations(channel, channel_user_id);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null,
  content text not null,
  intent text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_messages_conv on messages(conversation_id, created_at);

-- -----------------------------------------------------------------------------
-- faqs (curated quick-reference)
-- -----------------------------------------------------------------------------
create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  question text not null,
  answer text not null,
  category text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_faqs_org_active on faqs(org_id, is_active);

-- =============================================================================
-- Vector match RPC (top-K by cosine similarity, scoped to org)
-- =============================================================================
create or replace function match_document_chunks(
  query_embedding vector(1536),
  match_org_id uuid,
  match_count int default 5,
  similarity_threshold float default 0.5
)
returns table (
  id uuid,
  document_id uuid,
  chunk_text text,
  chunk_index int,
  similarity float
)
language sql stable as $$
  select
    dc.id,
    dc.document_id,
    dc.chunk_text,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where dc.org_id = match_org_id
    and dc.embedding is not null
    and 1 - (dc.embedding <=> query_embedding) >= similarity_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table organisations enable row level security;
alter table org_members enable row level security;
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table classes enable row level security;
alter table students enable row level security;
alter table bookings enable row level security;
alter table waitlist enable row level security;
alter table payments enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table faqs enable row level security;

-- Helper: is current user a member of org?
create or replace function is_org_member(target_org uuid)
returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from org_members
    where org_id = target_org and user_id = auth.uid()
  );
$$;

-- organisations: members can read their own org
create policy "members read own org" on organisations
  for select using (is_org_member(id));

create policy "members update own org" on organisations
  for update using (is_org_member(id));

-- org_members: users see their own memberships
create policy "users read own memberships" on org_members
  for select using (user_id = auth.uid());

-- Generic per-org policies for tables with an org_id column
do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'documents','document_chunks','classes','students','bookings',
      'waitlist','payments','conversations','faqs'
    ])
  loop
    execute format($f$
      drop policy if exists "members manage %1$s" on %1$I;
      create policy "members manage %1$s" on %1$I
        for all using (is_org_member(org_id)) with check (is_org_member(org_id));
    $f$, tbl);
  end loop;
end $$;

-- messages: scoped via parent conversation
drop policy if exists "members manage messages" on messages;
create policy "members manage messages" on messages
  for all
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id and is_org_member(c.org_id)
    )
  )
  with check (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id and is_org_member(c.org_id)
    )
  );

-- The service_role key bypasses RLS — used by API routes for chat traffic.
