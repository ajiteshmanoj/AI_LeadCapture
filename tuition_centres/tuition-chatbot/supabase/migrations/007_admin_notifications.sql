-- =============================================================================
-- 007_admin_notifications.sql
-- Per-org admin notification target. The centre owner runs `/linkadmin <code>`
-- against their Telegram bot once; we capture their chat id and ping them
-- whenever something noteworthy happens (booking, waitlist, escalation).
-- =============================================================================

alter table organisations
  add column if not exists admin_telegram_chat_id text,
  add column if not exists admin_link_code text,
  add column if not exists admin_link_code_expires_at timestamptz;
