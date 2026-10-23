"""
Source lists for the remaining Indian states and UTs, Nepal, and the countries
offered to NRIs. Run:  python3 tools/regions.py
It writes:
  supabase/seed_india_nepal_nri.sql   (load into Supabase after schema.sql)
  js/state-data.js                    (all states/provinces for demo mode)
  js/world-data.js                    (country names + dialling codes, used by the form)
District lists: Wikipedia "List of districts in India" (Oct 2026), Delhi's
13 districts (Dec 2025 notification), Ladakh's 7 districts (Apr 2026), and
"List of districts of Nepal".
"""
import json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

def L(s):  # "A, B, C" -> [(A, None), ...]
    return [(x.strip(), None) for x in s.split(',') if x.strip()]

def H(pairs):  # "Name=हिंदी; Name2=..." -> [(Name, hi)]
    out = []
    for p in pairs.split(';'):
        p = p.strip()
        if p:
            n, h = p.split('=')
            out.append((n.strip(), h.strip()))
    return out

# ----------------------------------------------------------------- India: states and UTs not loaded before
INDIA = [
    ('Andhra Pradesh', 'आंध्र प्रदेश', L('Alluri Sitharama Raju, Anakapalli, Ananthapuramu, Annamayya, Bapatla, Chittoor, Dr. B.R. Ambedkar Konaseema, East Godavari, Eluru, Guntur, Kakinada, Krishna, Kurnool, Markapuram, Nandyal, Nellore, NTR, Palnadu, Parvathipuram Manyam, Polavaram, Prakasam, Srikakulam, Sri Sathya Sai, Tirupati, Visakhapatnam, Vizianagaram, West Godavari, YSR Kadapa')),
    ('Arunachal Pradesh', 'अरुणाचल प्रदेश', L('Anjaw, Bichom, Changlang, East Kameng, East Siang, Kamle, Keyi Panyor, Kra Daadi, Kurung Kumey, Lepa Rada, Lohit, Longding, Lower Dibang Valley, Lower Siang, Lower Subansiri, Namsai, Pakke-Kessang, Papum Pare, Shi Yomi, Siang, Tawang, Tirap, Upper Dibang Valley, Upper Siang, Upper Subansiri, West Kameng, West Siang')),
    ('Assam', 'असम', L('Bajali, Baksa, Barpeta, Biswanath, Bongaigaon, Cachar, Charaideo, Chirang, Darrang, Dhemaji, Dhubri, Dibrugarh, Dima Hasao, Goalpara, Golaghat, Hailakandi, Hojai, Jorhat, Kamrup, Kamrup Metropolitan, Karbi Anglong, Karimganj, Kokrajhar, Lakhimpur, Majuli, Morigaon, Nagaon, Nalbari, Sivasagar, Sonitpur, South Salmara-Mankachar, Tamulpur, Tinsukia, Udalguri, West Karbi Anglong')),
    ('Chhattisgarh', 'छत्तीसगढ़', H('Balod=बालोद; Baloda Bazar=बलौदा बाजार; Balrampur-Ramanujganj=बलरामपुर-रामानुजगंज; Bastar=बस्तर; Bemetara=बेमेतरा; Bijapur=बीजापुर; Bilaspur=बिलासपुर; Dantewada=दंतेवाड़ा; Dhamtari=धमतरी; Durg=दुर्ग; Gariaband=गरियाबंद; Gaurela-Pendra-Marwahi=गौरेला-पेंड्रा-मरवाही; Janjgir-Champa=जांजगीर-चांपा; Jashpur=जशपुर; Kabirdham=कबीरधाम; Kanker=कांकेर; Khairagarh-Chhuikhadan-Gandai=खैरागढ़-छुईखदान-गंडई; Kondagaon=कोंडागांव; Korba=कोरबा; Korea=कोरिया; Mahasamund=महासमुंद; Manendragarh-Chirmiri-Bharatpur=मनेंद्रगढ़-चिरमिरी-भरतपुर; Mohla-Manpur-Ambagarh Chowki=मोहला-मानपुर-अंबागढ़ चौकी; Mungeli=मुंगेली; Narayanpur=नारायणपुर; Raigarh=रायगढ़; Raipur=रायपुर; Rajnandgaon=राजनांदगांव; Sakti=सक्ती; Sarangarh-Bilaigarh=सारंगढ़-बिलाईगढ़; Sukma=सुकमा; Surajpur=सूरजपुर; Surguja=सरगुजा')),
    ('Goa', 'गोवा', H('North Goa=उत्तर गोवा; South Goa=दक्षिण गोवा; Kushavati=कुशावती')),
    ('Haryana', 'हरियाणा', H('Ambala=अंबाला; Bhiwani=भिवानी; Charkhi Dadri=चरखी दादरी; Faridabad=फरीदाबाद; Fatehabad=फतेहाबाद; Gurugram=गुरुग्राम; Hansi=हांसी; Hisar=हिसार; Jhajjar=झज्जर; Jind=जींद; Kaithal=कैथल; Karnal=करनाल; Kurukshetra=कुरुक्षेत्र; Mahendragarh=महेंद्रगढ़; Nuh=नूंह; Palwal=पलवल; Panchkula=पंचकूला; Panipat=पानीपत; Rewari=रेवाड़ी; Rohtak=रोहतक; Sirsa=सिरसा; Sonipat=सोनीपत; Yamunanagar=यमुनानगर')),
    ('Himachal Pradesh', 'हिमाचल प्रदेश', H('Bilaspur=बिलासपुर; Chamba=चंबा; Hamirpur=हमीरपुर; Kangra=कांगड़ा; Kinnaur=किन्नौर; Kullu=कुल्लू; Lahaul and Spiti=लाहौल और स्पीति; Mandi=मंडी; Shimla=शिमला; Sirmaur=सिरमौर; Solan=सोलन; Una=ऊना')),
    ('Kerala', 'केरल', L('Alappuzha, Ernakulam, Idukki, Kannur, Kasaragod, Kollam, Kottayam, Kozhikode, Malappuram, Palakkad, Pathanamthitta, Thiruvananthapuram, Thrissur, Wayanad')),
    ('Maharashtra', 'महाराष्ट्र', H('Ahilyanagar (Ahmednagar)=अहिल्यानगर (अहमदनगर); Akola=अकोला; Amravati=अमरावती; Beed=बीड; Bhandara=भंडारा; Buldhana=बुलढाणा; Chandrapur=चंद्रपुर; Chhatrapati Sambhajinagar (Aurangabad)=छत्रपति संभाजीनगर (औरंगाबाद); Dharashiv (Osmanabad)=धाराशिव (उस्मानाबाद); Dhule=धुले; Gadchiroli=गढ़चिरौली; Gondia=गोंदिया; Hingoli=हिंगोली; Jalgaon=जलगांव; Jalna=जालना; Kolhapur=कोल्हापुर; Latur=लातूर; Mumbai City=मुंबई शहर; Mumbai Suburban=मुंबई उपनगर; Nagpur=नागपुर; Nanded=नांदेड़; Nandurbar=नंदुरबार; Nashik=नासिक; Palghar=पालघर; Parbhani=परभणी; Pune=पुणे; Raigad=रायगढ़; Ratnagiri=रत्नागिरी; Sangli=सांगली; Satara=सातारा; Sindhudurg=सिंधुदुर्ग; Solapur=सोलापुर; Thane=ठाणे; Wardha=वर्धा; Washim=वाशिम; Yavatmal=यवतमाल')),
    ('Manipur', 'मणिपुर', L('Bishnupur, Chandel, Churachandpur, Imphal East, Imphal West, Jiribam, Kakching, Kamjong, Kangpokpi, Noney, Pherzawl, Senapati, Tamenglong, Tengnoupal, Thoubal, Ukhrul')),
    ('Meghalaya', 'मेघालय', L('East Garo Hills, East Jaintia Hills, East Khasi Hills, Eastern West Khasi Hills, North Garo Hills, Ri Bhoi, South Garo Hills, South West Garo Hills, South West Khasi Hills, West Garo Hills, West Jaintia Hills, West Khasi Hills')),
    ('Mizoram', 'मिज़ोरम', L('Aizawl, Champhai, Hnahthial, Khawzawl, Kolasib, Lawngtlai, Lunglei, Mamit, Saitual, Serchhip, Siaha')),
    ('Nagaland', 'नागालैंड', L('Chumoukedima, Dimapur, Kiphire, Kohima, Longleng, Mokokchung, Mon, Niuland, Noklak, Peren, Phek, Shamator, Tseminyu, Tuensang, Wokha, Zunheboto')),
    ('Odisha', 'ओडिशा', L('Angul, Balangir, Balasore, Bargarh, Bhadrak, Boudh, Cuttack, Debagarh, Dhenkanal, Gajapati, Ganjam, Jagatsinghpur, Jajpur, Jharsuguda, Kalahandi, Kandhamal, Kendrapara, Kendujhar, Khordha, Koraput, Malkangiri, Mayurbhanj, Nabarangpur, Nayagarh, Nuapada, Puri, Rayagada, Sambalpur, Subarnapur, Sundargarh')),
    ('Punjab', 'पंजाब', H('Amritsar=अमृतसर; Barnala=बरनाला; Bathinda=बठिंडा; Faridkot=फरीदकोट; Fatehgarh Sahib=फतेहगढ़ साहिब; Fazilka=फाजिल्का; Firozpur=फिरोजपुर; Gurdaspur=गुरदासपुर; Hoshiarpur=होशियारपुर; Jalandhar=जालंधर; Kapurthala=कपूरथला; Ludhiana=लुधियाना; Malerkotla=मलेरकोटला; Mansa=मानसा; Moga=मोगा; Pathankot=पठानकोट; Patiala=पटियाला; Rupnagar=रूपनगर; Sahibzada Ajit Singh Nagar (Mohali)=साहिबजादा अजीत सिंह नगर (मोहाली); Sangrur=संगरूर; Shahid Bhagat Singh Nagar=शहीद भगत सिंह नगर; Sri Muktsar Sahib=श्री मुक्तसर साहिब; Tarn Taran=तरनतारन')),
    ('Sikkim', 'सिक्किम', L('Gangtok, Gyalshing, Mangan, Namchi, Pakyong, Soreng')),
    ('Tamil Nadu', 'तमिलनाडु', L('Ariyalur, Chengalpattu, Chennai, Coimbatore, Cuddalore, Dharmapuri, Dindigul, Erode, Kallakurichi, Kanchipuram, Kanyakumari, Karur, Krishnagiri, Madurai, Mayiladuthurai, Nagapattinam, Namakkal, Nilgiris, Perambalur, Pudukkottai, Ramanathapuram, Ranipet, Salem, Sivaganga, Tenkasi, Thanjavur, Theni, Thoothukudi, Tiruchirappalli, Tirunelveli, Tirupattur, Tiruppur, Tiruvallur, Tiruvannamalai, Tiruvarur, Vellore, Viluppuram, Virudhunagar')),
    ('Telangana', 'तेलंगाना', L('Adilabad, Bhadradri Kothagudem, Hanamkonda, Hyderabad, Jagtial, Jangaon, Jayashankar Bhupalpally, Jogulamba Gadwal, Kamareddy, Karimnagar, Khammam, Kumuram Bheem Asifabad, Mahabubabad, Mahbubnagar, Mancherial, Medak, Medchal-Malkajgiri, Mulugu, Nagarkurnool, Nalgonda, Narayanpet, Nirmal, Nizamabad, Peddapalli, Rajanna Sircilla, Ranga Reddy, Sangareddy, Siddipet, Suryapet, Vikarabad, Wanaparthy, Warangal, Yadadri Bhuvanagiri')),
    ('Tripura', 'त्रिपुरा', L('Dhalai, Gomati, Khowai, North Tripura, Sepahijala, South Tripura, Unakoti, West Tripura')),
    ('Uttarakhand', 'उत्तराखंड', H('Almora=अल्मोड़ा; Bageshwar=बागेश्वर; Chamoli=चमोली; Champawat=चंपावत; Dehradun=देहरादून; Haridwar=हरिद्वार; Nainital=नैनीताल; Pauri Garhwal=पौड़ी गढ़वाल; Pithoragarh=पिथौरागढ़; Rudraprayag=रुद्रप्रयाग; Tehri Garhwal=टिहरी गढ़वाल; Udham Singh Nagar=ऊधम सिंह नगर; Uttarkashi=उत्तरकाशी')),
    # Union territories
    ('Andaman and Nicobar Islands', 'अंडमान और निकोबार द्वीप समूह', L('Nicobar, North and Middle Andaman, South Andaman')),
    ('Chandigarh', 'चंडीगढ़', H('Chandigarh=चंडीगढ़')),
    ('Dadra and Nagar Haveli and Daman and Diu', 'दादरा और नगर हवेली और दमन और दीव', H('Dadra and Nagar Haveli=दादरा और नगर हवेली; Daman=दमन; Diu=दीव')),
    ('Delhi', 'दिल्ली', H('Central Delhi=मध्य दिल्ली; Central North Delhi=मध्य उत्तर दिल्ली; East Delhi=पूर्वी दिल्ली; New Delhi=नई दिल्ली; North Delhi=उत्तरी दिल्ली; North East Delhi=उत्तर पूर्वी दिल्ली; North West Delhi=उत्तर पश्चिमी दिल्ली; Old Delhi=पुरानी दिल्ली; Outer North Delhi=बाहरी उत्तरी दिल्ली; South Delhi=दक्षिणी दिल्ली; South East Delhi=दक्षिण पूर्वी दिल्ली; South West Delhi=दक्षिण पश्चिमी दिल्ली; West Delhi=पश्चिमी दिल्ली')),
    ('Jammu and Kashmir', 'जम्मू और कश्मीर', H('Anantnag=अनंतनाग; Bandipora=बांदीपोरा; Baramulla=बारामूला; Budgam=बडगाम; Doda=डोडा; Ganderbal=गांदरबल; Jammu=जम्मू; Kathua=कठुआ; Kishtwar=किश्तवाड़; Kulgam=कुलगाम; Kupwara=कुपवाड़ा; Poonch=पुंछ; Pulwama=पुलवामा; Rajouri=राजौरी; Ramban=रामबन; Reasi=रियासी; Samba=सांबा; Shopian=शोपियां; Srinagar=श्रीनगर; Udhampur=उधमपुर')),
    ('Ladakh', 'लद्दाख', H('Changthang=चांगथांग; Drass=द्रास; Kargil=कारगिल; Leh=लेह; Nubra=नुब्रा; Sham=शाम; Zanskar=ज़ांस्कर')),
    ('Lakshadweep', 'लक्षद्वीप', H('Lakshadweep=लक्षद्वीप')),
    ('Puducherry', 'पुडुचेरी', H('Karaikal=कराईकल; Mahe=माहे; Puducherry=पुडुचेरी; Yanam=यनम')),
]
INDIA_COUNTS = {'Andhra Pradesh': 28, 'Arunachal Pradesh': 27, 'Assam': 35, 'Chhattisgarh': 33, 'Goa': 3, 'Haryana': 23,
                'Himachal Pradesh': 12, 'Kerala': 14, 'Maharashtra': 36, 'Manipur': 16, 'Meghalaya': 12, 'Mizoram': 11,
                'Nagaland': 16, 'Odisha': 30, 'Punjab': 23, 'Sikkim': 6, 'Tamil Nadu': 38, 'Telangana': 33, 'Tripura': 8,
                'Uttarakhand': 13, 'Andaman and Nicobar Islands': 3, 'Chandigarh': 1, 'Dadra and Nagar Haveli and Daman and Diu': 3,
                'Delhi': 13, 'Jammu and Kashmir': 20, 'Ladakh': 7, 'Lakshadweep': 1, 'Puducherry': 4}

