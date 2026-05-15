-- Phase 3: WhatsApp credentials on organisations
-- Phase 4: Lead nurture + payment reminders tables

-- WhatsApp / Twilio credentials
alter table organisations
  add column if not exists twilio_account_sid   text,
  add column if not exists twilio_auth_token    text,
  add column if not exists twilio_whatsapp_from text,  -- e.g. whatsapp:+14155238886
  add column if not exists paynow_uen           text,  -- for payment QR (Phase 5)
  add column if not exists paynow_phone         text,  -- PayNow phone fallback
  add column if not exists billing_day          integer default 1;  -- 1–28

-- Lead nurture: drives Phase 4 post-trial follow-up sequences
create table if not exists lead_nurture (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references organisations(id) on delete cascade,
  booking_id       uuid references bookings(id) on delete set null,
  student_id       uuid references students(id) on delete set null,
  conversation_id  uuid references conversations(id) on delete set null,
  channel          text not null default 'web',  -- 'web' | 'whatsapp' | 'telegram'
  step             integer not null default 0,   -- 0=pending, 1=T+24h, 2=T+3d, 3=T+7d
  next_followup_at timestamptz,
  status           text not null default 'active',  -- 'active'|'enrolled'|'closed'|'paused'
  created_at       timestamptz default now()
);
create index if not exists lead_nurture_org_status on lead_nurture(org_id, status);
create index if not exists lead_nurture_next_followup on lead_nurture(next_followup_at) where status = 'active';

-- Payment reminders: Phase 4 monthly fee nudges
create table if not exists payment_reminders (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references organisations(id) on delete cascade,
  student_id       uuid not null references students(id) on delete cascade,
  month_for        text not null,        -- '2026-06'
  amount           numeric(10,2) not null,
  reminder_count   integer default 0,
  last_reminded_at timestamptz,
  status           text not null default 'pending',  -- 'pending'|'reminded'|'paid'|'overdue'|'escalated'
  paid_at          timestamptz,
  created_at       timestamptz default now(),
  unique (org_id, student_id, month_for)
);
create index if not exists payment_reminders_org_status on payment_reminders(org_id, status);

-- Enable RLS (service-role key bypasses; dashboard reads use org membership)
alter table lead_nurture enable row level security;
alter table payment_reminders enable row level security;

create policy "org members can manage lead_nurture"
  on lead_nurture for all
  using (is_org_member(org_id))
  with check (is_org_member(org_id));

create policy "org members can manage payment_reminders"
  on payment_reminders for all
  using (is_org_member(org_id))
  with check (is_org_member(org_id));
