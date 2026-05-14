-- 011_fnb_schema.sql
-- F&B extensions: reservation-specific columns on existing tables + new menu_items table.

ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS max_pax integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS min_pax integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS occasion_type text,
  ADD COLUMN IF NOT EXISTS menu_type text DEFAULT 'a_la_carte',
  ADD COLUMN IF NOT EXISTS requires_deposit boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric(10,2) DEFAULT 0;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS pax integer,
  ADD COLUMN IF NOT EXISTS dietary_requirements text[],
  ADD COLUMN IF NOT EXISTS occasion text,
  ADD COLUMN IF NOT EXISTS seating_preference text;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS confirmed_pax integer,
  ADD COLUMN IF NOT EXISTS special_requests text,
  ADD COLUMN IF NOT EXISTS deposit_paid boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_reference text;

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2),
  dietary_tags text[],
  category text,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_org ON menu_items(org_id, is_available);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members manage menu_items" ON menu_items
  FOR ALL
  USING (is_org_member(org_id))
  WITH CHECK (is_org_member(org_id));
