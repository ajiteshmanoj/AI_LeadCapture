-- 012_seed_virgin_active.sql
-- Seeds Virgin Active Singapore demo organisation, clubs, classes, membership tiers, and FAQs.
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING).

-- ─── Organisation ────────────────────────────────────────────────────────────
INSERT INTO organisations (id, name, slug, address, phone, email, settings, is_onboarded, onboarding_step)
VALUES (
  '33000000-0000-0000-0000-000000000001',
  'Virgin Active Singapore',
  'virgin-active',
  '238 Thomson Road, #01-01 Novena Square, Singapore 307683',
  '+65 6250 0000',
  'singapore@virginactive.com.sg',
  jsonb_build_object(
    'bot_name', 'Alex',
    'welcome_message', 'Hi! I''m Alex from Virgin Active Singapore. How can I help you today?',
    'primary_color', '#E3000F',
    'contact_person', 'our Member Services team'
  ),
  true,
  'widget'
)
ON CONFLICT (id) DO NOTHING;

-- ─── Locations (Clubs) ───────────────────────────────────────────────────────
INSERT INTO locations (id, org_id, name, address, postal_code, mrt_nearest, phone, is_active)
VALUES
  (
    '33000000-0000-0000-0001-000000000001',
    '33000000-0000-0000-0000-000000000001',
    'Virgin Active Novena',
    '238 Thomson Road, #01-01 Novena Square',
    '307683',
    'Novena MRT (NS20)',
    '+65 6250 0001',
    true
  ),
  (
    '33000000-0000-0000-0001-000000000002',
    '33000000-0000-0000-0000-000000000001',
    'Virgin Active Raffles Place',
    '30 Raffles Place, #04-01 Chevron House',
    '048622',
    'Raffles Place MRT (EW14/NS26)',
    '+65 6250 0002',
    true
  ),
  (
    '33000000-0000-0000-0001-000000000003',
    '33000000-0000-0000-0000-000000000001',
    'Virgin Active VivoCity',
    '1 HarbourFront Walk, #03-01 VivoCity',
    '098585',
    'HarbourFront MRT (CC29/NE1)',
    '+65 6250 0003',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Classes ─────────────────────────────────────────────────────────────────
INSERT INTO classes (id, org_id, location_id, subject, level, class_category, fitness_level, class_duration_minutes, teacher_name, day_of_week, start_time, end_time, max_capacity, current_enrollment, monthly_fee, registration_fee, material_fee, is_active)
VALUES
  (
    '33000000-0000-0000-0002-000000000001',
    '33000000-0000-0000-0000-000000000001',
    '33000000-0000-0000-0001-000000000001',
    'Hot Yoga',
    'All levels',
    'Yoga',
    'all',
    60,
    'Sarah Lee',
    'Monday',
    '07:00:00',
    '08:00:00',
    20,
    14,
    0,
    0,
    0,
    true
  ),
  (
    '33000000-0000-0000-0002-000000000002',
    '33000000-0000-0000-0000-000000000001',
    '33000000-0000-0000-0001-000000000001',
    'HIIT Blast',
    'Intermediate',
    'HIIT',
    'intermediate',
    45,
    'Mike Chen',
    'Wednesday',
    '18:30:00',
    '19:15:00',
    24,
    22,
    0,
    0,
    0,
    true
  ),
  (
    '33000000-0000-0000-0002-000000000003',
    '33000000-0000-0000-0000-000000000001',
    '33000000-0000-0000-0001-000000000002',
    'Spinning',
    'All levels',
    'Cycling',
    'all',
    60,
    'Priya Nair',
    'Tuesday',
    '07:00:00',
    '08:00:00',
    20,
    10,
    0,
    0,
    0,
    true
  ),
  (
    '33000000-0000-0000-0002-000000000004',
    '33000000-0000-0000-0000-000000000001',
    '33000000-0000-0000-0001-000000000002',
    'Boxing Cardio',
    'Beginner',
    'Boxing',
    'beginner',
    60,
    'James Tan',
    'Thursday',
    '12:00:00',
    '13:00:00',
    16,
    8,
    0,
    0,
    0,
    true
  ),
  (
    '33000000-0000-0000-0002-000000000005',
    '33000000-0000-0000-0000-000000000001',
    '33000000-0000-0000-0001-000000000003',
    'Aqua Aerobics',
    'All levels',
    'Aqua',
    'all',
    60,
    'Linda Wong',
    'Saturday',
    '10:00:00',
    '11:00:00',
    20,
    6,
    0,
    0,
    0,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ─── Membership Tiers ────────────────────────────────────────────────────────
INSERT INTO membership_tiers (id, org_id, name, monthly_fee, joining_fee, included_classes, guest_passes_per_month, features, is_active)
VALUES
  (
    '33000000-0000-0000-0003-000000000001',
    '33000000-0000-0000-0000-000000000001',
    'Classic',
    99.00,
    0.00,
    NULL,
    0,
    ARRAY['Access to all clubs', 'Unlimited fitness classes', 'State-of-the-art gym equipment', 'Locker room access'],
    true
  ),
  (
    '33000000-0000-0000-0003-000000000002',
    '33000000-0000-0000-0000-000000000001',
    'Plus',
    139.00,
    0.00,
    NULL,
    1,
    ARRAY['Everything in Classic', '1 guest pass per month', 'Spa & wellness access', 'Priority class booking'],
    true
  ),
  (
    '33000000-0000-0000-0003-000000000003',
    '33000000-0000-0000-0000-000000000001',
    'Premium',
    179.00,
    0.00,
    NULL,
    2,
    ARRAY['Everything in Plus', '2 guest passes per month', '1 personal training session per month', 'Towel service included', 'Exclusive premium lounge access'],
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ─── FAQs ────────────────────────────────────────────────────────────────────
INSERT INTO faqs (org_id, question, answer, category, sort_order, is_active)
VALUES
  (
    '33000000-0000-0000-0000-000000000001',
    'How much does a Virgin Active membership cost?',
    'We have three membership tiers: Classic at $99/month (full club and class access), Plus at $139/month (includes 1 guest pass/month and spa access), and Premium at $179/month (includes 2 guest passes, 1 PT session/month, and towel service). There is no joining fee.',
    'membership',
    1,
    true
  ),
  (
    '33000000-0000-0000-0000-000000000001',
    'Can I try a class before joining?',
    'Yes! We offer complimentary trial classes for new visitors. Just let us know which class and club you''re interested in, and we''ll get you booked in. No membership required for your first trial class.',
    'trial',
    2,
    true
  ),
  (
    '33000000-0000-0000-0000-000000000001',
    'Do I need to book classes in advance?',
    'Yes, class booking is required to guarantee your spot. You can book via our chatbot, the Virgin Active app, or by calling your preferred club directly. We recommend booking at least 24 hours in advance as popular classes fill up fast.',
    'booking',
    3,
    true
  ),
  (
    '33000000-0000-0000-0000-000000000001',
    'What is your cancellation policy?',
    'You can cancel a class booking up to 2 hours before the class starts without penalty. Late cancellations or no-shows may result in a strike against your account. Three strikes in a month may temporarily restrict your booking privileges.',
    'policy',
    4,
    true
  ),
  (
    '33000000-0000-0000-0000-000000000001',
    'Which Virgin Active clubs have a swimming pool?',
    'Our VivoCity club features a full 25-metre swimming pool and offers Aqua Aerobics classes. Please check with individual clubs for the latest facilities information as amenities may vary.',
    'facilities',
    5,
    true
  )
ON CONFLICT DO NOTHING;
