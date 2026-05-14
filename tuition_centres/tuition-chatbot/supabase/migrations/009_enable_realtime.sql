-- =============================================================================
-- 009_enable_realtime.sql
-- Enable Postgres logical replication on conversation + message tables so
-- the dashboard can subscribe to live updates.
--
-- Idempotent: re-adding a table to the publication errors otherwise.
-- =============================================================================

do $$
begin
  alter publication supabase_realtime add table messages;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table conversations;
exception when duplicate_object then null;
end $$;
