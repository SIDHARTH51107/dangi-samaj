-- =====================================================================
--  Seed: Bihar + its 38 districts (with Hindi names).
--  Run after schema.sql. Safe to run twice.
--  Blocks, panchayats and villages come from the official LGD lists —
--  see tools/lgd_to_sql.py and README step 4.
-- =====================================================================

insert into public.locations(level, name, name_hi, lgd_code)
values ('state', 'Bihar', 'बिहार', '10')
on conflict do nothing;

with bihar as (select id from public.locations where level = 'state' and name = 'Bihar')
insert into public.locations(level, name, name_hi, parent_id)
select 'district', d.name, d.name_hi, bihar.id
from bihar, (values
  ('Araria','अररिया'), ('Arwal','अरवल'), ('Aurangabad','औरंगाबाद'), ('Banka','बांका'),
  ('Begusarai','बेगूसराय'), ('Bhagalpur','भागलपुर'), ('Bhojpur','भोजपुर'), ('Buxar','बक्सर'),
  ('Darbhanga','दरभंगा'), ('East Champaran','पूर्वी चंपारण'), ('Gaya','गया'), ('Gopalganj','गोपालगंज'),
  ('Jamui','जमुई'), ('Jehanabad','जहानाबाद'), ('Kaimur','कैमूर'), ('Katihar','कटिहार'),
  ('Khagaria','खगड़िया'), ('Kishanganj','किशनगंज'), ('Lakhisarai','लखीसराय'), ('Madhepura','मधेपुरा'),
  ('Madhubani','मधुबनी'), ('Munger','मुंगेर'), ('Muzaffarpur','मुजफ्फरपुर'), ('Nalanda','नालंदा'),
  ('Nawada','नवादा'), ('Patna','पटना'), ('Purnia','पूर्णिया'), ('Rohtas','रोहतास'),
  ('Saharsa','सहरसा'), ('Samastipur','समस्तीपुर'), ('Saran','सारण'), ('Sheikhpura','शेखपुरा'),
  ('Sheohar','शिवहर'), ('Sitamarhi','सीतामढ़ी'), ('Siwan','सीवान'), ('Supaul','सुपौल'),
  ('Vaishali','वैशाली'), ('West Champaran','पश्चिमी चंपारण')
) as d(name, name_hi)
on conflict do nothing;
