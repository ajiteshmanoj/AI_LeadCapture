-- =============================================================================
-- 006_telegram_webhook_secret.sql
-- Per-org secret used to validate inbound Telegram webhooks. Telegram echoes
-- this back as X-Telegram-Bot-Api-Secret-Token; the webhook rejects requests
-- whose header doesn't match the org row.
-- =============================================================================

alter table organisations
  add column if not exists telegram_webhook_secret text;
