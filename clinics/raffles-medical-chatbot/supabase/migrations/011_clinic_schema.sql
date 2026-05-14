-- 011_clinic_schema.sql
-- Adds clinic-specific columns to existing tables.
-- All columns use IF NOT EXISTS so this is safe to re-run.

ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS consultation_type text,
  ADD COLUMN IF NOT EXISTS doctor_specialisation text,
  ADD COLUMN IF NOT EXISTS medisave_eligible boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_referral boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS teleconsult_available boolean DEFAULT false;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS nric_last4 text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS preferred_doctor_id uuid;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS appointment_type text DEFAULT 'consultation',
  ADD COLUMN IF NOT EXISTS escalated_to_nurse boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS clinic_form_sent boolean DEFAULT false;

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS clinic_type text,
  ADD COLUMN IF NOT EXISTS has_xray boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_lab boolean DEFAULT false;