# ----------------------------------------------------------------- Nepal: 7 provinces, 77 districts (Nepali names)
NEPAL = [
    ('Koshi', 'कोशी प्रदेश', H('Bhojpur=भोजपुर; Dhankuta=धनकुटा; Ilam=इलाम; Jhapa=झापा; Khotang=खोटाङ; Morang=मोरङ; Okhaldhunga=ओखलढुङ्गा; Panchthar=पाँचथर; Sankhuwasabha=सङ्खुवासभा; Solukhumbu=सोलुखुम्बु; Sunsari=सुनसरी; Taplejung=ताप्लेजुङ; Tehrathum=तेह्रथुम; Udayapur=उदयपुर')),
    ('Madhesh', 'मधेश प्रदेश', H('Bara=बारा; Dhanusha=धनुषा; Mahottari=महोत्तरी; Parsa=पर्सा; Rautahat=रौतहट; Saptari=सप्तरी; Sarlahi=सर्लाही; Siraha=सिराहा')),
    ('Bagmati', 'बागमती प्रदेश', H('Bhaktapur=भक्तपुर; Chitwan=चितवन; Dhading=धादिङ; Dolakha=दोलखा; Kathmandu=काठमाडौँ; Kavrepalanchok=काभ्रेपलाञ्चोक; Lalitpur=ललितपुर; Makwanpur=मकवानपुर; Nuwakot=नुवाकोट; Ramechhap=रामेछाप; Rasuwa=रसुवा; Sindhuli=सिन्धुली; Sindhupalchok=सिन्धुपाल्चोक')),
    ('Gandaki', 'गण्डकी प्रदेश', H('Baglung=बागलुङ; Gorkha=गोरखा; Kaski=कास्की; Lamjung=लमजुङ; Manang=मनाङ; Mustang=मुस्ताङ; Myagdi=म्याग्दी; Nawalpur (Nawalparasi East)=नवलपुर (नवलपरासी पूर्व); Parbat=पर्वत; Syangja=स्याङ्जा; Tanahun=तनहुँ')),
    ('Lumbini', 'लुम्बिनी प्रदेश', H('Arghakhanchi=अर्घाखाँची; Banke=बाँके; Bardiya=बर्दिया; Dang=दाङ; Eastern Rukum=पूर्वी रुकुम; Gulmi=गुल्मी; Kapilvastu=कपिलवस्तु; Palpa=पाल्पा; Parasi (Nawalparasi West)=परासी (नवलपरासी पश्चिम); Pyuthan=प्युठान; Rolpa=रोल्पा; Rupandehi=रुपन्देही')),
    ('Karnali', 'कर्णाली प्रदेश', H('Dailekh=दैलेख; Dolpa=डोल्पा; Humla=हुम्ला; Jajarkot=जाजरकोट; Jumla=जुम्ला; Kalikot=कालिकोट; Mugu=मुगु; Salyan=सल्यान; Surkhet=सुर्खेत; Western Rukum=पश्चिमी रुकुम')),
    ('Sudurpashchim', 'सुदूरपश्चिम प्रदेश', H('Achham=अछाम; Baitadi=बैतडी; Bajhang=बझाङ; Bajura=बाजुरा; Dadeldhura=डडेलधुरा; Darchula=दार्चुला; Doti=डोटी; Kailali=कैलाली; Kanchanpur=कञ्चनपुर')),
]
NEPAL_COUNTS = {'Koshi': 14, 'Madhesh': 8, 'Bagmati': 13, 'Gandaki': 11, 'Lumbini': 12, 'Karnali': 10, 'Sudurpashchim': 9}

