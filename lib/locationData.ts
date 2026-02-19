// lib/locationData.ts

export interface Country {
    code: string;
    name: string;
    flag: string;
    majorCities: string[];
  }
  
  export interface Ethnicity {
    name: string;
    flag: string;
    description?: string;
  }
  
  export const COUNTRIES: Country[] = [
    // Middle East & North Africa
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', majorCities: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Abha', 'Taif', 'Hail', 'Jubail', 'Yanbu', 'Buraydah', 'Najran', 'Jizan', 'Al Kharj'] },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', majorCities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Al Ain'] },
    { code: 'QA', name: 'Qatar', flag: '🇶🇦', majorCities: ['Doha', 'Al Wakrah', 'Al Rayyan', 'Al Khor', 'Umm Salal', 'Lusail'] },
    { code: 'KW', name: 'Kuwait', flag: '🇰🇼', majorCities: ['Kuwait City', 'Hawalli', 'Salmiya', 'Jahra', 'Farwaniya', 'Ahmadi', 'Mangaf'] },
    { code: 'BH', name: 'Bahrain', flag: '🇧🇭', majorCities: ['Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'Isa Town', 'Sitra'] },
    { code: 'OM', name: 'Oman', flag: '🇴🇲', majorCities: ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Ibri', 'Barka', 'Rustaq'] },
    { code: 'JO', name: 'Jordan', flag: '🇯🇴', majorCities: ['Amman', 'Zarqa', 'Irbid', 'Aqaba', 'Madaba', 'Salt', 'Mafraq', 'Jerash', 'Karak'] },
    { code: 'LB', name: 'Lebanon', flag: '🇱🇧', majorCities: ['Beirut', 'Tripoli', 'Sidon', 'Tyre', 'Jounieh', 'Zahle', 'Baalbek', 'Byblos'] },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬', majorCities: ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Aswan', 'Mansoura', 'Tanta', 'Zagazig', 'Ismailia', 'Faiyum', 'Damanhur', 'Minya', 'Asyut', 'Sohag', 'Hurghada'] },
    { code: 'MA', name: 'Morocco', flag: '🇲🇦', majorCities: ['Casablanca', 'Rabat', 'Fes', 'Marrakech', 'Tangier', 'Agadir', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan', 'Safi', 'Nador', 'Mohammedia', 'El Jadida', 'Beni Mellal', 'Taza'] },
    { code: 'DZ', name: 'Algeria', flag: '🇩🇿', majorCities: ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Setif', 'Djelfa', 'Biskra', 'Tlemcen', 'Bejaia', 'Tiaret', 'Tizi Ouzou'] },
    { code: 'TN', name: 'Tunisia', flag: '🇹🇳', majorCities: ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabes', 'Ariana', 'Gafsa', 'Monastir', 'Ben Arous', 'Nabeul'] },
    { code: 'LY', name: 'Libya', flag: '🇱🇾', majorCities: ['Tripoli', 'Benghazi', 'Misrata', 'Zliten', 'Zawiya', 'Sabha', 'Ajdabiya', 'Sirte'] },
    { code: 'SD', name: 'Sudan', flag: '🇸🇩', majorCities: ['Khartoum', 'Omdurman', 'Port Sudan', 'Kassala', 'El Obeid', 'Wad Madani', 'Nyala', 'El Fasher', 'Atbara'] },
    { code: 'SY', name: 'Syria', flag: '🇸🇾', majorCities: ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Raqqa', 'Deir ez-Zor', 'Tartus', 'Idlib', 'Daraa'] },
    { code: 'IQ', name: 'Iraq', flag: '🇮🇶', majorCities: ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Najaf', 'Karbala', 'Kirkuk', 'Sulaymaniyah', 'Nasiriyah', 'Hillah', 'Duhok', 'Ramadi', 'Fallujah', 'Samarra'] },
    { code: 'YE', name: 'Yemen', flag: '🇾🇪', majorCities: ['Sanaa', 'Aden', 'Taiz', 'Hodeidah', 'Ibb', 'Mukalla', 'Dhamar', 'Sayyan', 'Seiyun'] },
    { code: 'PS', name: 'Palestine', flag: '🇵🇸', majorCities: ['Gaza', 'Ramallah', 'Hebron', 'Nablus', 'Jenin', 'Tulkarm', 'Bethlehem', 'Jericho', 'Khan Yunis', 'Rafah'] },

    // South Asia
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰', majorCities: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana', 'Mardan', 'Abbottabad', 'Mirpur', 'Muzaffarabad'] },
    { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', majorCities: ['Dhaka', 'Chittagong', 'Khulna', 'Sylhet', 'Rajshahi', 'Comilla', 'Rangpur', 'Gazipur', 'Narayanganj', 'Mymensingh', 'Barisal', 'Jessore', 'Bogra', 'Cox\'s Bazar', 'Dinajpur'] },
    { code: 'IN', name: 'India', flag: '🇮🇳', majorCities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Lucknow', 'Ahmedabad', 'Pune', 'Jaipur', 'Surat', 'Bhopal', 'Patna', 'Indore', 'Nagpur', 'Aligarh', 'Meerut', 'Varanasi', 'Agra', 'Kozhikode', 'Malappuram', 'Srinagar'] },
    { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', majorCities: ['Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Jalalabad', 'Kunduz', 'Ghazni', 'Lashkar Gah', 'Baghlan'] },
    { code: 'MV', name: 'Maldives', flag: '🇲🇻', majorCities: ['Malé', 'Addu City', 'Fuvahmulah'] },

    // Southeast Asia
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩', majorCities: ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Depok', 'Tangerang', 'Bekasi', 'Yogyakarta', 'Malang', 'Solo', 'Padang', 'Denpasar', 'Balikpapan', 'Banjarmasin'] },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾', majorCities: ['Kuala Lumpur', 'Johor Bahru', 'Penang', 'Malacca', 'Ipoh', 'Shah Alam', 'Petaling Jaya', 'Kota Kinabalu', 'Kuching', 'Kota Bharu', 'Kuantan', 'Seremban', 'Alor Setar'] },
    { code: 'BN', name: 'Brunei', flag: '🇧🇳', majorCities: ['Bandar Seri Begawan', 'Kuala Belait', 'Seria', 'Tutong'] },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬', majorCities: ['Singapore'] },

    // Central Asia & Turkey
    { code: 'TR', name: 'Turkey', flag: '🇹🇷', majorCities: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Adana', 'Gaziantep', 'Konya', 'Antalya', 'Kayseri', 'Mersin', 'Diyarbakir', 'Eskisehir', 'Samsun', 'Trabzon', 'Malatya', 'Sanliurfa'] },
    { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿', majorCities: ['Baku', 'Ganja', 'Sumqayit', 'Mingachevir', 'Shirvan', 'Lankaran'] },
    { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', majorCities: ['Almaty', 'Astana', 'Shymkent', 'Karaganda', 'Aktobe', 'Taraz', 'Pavlodar', 'Semey'] },
    { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', majorCities: ['Tashkent', 'Samarkand', 'Bukhara', 'Khiva', 'Namangan', 'Andijan', 'Fergana', 'Nukus', 'Karshi'] },
    { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲', majorCities: ['Ashgabat', 'Türkmenabat', 'Dashoguz', 'Mary', 'Balkanabat'] },
    { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬', majorCities: ['Bishkek', 'Osh', 'Jalal-Abad', 'Karakol', 'Tokmok'] },
    { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯', majorCities: ['Dushanbe', 'Khujand', 'Kulob', 'Bokhtar', 'Istaravshan'] },

    // Sub-Saharan Africa
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬', majorCities: ['Lagos', 'Kano', 'Ibadan', 'Abuja', 'Port Harcourt', 'Kaduna', 'Maiduguri', 'Zaria', 'Ilorin', 'Jos', 'Enugu', 'Abeokuta', 'Sokoto', 'Oyo', 'Benin City', 'Calabar'] },
    { code: 'SO', name: 'Somalia', flag: '🇸🇴', majorCities: ['Mogadishu', 'Hargeisa', 'Kismayo', 'Marka', 'Berbera', 'Baidoa', 'Bosaso', 'Galkayo', 'Beledweyne', 'Burao', 'Garowe'] },
    { code: 'SN', name: 'Senegal', flag: '🇸🇳', majorCities: ['Dakar', 'Touba', 'Thiès', 'Saint-Louis', 'Kaolack', 'Ziguinchor', 'Rufisque', 'Mbour'] },
    { code: 'ML', name: 'Mali', flag: '🇲🇱', majorCities: ['Bamako', 'Sikasso', 'Mopti', 'Koutiala', 'Kayes', 'Segou', 'Gao', 'Timbuktu'] },
    { code: 'NE', name: 'Niger', flag: '🇳🇪', majorCities: ['Niamey', 'Zinder', 'Maradi', 'Agadez', 'Tahoua', 'Dosso'] },
    { code: 'TD', name: 'Chad', flag: '🇹🇩', majorCities: ['N\'Djamena', 'Moundou', 'Sarh', 'Abeche', 'Kelo', 'Koumra'] },
    { code: 'GM', name: 'Gambia', flag: '🇬🇲', majorCities: ['Banjul', 'Serekunda', 'Brikama', 'Bakau', 'Farafenni'] },
    { code: 'GN', name: 'Guinea', flag: '🇬🇳', majorCities: ['Conakry', 'Nzérékoré', 'Kankan', 'Kindia', 'Labé'] },
    { code: 'CI', name: 'Ivory Coast', flag: '🇨🇮', majorCities: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'Daloa', 'San Pedro', 'Korhogo'] },
    { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', majorCities: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya'] },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪', majorCities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Garissa', 'Malindi', 'Lamu', 'Thika'] },
    { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', majorCities: ['Dar es Salaam', 'Dodoma', 'Mwanza', 'Zanzibar', 'Arusha', 'Mbeya', 'Morogoro', 'Tanga', 'Iringa'] },
    { code: 'UG', name: 'Uganda', flag: '🇺🇬', majorCities: ['Kampala', 'Gulu', 'Lira', 'Mbarara', 'Jinja', 'Mbale', 'Entebbe', 'Mukono'] },
    { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', majorCities: ['Addis Ababa', 'Dire Dawa', 'Mekelle', 'Harar', 'Bahir Dar', 'Gondar', 'Jimma', 'Awasa', 'Dessie', 'Jijiga'] },
    { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', majorCities: ['Djibouti City', 'Ali Sabieh', 'Tadjoura', 'Obock'] },
    { code: 'ER', name: 'Eritrea', flag: '🇪🇷', majorCities: ['Asmara', 'Massawa', 'Keren', 'Assab', 'Mendefera'] },
    { code: 'CM', name: 'Cameroon', flag: '🇨🇲', majorCities: ['Yaoundé', 'Douala', 'Garoua', 'Bamenda', 'Maroua', 'Bafoussam', 'Ngaoundéré'] },
    { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', majorCities: ['Maputo', 'Matola', 'Beira', 'Nampula', 'Chimoio', 'Nacala', 'Quelimane', 'Pemba'] },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦', majorCities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'Pietermaritzburg', 'Centurion', 'Midrand', 'Lenasia', 'Laudium'] },

    // Europe
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', majorCities: [
      // Major cities
      'London', 'Birmingham', 'Manchester', 'Leeds', 'Glasgow', 'Bradford', 'Liverpool', 'Edinburgh', 'Bristol', 'Sheffield', 'Leicester', 'Coventry', 'Nottingham', 'Newcastle', 'Sunderland', 'Brighton', 'Hull', 'Plymouth', 'Stoke-on-Trent', 'Wolverhampton', 'Derby', 'Southampton', 'Portsmouth', 'Oxford', 'Cambridge', 'Reading', 'Luton', 'Bolton', 'Blackburn', 'Oldham', 'Rochdale', 'Burnley', 'Preston', 'Dewsbury', 'Batley', 'Halifax', 'Huddersfield', 'Slough', 'Walsall', 'Peterborough', 'Cardiff', 'Swansea', 'Newport', 'Aberdeen', 'Dundee', 'Belfast', 'Milton Keynes', 'Northampton', 'Middlesbrough', 'High Wycombe', 'Watford', 'Ipswich', 'Woking', 'Crawley', 'Croydon', 'Ilford', 'Walthamstow', 'Tower Hamlets', 'Newham', 'Wembley', 'Hounslow', 'Tooting', 'Stratford', 'Barking', 'Whitechapel', 'Bethnal Green', 'Sparkhill', 'Sparkbrook', 'Small Heath', 'Alum Rock', 'Washwood Heath', 'Handsworth', 'Lozells', 'Aston', 'Savile Town', 'Manningham', 'Keighley', 'Nelson', 'Accrington', 'Pendle',
      // Counties - England
      'Greater London', 'West Midlands', 'Greater Manchester', 'West Yorkshire', 'South Yorkshire', 'Merseyside', 'Tyne and Wear', 'Lancashire', 'Kent', 'Essex', 'Hampshire', 'Surrey', 'Hertfordshire', 'Berkshire', 'Buckinghamshire', 'Oxfordshire', 'Cambridgeshire', 'Suffolk', 'Norfolk', 'Devon', 'Somerset', 'Dorset', 'Wiltshire', 'Gloucestershire', 'Worcestershire', 'Warwickshire', 'Staffordshire', 'Derbyshire', 'Nottinghamshire', 'Lincolnshire', 'Leicestershire', 'Northamptonshire', 'Bedfordshire', 'East Sussex', 'West Sussex', 'North Yorkshire', 'East Yorkshire', 'Durham', 'Northumberland', 'Cumbria', 'Cheshire', 'Shropshire', 'Herefordshire', 'Cornwall', 'Rutland',
      // Counties - Wales
      'Glamorgan', 'Gwent', 'Dyfed', 'Powys', 'Gwynedd', 'Clwyd',
      // Counties - Scotland
      'Lanarkshire', 'Lothian', 'Fife', 'Tayside', 'Grampian', 'Highland', 'Ayrshire', 'Renfrewshire', 'Stirlingshire',
      // Counties - Northern Ireland
      'Antrim', 'Down', 'Armagh', 'Tyrone', 'Londonderry', 'Fermanagh',
    ] },
    { code: 'FR', name: 'France', flag: '🇫🇷', majorCities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Lille', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Rennes', 'Reims', 'Saint-Denis', 'Aubervilliers', 'Argenteuil', 'Montreuil', 'Roubaix', 'Tourcoing', 'Grenoble', 'Rouen', 'Mulhouse', 'Metz', 'Nîmes', 'Avignon', 'Créteil', 'Vitry-sur-Seine'] },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', majorCities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Dortmund', 'Stuttgart', 'Düsseldorf', 'Essen', 'Bremen', 'Hanover', 'Leipzig', 'Dresden', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Mannheim', 'Bonn', 'Gelsenkirchen', 'Aachen', 'Offenbach'] },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱', majorCities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen', 'Haarlem', 'Arnhem', 'Zaanstad', 'Leiden', 'Zoetermeer'] },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪', majorCities: ['Brussels', 'Antwerp', 'Ghent', 'Bruges', 'Charleroi', 'Liège', 'Namur', 'Leuven', 'Mechelen', 'Molenbeek', 'Schaerbeek'] },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪', majorCities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping', 'Södertälje', 'Botkyrka'] },
    { code: 'NO', name: 'Norway', flag: '🇳🇴', majorCities: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Drammen', 'Fredrikstad', 'Kristiansand', 'Tromsø'] },
    { code: 'DK', name: 'Denmark', flag: '🇩🇰', majorCities: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Frederiksberg', 'Esbjerg', 'Randers'] },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', majorCities: ['Rome', 'Milan', 'Naples', 'Turin', 'Florence', 'Palermo', 'Genoa', 'Bologna', 'Bari', 'Catania', 'Venice', 'Verona', 'Brescia', 'Bergamo', 'Padua'] },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', majorCities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Malaga', 'Zaragoza', 'Murcia', 'Bilbao', 'Alicante', 'Granada', 'Córdoba', 'Ceuta', 'Melilla'] },
    { code: 'AT', name: 'Austria', flag: '🇦🇹', majorCities: ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Wels'] },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭', majorCities: ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne', 'Winterthur', 'Lucerne', 'St. Gallen'] },
    { code: 'AL', name: 'Albania', flag: '🇦🇱', majorCities: ['Tirana', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Fier', 'Korçë', 'Berat'] },
    { code: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦', majorCities: ['Sarajevo', 'Banja Luka', 'Tuzla', 'Zenica', 'Mostar', 'Bijeljina', 'Brčko'] },
    { code: 'XK', name: 'Kosovo', flag: '🇽🇰', majorCities: ['Pristina', 'Prizren', 'Peja', 'Ferizaj', 'Gjilan', 'Mitrovica'] },
    { code: 'IE', name: 'Ireland', flag: '🇮🇪', majorCities: ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda'] },
    { code: 'FI', name: 'Finland', flag: '🇫🇮', majorCities: ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Turku', 'Oulu'] },
    { code: 'GR', name: 'Greece', flag: '🇬🇷', majorCities: ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa', 'Komotini'] },

    // North America
    { code: 'US', name: 'United States', flag: '🇺🇸', majorCities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Detroit', 'Minneapolis', 'Seattle', 'Atlanta', 'Boston', 'Washington DC', 'San Francisco', 'Denver', 'Baltimore', 'Las Vegas', 'Portland', 'San Jose', 'Austin', 'Jacksonville', 'Columbus', 'Charlotte', 'Indianapolis', 'Nashville', 'Memphis', 'Oklahoma City', 'Louisville', 'Milwaukee', 'Raleigh', 'Tampa', 'Miami', 'Orlando', 'St. Louis', 'Pittsburgh', 'Cincinnati', 'Kansas City', 'Cleveland', 'New Orleans', 'Sacramento', 'Salt Lake City', 'Dearborn', 'Paterson', 'Jersey City', 'Bridgeview', 'Hamtramck', 'Irving', 'Richardson', 'Plano', 'Sugar Land', 'Fremont', 'Irvine', 'Edison', 'Herndon', 'Sterling', 'Falls Church', 'College Park', 'Cedar Rapids'] },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', majorCities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Mississauga', 'Winnipeg', 'Hamilton', 'Quebec City', 'Brampton', 'Surrey', 'Halifax', 'London', 'Markham', 'Vaughan', 'Richmond Hill', 'Scarborough', 'Kitchener', 'Windsor', 'Saskatoon', 'Regina', 'St. Catharines', 'Waterloo'] },

    // South America
    { code: 'BR', name: 'Brazil', flag: '🇧🇷', majorCities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Curitiba', 'Manaus', 'Recife', 'Porto Alegre', 'Foz do Iguaçu'] },
    { code: 'GY', name: 'Guyana', flag: '🇬🇾', majorCities: ['Georgetown', 'Linden', 'New Amsterdam', 'Anna Regina'] },
    { code: 'SR', name: 'Suriname', flag: '🇸🇷', majorCities: ['Paramaribo', 'Lelydorp', 'Nieuw Nickerie'] },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷', majorCities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán'] },
    { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹', majorCities: ['Port of Spain', 'San Fernando', 'Chaguanas', 'Arima'] },

    // Oceania
    { code: 'AU', name: 'Australia', flag: '🇦🇺', majorCities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Newcastle', 'Wollongong', 'Hobart', 'Darwin', 'Cairns', 'Toowoomba', 'Logan', 'Lakemba', 'Auburn', 'Bankstown', 'Broadmeadows', 'Dandenong', 'Campbelltown'] },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', majorCities: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Dunedin'] },

    // East Asia (for Muslims living there)
    { code: 'CN', name: 'China', flag: '🇨🇳', majorCities: ['Beijing', 'Shanghai', 'Urumqi', 'Guangzhou', 'Shenzhen', 'Xian', 'Lanzhou', 'Yinchuan', 'Hohhot', 'Kashgar'] },
    { code: 'JP', name: 'Japan', flag: '🇯🇵', majorCities: ['Tokyo', 'Osaka', 'Kobe', 'Nagoya', 'Yokohama', 'Kyoto', 'Fukuoka'] },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷', majorCities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon'] },
  ];
  
  export const ETHNICITIES: Ethnicity[] = [
    // Arab ethnicities
    { name: 'Arab - Gulf', flag: '🇸🇦', description: 'Saudi, Emirati, Kuwaiti, Qatari, Bahraini, Omani' },
    { name: 'Arab - Levantine', flag: '🇯🇴', description: 'Syrian, Lebanese, Jordanian, Palestinian' },
    { name: 'Arab - North African', flag: '🇲🇦', description: 'Moroccan, Algerian, Tunisian, Libyan' },
    { name: 'Arab - Egyptian', flag: '🇪🇬', description: 'Egyptian, Sudanese' },
    { name: 'Arab - Iraqi', flag: '🇮🇶', description: 'Iraqi' },
    { name: 'Arab - Yemeni', flag: '🇾🇪', description: 'Yemeni' },
  
    // South Asian
    { name: 'Pakistani', flag: '🇵🇰', description: 'Punjabi, Sindhi, Pashtun, Baloch, Muhajir' },
    { name: 'Indian', flag: '🇮🇳', description: 'North Indian, South Indian, Bengali' },
    { name: 'Bangladeshi', flag: '🇧🇩', description: 'Bengali from Bangladesh' },
    { name: 'Afghan', flag: '🇦🇫', description: 'Pashtun, Tajik, Hazara, Uzbek' },
  
    // Southeast Asian
    { name: 'Indonesian', flag: '🇮🇩', description: 'Javanese, Sundanese, Malay' },
    { name: 'Malaysian', flag: '🇲🇾', description: 'Malay, Chinese-Malaysian, Indian-Malaysian' },
    { name: 'Singaporean', flag: '🇸🇬', description: 'Malay-Singaporean' },
    { name: 'Bruneian', flag: '🇧🇳', description: 'Malay-Bruneian' },
  
    // Turkish & Central Asian
    { name: 'Turkish', flag: '🇹🇷', description: 'Turkish, Kurdish' },
    { name: 'Central Asian', flag: '🇺🇿', description: 'Uzbek, Kazakh, Kyrgyz, Tajik, Turkmen' },
    { name: 'Azerbaijani', flag: '🇦🇿', description: 'Azeri' },
  
    // African
    { name: 'West African', flag: '🇳🇬', description: 'Nigerian, Senegalese, Malian, Ghanaian' },
    { name: 'East African', flag: '🇰🇪', description: 'Somali, Kenyan, Tanzanian, Ethiopian' },
    { name: 'North African - Amazigh', flag: '🇲🇦', description: 'Berber/Amazigh' },
    { name: 'South African', flag: '🇿🇦', description: 'Cape Malay, Black South African' },
  
    // European/Western
    { name: 'White - British', flag: '🇬🇧', description: 'British, English, Scottish, Welsh' },
    { name: 'White - American', flag: '🇺🇸', description: 'American (Caucasian)' },
    { name: 'White - European', flag: '🇪🇺', description: 'French, German, Dutch, Scandinavian' },
    { name: 'White - Balkan', flag: '🇦🇱', description: 'Albanian, Bosnian, Kosovar' },
    { name: 'Hispanic/Latino', flag: '🇲🇽', description: 'Latin American, Spanish-speaking' },
  
    // Revert/Convert (no specific ethnicity)
    { name: 'Mixed Heritage', flag: '🌍', description: 'Multiple ethnic backgrounds' },
    { name: 'Other', flag: '🌍', description: 'Not listed above' },
  ];
  
  // Helper functions
  export const getCountryByCode = (code: string): Country | undefined => {
    return COUNTRIES.find(c => c.code === code);
  };
  
  export const getCountryByName = (name: string): Country | undefined => {
    return COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase());
  };
  
  export const getAllCities = (): string[] => {
    return COUNTRIES.flatMap(country => 
      country.majorCities.map(city => `${city}, ${country.name}`)
    );
  };
  
  export const searchCountries = (query: string): Country[] => {
    const lowerQuery = query.toLowerCase();
    return COUNTRIES.filter(country => 
      country.name.toLowerCase().includes(lowerQuery) ||
      country.code.toLowerCase().includes(lowerQuery)
    );
  };
  
  export const searchCities = (query: string): Array<{city: string, country: Country}> => {
    const lowerQuery = query.toLowerCase();
    const results: Array<{city: string, country: Country}> = [];
    
    COUNTRIES.forEach(country => {
      country.majorCities.forEach(city => {
        if (city.toLowerCase().includes(lowerQuery)) {
          results.push({ city, country });
        }
      });
    });
    
    return results;
  };
  
  export const getEthnicityByName = (name: string | undefined): Ethnicity | undefined => {
    if (!name) return undefined;

    return ETHNICITIES.find(e => e.name.toLowerCase() === name.toLowerCase());
  };
  
  export const searchEthnicities = (query: string): Ethnicity[] => {
    const lowerQuery = query.toLowerCase();
    return ETHNICITIES.filter(eth => 
      eth.name.toLowerCase().includes(lowerQuery) ||
      eth.description?.toLowerCase().includes(lowerQuery)
    );
  };