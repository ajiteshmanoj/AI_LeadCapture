-- =============================================================================
-- 008_parent_channels.sql
-- Per-parent messaging-channel ids so we can reach them after the booking.
-- Web bookers opt in via deep link; Telegram bookers are linked automatically
-- when their chat starts. WhatsApp column is prepared for the future port.
-- =============================================================================

alter table students
  add column if not exists telegram_chat_id text,
  add column if not exists whatsapp_chat_id text;

create index if not exists idx_students_telegram_chat
  on students(telegram_chat_id) where telegram_chat_id is not null;
create index if not exists idx_students_whatsapp_chat
  on students(whatsapp_chat_id) where whatsapp_chat_id is not null;

-- Bot username is needed to construct https://t.me/<username>?start=... deep
-- links. Fetched on connect; lazily backfilled on existing rows.
alter table organisations
  add column if not exists telegram_bot_username text;
