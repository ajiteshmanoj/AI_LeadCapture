-- =============================================================================
-- 012_lesson_reminders.sql
-- Adds attendance tracking + an idempotency log for 24h lesson reminders.
-- Cron at /api/cron/reminders writes lesson_reminder_log so the same parent
-- never gets two reminders for the same lesson, even if cron runs twice.
-- =============================================================================

create table if not exists attendance (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organisations(id) on delete cascade,
  class_id    uuid not null references classes(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  booking_id  uuid references bookings(id) on delete set null,
  lesson_date date not null,
  status      text not null default 'expected',
    -- 'expected' | 'present' | 'absent' | 'absent_notified' | 'makeup'
  marked_by   text,           -- 'teacher' | 'system' | 'parent'
  marked_at   timestamptz,
  created_at  timestamptz default now(),
  unique (class_id, student_id, lesson_date)
);

create index if not exists idx_attendance_org_date
  on attendance(org_id, lesson_date);

create table if not exists lesson_reminder_log (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organisations(id) on delete cascade,
  booking_id  uuid references bookings(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  class_id    uuid references classes(id) on delete set null,
  lesson_date date not null,
  channel     text not null,  -- 'web' | 'whatsapp' | 'telegram'
  sent_at     timestamptz default now(),
  unique (booking_id, lesson_date)
);

create index if not exists idx_lesson_reminder_log_org_date
  on lesson_reminder_log(org_id, lesson_date);

-- RLS — same is_org_member() pattern used everywhere else.

alter table attendance enable row level security;

drop policy if exists attendance_org_select on attendance;
drop policy if exists attendance_org_insert on attendance;
drop policy if exists attendance_org_update on attendance;

create policy attendance_org_select on attendance
  for select using (is_org_member(org_id));
create policy attendance_org_insert on attendance
  for insert with check (is_org_member(org_id));
create policy attendance_org_update on attendance
  for update using (is_org_member(org_id));

alter table lesson_reminder_log enable row level security;

drop policy if exists lesson_log_org_select on lesson_reminder_log;

create policy lesson_log_org_select on lesson_reminder_log
  for select using (is_org_member(org_id));
-- writes happen via service-role key from the cron — RLS bypassed there.
