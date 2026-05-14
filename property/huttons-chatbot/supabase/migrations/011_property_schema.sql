ALTER TABLE classes ADD COLUMN IF NOT EXISTS property_type text, ADD COLUMN IF NOT EXISTS tenure text, ADD COLUMN IF NOT EXISTS psf numeric(10,2), ADD COLUMN IF NOT EXISTS floor_area_sqft integer, ADD COLUMN IF NOT EXISTS asking_price numeric(12,2), ADD COLUMN IF NOT EXISTS district text, ADD COLUMN IF NOT EXISTS mrt_distance_minutes integer, ADD COLUMN IF NOT EXISTS listing_type text DEFAULT 'sale';

ALTER TABLE students ADD COLUMN IF NOT EXISTS lead_score text DEFAULT 'cold', ADD COLUMN IF NOT EXISTS budget_min numeric(12,2), ADD COLUMN IF NOT EXISTS budget_max numeric(12,2), ADD COLUMN IF NOT EXISTS preferred_property_type text[], ADD COLUMN IF NOT EXISTS preferred_tenure text, ADD COLUMN IF NOT EXISTS preferred_district text[], ADD COLUMN IF NOT EXISTS citizenship_status text, ADD COLUMN IF NOT EXISTS utm_source text, ADD COLUMN IF NOT EXISTS assigned_agent text;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS viewing_address text, ADD COLUMN IF NOT EXISTS agent_name text, ADD COLUMN IF NOT EXISTS lead_qualified boolean DEFAULT false, ADD COLUMN IF NOT EXISTS follow_up_date date;

CREATE TABLE IF NOT EXISTS property_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  assigned_agent_name text,
  title text NOT NULL,
  property_type text NOT NULL,
  tenure text,
  asking_price numeric(12,2),
  floor_area_sqft integer,
  psf numeric(10,2),
  num_bedrooms integer,
  num_bathrooms integer,
  district text,
  address text,
  mrt_nearest text,
  mrt_distance_minutes integer,
  listing_type text DEFAULT 'sale',
  status text DEFAULT 'active',
  highlights text[],
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_listings_org ON property_listings(org_id, status);
ALTER TABLE property_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members manage property_listings" ON property_listings FOR ALL USING (is_org_member(org_id)) WITH CHECK (is_org_member(org_id));