# ----------------------------------------------------------------- countries for NRIs: name, dialling code, Hindi (common ones)
ABROAD_NAME, ABROAD_HI = 'NRI / Abroad', 'विदेश (NRI)'
COUNTRIES = """
Afghanistan|93|अफ़ग़ानिस्तान
Albania|355
Algeria|213
Andorra|376
Angola|244
Antigua and Barbuda|1
Argentina|54|अर्जेंटीना
Armenia|374
Australia|61|ऑस्ट्रेलिया
Austria|43|ऑस्ट्रिया
Azerbaijan|994
Bahamas|1
Bahrain|973|बहरीन
Bangladesh|880|बांग्लादेश
Barbados|1
Belarus|375
Belgium|32|बेल्जियम
Belize|501
Benin|229
Bhutan|975|भूटान
Bolivia|591
Bosnia and Herzegovina|387
Botswana|267
Brazil|55|ब्राज़ील
Brunei|673
Bulgaria|359
Burkina Faso|226
Burundi|257
Cambodia|855
Cameroon|237
Canada|1|कनाडा
Cape Verde|238
Central African Republic|236
Chad|235
Chile|56
China|86|चीन
Colombia|57
Comoros|269
Congo|242
Costa Rica|506
Croatia|385
Cuba|53
Cyprus|357|साइप्रस
Czech Republic|420
Democratic Republic of the Congo|243
Denmark|45|डेनमार्क
Djibouti|253
Dominica|1
Dominican Republic|1
East Timor|670
Ecuador|593
Egypt|20|मिस्र
El Salvador|503
Equatorial Guinea|240
Eritrea|291
Estonia|372
Eswatini|268
Ethiopia|251|इथियोपिया
Fiji|679|फ़िजी
Finland|358|फ़िनलैंड
France|33|फ़्रांस
Gabon|241
Gambia|220
Georgia|995
Germany|49|जर्मनी
Ghana|233|घाना
Greece|30|ग्रीस
Grenada|1
Guatemala|502
Guinea|224
Guinea-Bissau|245
Guyana|592|गुयाना
Haiti|509
Honduras|504
Hong Kong|852|हांगकांग
Hungary|36
Iceland|354
Indonesia|62|इंडोनेशिया
Iran|98|ईरान
Iraq|964|इराक
Ireland|353|आयरलैंड
Israel|972|इज़राइल
Italy|39|इटली
Ivory Coast|225
Jamaica|1
Japan|81|जापान
Jordan|962|जॉर्डन
Kazakhstan|7
Kenya|254|केन्या
Kiribati|686
Kosovo|383
Kuwait|965|कुवैत
Kyrgyzstan|996
Laos|856
Latvia|371
Lebanon|961
Lesotho|266
Liberia|231
Libya|218
Liechtenstein|423
Lithuania|370
Luxembourg|352
Macau|853
Madagascar|261
Malawi|265
Malaysia|60|मलेशिया
Maldives|960|मालदीव
Mali|223
Malta|356
Marshall Islands|692
Mauritania|222
Mauritius|230|मॉरीशस
Mexico|52|मेक्सिको
Micronesia|691
Moldova|373
Monaco|377
Mongolia|976
Montenegro|382
Morocco|212
Mozambique|258
Myanmar|95|म्यांमार
Namibia|264
Nauru|674
Netherlands|31|नीदरलैंड
New Zealand|64|न्यूज़ीलैंड
Nicaragua|505
Niger|227
Nigeria|234|नाइजीरिया
North Korea|850
North Macedonia|389
Norway|47|नॉर्वे
Oman|968|ओमान
Pakistan|92|पाकिस्तान
Palau|680
Palestine|970
Panama|507
Papua New Guinea|675
Paraguay|595
Peru|51
Philippines|63|फ़िलीपींस
Poland|48|पोलैंड
Portugal|351|पुर्तगाल
Qatar|974|क़तर
Romania|40
Russia|7|रूस
Rwanda|250
Saint Kitts and Nevis|1
Saint Lucia|1
Saint Vincent and the Grenadines|1
Samoa|685
San Marino|378
Sao Tome and Principe|239
Saudi Arabia|966|सऊदी अरब
Senegal|221
Serbia|381
Seychelles|248|सेशेल्स
Sierra Leone|232
Singapore|65|सिंगापुर
Slovakia|421
Slovenia|386
Solomon Islands|677
Somalia|252
South Africa|27|दक्षिण अफ़्रीका
South Korea|82|दक्षिण कोरिया
South Sudan|211
Spain|34|स्पेन
Sri Lanka|94|श्रीलंका
Sudan|249
Suriname|597|सूरीनाम
Sweden|46|स्वीडन
Switzerland|41|स्विट्ज़रलैंड
Syria|963
Taiwan|886|ताइवान
Tajikistan|992
Tanzania|255|तंज़ानिया
Thailand|66|थाईलैंड
Togo|228
Tonga|676
Trinidad and Tobago|1|त्रिनिदाद और टोबैगो
Tunisia|216
Turkey|90|तुर्की
Turkmenistan|993
Tuvalu|688
Uganda|256|युगांडा
Ukraine|380|यूक्रेन
United Arab Emirates (UAE)|971|संयुक्त अरब अमीरात (UAE)
United Kingdom (UK)|44|ब्रिटेन (UK)
United States (USA)|1|अमेरिका (USA)
Uruguay|598
Uzbekistan|998
Vanuatu|678
Vatican City|39
Venezuela|58
Vietnam|84|वियतनाम
Yemen|967
Zambia|260
Zimbabwe|263
"""
COUNTRY_ROWS = []
for line in COUNTRIES.strip().splitlines():
    parts = line.split('|')
    COUNTRY_ROWS.append((parts[0], parts[1], parts[2] if len(parts) > 2 else None))
