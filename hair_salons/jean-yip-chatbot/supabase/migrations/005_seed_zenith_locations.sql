-- Three sample Zenith locations + link the test classes from migration 003.
-- Idempotent via fixed UUIDs.

insert into locations (id, org_id, name, address, postal_code, mrt_nearest, phone, is_active) values
  (
    '00000000-0000-0000-0000-00000010c001',
    '00000000-0000-0000-0000-000000000002',
    'Tampines Hub',
    '1 Tampines Walk, #04-12 Our Tampines Hub',
    '528523',
    'Tampines MRT',
    '+65 6789 0001',
    true
  ),
  (
    '00000000-0000-0000-0000-00000010c002',
    '00000000-0000-0000-0000-000000000002',
    'Bishan Junction 8',
    '9 Bishan Place, #05-08 Junction 8',
    '579837',
    'Bishan MRT',
    '+65 6789 0002',
    true
  ),
  (
    '00000000-0000-0000-0000-00000010c003',
    '00000000-0000-0000-0000-000000000002',
    'Jurong East JEM',
    '50 Jurong Gateway Road, #03-21 JEM',
    '608549',
    'Jurong East MRT',
    '+65 6789 0003',
    true
  )
on conflict (id) do nothing;

-- Link the three test classes from migration 003 to specific centres.
update classes set location_id = '00000000-0000-0000-0000-00000010c001'
  where id = '00000000-0000-0000-0000-0000000c1a55';
update classes set location_id = '00000000-0000-0000-0000-00000010c002'
  where id = '00000000-0000-0000-0000-0000000c1a56';
update classes set location_id = '00000000-0000-0000-0000-00000010c003'
  where id = '00000000-0000-0000-0000-0000000c1a57';
