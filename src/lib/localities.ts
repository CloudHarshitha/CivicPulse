/**
 * India 3-Level Locality Data: State → District → Cities
 */
export const INDIA_LOCALITIES: {
  [state: string]: {
    [district: string]: string[];
  };
} = {
  "Delhi": {
    "Central Delhi": ["Paharganj", "Connaught Place", "Karol Bagh", "Daryaganj"],
    "East Delhi": ["Preet Vihar", "Vivek Vihar", "Shahdara", "Krishnanagar"],
    "New Delhi": ["Chanakyapuri", "Lodhi Road", "Sarojini Nagar", "RK Puram"],
    "North Delhi": ["Model Town", "Rohini", "Pitampura", "Ashok Vihar"],
    "North East Delhi": ["Seemapuri", "Nand Nagri", "Mustafabad", "Seelampur"],
    "North West Delhi": ["Shalimar Bagh", "Pitampura", "Rani Bagh", "Paschim Vihar"],
    "Shahdara": ["Dilshad Garden", "Geeta Colony", "Gandhi Nagar"],
    "South Delhi": ["Greater Kailash", "Lajpat Nagar", "Saket", "Vasant Kunj"],
    "South East Delhi": ["Okhla", "Jasola", "Jaitpur", "Madanpur Khadar"],
    "South West Delhi": ["Dwarka", "Uttam Nagar", "Janakpuri", "Hari Nagar"],
    "West Delhi": ["Rajouri Garden", "Tilak Nagar", "Vikaspuri", "Subhash Nagar"],
  },
  "Maharashtra": {
    "Mumbai City": ["Fort", "Colaba", "Byculla", "Dharavi", "Worli"],
    "Mumbai Suburban": ["Bandra", "Kurla", "Andheri", "Borivali", "Malad"],
    "Pune": ["Shivajinagar", "Kothrud", "Hadapsar", "Wakad", "Baner"],
    "Nagpur": ["Civil Lines", "Dharampeth", "Sitabuldi", "Sadar"],
    "Nashik": ["Nashik Road", "Dwarka", "Cidco", "Panchavati"],
    "Thane": ["Thane City", "Kalyan", "Dombivli", "Ulhasnagar"],
    "Aurangabad": ["CIDCO", "Cantonment", "Osmanpura"],
    "Solapur": ["Central Solapur", "North Solapur", "South Solapur"],
  },
  "Karnataka": {
    "Bangalore Urban": ["Whitefield", "Electronic City", "Koramangala", "Indiranagar", "Jayanagar"],
    "Bangalore Rural": ["Devanahalli", "Doddaballapur", "Hoskote"],
    "Mysuru": ["Mysuru City", "Nanjangud", "Hunsur"],
    "Mangaluru": ["Mangaluru City", "Puttur", "Bantwal"],
    "Belagavi": ["Belagavi City", "Gokak", "Bail-Hongal"],
    "Hubballi-Dharwad": ["Hubballi", "Dharwad"],
    "Kalaburagi": ["Kalaburagi City", "Sedam", "Aland"],
  },
  "Uttar Pradesh": {
    "Lucknow": ["Hazratganj", "Gomti Nagar", "Aliganj", "Indira Nagar", "Alambagh"],
    "Kanpur Nagar": ["Civil Lines", "Kakadeo", "Kidwai Nagar", "Govind Nagar"],
    "Gautam Buddha Nagar": ["Noida", "Greater Noida", "Dadri"],
    "Agra": ["Agra City", "Fatehabad", "Kheragarh"],
    "Varanasi": ["Varanasi City", "Ramnagar", "Sarnath"],
    "Prayagraj": ["Allahabad City", "Phulpur", "Naini"],
    "Ghaziabad": ["Ghaziabad City", "Loni", "Muradnagar"],
    "Meerut": ["Meerut City", "Hapur", "Modinagar"],
    "Mathura": ["Mathura City", "Vrindavan", "Govardhan"],
    "Bareilly": ["Bareilly City", "Faridpur", "Nawabganj"],
  },
  "Tamil Nadu": {
    "Chennai": ["Adyar", "Anna Nagar", "T. Nagar", "Velachery", "Tambaram", "Ramapuram", "Mogappair", "Maduravoyal", "Nolumbur"],
    "Coimbatore": ["Coimbatore North", "Coimbatore South", "Pollachi"],
    "Madurai": ["Madurai City", "Melur", "Tirumangalam"],
    "Tiruchirappalli": ["Tiruchirappalli City", "Musiri", "Lalgudi"],
    "Salem": ["Salem City", "Mettur", "Attur"],
    "Tirunelveli": ["Tirunelveli City", "Tenkasi", "Sankarankovil"],
    "Erode": ["Erode City", "Bhavani", "Perundurai"],
    "Vellore": ["Vellore City", "Gudiyatham", "Ranipet"],
  },
  "West Bengal": {
    "Kolkata": ["Park Street", "Ballygunge", "Jadavpur", "Dum Dum", "Howrah"],
    "Howrah": ["Howrah City", "Uluberia", "Bally"],
    "North 24 Parganas": ["Barasat", "Barrackpore", "Kalyani"],
    "South 24 Parganas": ["Alipore", "Diamond Harbour", "Sundarbans"],
    "Purba Medinipur": ["Haldia", "Tamluk", "Contai"],
    "Darjeeling": ["Darjeeling Town", "Kurseong", "Siliguri"],
    "Murshidabad": ["Berhampore", "Jangipur", "Kandi"],
  },
  "Gujarat": {
    "Ahmedabad": ["Satellite", "Navrangpura", "Bopal", "Maninagar", "Vejalpur"],
    "Surat": ["Surat City", "Katargam", "Udhna", "Varachha"],
    "Vadodara": ["Vadodara City", "Waghodia", "Padra"],
    "Rajkot": ["Rajkot City", "Gondal", "Jetpur"],
    "Bhavnagar": ["Bhavnagar City", "Mahuva", "Palitana"],
    "Jamnagar": ["Jamnagar City", "Dwarka", "Lalpur"],
    "Gandhinagar": ["Gandhinagar City", "Mansa", "Dehgam"],
  },
  "Rajasthan": {
    "Jaipur": ["Malviya Nagar", "Mansarovar", "Vaishali Nagar", "Civil Lines", "Sanganer"],
    "Jodhpur": ["Jodhpur City", "Bilara", "Phalodi"],
    "Udaipur": ["Udaipur City", "Nathdwara", "Rajsamand"],
    "Kota": ["Kota City", "Bundi", "Baran"],
    "Ajmer": ["Ajmer City", "Pushkar", "Beawar"],
    "Bikaner": ["Bikaner City", "Nokha", "Lunkaransar"],
    "Alwar": ["Alwar City", "Bharatpur", "Tijara"],
  },
  "Andhra Pradesh": {
    "Visakhapatnam": ["Visakhapatnam City", "Bheemunipatnam", "Bhimili"],
    "Vijayawada": ["Vijayawada City", "Machilipatnam", "Gudivada"],
    "Guntur": ["Guntur City", "Tenali", "Narasaraopet"],
    "Nellore": ["Nellore City", "Kavali", "Gudur"],
    "Kurnool": ["Kurnool City", "Adoni", "Nandyal"],
    "Kadapa": ["Kadapa City", "Proddatur", "Jammalamadugu"],
    "Tirupati": ["Tirupati City", "Chittoor", "Srikalahasti"],
  },
  "Telangana": {
    "Hyderabad": ["Banjara Hills", "Jubilee Hills", "Kukatpally", "Secunderabad", "Hitech City"],
    "Ranga Reddy": ["LB Nagar", "Dilsukhnagar", "Hayathnagar"],
    "Medchal-Malkajgiri": ["Kompally", "Malkajgiri", "Quthbullapur"],
    "Warangal Urban": ["Warangal City", "Hanumakonda", "Kazipet"],
    "Khammam": ["Khammam City", "Kothagudem", "Palvancha"],
    "Nizamabad": ["Nizamabad City", "Bodhan", "Armoor"],
  },
  "Kerala": {
    "Thiruvananthapuram": ["Thiruvananthapuram City", "Neyyattinkara", "Attingal"],
    "Ernakulam": ["Kochi", "Thrippunithura", "Aluva", "Perumbavoor"],
    "Kozhikode": ["Kozhikode City", "Vadakara", "Koyilandy"],
    "Thrissur": ["Thrissur City", "Chalakudy", "Kodungallur"],
    "Kollam": ["Kollam City", "Karunagappally", "Punalur"],
    "Kannur": ["Kannur City", "Thalassery", "Mattannur"],
    "Malappuram": ["Malappuram City", "Tirur", "Perinthalmanna"],
  },
  "Madhya Pradesh": {
    "Bhopal": ["Bhopal City", "Huzur", "Sehore", "Berasia"],
    "Indore": ["Indore City", "Mhow", "Depalpur"],
    "Gwalior": ["Gwalior City", "Lashkar", "Morar"],
    "Jabalpur": ["Jabalpur City", "Katni", "Damoh"],
    "Ujjain": ["Ujjain City", "Nagda", "Mahidpur"],
    "Sagar": ["Sagar City", "Damoh", "Banda"],
    "Rewa": ["Rewa City", "Satna", "Sidhi"],
  },
  "Bihar": {
    "Patna": ["Patna City", "Danapur", "Phulwari", "Maner"],
    "Gaya": ["Gaya City", "Bodh Gaya", "Sherghati"],
    "Bhagalpur": ["Bhagalpur City", "Banka", "Sultanganj"],
    "Muzaffarpur": ["Muzaffarpur City", "Hajipur", "Sitamarhi"],
    "Darbhanga": ["Darbhanga City", "Madhubani", "Samastipur"],
    "Purnia": ["Purnia City", "Katihar", "Araria"],
  },
  "Odisha": {
    "Khordha": ["Bhubaneswar", "Puri", "Khordha Town"],
    "Cuttack": ["Cuttack City", "Jagatsinghpur", "Kendrapara"],
    "Sundargarh": ["Rourkela", "Sundargarh Town", "Bonai"],
    "Sambalpur": ["Sambalpur City", "Bargarh", "Jharsuguda"],
    "Ganjam": ["Berhampur", "Aska", "Brahmapur"],
  },
  "Haryana": {
    "Faridabad": ["Faridabad City", "Ballabhgarh", "NIT Faridabad"],
    "Gurugram": ["Gurugram City", "DLF Phase 1", "Sohna", "Manesar"],
    "Panipat": ["Panipat City", "Samalkha", "Israna"],
    "Ambala": ["Ambala City", "Ambala Cantt", "Naraingarh"],
    "Rohtak": ["Rohtak City", "Bahadurgarh", "Jhajjar"],
    "Hisar": ["Hisar City", "Hansi", "Fatehabad"],
    "Karnal": ["Karnal City", "Panipat", "Kaithal"],
  },
  "Punjab": {
    "Ludhiana": ["Ludhiana City", "Khanna", "Samrala"],
    "Amritsar": ["Amritsar City", "Ajnala", "Attari"],
    "Jalandhar": ["Jalandhar City", "Phagwara", "Nakodar"],
    "Patiala": ["Patiala City", "Rajpura", "Sangrur"],
    "Mohali": ["Mohali City", "Kharar", "Derabassi"],
    "Bathinda": ["Bathinda City", "Mansa", "Rampura Phul"],
  },
  "Assam": {
    "Kamrup Metropolitan": ["Guwahati", "Dispur", "Jalukbari"],
    "Kamrup": ["Boko", "Hajo", "Rangia"],
    "Cachar": ["Silchar", "Sonai", "Lakhipur"],
    "Dibrugarh": ["Dibrugarh City", "Naharkatia", "Moran"],
    "Jorhat": ["Jorhat City", "Majuli", "Titabar"],
  },
  "Himachal Pradesh": {
    "Shimla": ["Shimla City", "Rampur", "Rohru"],
    "Kangra": ["Dharamshala", "Palampur", "Nurpur"],
    "Kullu": ["Kullu City", "Manali", "Banjar"],
    "Mandi": ["Mandi City", "Sundernagar", "Jogindernagar"],
    "Solan": ["Solan City", "Baddi", "Nalagarh"],
  },
  "Jharkhand": {
    "Ranchi": ["Ranchi City", "Namkum", "Kanke"],
    "East Singhbhum": ["Jamshedpur", "Dhalbhum", "Boram"],
    "Dhanbad": ["Dhanbad City", "Jharia", "Sindri"],
    "Bokaro": ["Bokaro Steel City", "Chas", "Bermo"],
  },
  "Uttarakhand": {
    "Dehradun": ["Dehradun City", "Rishikesh", "Mussoorie"],
    "Haridwar": ["Haridwar City", "Roorkee", "Jwalapur"],
    "Nainital": ["Nainital Town", "Haldwani", "Ramnagar"],
    "Udham Singh Nagar": ["Rudrapur", "Kashipur", "Kichha"],
  },
  "Goa": {
    "North Goa": ["Panaji", "Mapusa", "Calangute", "Baga"],
    "South Goa": ["Margao", "Vasco da Gama", "Ponda", "Quepem"],
  },
  "Chhattisgarh": {
    "Raipur": ["Raipur City", "Arang", "Abhanpur"],
    "Durg": ["Bhilai", "Durg City", "Patan"],
    "Bilaspur": ["Bilaspur City", "Mungeli", "Takhatpur"],
    "Korba": ["Korba City", "Katghora", "Pali"],
  },
  "Tripura": {
    "West Tripura": ["Agartala", "Mohanpur", "Majlishpur"],
    "North Tripura": ["Dharmanagar", "Kanchanpur"],
    "South Tripura": ["Sabroom", "Udaipur", "Belonia"],
  },
  "Manipur": {
    "Imphal West": ["Imphal City", "Lamphel", "Yaiskul"],
    "Imphal East": ["Porompat", "Thoubal", "Wangjing"],
  },
  "Meghalaya": {
    "East Khasi Hills": ["Shillong", "Mawlai", "Nongthymmai"],
    "West Garo Hills": ["Tura", "Phulbari", "Selsella"],
  },
  "Nagaland": {
    "Kohima": ["Kohima City", "Zubza", "Kigwema"],
    "Dimapur": ["Dimapur City", "Chumukedima"],
  },
  "Arunachal Pradesh": {
    "Papum Pare": ["Itanagar", "Naharlagun", "Nirjuli"],
    "Tawang": ["Tawang Town", "Lumla"],
    "East Siang": ["Pasighat", "Mebo"],
  },
  "Sikkim": {
    "East Sikkim": ["Gangtok", "Rangpo", "Singtam"],
    "South Sikkim": ["Namchi", "Jorethang"],
    "North Sikkim": ["Mangan", "Chungthang"],
  },
  "Mizoram": {
    "Aizawl": ["Aizawl City", "Durtlang", "Zemabawk"],
    "Lunglei": ["Lunglei City", "Tlabung"],
  },
  "Andaman and Nicobar Islands": {
    "South Andaman": ["Port Blair", "Aberdeen Bazaar", "Haddo"],
    "North and Middle Andaman": ["Mayabunder", "Diglipur"],
  },
  "Chandigarh": {
    "Chandigarh": ["Sector 1", "Sector 17", "Sector 22", "Sector 35", "Mohali"],
  },
  "Dadra and Nagar Haveli and Daman and Diu": {
    "Daman": ["Daman City", "Vapi"],
    "Diu": ["Diu Town", "Ghogha"],
    "Dadra and Nagar Haveli": ["Silvassa", "Amli"],
  },
  "Lakshadweep": {
    "Lakshadweep": ["Kavaratti", "Agatti", "Androth"],
  },
  "Puducherry": {
    "Puducherry": ["Puducherry City", "Oulgaret", "Ariyankuppam"],
    "Karaikal": ["Karaikal Town"],
  },
  "Ladakh": {
    "Leh": ["Leh City", "Nubra", "Zanskar"],
    "Kargil": ["Kargil City", "Drass", "Sanku"],
  },
  "Jammu and Kashmir": {
    "Srinagar": ["Srinagar City", "Ganderbal", "Budgam"],
    "Jammu": ["Jammu City", "Samba", "Kathua"],
    "Anantnag": ["Anantnag City", "Kulgam", "Shopian"],
    "Baramulla": ["Baramulla City", "Sopore", "Uri"],
    "Kupwara": ["Kupwara Town", "Handwara", "Karnah"],
  },
};

export function getStates(): string[] {
  return Object.keys(INDIA_LOCALITIES).sort();
}

export function getDistricts(state: string): string[] {
  if (!state || !INDIA_LOCALITIES[state]) return [];
  return Object.keys(INDIA_LOCALITIES[state]).sort();
}

export function getCities(state: string, district?: string): string[] {
  if (!state || !INDIA_LOCALITIES[state]) return [];
  if (district && INDIA_LOCALITIES[state][district]) {
    return INDIA_LOCALITIES[state][district].sort();
  }
  // Fallback: return all cities across all districts for the state
  return Object.values(INDIA_LOCALITIES[state]).flat().sort();
}
