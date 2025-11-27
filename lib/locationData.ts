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
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', majorCities: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk'] },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', majorCities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah'] },
    { code: 'QA', name: 'Qatar', flag: '🇶🇦', majorCities: ['Doha', 'Al Wakrah', 'Al Rayyan'] },
    { code: 'KW', name: 'Kuwait', flag: '🇰🇼', majorCities: ['Kuwait City', 'Hawalli', 'Salmiya'] },
    { code: 'BH', name: 'Bahrain', flag: '🇧🇭', majorCities: ['Manama', 'Riffa', 'Muharraq'] },
    { code: 'OM', name: 'Oman', flag: '🇴🇲', majorCities: ['Muscat', 'Salalah', 'Sohar'] },
    { code: 'JO', name: 'Jordan', flag: '🇯🇴', majorCities: ['Amman', 'Zarqa', 'Irbid', 'Aqaba'] },
    { code: 'LB', name: 'Lebanon', flag: '🇱🇧', majorCities: ['Beirut', 'Tripoli', 'Sidon', 'Tyre'] },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬', majorCities: ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said'] },
    { code: 'MA', name: 'Morocco', flag: '🇲🇦', majorCities: ['Casablanca', 'Rabat', 'Fes', 'Marrakech', 'Tangier'] },
    { code: 'DZ', name: 'Algeria', flag: '🇩🇿', majorCities: ['Algiers', 'Oran', 'Constantine', 'Annaba'] },
    { code: 'TN', name: 'Tunisia', flag: '🇹🇳', majorCities: ['Tunis', 'Sfax', 'Sousse', 'Kairouan'] },
    { code: 'LY', name: 'Libya', flag: '🇱🇾', majorCities: ['Tripoli', 'Benghazi', 'Misrata'] },
    { code: 'SD', name: 'Sudan', flag: '🇸🇩', majorCities: ['Khartoum', 'Omdurman', 'Port Sudan'] },
    { code: 'SY', name: 'Syria', flag: '🇸🇾', majorCities: ['Damascus', 'Aleppo', 'Homs', 'Latakia'] },
    { code: 'IQ', name: 'Iraq', flag: '🇮🇶', majorCities: ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Najaf', 'Karbala'] },
    { code: 'YE', name: 'Yemen', flag: '🇾🇪', majorCities: ['Sanaa', 'Aden', 'Taiz', 'Hodeidah'] },
    { code: 'PS', name: 'Palestine', flag: '🇵🇸', majorCities: ['Gaza', 'Ramallah', 'Hebron', 'Nablus'] },
  
    // South Asia
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰', majorCities: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar'] },
    { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', majorCities: ['Dhaka', 'Chittagong', 'Khulna', 'Sylhet', 'Rajshahi'] },
    { code: 'IN', name: 'India', flag: '🇮🇳', majorCities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Lucknow'] },
    { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', majorCities: ['Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif'] },
    { code: 'MV', name: 'Maldives', flag: '🇲🇻', majorCities: ['Malé'] },
  
    // Southeast Asia
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩', majorCities: ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar'] },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾', majorCities: ['Kuala Lumpur', 'Johor Bahru', 'Penang', 'Malacca', 'Ipoh'] },
    { code: 'BN', name: 'Brunei', flag: '🇧🇳', majorCities: ['Bandar Seri Begawan', 'Kuala Belait', 'Seria'] },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬', majorCities: ['Singapore'] },
  
    // Central Asia
    { code: 'TR', name: 'Turkey', flag: '🇹🇷', majorCities: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Adana', 'Gaziantep'] },
    { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿', majorCities: ['Baku', 'Ganja', 'Sumqayit'] },
    { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', majorCities: ['Almaty', 'Nur-Sultan', 'Shymkent'] },
    { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', majorCities: ['Tashkent', 'Samarkand', 'Bukhara', 'Khiva'] },
    { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲', majorCities: ['Ashgabat', 'Türkmenabat'] },
    { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬', majorCities: ['Bishkek', 'Osh'] },
    { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯', majorCities: ['Dushanbe', 'Khujand'] },
  
    // Sub-Saharan Africa
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬', majorCities: ['Lagos', 'Kano', 'Ibadan', 'Abuja', 'Port Harcourt'] },
    { code: 'SO', name: 'Somalia', flag: '🇸🇴', majorCities: ['Mogadishu', 'Hargeisa', 'Kismayo'] },
    { code: 'SN', name: 'Senegal', flag: '🇸🇳', majorCities: ['Dakar', 'Touba', 'Thiès'] },
    { code: 'ML', name: 'Mali', flag: '🇲🇱', majorCities: ['Bamako', 'Sikasso', 'Mopti'] },
    { code: 'NE', name: 'Niger', flag: '🇳🇪', majorCities: ['Niamey', 'Zinder', 'Maradi'] },
    { code: 'TD', name: 'Chad', flag: '🇹🇩', majorCities: ['N\'Djamena', 'Moundou', 'Sarh'] },
    { code: 'GM', name: 'Gambia', flag: '🇬🇲', majorCities: ['Banjul', 'Serekunda'] },
    { code: 'GN', name: 'Guinea', flag: '🇬🇳', majorCities: ['Conakry', 'Nzérékoré'] },
    { code: 'CI', name: 'Ivory Coast', flag: '🇨🇮', majorCities: ['Abidjan', 'Yamoussoukro', 'Bouaké'] },
    { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', majorCities: ['Ouagadougou', 'Bobo-Dioulasso'] },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪', majorCities: ['Nairobi', 'Mombasa', 'Kisumu'] },
    { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', majorCities: ['Dar es Salaam', 'Dodoma', 'Mwanza', 'Zanzibar'] },
    { code: 'UG', name: 'Uganda', flag: '🇺🇬', majorCities: ['Kampala', 'Gulu', 'Lira'] },
    { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', majorCities: ['Addis Ababa', 'Dire Dawa', 'Mekelle'] },
    { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', majorCities: ['Djibouti City'] },
    { code: 'ER', name: 'Eritrea', flag: '🇪🇷', majorCities: ['Asmara', 'Massawa'] },
    { code: 'CM', name: 'Cameroon', flag: '🇨🇲', majorCities: ['Yaoundé', 'Douala'] },
    { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', majorCities: ['Maputo', 'Matola', 'Beira'] },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦', majorCities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'] },
  
    // Europe
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', majorCities: ['London', 'Birmingham', 'Manchester', 'Leeds', 'Glasgow', 'Bradford'] },
    { code: 'FR', name: 'France', flag: '🇫🇷', majorCities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Lille'] },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', majorCities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Dortmund'] },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱', majorCities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht'] },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪', majorCities: ['Brussels', 'Antwerp', 'Ghent', 'Bruges'] },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪', majorCities: ['Stockholm', 'Gothenburg', 'Malmö'] },
    { code: 'NO', name: 'Norway', flag: '🇳🇴', majorCities: ['Oslo', 'Bergen', 'Trondheim'] },
    { code: 'DK', name: 'Denmark', flag: '🇩🇰', majorCities: ['Copenhagen', 'Aarhus', 'Odense'] },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', majorCities: ['Rome', 'Milan', 'Naples', 'Turin', 'Florence'] },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', majorCities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Malaga'] },
    { code: 'AT', name: 'Austria', flag: '🇦🇹', majorCities: ['Vienna', 'Graz', 'Linz'] },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭', majorCities: ['Zurich', 'Geneva', 'Basel', 'Bern'] },
    { code: 'AL', name: 'Albania', flag: '🇦🇱', majorCities: ['Tirana', 'Durrës', 'Vlorë'] },
    { code: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦', majorCities: ['Sarajevo', 'Banja Luka', 'Tuzla'] },
    { code: 'XK', name: 'Kosovo', flag: '🇽🇰', majorCities: ['Pristina', 'Prizren', 'Peja'] },
  
    // North America
    { code: 'US', name: 'United States', flag: '🇺🇸', majorCities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Detroit', 'Minneapolis', 'Seattle', 'Atlanta', 'Boston', 'Washington DC'] },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', majorCities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Mississauga'] },
  
    // South America
    { code: 'BR', name: 'Brazil', flag: '🇧🇷', majorCities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza'] },
    { code: 'GY', name: 'Guyana', flag: '🇬🇾', majorCities: ['Georgetown', 'Linden'] },
    { code: 'SR', name: 'Suriname', flag: '🇸🇷', majorCities: ['Paramaribo'] },
  
    // Oceania
    { code: 'AU', name: 'Australia', flag: '🇦🇺', majorCities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'] },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', majorCities: ['Auckland', 'Wellington', 'Christchurch'] },
  
    // East Asia (for Muslims living there)
    { code: 'CN', name: 'China', flag: '🇨🇳', majorCities: ['Beijing', 'Shanghai', 'Urumqi', 'Guangzhou'] },
    { code: 'JP', name: 'Japan', flag: '🇯🇵', majorCities: ['Tokyo', 'Osaka', 'Kobe'] },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷', majorCities: ['Seoul', 'Busan'] },
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
  
  export const getEthnicityByName = (name: string): Ethnicity | undefined => {
    return ETHNICITIES.find(e => e.name.toLowerCase() === name.toLowerCase());
  };
  
  export const searchEthnicities = (query: string): Ethnicity[] => {
    const lowerQuery = query.toLowerCase();
    return ETHNICITIES.filter(eth => 
      eth.name.toLowerCase().includes(lowerQuery) ||
      eth.description?.toLowerCase().includes(lowerQuery)
    );
  };