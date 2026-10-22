-- =====================================================================
--  Seed: Jehanabad district — 7 blocks, 93 gram panchayats, plus
--  Jehanabad Nagar Parishad (33 wards) and Makhdumpur Nagar Panchayat
--  (19 wards). From the district panchayat list. Run after seed_bihar.sql.
--  Safe to run twice.
-- =====================================================================
create temp table jp(block text, block_hi text, panchayat text, panchayat_hi text);
insert into jp values
('Jehanabad','जहानाबाद','Amain','अमैन'),
('Jehanabad','जहानाबाद','Kalpa','कल्पा'),
('Jehanabad','जहानाबाद','Kinari','किनारी'),
('Jehanabad','जहानाबाद','Gonawan','गोनवां'),
('Jehanabad','जहानाबाद','Jamuk','जामुक'),
('Jehanabad','जहानाबाद','Nauru','नौरू'),
('Jehanabad','जहानाबाद','Pandui','पंडुई'),
('Jehanabad','जहानाबाद','Muthair','मुठेर'),
('Jehanabad','जहानाबाद','Mandil','मांदिल'),
('Jehanabad','जहानाबाद','Mandev Bigha','मानदेवबिगहा'),
('Jehanabad','जहानाबाद','Larsa','लरसा'),
('Jehanabad','जहानाबाद','Surangapur Bhawanichak','सुरंगापुर भवानीचक'),
('Jehanabad','जहानाबाद','Sewnan','सेवनन'),
('Jehanabad','जहानाबाद','Sikariya','सिकरिया'),
('Ghosi','घोसी','Ahiyasa','अहियासा'),
('Ghosi','घोसी','Uber','उबेर'),
('Ghosi','घोसी','Kurre','कुर्रे'),
('Ghosi','घोसी','Golakpur','गोलकपुर'),
('Ghosi','घोसी','Ghosi','घोसी'),
('Ghosi','घोसी','Parawan','परावन'),
('Ghosi','घोसी','Bharthu','भारथू'),
('Ghosi','घोसी','Lakhawar','लखावर'),
('Ghosi','घोसी','Sahpur','साहपुर'),
('Ghosi','घोसी','Saho Bigha','साहोबिगहा'),
('Kako','काको','Amathua','अमथुआ'),
('Kako','काको','Uttar Serthu','उत्तर सेरथू'),
('Kako','काको','Khalispur','खालिसपुर'),
('Kako','काको','Dedhsaiya','डेढ़सैया'),
('Kako','काको','Damuhan','दमुहाँ'),
('Kako','काको','Nerathua','नेरथुआ'),
('Kako','काको','Nonhi','नोनही'),
('Kako','काको','Purvi Kako','पूर्वी काको'),
('Kako','काको','Paschimi Kako','पश्चिमी काको'),
('Kako','काको','Pinjaura','पिंजौरा'),
('Kako','काको','Badhauna','बढ़ौना'),
('Kako','काको','Barawan','बरावां'),
('Kako','काको','Bara','बारा'),
('Kako','काको','Maniyawan','मनियावां'),
('Kako','काको','Saidabad','सैदाबाद'),
('Kako','काको','Sulemanpur','सुलेमानपुर'),
('Makhdumpur','मखदुमपुर','Kachnawan','कचनावां'),
('Makhdumpur','मखदुमपुर','Kumardih','कुमरडीह'),
('Makhdumpur','मखदुमपुर','Kalanaur','कलानौर'),
('Makhdumpur','मखदुमपुर','Kohra','कोहरा'),
('Makhdumpur','मखदुमपुर','Chhariyari','छरियारी'),
('Makhdumpur','मखदुमपुर','Jagpura','जगपुरा'),
('Makhdumpur','मखदुमपुर','Jamanganj','जमनगंज'),
('Makhdumpur','मखदुमपुर','Dakra','डकरा'),
('Makhdumpur','मखदुमपुर','Dharnai','धरनई'),
('Makhdumpur','मखदुमपुर','Dharaut','धराउत'),
('Makhdumpur','मखदुमपुर','Punhada','पुनहदा'),
('Makhdumpur','मखदुमपुर','Purvi Seren','पूर्वी सरेन'),
('Makhdumpur','मखदुमपुर','Paschimi Seren','पश्चिमी सरेन'),
('Makhdumpur','मखदुमपुर','Bhaikh','भैख'),
('Makhdumpur','मखदुमपुर','Makarpur','मकरपुर'),
('Makhdumpur','मखदुमपुर','Manjhaus','मंझौस'),
('Makhdumpur','मखदुमपुर','Malathi','मलाठी'),
('Makhdumpur','मखदुमपुर','Rampur','रामपुर'),
('Makhdumpur','मखदुमपुर','Vela Virro','वेला विर्रो'),
('Makhdumpur','मखदुमपुर','Sugaon','सुगाँव'),
('Makhdumpur','मखदुमपुर','Sumera','सुमेरा'),
('Makhdumpur','मखदुमपुर','Solhanda','सोलहंडा'),
('Modanganj','मोदनगंज','Gandhar','गांधर'),
('Modanganj','मोदनगंज','Jaitipur','जैतिपुर'),
('Modanganj','मोदनगंज','Dewra','देवरा'),
('Modanganj','मोदनगंज','Naima','नईमा'),
('Modanganj','मोदनगंज','Bandhuganj','बंधुगंज'),
('Modanganj','मोदनगंज','Modanganj Gobindpur','मोदनगंज गोविंदपुर'),
('Modanganj','मोदनगंज','Vishunpur Okri','विशुनपुर ओकरी'),
('Modanganj','मोदनगंज','Saistabad','साईस्ताबाद'),
('Ratni Faridpur','रतनी फरीदपुर','Uchita','उचिटा'),
('Ratni Faridpur','रतनी फरीदपुर','Kansua','कनसुआ'),
('Ratni Faridpur','रतनी फरीदपुर','Kaswan','कसवां'),
('Ratni Faridpur','रतनी फरीदपुर','Jhunathi','झुनाठी'),
('Ratni Faridpur','रतनी फरीदपुर','Nehalpur','नेहालपुर'),
('Ratni Faridpur','रतनी फरीदपुर','Narayanpur','नारायणपुर'),
('Ratni Faridpur','रतनी फरीदपुर','Noawan','नोआवां'),
('Ratni Faridpur','रतनी फरीदपुर','Pandaul','पंडौल'),
('Ratni Faridpur','रतनी फरीदपुर','Murhara','मुरहरा'),
('Ratni Faridpur','रतनी फरीदपुर','Ratni','रतनी'),
('Ratni Faridpur','रतनी फरीदपुर','Lakhapur','लाखापुर'),
('Ratni Faridpur','रतनी फरीदपुर','Sesamba','सेसम्बा'),
('Ratni Faridpur','रतनी फरीदपुर','Sikandarpur','सिकंदरपुर'),
('Ratni Faridpur','रतनी फरीदपुर','Sohraiya','सोहरैया'),
('Hulasganj','हुलासगंज','Keufar','केउफर'),
('Hulasganj','हुलासगंज','Kokarsa','कोकरसा'),
('Hulasganj','हुलासगंज','Khudauri','खुदौरी'),
('Hulasganj','हुलासगंज','Chiri','चिरी'),
('Hulasganj','हुलासगंज','Tirra','तिर्रा'),
('Hulasganj','हुलासगंज','Dawathu','दवाथु'),
('Hulasganj','हुलासगंज','Bauri','बौरी'),
('Hulasganj','हुलासगंज','Murgaon','मुरगाँव'),
('Hulasganj','हुलासगंज','Surajpur','सूरजपुर'),
('Jehanabad','जहानाबाद','Jehanabad Nagar Parishad','जहानाबाद नगर परिषद'),
('Makhdumpur','मखदुमपुर','Makhdumpur Nagar Panchayat','नगर पंचायत मखदुमपुर');

