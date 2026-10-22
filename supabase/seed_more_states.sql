-- =====================================================================
--  Seed: Jharkhand (24), Uttar Pradesh (75), Karnataka (31),
--  Gujarat (34) and West Bengal (23) districts.
--  Also fixes state names typed by hand earlier ("UP", "Gujrat").
--  Members type block / panchayat / village until lists are added.
--  Safe to run twice.
-- =====================================================================
update public.locations set name = 'Uttar Pradesh' where level = 'state' and lower(name) in ('up', 'u.p.', 'u p');
update public.locations set name = 'Gujarat' where level = 'state' and lower(name) = 'gujrat';

insert into public.locations(level, name, name_hi) values
  ('state', 'Jharkhand', 'झारखंड'), ('state', 'Uttar Pradesh', 'उत्तर प्रदेश'), ('state', 'Karnataka', 'कर्नाटक'),
  ('state', 'Gujarat', 'गुजरात'), ('state', 'West Bengal', 'पश्चिम बंगाल')
on conflict do nothing;
update public.locations set name_hi = v.hi
from (values ('Jharkhand','झारखंड'), ('Uttar Pradesh','उत्तर प्रदेश'), ('Karnataka','कर्नाटक'), ('Gujarat','गुजरात'), ('West Bengal','पश्चिम बंगाल')) as v(n, hi)
where level = 'state' and name = v.n;

