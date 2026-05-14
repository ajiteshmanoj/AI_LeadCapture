-- 011_salon_schema.sql
-- Salon-specific columns appended to existing tuition-chatbot tables.
-- Append-only: never edit applied migrations.

ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS service_category text,
  ADD COLUMN IF NOT EXISTS service_duration_minutes integer DEFAULT 60,
  ADD COLUMN IF NOT EXISTS requires_deposit boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hair_length_category text,
  ADD COLUMN IF NOT EXISTS is_unisex boolean DEFAULT true;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS preferred_stylist text,
  ADD COLUMN IF NOT EXISTS hair_type text,
  ADD COLUMN IF NOT EXISTS last_visited date,
  ADD COLUMN IF NOT EXISTS loyalty_points integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS colour_allergies text;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS stylist_requested text,
  ADD COLUMN IF NOT EXISTS deposit_collected boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_amount_collected numeric(10,2),
  ADD COLUMN IF NOT EXISTS reschedule_count integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS stylists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  name text NOT NULL,
  tier text DEFAULT 'Stylist',
  specialisation text[],
  years_experience integer,
  bio text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stylists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members manage stylists"
  ON stylists FOR ALL
  USING (is_org_member(org_id))
  WITH CHECK (is_org_member(org_id));