COUNTRY_ROWS.append(('Other country', '', 'अन्य देश'))


def q(s):
    return 'null' if s is None else "'" + s.replace("'", "''") + "'"


def check():
    for st, hi, ds in INDIA:
        assert len(ds) == INDIA_COUNTS[st], (st, len(ds))
        assert len({d.lower() for d, _ in ds}) == len(ds), st
    for st, hi, ds in NEPAL:
        assert len(ds) == NEPAL_COUNTS[st], (st, len(ds))
    assert sum(len(d) for _, _, d in NEPAL) == 77
    assert len(INDIA) == 28
    names = [c[0] for c in COUNTRY_ROWS]
    assert len(set(names)) == len(names)


def existing_states():
    """States loaded by the earlier seed files, for the demo data file."""
    out = {}
    sql = (ROOT / 'supabase/seed_mp_rajasthan.sql').read_text()
    for block in re.findall(r"name = '([^']+)'\)\ninsert into[\s\S]*?\(values\n([\s\S]*?)\) as d", sql):
        out.setdefault(block[0], [])
        out[block[0]] += re.findall(r"\('((?:[^']|'')+)','((?:[^']|'')+)'\)", block[1])
    sql = (ROOT / 'supabase/seed_more_states.sql').read_text()
    for st, n, h in re.findall(r"\('([^']+)','((?:[^']|'')+)','((?:[^']|'')+)'\)", sql):
        out.setdefault(st, []).append((n, h))
    return out