create temp table sd(state text, name text, name_hi text);
insert into sd values
-- Jharkhand
('Jharkhand','Bokaro','बोकारो'),('Jharkhand','Chatra','चतरा'),('Jharkhand','Deoghar','देवघर'),('Jharkhand','Dhanbad','धनबाद'),
('Jharkhand','Dumka','दुमका'),('Jharkhand','East Singhbhum','पूर्वी सिंहभूम'),('Jharkhand','Garhwa','गढ़वा'),('Jharkhand','Giridih','गिरिडीह'),
('Jharkhand','Godda','गोड्डा'),('Jharkhand','Gumla','गुमला'),('Jharkhand','Hazaribagh','हजारीबाग'),('Jharkhand','Jamtara','जामताड़ा'),
('Jharkhand','Khunti','खूंटी'),('Jharkhand','Koderma','कोडरमा'),('Jharkhand','Latehar','लातेहार'),('Jharkhand','Lohardaga','लोहरदगा'),
('Jharkhand','Pakur','पाकुड़'),('Jharkhand','Palamu','पलामू'),('Jharkhand','Ramgarh','रामगढ़'),('Jharkhand','Ranchi','रांची'),
('Jharkhand','Sahibganj','साहिबगंज'),('Jharkhand','Saraikela-Kharsawan','सरायकेला-खरसावां'),('Jharkhand','Simdega','सिमडेगा'),('Jharkhand','West Singhbhum','पश्चिमी सिंहभूम'),
-- Uttar Pradesh
('Uttar Pradesh','Agra','आगरा'),('Uttar Pradesh','Aligarh','अलीगढ़'),('Uttar Pradesh','Ambedkar Nagar','अंबेडकर नगर'),('Uttar Pradesh','Amethi','अमेठी'),
('Uttar Pradesh','Amroha','अमरोहा'),('Uttar Pradesh','Auraiya','औरैया'),('Uttar Pradesh','Ayodhya','अयोध्या'),('Uttar Pradesh','Azamgarh','आजमगढ़'),
('Uttar Pradesh','Budaun','बदायूं'),('Uttar Pradesh','Bagpat','बागपत'),('Uttar Pradesh','Bahraich','बहराइच'),('Uttar Pradesh','Ballia','बलिया'),
('Uttar Pradesh','Balrampur','बलरामपुर'),('Uttar Pradesh','Banda','बांदा'),('Uttar Pradesh','Barabanki','बाराबंकी'),('Uttar Pradesh','Bareilly','बरेली'),
('Uttar Pradesh','Basti','बस्ती'),('Uttar Pradesh','Bhadohi','भदोही'),('Uttar Pradesh','Bijnor','बिजनौर'),('Uttar Pradesh','Bulandshahr','बुलंदशहर'),
('Uttar Pradesh','Chandauli','चंदौली'),('Uttar Pradesh','Chitrakoot','चित्रकूट'),('Uttar Pradesh','Deoria','देवरिया'),('Uttar Pradesh','Etah','एटा'),
('Uttar Pradesh','Etawah','इटावा'),('Uttar Pradesh','Farrukhabad','फर्रुखाबाद'),('Uttar Pradesh','Fatehpur','फतेहपुर'),('Uttar Pradesh','Firozabad','फिरोजाबाद'),
('Uttar Pradesh','Gautam Buddha Nagar','गौतम बुद्ध नगर'),('Uttar Pradesh','Ghaziabad','गाजियाबाद'),('Uttar Pradesh','Ghazipur','गाजीपुर'),('Uttar Pradesh','Gonda','गोंडा'),
('Uttar Pradesh','Gorakhpur','गोरखपुर'),('Uttar Pradesh','Hamirpur','हमीरपुर'),('Uttar Pradesh','Hapur','हापुड़'),('Uttar Pradesh','Hardoi','हरदोई'),
('Uttar Pradesh','Hathras','हाथरस'),('Uttar Pradesh','Jalaun','जालौन'),('Uttar Pradesh','Jaunpur','जौनपुर'),('Uttar Pradesh','Jhansi','झांसी'),
('Uttar Pradesh','Kannauj','कन्नौज'),('Uttar Pradesh','Kanpur Dehat','कानपुर देहात'),('Uttar Pradesh','Kanpur Nagar','कानपुर नगर'),('Uttar Pradesh','Kasganj','कासगंज'),
('Uttar Pradesh','Kaushambi','कौशांबी'),('Uttar Pradesh','Kushinagar','कुशीनगर'),('Uttar Pradesh','Lakhimpur Kheri','लखीमपुर खीरी'),('Uttar Pradesh','Lalitpur','ललितपुर'),
('Uttar Pradesh','Lucknow','लखनऊ'),('Uttar Pradesh','Maharajganj','महराजगंज'),('Uttar Pradesh','Mahoba','महोबा'),('Uttar Pradesh','Mainpuri','मैनपुरी'),
('Uttar Pradesh','Mathura','मथुरा'),('Uttar Pradesh','Mau','मऊ'),('Uttar Pradesh','Meerut','मेरठ'),('Uttar Pradesh','Mirzapur','मिर्जापुर'),
('Uttar Pradesh','Moradabad','मुरादाबाद'),('Uttar Pradesh','Muzaffarnagar','मुजफ्फरनगर'),('Uttar Pradesh','Pilibhit','पीलीभीत'),('Uttar Pradesh','Pratapgarh','प्रतापगढ़'),
('Uttar Pradesh','Prayagraj','प्रयागराज'),('Uttar Pradesh','Rae Bareli','रायबरेली'),('Uttar Pradesh','Rampur','रामपुर'),('Uttar Pradesh','Saharanpur','सहारनपुर'),
('Uttar Pradesh','Sant Kabir Nagar','संत कबीर नगर'),('Uttar Pradesh','Sambhal','संभल'),('Uttar Pradesh','Shahjahanpur','शाहजहांपुर'),('Uttar Pradesh','Shamli','शामली'),
('Uttar Pradesh','Shravasti','श्रावस्ती'),('Uttar Pradesh','Siddharthnagar','सिद्धार्थनगर'),('Uttar Pradesh','Sitapur','सीतापुर'),('Uttar Pradesh','Sonbhadra','सोनभद्र'),
('Uttar Pradesh','Sultanpur','सुल्तानपुर'),('Uttar Pradesh','Unnao','उन्नाव'),('Uttar Pradesh','Varanasi','वाराणसी'),
-- Karnataka
('Karnataka','Bagalkote','बागलकोट'),('Karnataka','Ballari','बल्लारी'),('Karnataka','Belagavi','बेलगावी'),('Karnataka','Bengaluru North','बेंगलुरु उत्तर'),
('Karnataka','Bengaluru South','बेंगलुरु दक्षिण'),('Karnataka','Bengaluru Urban','बेंगलुरु शहरी'),('Karnataka','Bidar','बीदर'),('Karnataka','Chamarajanagara','चामराजनगर'),
('Karnataka','Chikkaballapura','चिक्कबल्लापुर'),('Karnataka','Chikkamagaluru','चिक्कमगलूरु'),('Karnataka','Chitradurga','चित्रदुर्ग'),('Karnataka','Dakshina Kannada','दक्षिण कन्नड़'),
('Karnataka','Davanagere','दावणगेरे'),('Karnataka','Dharwad','धारवाड़'),('Karnataka','Gadag','गदग'),('Karnataka','Haveri','हावेरी'),
('Karnataka','Hassan','हासन'),('Karnataka','Kalaburagi','कलबुर्गी'),('Karnataka','Kodagu','कोडगु'),('Karnataka','Kolar','कोलार'),
('Karnataka','Koppal','कोप्पल'),('Karnataka','Mandya','मंड्या'),('Karnataka','Mysuru','मैसूरु'),('Karnataka','Raichur','रायचूर'),
('Karnataka','Shivamogga','शिवमोग्गा'),('Karnataka','Tumakuru','तुमकुरु'),('Karnataka','Udupi','उडुपी'),('Karnataka','Uttara Kannada','उत्तर कन्नड़'),
('Karnataka','Vijayanagara','विजयनगर'),('Karnataka','Vijayapura','विजयपुरा'),('Karnataka','Yadgiri','यादगिरी'),
-- Gujarat
('Gujarat','Ahmedabad','अहमदाबाद'),('Gujarat','Amreli','अमरेली'),('Gujarat','Anand','आणंद'),('Gujarat','Aravalli','अरवल्ली'),
('Gujarat','Banaskantha','बनासकांठा'),('Gujarat','Bharuch','भरूच'),('Gujarat','Bhavnagar','भावनगर'),('Gujarat','Botad','बोटाद'),
('Gujarat','Chhota Udaipur','छोटा उदयपुर'),('Gujarat','Dahod','दाहोद'),('Gujarat','Dang','डांग'),('Gujarat','Devbhoomi Dwarka','देवभूमि द्वारका'),
('Gujarat','Gandhinagar','गांधीनगर'),('Gujarat','Gir Somnath','गिर सोमनाथ'),('Gujarat','Jamnagar','जामनगर'),('Gujarat','Junagadh','जूनागढ़'),
('Gujarat','Kheda','खेड़ा'),('Gujarat','Kutch','कच्छ'),('Gujarat','Mahisagar','महीसागर'),('Gujarat','Mehsana','मेहसाणा'),
('Gujarat','Morbi','मोरबी'),('Gujarat','Narmada','नर्मदा'),('Gujarat','Navsari','नवसारी'),('Gujarat','Panchmahal','पंचमहाल'),
('Gujarat','Patan','पाटण'),('Gujarat','Porbandar','पोरबंदर'),('Gujarat','Rajkot','राजकोट'),('Gujarat','Sabarkantha','साबरकांठा'),
('Gujarat','Surat','सूरत'),('Gujarat','Surendranagar','सुरेंद्रनगर'),('Gujarat','Tapi','तापी'),('Gujarat','Vadodara','वडोदरा'),
('Gujarat','Valsad','वलसाड'),('Gujarat','Vav-Tharad','वाव-थराद'),
-- West Bengal
('West Bengal','Alipurduar','अलीपुरद्वार'),('West Bengal','Bankura','बांकुड़ा'),('West Bengal','Birbhum','बीरभूम'),('West Bengal','Cooch Behar','कूचबिहार'),
('West Bengal','Dakshin Dinajpur','दक्षिण दिनाजपुर'),('West Bengal','Darjeeling','दार्जिलिंग'),('West Bengal','Hooghly','हुगली'),('West Bengal','Howrah','हावड़ा'),
('West Bengal','Jalpaiguri','जलपाईगुड़ी'),('West Bengal','Jhargram','झाड़ग्राम'),('West Bengal','Kalimpong','कालिम्पोंग'),('West Bengal','Kolkata','कोलकाता'),
('West Bengal','Malda','मालदा'),('West Bengal','Murshidabad','मुर्शिदाबाद'),('West Bengal','Nadia','नदिया'),('West Bengal','North 24 Parganas','उत्तर 24 परगना'),
('West Bengal','Paschim Bardhaman','पश्चिम बर्धमान'),('West Bengal','Paschim Medinipur','पश्चिम मेदिनीपुर'),('West Bengal','Purba Bardhaman','पूर्व बर्धमान'),('West Bengal','Purba Medinipur','पूर्व मेदिनीपुर'),
('West Bengal','Purulia','पुरुलिया'),('West Bengal','South 24 Parganas','दक्षिण 24 परगना'),('West Bengal','Uttar Dinajpur','उत्तर दिनाजपुर');

insert into public.locations(level, name, name_hi, parent_id)
select 'district', sd.name, sd.name_hi, s.id
from sd join public.locations s on s.level = 'state' and s.name = sd.state
on conflict do nothing;

drop table sd;