insert into public.locations(level, name, name_hi, parent_id)
select distinct 'block', jp.block, jp.block_hi, d.id
from jp
join public.locations s on s.level = 'state' and s.name = 'Bihar'
join public.locations d on d.parent_id = s.id and d.level = 'district' and d.name = 'Jehanabad'
on conflict do nothing;

insert into public.locations(level, name, name_hi, parent_id)
select 'panchayat', jp.panchayat, jp.panchayat_hi, b.id
from jp
join public.locations d on d.level = 'district' and d.name = 'Jehanabad'
join public.locations b on b.parent_id = d.id and b.level = 'block' and lower(b.name) = lower(jp.block)
on conflict do nothing;

-- town wards are listed so people pick their ward
create temp table jw(block text, town text, ward text, ward_hi text);
insert into jw values
('Jehanabad','Jehanabad Nagar Parishad','Ward 01','वार्ड 01'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 02','वार्ड 02'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 03','वार्ड 03'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 04','वार्ड 04'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 05','वार्ड 05'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 06','वार्ड 06'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 07','वार्ड 07'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 08','वार्ड 08'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 09','वार्ड 09'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 10','वार्ड 10'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 11','वार्ड 11'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 12','वार्ड 12'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 13','वार्ड 13'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 14','वार्ड 14'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 15','वार्ड 15'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 16','वार्ड 16'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 17','वार्ड 17'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 18','वार्ड 18'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 19','वार्ड 19'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 20','वार्ड 20'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 21','वार्ड 21'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 22','वार्ड 22'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 23','वार्ड 23'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 24','वार्ड 24'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 25','वार्ड 25'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 26','वार्ड 26'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 27','वार्ड 27'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 28','वार्ड 28'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 29','वार्ड 29'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 30','वार्ड 30'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 31','वार्ड 31'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 32','वार्ड 32'),
('Jehanabad','Jehanabad Nagar Parishad','Ward 33','वार्ड 33'),
('Makhdumpur','Makhdumpur Nagar Panchayat','Ward 01','वार्ड 01'),
('Makhdumpur','Makhdumpur Nagar Panchayat','Ward 02','वार्ड 02'),
('Makhdumpur','Makhdumpur Nagar Panchayat','Ward 03','वार्ड 03'),
('Makhdumpur','Makhdumpur Nagar Panchayat','Ward 04','वार्ड 04'),
('Makhdumpur','Makhdumpur Nagar Panchayat','Ward 05','वार्ड 05'),
('Makhdumpur','Makhdumpur Nagar Panchayat','Ward 06','वार्ड 06'),
('Makhdumpur','Makhdumpur Nagar Panchayat','Ward 07','वार्ड 07'),
('Makhdumpur','Makhdumpur Nagar Panchayat','Ward 08','वार्ड 08'),
('Makhdumpur','Makhdumpur Nagar Panchayat','Ward 09','वार्ड 09'),
('Makhdumpur','Makhdumpur Nagar Panchayat','Ward 10','वार्ड 10'),
('Makhdumpur','Makhdumpur Nagar Panchayat','Ward 11','वार्ड 11'),
('Makhdumpur','Makhdumpur Nagar Panchayat','Ward 12','वार्ड 12'),
('Makhdumpur','Makhdumpur Nagar Panchayat','Ward 13','वार्ड 13'),
('Makhdumpur','Makhdumpur Nagar Panchayat','Ward 14','वार्ड 14'),
('Makhdumpur','Makhdumpur Nagar Panchayat','Ward 15','वार्ड 15'),
('Makhdumpur','Makhdumpur Nagar Panchayat','Ward 16','वार्ड 16'),
('Makhdumpur','Makhdumpur Nagar Panchayat','Ward 17','वार्ड 17'),
('Makhdumpur','Makhdumpur Nagar Panchayat','Ward 18','वार्ड 18'),
('Makhdumpur','Makhdumpur Nagar Panchayat','Ward 19','वार्ड 19');

insert into public.locations(level, name, name_hi, parent_id)
select 'village', jw.ward, jw.ward_hi, p.id
from jw
join public.locations d on d.level = 'district' and d.name = 'Jehanabad'
join public.locations b on b.parent_id = d.id and b.level = 'block' and b.name = jw.block
join public.locations p on p.parent_id = b.id and p.level = 'panchayat' and p.name = jw.town
on conflict do nothing;

drop table jp; drop table jw;