STATE_HI_OLD = {'Madhya Pradesh': 'मध्य प्रदेश', 'Rajasthan': 'राजस्थान', 'Jharkhand': 'झारखंड', 'Uttar Pradesh': 'उत्तर प्रदेश',
                'Karnataka': 'कर्नाटक', 'Gujarat': 'गुजरात', 'West Bengal': 'पश्चिम बंगाल'}


def write_sql():
    rows_states = [(n, hi, 'india') for n, hi, _ in INDIA] + [(n, hi, 'nepal') for n, hi, _ in NEPAL] + [(ABROAD_NAME, ABROAD_HI, 'abroad')]
    dist = [(st, d, h) for st, _, ds in INDIA + NEPAL for d, h in ds] + [(ABROAD_NAME, c, h) for c, _, h in COUNTRY_ROWS]
    lines = [
        '-- =====================================================================',
        '--  Seed: every Indian state and UT with its districts, Nepal (7 provinces,',
        '--  77 districts) and "NRI / Abroad" with the countries of the world.',
        '--  Generated by tools/regions.py. Run after schema.sql. Safe to run twice.',
        '--  Below the district (or country) members type their own block, panchayat',
        '--  and village (Nepal: municipality, ward, village; abroad: state, city).',
        '-- =====================================================================',
        '',
        'insert into public.locations(level, name, name_hi, region) values',
        ',\n'.join(f"  ('state', {q(n)}, {q(h)}, '{r}')" for n, h, r in rows_states),
        'on conflict do nothing;',
        '',
        "update public.locations set region = v.r, name_hi = coalesce(public.locations.name_hi, v.h)",
        'from (values',
        ',\n'.join(f"  ({q(n)}, {q(h)}, '{r}')" for n, h, r in rows_states),
        ') as v(n, h, r)',
        "where level = 'state' and parent_id is null and name = v.n;",
        '',
        'create temp table sd(state text, name text, name_hi text);',
        'insert into sd values',
        ',\n'.join(f'({q(s)},{q(n)},{q(h)})' for s, n, h in dist) + ';',
        '',
        'insert into public.locations(level, name, name_hi, parent_id)',
        "select 'district', sd.name, sd.name_hi, s.id",
        "from sd join public.locations s on s.level = 'state' and s.parent_id is null and s.name = sd.state",
        'on conflict do nothing;',
        '',
        'drop table sd;',
        '',
        '-- every place carries the region of its state (india / nepal / abroad)',
        "update public.locations l set region = s.region from public.locations s",
        "where s.id = l.path[1] and l.level <> 'state' and l.region is distinct from s.region;",
        '',
    ]
    (ROOT / 'supabase/seed_india_nepal_nri.sql').write_text('\n'.join(lines))


