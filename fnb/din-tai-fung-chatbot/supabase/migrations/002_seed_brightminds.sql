-- =============================================================================
-- Seed data: BrightMinds Tuition (fictional centre in Jurong East)
-- Run AFTER 001_initial_schema.sql for local dev/demo only.
-- =============================================================================

insert into organisations (
  id, name, slug, address, phone, email, operating_hours, settings
) values (
  '00000000-0000-0000-0000-000000000001',
  'BrightMinds Tuition',
  'brightminds',
  '123 Jurong East Street 21, #03-15, Singapore 609607',
  '+65 6123 4567',
  'hello@brightminds.sg',
  '{"mon":{"open":"14:00","close":"21:00"},"tue":{"open":"14:00","close":"21:00"},"wed":{"open":"14:00","close":"21:00"},"thu":{"open":"14:00","close":"21:00"},"fri":{"open":"14:00","close":"21:00"},"sat":{"open":"09:00","close":"18:00"},"sun":{"open":"09:00","close":"18:00"}}'::jsonb,
  '{"bot_name":"Amy","welcome_message":"Hi! I''m Amy from BrightMinds 😊 How can I help you today?","primary_color":"#2563eb","contact_person":"Ms Tan"}'::jsonb
) on conflict (slug) do nothing;

insert into classes (
  org_id, subject, level, day_of_week, start_time, end_time, teacher_name,
  max_capacity, current_enrollment, monthly_fee, registration_fee, material_fee
) values
  ('00000000-0000-0000-0000-000000000001','Mathematics','Pri 5','Monday','16:00','17:30','Mr Lim',8,5,320,50,30),
  ('00000000-0000-0000-0000-000000000001','Mathematics','Pri 6','Tuesday','16:00','17:30','Mr Lim',8,8,340,50,30),
  ('00000000-0000-0000-0000-000000000001','Science','Pri 5','Wednesday','16:00','17:30','Ms Wong',8,4,320,50,30),
  ('00000000-0000-0000-0000-000000000001','English','Pri 6','Thursday','16:00','17:30','Ms Lee',8,6,320,50,30),
  ('00000000-0000-0000-0000-000000000001','Mathematics','Sec 2','Monday','18:00','20:00','Mr Tan',10,7,380,80,40),
  ('00000000-0000-0000-0000-000000000001','A-Math','Sec 3','Tuesday','18:00','20:00','Mr Tan',10,9,420,80,40),
  ('00000000-0000-0000-0000-000000000001','E-Math','Sec 4','Wednesday','18:00','20:00','Mr Tan',10,10,420,80,40),
  ('00000000-0000-0000-0000-000000000001','Chemistry','Sec 4','Thursday','18:00','20:00','Dr Goh',10,6,440,80,50),
  ('00000000-0000-0000-0000-000000000001','Physics','Sec 4','Friday','18:00','20:00','Dr Goh',10,5,440,80,50),
  ('00000000-0000-0000-0000-000000000001','English','Sec 3','Saturday','10:00','12:00','Ms Lee',10,4,400,80,40);

insert into faqs (org_id, question, answer, category, sort_order) values
  ('00000000-0000-0000-0000-000000000001','Where is BrightMinds located?','We''re at 123 Jurong East Street 21, #03-15, just a 5-minute walk from Jurong East MRT (JE1 exit).','location',1),
  ('00000000-0000-0000-0000-000000000001','What are your operating hours?','Mon–Fri: 2pm–9pm, Sat–Sun: 9am–6pm.','general',2),
  ('00000000-0000-0000-0000-000000000001','Do you offer free trial classes?','Yes! Your child can attend one trial class for free. Just let us know which subject and level.','policy',3),
  ('00000000-0000-0000-0000-000000000001','How do I sign up?','Easy — tell me your child''s level and subject and I can book a trial right here, or you can call us at +65 6123 4567.','policy',4),
  ('00000000-0000-0000-0000-000000000001','Is there a registration fee?','Yes, a one-time registration fee applies on enrolment ($50 for primary, $80 for secondary). Material fees vary by subject.','fees',5),
  ('00000000-0000-0000-0000-000000000001','Can I pay by PayNow?','Yes, we accept PayNow and credit/debit card via Stripe. I can send you a payment link anytime.','fees',6);
