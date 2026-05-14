-- 012_seed_din_tai_fung.sql
-- Seed data for Din Tai Fung Singapore demo org.
-- Safe to re-run (uses ON CONFLICT DO NOTHING).

-- ── Organisation ─────────────────────────────────────────────────────────────
INSERT INTO organisations (
  id,
  name,
  slug,
  address,
  phone,
  email,
  settings,
  is_onboarded,
  onboarding_step
) VALUES (
  '22000000-0000-0000-0000-000000000001',
  'Din Tai Fung Singapore',
  'din-tai-fung',
  '290 Orchard Rd, #B1-03 Paragon, Singapore 238859',
  '+65 6836 8336',
  'reservations@dintaifung.com.sg',
  jsonb_build_object(
    'bot_name', 'Mei',
    'primary_color', '#8B0000',
    'welcome_message', 'Hi! I am Mei from Din Tai Fung Singapore. I can help you with reservations, menu questions, and outlet information. How can I assist you today?',
    'contact_person', 'our reservations team'
  ),
  true,
  'widget'
) ON CONFLICT (id) DO NOTHING;

-- ── Locations (outlets) ───────────────────────────────────────────────────────
INSERT INTO locations (id, org_id, name, address, postal_code, mrt_nearest, phone, is_active)
VALUES
  (
    '22000000-0000-0000-0000-000000000010',
    '22000000-0000-0000-0000-000000000001',
    'Din Tai Fung @ Paragon',
    '290 Orchard Rd, #B1-03 Paragon',
    '238859',
    'Somerset MRT (Exit C, 3-min walk)',
    '+65 6836 8336',
    true
  ),
  (
    '22000000-0000-0000-0000-000000000011',
    '22000000-0000-0000-0000-000000000001',
    'Din Tai Fung @ ION Orchard',
    '2 Orchard Turn, #03-22 ION Orchard',
    '238801',
    'Orchard MRT (direct basement link)',
    '+65 6509 9531',
    true
  ),
  (
    '22000000-0000-0000-0000-000000000012',
    '22000000-0000-0000-0000-000000000001',
    'Din Tai Fung @ VivoCity',
    '1 HarbourFront Walk, #01-116/117 VivoCity',
    '098585',
    'HarbourFront MRT (direct mall link)',
    '+65 6376 9265',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ── Reservation slots (classes table) ────────────────────────────────────────
-- subject  → Time Slot / Occasion label
-- level    → Max Party Size descriptor
-- monthly_fee → Deposit Required ($)

INSERT INTO classes (
  id, org_id, subject, level, class_type,
  day_of_week, start_time, end_time,
  teacher_name, max_capacity, current_enrollment,
  monthly_fee, registration_fee, material_fee,
  location_id, is_active,
  requires_deposit, deposit_amount, max_pax, min_pax
) VALUES
  -- Lunch Paragon
  (
    '22000000-0000-0000-0000-000000000020',
    '22000000-0000-0000-0000-000000000001',
    'Lunch Service',
    'up to 8 pax',
    'group',
    'Monday', '11:30:00', '14:30:00',
    null, 40, 0,
    0, 0, 0,
    '22000000-0000-0000-0000-000000000010',
    true,
    false, 0, 8, 1
  ),
  -- Dinner Paragon
  (
    '22000000-0000-0000-0000-000000000021',
    '22000000-0000-0000-0000-000000000001',
    'Dinner Service',
    'up to 8 pax',
    'group',
    'Monday', '18:00:00', '22:00:00',
    null, 40, 0,
    0, 0, 0,
    '22000000-0000-0000-0000-000000000010',
    true,
    false, 0, 8, 1
  ),
  -- Lunch ION
  (
    '22000000-0000-0000-0000-000000000022',
    '22000000-0000-0000-0000-000000000001',
    'Lunch Service',
    'up to 8 pax',
    'group',
    'Monday', '11:30:00', '14:30:00',
    null, 50, 0,
    0, 0, 0,
    '22000000-0000-0000-0000-000000000011',
    true,
    false, 0, 8, 1
  ),
  -- Dinner ION
  (
    '22000000-0000-0000-0000-000000000023',
    '22000000-0000-0000-0000-000000000001',
    'Dinner Service',
    'up to 8 pax',
    'group',
    'Monday', '18:00:00', '22:00:00',
    null, 50, 0,
    0, 0, 0,
    '22000000-0000-0000-0000-000000000011',
    true,
    false, 0, 8, 1
  ),
  -- Private Dining Room Paragon (requires deposit for 10+ pax, max 20)
  (
    '22000000-0000-0000-0000-000000000024',
    '22000000-0000-0000-0000-000000000001',
    'Private Dining Room',
    'up to 20 pax',
    'group',
    'Monday', '11:30:00', '22:00:00',
    null, 4, 0,
    50, 0, 0,
    '22000000-0000-0000-0000-000000000010',
    true,
    true, 50.00, 20, 10
  )
ON CONFLICT (id) DO NOTHING;

-- ── FAQs ─────────────────────────────────────────────────────────────────────
INSERT INTO faqs (id, org_id, question, answer, category, sort_order, is_active)
VALUES
  (
    '22000000-0000-0000-0000-000000000030',
    '22000000-0000-0000-0000-000000000001',
    'Is Din Tai Fung Halal-certified?',
    'No. Din Tai Fung Singapore is NOT Halal-certified. Our kitchen uses pork products (including lard in some doughs), and we do not hold any Halal certification from MUIS or any other body. We are unable to make any Halal guarantees.',
    'dietary',
    1,
    true
  ),
  (
    '22000000-0000-0000-0000-000000000031',
    '22000000-0000-0000-0000-000000000001',
    'Do you accept reservations?',
    'Yes! We accept reservations for groups of 5 or more at most outlets. Groups of up to 4 are welcome to walk in and join our queue. For private dining rooms (groups of 10–20), a refundable deposit of $50/table applies. You can make a reservation via this chat, our website, or by calling the outlet directly.',
    'reservations',
    2,
    true
  ),
  (
    '22000000-0000-0000-0000-000000000032',
    '22000000-0000-0000-0000-000000000001',
    'What are your signature dishes?',
    'Our most iconic dish is the Steamed Pork Xiao Long Bao (soup dumplings) — each one is hand-crafted with exactly 18 pleats. Other signatures include: Steamed Truffle & Pork Xiao Long Bao, Pan-Fried Pork Chop Noodle, Braised Beef Noodle, Pork Chop Fried Rice, and our Chocolate and Taro Xiao Long Bao for dessert.',
    'menu',
    3,
    true
  ),
  (
    '22000000-0000-0000-0000-000000000033',
    '22000000-0000-0000-0000-000000000001',
    'Do you have vegetarian options?',
    'Yes, we have a dedicated vegetarian menu including Steamed Vegetable & Mushroom Dumplings, Vegetarian Fried Rice, and various noodle dishes without meat. Please note that our kitchen is a shared kitchen — we cannot guarantee zero cross-contamination with pork or other allergens. If you have severe allergies, please speak to our staff directly.',
    'dietary',
    4,
    true
  ),
  (
    '22000000-0000-0000-0000-000000000034',
    '22000000-0000-0000-0000-000000000001',
    'Do you offer catering or large group dining?',
    'We cater for corporate events, celebrations, and large groups. For groups over 20 pax or off-site catering enquiries, please contact our reservations team at reservations@dintaifung.com.sg or call +65 6836 8336. We will connect you with our events team who can discuss custom menus and arrangements.',
    'catering',
    5,
    true
  )
ON CONFLICT (id) DO NOTHING;
