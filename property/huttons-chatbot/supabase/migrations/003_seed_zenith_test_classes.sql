-- Test classes for Zenith Education Studio so the booking flow has rows to
-- match against. One full class included to exercise the waitlist path.

insert into classes (
  id, org_id, subject, level, class_type, day_of_week, start_time, end_time,
  teacher_name, max_capacity, current_enrollment, monthly_fee,
  registration_fee, material_fee, is_active
) values
  (
    '00000000-0000-0000-0000-0000000c1a55',
    '00000000-0000-0000-0000-000000000002',
    'Mathematics', 'P5', 'group',
    'Wednesday', '17:00', '18:30',
    'Ms Tan', 8, 3, 320.00, 50.00, 30.00, true
  ),
  (
    '00000000-0000-0000-0000-0000000c1a56',
    '00000000-0000-0000-0000-000000000002',
    'A-Math', 'Sec 3', 'group',
    'Saturday', '10:00', '11:30',
    'Mr Lim', 8, 8, 380.00, 50.00, 40.00, true
  ),
  (
    '00000000-0000-0000-0000-0000000c1a57',
    '00000000-0000-0000-0000-000000000002',
    'H2 Mathematics', 'JC1', 'group',
    'Tuesday', '19:00', '21:00',
    'Dr Wong', 6, 2, 480.00, 50.00, 50.00, true
  )
on conflict (id) do nothing;
