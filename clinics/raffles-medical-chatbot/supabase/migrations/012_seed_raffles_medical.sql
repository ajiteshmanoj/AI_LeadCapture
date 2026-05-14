-- 012_seed_raffles_medical.sql
-- Seeds Raffles Medical Group demo data.
-- Skip this in production — it is for development / demo purposes only.

-- ── Organisation ────────────────────────────────────────────────────────────
INSERT INTO organisations (
  id,
  name,
  slug,
  is_onboarded,
  onboarding_step,
  settings
) VALUES (
  '11000000-0000-0000-0000-000000000001',
  'Raffles Medical Group',
  'raffles-medical',
  true,
  'widget',
  jsonb_build_object(
    'bot_name',       'Priya',
    'primary_color',  '#003087',
    'welcome_message','Hi! I am Priya, your patient services coordinator at Raffles Medical Group. How can I help you today?',
    'contact_person', 'our patient services team'
  )
) ON CONFLICT (id) DO NOTHING;

-- ── Locations ────────────────────────────────────────────────────────────────
INSERT INTO locations (id, org_id, name, address, postal_code, mrt_nearest, phone, is_active, clinic_type, has_xray, has_lab) VALUES
  (
    '11000000-0000-0000-0000-000000000101',
    '11000000-0000-0000-0000-000000000001',
    'Raffles Hospital City Hall',
    '585 North Bridge Road, Raffles Hospital, Singapore',
    '188770',
    'City Hall MRT (EW13/NS25)',
    '+65 6311 1111',
    true,
    'hospital',
    true,
    true
  ),
  (
    '11000000-0000-0000-0000-000000000102',
    '11000000-0000-0000-0000-000000000001',
    'Raffles Medical Holland Village',
    '118 Holland Avenue, #01-01, Singapore',
    '278997',
    'Holland Village MRT (CC21)',
    '+65 6462 5288',
    true,
    'clinic',
    false,
    true
  ),
  (
    '11000000-0000-0000-0000-000000000103',
    '11000000-0000-0000-0000-000000000001',
    'Raffles Medical Woodlands',
    '900 South Woodlands Drive, #01-01 Woodlands Civic Centre, Singapore',
    '730900',
    'Woodlands MRT (NS9)',
    '+65 6363 1818',
    true,
    'clinic',
    false,
    false
  )
ON CONFLICT (id) DO NOTHING;

-- ── Appointment types (stored as "classes") ───────────────────────────────────
INSERT INTO classes (
  id, org_id, subject, level, teacher_name,
  day_of_week, start_time, end_time,
  max_capacity, current_enrollment, monthly_fee,
  registration_fee, material_fee, is_active, location_id,
  consultation_type, doctor_specialisation, medisave_eligible, requires_referral
) VALUES
  (
    '11000000-0000-0000-0000-000000000201',
    '11000000-0000-0000-0000-000000000001',
    'General Practice', 'GP',
    'Dr Tan Wei Ming',
    'Monday', '09:00', '12:00',
    20, 0, 38, 0, 0, true,
    '11000000-0000-0000-0000-000000000101',
    'GP Consultation', 'General Practice', false, false
  ),
  (
    '11000000-0000-0000-0000-000000000202',
    '11000000-0000-0000-0000-000000000001',
    'Cardiology', 'Specialist',
    'Dr Lee Kok Weng',
    'Tuesday', '10:00', '17:00',
    10, 0, 200, 0, 0, true,
    '11000000-0000-0000-0000-000000000101',
    'Specialist Consultation', 'Cardiology', true, true
  ),
  (
    '11000000-0000-0000-0000-000000000203',
    '11000000-0000-0000-0000-000000000001',
    'General Practice', 'GP',
    'Dr Sarah Goh',
    'Monday', '08:30', '17:30',
    15, 0, 38, 0, 0, true,
    '11000000-0000-0000-0000-000000000102',
    'GP Consultation', 'General Practice', false, false
  ),
  (
    '11000000-0000-0000-0000-000000000204',
    '11000000-0000-0000-0000-000000000001',
    'Executive Health Screening', 'Health Screening',
    NULL,
    'Wednesday', '08:00', '13:00',
    8, 0, 350, 0, 0, true,
    '11000000-0000-0000-0000-000000000102',
    'Health Screening', 'Preventive Medicine', true, false
  ),
  (
    '11000000-0000-0000-0000-000000000205',
    '11000000-0000-0000-0000-000000000001',
    'General Practice', 'GP',
    'Dr Ravi Kumar',
    'Monday', '08:30', '17:30',
    15, 0, 38, 0, 0, true,
    '11000000-0000-0000-0000-000000000103',
    'GP Consultation', 'General Practice', false, false
  )
ON CONFLICT (id) DO NOTHING;

-- ── FAQs ─────────────────────────────────────────────────────────────────────
INSERT INTO faqs (id, org_id, question, answer, category, sort_order, is_active) VALUES
  (
    '11000000-0000-0000-0000-000000000301',
    '11000000-0000-0000-0000-000000000001',
    'How much does a GP consultation cost?',
    'A standard GP consultation at Raffles Medical is $38. This covers the consultation fee; medication and diagnostic tests are charged separately if required.',
    'fees',
    1,
    true
  ),
  (
    '11000000-0000-0000-0000-000000000302',
    '11000000-0000-0000-0000-000000000001',
    'Do you accept walk-in patients?',
    'Yes, we accept walk-in patients at all our clinics during operating hours. However, booking an appointment in advance helps reduce your waiting time. You can book via this chat or call your preferred clinic directly.',
    'appointments',
    2,
    true
  ),
  (
    '11000000-0000-0000-0000-000000000303',
    '11000000-0000-0000-0000-000000000001',
    'Can I use Medisave for my appointment?',
    'Medisave can be used for certain specialist consultations and approved health screenings at Raffles Medical. It is not claimable for standard GP consultations. Our staff can advise you on eligibility when you book.',
    'payments',
    3,
    true
  ),
  (
    '11000000-0000-0000-0000-000000000304',
    '11000000-0000-0000-0000-000000000001',
    'What should I bring for my first visit?',
    'Please bring your NRIC or passport, your insurance card (if applicable), any referral letters, and a list of current medications. For health screenings, please fast for at least 8 hours beforehand.',
    'appointments',
    4,
    true
  ),
  (
    '11000000-0000-0000-0000-000000000305',
    '11000000-0000-0000-0000-000000000001',
    'Is teleconsultation available?',
    'Yes, Raffles Medical offers teleconsultation for follow-up appointments and minor ailments. You can book a teleconsult through this chat. Please note that teleconsults are not suitable for emergencies or conditions requiring a physical examination.',
    'appointments',
    5,
    true
  )
ON CONFLICT (id) DO NOTHING;
