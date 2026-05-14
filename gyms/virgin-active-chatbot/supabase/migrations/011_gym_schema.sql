-- 011_gym_schema.sql
-- Adds gym-specific columns to existing tables and creates membership_tiers table.

ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS class_category text,
  ADD COLUMN IF NOT EXISTS fitness_level text DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS equipment_required text[],
  ADD COLUMN IF NOT EXISTS is_virtual boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS class_duration_minutes integer DEFAULT 60;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS membership_tier text,
  ADD COLUMN IF NOT EXISTS membership_expiry date,
  ADD COLUMN IF NOT EXISTS fitness_goals text[],
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS is_guest_pass boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS membership_tier_at_booking text;

CREATE TABLE IF NOT EXISTS membership_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name text NOT NULL,
  monthly_fee numeric(10,2),
  joining_fee numeric(10,2) DEFAULT 0,
  included_classes integer,
  guest_passes_per_month integer DEFAULT 0,
  features text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members manage membership_tiers" ON membership_tiers
  FOR ALL
  USING (is_org_member(org_id))
  WITH CHECK (is_org_member(org_id));