def write_js():
    data = {}
    for st, ds in existing_states().items():
        data[st] = {'hi': STATE_HI_OLD.get(st), 'r': 'india', 'd': [[n.replace("''", "'"), h.replace("''", "'")] for n, h in ds]}
    for st, hi, ds in INDIA:
        data[st] = {'hi': hi, 'r': 'india', 'd': [[n, h] for n, h in ds]}
    for st, hi, ds in NEPAL:
        data[st] = {'hi': hi, 'r': 'nepal', 'd': [[n, h] for n, h in ds]}
    data[ABROAD_NAME] = {'hi': ABROAD_HI, 'r': 'abroad', 'd': [[c, h] for c, _, h in COUNTRY_ROWS]}
    (ROOT / 'js/state-data.js').write_text(
        '/* States, Nepal provinces and NRI countries with their districts [name, Hindi] (demo mode only; the live app reads the database).\n'
        '   Generated by tools/regions.py. Bihar is built into js/data.js. */\n'
        'window.STATE_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    countries = [[c, d] for c, d, _ in COUNTRY_ROWS]
    (ROOT / 'js/world-data.js').write_text(
        '/* Countries offered under "NRI / Abroad" with their dialling codes (used by the phone field). Generated by tools/regions.py. */\n'
        'window.WORLD_DATA = { india: \'91\', nepal: \'977\', countries: ' + json.dumps(countries, ensure_ascii=False, separators=(',', ':')) + ' };\n')


if __name__ == '__main__':
    check()
    write_sql()
    write_js()
    print('India', len(INDIA), sum(len(d) for _, _, d in INDIA), '| Nepal', len(NEPAL), sum(len(d) for _, _, d in NEPAL), '| countries', len(COUNTRY_ROWS))
