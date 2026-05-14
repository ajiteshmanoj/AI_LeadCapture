-- 012_seed_jean_yip.sql
-- Seed data for Jean Yip Group demo org.
-- Safe to skip in environments where the org already exists.

-- ── Organisation ──────────────────────────────────────────────────────────────
INSERT INTO organisations (
  id, name, slug, address, phone, email,
  settings, is_onboarded, onboarding_step
) VALUES (
  '44000000-0000-0000-0000-000000000001',
  'Jean Yip Group',
  'jean-yip',
  '1 Jurong West Central 2, #B1-01 Jurong Point, Singapore 648886',
  '+65 6790 0001',
  'enquiries@jeanyip.com.sg',
  '{"bot_name":"Fiona","welcome_message":"Hi! I''m Fiona from Jean Yip. How can I help you today?","primary_color":"#C9A96E","contact_person":"salon manager"}',
  true,
  'widget'
) ON CONFLICT (id) DO NOTHING;

-- ── Locations ─────────────────────────────────────────────────────────────────
INSERT INTO locations (id, org_id, name, address, postal_code, mrt_nearest, phone, is_active) VALUES
(
  '44000000-0000-0000-0000-000000000011',
  '44000000-0000-0000-0000-000000000001',
  'Jean Yip @ Jurong Point',
  '1 Jurong West Central 2, #B1-01, Singapore 648886',
  '648886',
  'Boon Lay MRT (EW27) — direct covered walkway',
  '+65 6790 0001',
  true
),
(
  '44000000-0000-0000-0000-000000000012',
  '44000000-0000-0000-0000-000000000001',
  'Jean Yip @ Tampines Mall',
  '4 Tampines Central 5, #03-28, Singapore 529510',
  '529510',
  'Tampines MRT (EW2/DT32) — 3-min walk',
  '+65 6789 0002',
  true
),
(
  '44000000-0000-0000-0000-000000000013',
  '44000000-0000-0000-0000-000000000001',
  'Jean Yip @ Bugis Junction',
  '200 Victoria Street, #03-20, Singapore 188021',
  '188021',
  'Bugis MRT (EW12/DT14) — direct link via junction',
  '+65 6334 0003',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ── Services (classes table, salon-specific columns) ──────────────────────────
INSERT INTO classes (
  id, org_id, subject, level, class_type, day_of_week, start_time, end_time,
  teacher_name, max_capacity, current_enrollment, monthly_fee, registration_fee,
  material_fee, is_active, location_id,
  service_category, service_duration_minutes, requires_deposit, deposit_amount,
  hair_length_category, is_unisex
) VALUES
-- Haircut & Blow Dry — Short/Medium (all salons, no deposit)
(
  '44000000-0000-0000-0000-000000000021',
  '44000000-0000-0000-0000-000000000001',
  'Haircut & Blow Dry', 'Short / Medium', 'group', 'Monday', '10:00:00', '11:00:00',
  NULL, 20, 0, 68, 0, 0, true, NULL,
  'cut', 60, false, 0, 'short-medium', true
),
-- Full Colour — Short (deposit required, >$100)
(
  '44000000-0000-0000-0000-000000000022',
  '44000000-0000-0000-0000-000000000001',
  'Full Colour', 'Short', 'group', 'Monday', '10:00:00', '11:30:00',
  NULL, 12, 0, 120, 0, 0, true, NULL,
  'colour', 90, true, 36, 'short', true
),
-- Balayage + Toner — Long (deposit required, >$100 and >2hrs)
(
  '44000000-0000-0000-0000-000000000023',
  '44000000-0000-0000-0000-000000000001',
  'Balayage + Toner', 'Long', 'group', 'Monday', '10:00:00', '13:00:00',
  NULL, 8, 0, 280, 0, 0, true, NULL,
  'colour', 180, true, 84, 'long', true
),
-- Keratin Treatment — Medium (deposit required)
(
  '44000000-0000-0000-0000-000000000024',
  '44000000-0000-0000-0000-000000000001',
  'Keratin Treatment', 'Medium', 'group', 'Monday', '10:00:00', '12:30:00',
  NULL, 6, 0, 220, 0, 0, true, NULL,
  'treatment', 150, true, 66, 'medium', true
),
-- Digital Perm — Short/Medium (deposit required)
(
  '44000000-0000-0000-0000-000000000025',
  '44000000-0000-0000-0000-000000000001',
  'Digital Perm', 'Short / Medium', 'group', 'Monday', '10:00:00', '12:00:00',
  NULL, 8, 0, 160, 0, 0, true, NULL,
  'perm', 120, true, 48, 'short-medium', true
)
ON CONFLICT (id) DO NOTHING;

-- ── Stylists ──────────────────────────────────────────────────────────────────
INSERT INTO stylists (id, org_id, location_id, name, tier, specialisation, years_experience, bio, is_active) VALUES
(
  '44000000-0000-0000-0000-000000000031',
  '44000000-0000-0000-0000-000000000001',
  '44000000-0000-0000-0000-000000000011',
  'Kelly Tan',
  'Senior',
  ARRAY['colouring', 'balayage', 'highlights'],
  8,
  'Kelly specialises in natural-looking balayage and lived-in colour. She has a loyal clientele at Jurong Point and is known for her attention to hair health.',
  true
),
(
  '44000000-0000-0000-0000-000000000032',
  '44000000-0000-0000-0000-000000000001',
  '44000000-0000-0000-0000-000000000012',
  'Xiao Mei',
  'Principal',
  ARRAY['balayage', 'bridal styling', 'ombre', 'creative colour'],
  13,
  'Xiao Mei is a Principal Stylist with over a decade of experience in editorial and bridal hair. Book at least 2 weeks ahead for weekend slots.',
  true
),
(
  '44000000-0000-0000-0000-000000000033',
  '44000000-0000-0000-0000-000000000001',
  '44000000-0000-0000-0000-000000000013',
  'Ahmad Firdaus',
  'Stylist',
  ARRAY['haircut', 'perm', 'men''s grooming', 'rebonding'],
  5,
  'Firdaus is a versatile stylist at Bugis Junction, popular for precision cuts and digital perms. Great with both straight and curly hair textures.',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ── FAQs ──────────────────────────────────────────────────────────────────────
INSERT INTO faqs (org_id, question, answer, category, sort_order, is_active) VALUES
(
  '44000000-0000-0000-0000-000000000001',
  'How do I book an appointment?',
  'You can book directly here in chat — just tell me what service you''re looking for and your preferred salon, and I''ll help you secure a slot. Alternatively, call your nearest Jean Yip outlet or walk in (subject to availability).',
  'booking',
  1,
  true
),
(
  '44000000-0000-0000-0000-000000000001',
  'Do I need to pay a deposit?',
  'A 30% deposit is required for colour, chemical, and treatment services priced above $100 or lasting more than 2 hours. For haircuts and blow-dries, no deposit is needed. The deposit is deducted from your final bill on the day.',
  'payment',
  2,
  true
),
(
  '44000000-0000-0000-0000-000000000001',
  'Can I request a specific stylist?',
  'Yes — just let me know who you''d like when booking and I''ll check their availability. Note that Principal and Creative Director stylists tend to book out faster, so we recommend booking at least 1–2 weeks ahead for them.',
  'booking',
  3,
  true
),
(
  '44000000-0000-0000-0000-000000000001',
  'What is the cancellation policy?',
  'Please give us at least 24 hours'' notice if you need to cancel or reschedule. Cancellations with less than 24 hours'' notice will forfeit the deposit. We understand emergencies happen — contact us as early as possible and we''ll do our best.',
  'policy',
  4,
  true
),
(
  '44000000-0000-0000-0000-000000000001',
  'How much does a haircut cost?',
  'Haircut pricing starts from $38 for Junior Stylists and goes up to $120+ for Creative Directors, depending on hair length and complexity. A standard Haircut & Blow Dry with a Senior Stylist for short-to-medium hair is $68. Prices are quoted before we start — no surprises.',
  'pricing',
  5,
  true
)
ON CONFLICT DO NOTHING;
