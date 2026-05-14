INSERT INTO organisations (id, name, slug, address, phone, email, settings) VALUES (
  '55000000-0000-0000-0000-000000000001',
  'Huttons Asia',
  'huttons',
  '3 Bishan Place, #05-01 CPF Bishan Building, Singapore 579838',
  '+65 6253 0030',
  'info@huttonsgroup.com',
  '{"bot_name":"James","welcome_message":"Hi! I''m James from Huttons Asia. Looking to buy, sell, or rent property in Singapore? I can help match you with the right listings and connect you with our agents.","primary_color":"#1A3C5E","secondary_color":"#FFFFFF","accent_color":"#2E6DA4","contact_person":"our property consultants","onboarding_complete":true}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO locations (id, org_id, name, address, postal_code, mrt_nearest, phone, is_active) VALUES
  ('55000000-0000-0000-0000-00000055c001','55000000-0000-0000-0000-000000000001','Huttons Central (Bishan)','3 Bishan Place, #05-01 CPF Bishan Building','579838','Bishan MRT (5 min)','+65 6253 0030',true),
  ('55000000-0000-0000-0000-00000055c002','55000000-0000-0000-0000-000000000001','Huttons East Division','10 Tampines Central 1, #04-01 Tampines 1','529536','Tampines MRT (5 min)','+65 6253 0031',true),
  ('55000000-0000-0000-0000-00000055c003','55000000-0000-0000-0000-000000000001','Huttons West Division','1 Jurong West Central 2, #08-01 Jurong Point','648886','Boon Lay MRT (5 min)','+65 6253 0032',true)
ON CONFLICT (id) DO NOTHING;

-- Viewing slots (classes table; subject=property title, level=budget range, teacher_name=agent name)
INSERT INTO classes (id, org_id, location_id, subject, level, teacher_name, class_type, day_of_week, start_time, end_time, max_capacity, current_enrollment, monthly_fee, is_active, property_type, tenure, asking_price, floor_area_sqft, psf, district) VALUES
  ('55000000-0000-0000-0000-000000005501','55000000-0000-0000-0000-000000000001','55000000-0000-0000-0000-00000055c001','3BR Condo @ Bishan Park','$1.5M–$1.8M','David Lim','individual','Saturday','10:00','17:00',3,1,0,true,'Condo','99-year',1650000,1076,1533,'D20'),
  ('55000000-0000-0000-0000-000000005502','55000000-0000-0000-0000-000000000001','55000000-0000-0000-0000-00000055c001','5-Room HDB @ Bishan','$650K–$750K','Sarah Wong','individual','Saturday','10:00','17:00',4,0,0,true,'HDB','99-year (Leasehold)',700000,1184,591,'D20'),
  ('55000000-0000-0000-0000-000000005503','55000000-0000-0000-0000-000000000001','55000000-0000-0000-0000-00000055c002','2BR Condo @ Tampines (New Launch)','$900K–$1.1M','Michael Tan','individual','Sunday','10:00','17:00',5,2,0,true,'Condo','99-year',1000000,700,1429,'D18'),
  ('55000000-0000-0000-0000-000000005504','55000000-0000-0000-0000-000000000001','55000000-0000-0000-0000-00000055c003','2BR Condo @ Jurong Lake District','$800K–$950K','Amy Lim','individual','Saturday','10:00','17:00',4,1,0,true,'Condo','99-year',875000,657,1332,'D22'),
  ('55000000-0000-0000-0000-000000005505','55000000-0000-0000-0000-000000000001','55000000-0000-0000-0000-00000055c001','Freehold Shop @ Balestier','$2.2M','Kevin Ng','individual','Monday-Friday','10:00','17:00',2,0,0,true,'Commercial','Freehold',2200000,1500,1467,'D12')
ON CONFLICT (id) DO NOTHING;

-- Sample property listings
INSERT INTO property_listings (org_id, location_id, assigned_agent_name, title, property_type, tenure, asking_price, floor_area_sqft, psf, num_bedrooms, num_bathrooms, district, address, mrt_nearest, mrt_distance_minutes, listing_type, status, highlights) VALUES
  ('55000000-0000-0000-0000-000000000001','55000000-0000-0000-0000-00000055c001','David Lim','Sky Vista Residences — 3BR','Condo','99-year',1650000,1076,1533,3,2,'D20','18 Bishan Street 22','Bishan MRT',8,'sale','active',ARRAY['Corner unit','Unblocked pool view','3 min to Bishan MRT','Top floor']),
  ('55000000-0000-0000-0000-000000000001','55000000-0000-0000-0000-00000055c001','Sarah Wong','Bishan HDB 5-Room — Move-in Ready','HDB','99-year',700000,1184,591,5,3,'D20','Blk 123 Bishan Street 13','Bishan MRT',5,'sale','active',ARRAY['Move-in condition','High floor','North-South facing','Near schools']),
  ('55000000-0000-0000-0000-000000000001','55000000-0000-0000-0000-00000055c002','Michael Tan','Tampines Grand — 2BR New Launch','Condo','99-year',1000000,700,1429,2,2,'D18','10 Tampines Central 7','Tampines MRT',6,'sale','active',ARRAY['New launch','Full condo facilities','Tampines Regional Centre','Smart home features'])
ON CONFLICT DO NOTHING;

-- FAQs
INSERT INTO faqs (org_id, question, answer, sort_order, is_active) VALUES
  ('55000000-0000-0000-0000-000000000001','How much is the agent commission?','For property sales in Singapore, buyer''s agents typically do not charge commission — the seller pays the agent''s fee (1–2% of sale price). For rentals, the tenant typically pays half a month to 1 month''s rent as commission. Huttons agents will advise you on exact fees during your consultation.',1,true),
  ('55000000-0000-0000-0000-000000000001','Can foreigners buy property in Singapore?','Foreigners can purchase private condominium units and commercial/industrial properties. Foreigners are generally NOT allowed to buy HDB flats or landed residential property (with limited exceptions). Foreigners pay an Additional Buyer''s Stamp Duty (ABSD) of 60% on top of the standard Buyer''s Stamp Duty. Please ask our agents for detailed advice based on your citizenship status.',2,true),
  ('55000000-0000-0000-0000-000000000001','What is ABSD?','ABSD stands for Additional Buyer''s Stamp Duty. Singapore Citizens pay 0% ABSD on their first property, 20% on second, 30% on third+. Permanent Residents pay 5% on first, 30% on second+. Foreigners pay 60% on any residential property. ABSD is in addition to standard BSD. Our agents can help you calculate the exact stamp duty payable.',3,true),
  ('55000000-0000-0000-0000-000000000001','What documents do I need to buy a property?','For Singapore Citizens/PRs buying HDB: NRIC, HDB Flat Eligibility (HFE) letter, CPF withdrawal statements. For private property: NRIC/passport, proof of income, bank statements, Option to Purchase (OTP). Foreigners may need additional documents. Our agents will provide a full checklist based on your profile.',4,true),
  ('55000000-0000-0000-0000-000000000001','How long does a property transaction take?','HDB resale: typically 8–12 weeks from HFE application to key collection. Private resale: typically 10–12 weeks from OTP signing to completion. New launches: 3–5 years if buying under construction (TOP date given). Our agents will guide you through each milestone.',5,true)
ON CONFLICT DO NOTHING;
