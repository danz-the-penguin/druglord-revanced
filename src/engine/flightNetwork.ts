import { AirportInfo, RealFlightSchedule, FlightSeatClass } from './types';
import { CITY_MAP, CITIES } from './constants';

export const AIRPORT_REGISTRY: Record<string, AirportInfo> = {
  new_york: {
    cityId: 'new_york',
    iata: 'JFK',
    airportName: 'John F. Kennedy International',
    terminals: 6,
    coordinates: { lat: 40.6413, lng: -73.7781 },
    hubTier: 'mega_global',
    directDestinations: [
      'miami', 'los_angeles', 'detroit', 'vancouver', 'toronto',
      'london', 'paris', 'amsterdam', 'berlin', 'frankfurt', 'madrid', 'zurich',
      'bogota', 'medellin', 'panama_city', 'mexico_city', 'sao_paulo', 'rio_de_janeiro',
      'tokyo', 'hong_kong', 'dubai', 'lagos', 'johannesburg'
    ],
  },
  miami: {
    cityId: 'miami',
    iata: 'MIA',
    airportName: 'Miami International Airport',
    terminals: 3,
    coordinates: { lat: 25.7959, lng: -80.287 },
    hubTier: 'major_regional',
    directDestinations: [
      'new_york', 'los_angeles', 'detroit', 'toronto',
      'bogota', 'medellin', 'panama_city', 'mexico_city', 'sao_paulo', 'rio_de_janeiro',
      'london', 'paris', 'madrid', 'frankfurt'
    ],
  },
  los_angeles: {
    cityId: 'los_angeles',
    iata: 'LAX',
    airportName: 'Los Angeles International',
    terminals: 9,
    coordinates: { lat: 33.9416, lng: -118.4085 },
    hubTier: 'mega_global',
    directDestinations: [
      'new_york', 'miami', 'detroit', 'vancouver', 'toronto', 'tijuana', 'mexico_city',
      'panama_city', 'tokyo', 'hong_kong', 'sydney', 'singapore', 'london', 'paris', 'frankfurt'
    ],
  },
  detroit: {
    cityId: 'detroit',
    iata: 'DTW',
    airportName: 'Detroit Metropolitan Wayne County',
    terminals: 2,
    coordinates: { lat: 42.2162, lng: -83.3554 },
    hubTier: 'major_regional',
    directDestinations: [
      'new_york', 'miami', 'los_angeles', 'toronto', 'vancouver', 'mexico_city',
      'london', 'paris', 'amsterdam', 'frankfurt', 'tokyo'
    ],
  },
  vancouver: {
    cityId: 'vancouver',
    iata: 'YVR',
    airportName: 'Vancouver International',
    terminals: 3,
    coordinates: { lat: 49.1967, lng: -123.1815 },
    hubTier: 'major_regional',
    directDestinations: [
      'toronto', 'los_angeles', 'new_york', 'detroit',
      'tokyo', 'hong_kong', 'sydney', 'london', 'frankfurt', 'mexico_city'
    ],
  },
  tijuana: {
    cityId: 'tijuana',
    iata: 'TIJ',
    airportName: 'General Abelardo L. Rodríguez Intl',
    terminals: 2,
    coordinates: { lat: 32.5411, lng: -116.9702 },
    hubTier: 'specialized',
    directDestinations: ['mexico_city', 'los_angeles', 'panama_city', 'bogota'],
  },
  bogota: {
    cityId: 'bogota',
    iata: 'BOG',
    airportName: 'El Dorado International',
    terminals: 2,
    coordinates: { lat: 4.7016, lng: -74.1469 },
    hubTier: 'major_regional',
    directDestinations: [
      'medellin', 'panama_city', 'miami', 'new_york', 'mexico_city',
      'sao_paulo', 'rio_de_janeiro', 'madrid', 'london', 'paris', 'frankfurt'
    ],
  },
  medellin: {
    cityId: 'medellin',
    iata: 'MDE',
    airportName: 'José María Córdova International',
    terminals: 1,
    coordinates: { lat: 6.1645, lng: -75.4231 },
    hubTier: 'specialized',
    directDestinations: ['bogota', 'panama_city', 'miami', 'new_york', 'mexico_city', 'madrid'],
  },
  rio_de_janeiro: {
    cityId: 'rio_de_janeiro',
    iata: 'GIG',
    airportName: 'Galeão International',
    terminals: 2,
    coordinates: { lat: -22.8089, lng: -43.2436 },
    hubTier: 'major_regional',
    directDestinations: [
      'sao_paulo', 'bogota', 'panama_city', 'miami', 'new_york',
      'london', 'paris', 'madrid', 'frankfurt', 'lagos'
    ],
  },
  london: {
    cityId: 'london',
    iata: 'LHR',
    airportName: 'London Heathrow Airport',
    terminals: 5,
    coordinates: { lat: 51.47, lng: -0.4543 },
    hubTier: 'mega_global',
    directDestinations: [
      'paris', 'amsterdam', 'berlin', 'frankfurt', 'madrid', 'zurich', 'ibiza', 'istanbul',
      'new_york', 'miami', 'los_angeles', 'toronto', 'vancouver',
      'dubai', 'singapore', 'hong_kong', 'tokyo', 'bangkok', 'sydney', 'johannesburg', 'lagos',
      'bogota', 'sao_paulo', 'mexico_city'
    ],
  },
  paris: {
    cityId: 'paris',
    iata: 'CDG',
    airportName: 'Paris Charles de Gaulle',
    terminals: 3,
    coordinates: { lat: 49.0097, lng: 2.5479 },
    hubTier: 'mega_global',
    directDestinations: [
      'london', 'amsterdam', 'berlin', 'frankfurt', 'madrid', 'zurich', 'ibiza', 'istanbul',
      'new_york', 'miami', 'los_angeles', 'toronto', 'vancouver',
      'dubai', 'singapore', 'hong_kong', 'tokyo', 'bangkok', 'johannesburg', 'lagos',
      'bogota', 'sao_paulo', 'rio_de_janeiro'
    ],
  },
  amsterdam: {
    cityId: 'amsterdam',
    iata: 'AMS',
    airportName: 'Amsterdam Airport Schiphol',
    terminals: 1,
    coordinates: { lat: 52.3105, lng: 4.7683 },
    hubTier: 'mega_global',
    directDestinations: [
      'london', 'paris', 'berlin', 'frankfurt', 'madrid', 'zurich', 'ibiza', 'istanbul',
      'new_york', 'detroit', 'los_angeles', 'toronto', 'panama_city', 'sao_paulo',
      'dubai', 'singapore', 'bangkok', 'tokyo', 'hong_kong', 'johannesburg', 'lagos'
    ],
  },
  berlin: {
    cityId: 'berlin',
    iata: 'BER',
    airportName: 'Berlin Brandenburg Willy Brandt',
    terminals: 2,
    coordinates: { lat: 52.3667, lng: 13.5033 },
    hubTier: 'major_regional',
    directDestinations: [
      'london', 'paris', 'amsterdam', 'frankfurt', 'zurich', 'madrid', 'ibiza', 'istanbul',
      'new_york', 'dubai', 'singapore'
    ],
  },
  ibiza: {
    cityId: 'ibiza',
    iata: 'IBZ',
    airportName: 'Aeropuerto de Ibiza',
    terminals: 1,
    coordinates: { lat: 38.8729, lng: 1.3731 },
    hubTier: 'specialized',
    directDestinations: ['madrid', 'london', 'paris', 'amsterdam', 'berlin', 'frankfurt', 'zurich'],
  },
  sydney: {
    cityId: 'sydney',
    iata: 'SYD',
    airportName: 'Sydney Kingsford Smith',
    terminals: 3,
    coordinates: { lat: -33.9399, lng: 151.1753 },
    hubTier: 'major_regional',
    directDestinations: [
      'singapore', 'bangkok', 'hong_kong', 'tokyo', 'dubai',
      'los_angeles', 'vancouver', 'johannesburg', 'london'
    ],
  },
  tokyo: {
    cityId: 'tokyo',
    iata: 'NRT',
    airportName: 'Narita International Airport',
    terminals: 3,
    coordinates: { lat: 35.772, lng: 140.3929 },
    hubTier: 'mega_global',
    directDestinations: [
      'singapore', 'hong_kong', 'bangkok', 'sydney', 'dubai', 'istanbul',
      'los_angeles', 'new_york', 'detroit', 'vancouver', 'toronto', 'mexico_city',
      'london', 'paris', 'frankfurt', 'amsterdam', 'zurich'
    ],
  },
  bangkok: {
    cityId: 'bangkok',
    iata: 'BKK',
    airportName: 'Suvarnabhumi Airport',
    terminals: 2,
    coordinates: { lat: 13.69, lng: 100.7501 },
    hubTier: 'major_regional',
    directDestinations: [
      'singapore', 'hong_kong', 'tokyo', 'sydney', 'dubai', 'istanbul',
      'london', 'paris', 'frankfurt', 'amsterdam', 'zurich',
      'kuala_lumpur', 'penang', 'chiang_mai', 'jakarta', 'ho_chi_minh', 'hanoi', 'vientiane', 'phnom_penh'
    ],
  },
  hong_kong: {
    cityId: 'hong_kong',
    iata: 'HKG',
    airportName: 'Hong Kong International',
    terminals: 2,
    coordinates: { lat: 22.308, lng: 113.9185 },
    hubTier: 'mega_global',
    directDestinations: [
      'singapore', 'bangkok', 'tokyo', 'sydney', 'dubai', 'istanbul',
      'los_angeles', 'new_york', 'vancouver', 'toronto',
      'london', 'paris', 'frankfurt', 'amsterdam', 'zurich',
      'kuala_lumpur', 'penang', 'jakarta', 'ho_chi_minh', 'hanoi'
    ],
  },
  dubai: {
    cityId: 'dubai',
    iata: 'DXB',
    airportName: 'Dubai International Airport',
    terminals: 3,
    coordinates: { lat: 25.2532, lng: 55.3657 },
    hubTier: 'mega_global',
    directDestinations: [
      'london', 'paris', 'frankfurt', 'amsterdam', 'berlin', 'madrid', 'zurich', 'istanbul',
      'singapore', 'bangkok', 'hong_kong', 'tokyo', 'sydney',
      'johannesburg', 'lagos',
      'new_york', 'los_angeles', 'toronto', 'sao_paulo', 'kuala_lumpur', 'jakarta'
    ],
  },
  johannesburg: {
    cityId: 'johannesburg',
    iata: 'JNB',
    airportName: 'O.R. Tambo International',
    terminals: 2,
    coordinates: { lat: -26.1367, lng: 28.2411 },
    hubTier: 'major_regional',
    directDestinations: [
      'lagos', 'dubai', 'istanbul', 'london', 'paris', 'frankfurt', 'amsterdam',
      'singapore', 'sydney', 'sao_paulo', 'new_york'
    ],
  },
  lagos: {
    cityId: 'lagos',
    iata: 'LOS',
    airportName: 'Murtala Muhammed International',
    terminals: 2,
    coordinates: { lat: 6.5774, lng: 3.3212 },
    hubTier: 'major_regional',
    directDestinations: [
      'johannesburg', 'dubai', 'istanbul', 'london', 'paris', 'frankfurt', 'amsterdam',
      'new_york', 'sao_paulo'
    ],
  },
  panama_city: {
    cityId: 'panama_city',
    iata: 'PTY',
    airportName: 'Tocumen International Airport',
    terminals: 2,
    coordinates: { lat: 9.0714, lng: -79.3835 },
    hubTier: 'major_regional',
    directDestinations: [
      'bogota', 'medellin', 'miami', 'new_york', 'los_angeles', 'mexico_city', 'tijuana',
      'sao_paulo', 'rio_de_janeiro', 'toronto', 'madrid', 'amsterdam', 'paris'
    ],
  },
  singapore: {
    cityId: 'singapore',
    iata: 'SIN',
    airportName: 'Singapore Changi Airport',
    terminals: 4,
    coordinates: { lat: 1.3644, lng: 103.9915 },
    hubTier: 'mega_global',
    directDestinations: [
      'bangkok', 'hong_kong', 'tokyo', 'sydney', 'dubai', 'istanbul',
      'london', 'paris', 'frankfurt', 'amsterdam', 'zurich',
      'los_angeles', 'new_york', 'johannesburg',
      'kuala_lumpur', 'penang', 'chiang_mai', 'jakarta', 'surabaya', 'ho_chi_minh', 'hanoi', 'vientiane', 'phnom_penh'
    ],
  },
  zurich: {
    cityId: 'zurich',
    iata: 'ZRH',
    airportName: 'Zurich Airport / Kloten',
    terminals: 3,
    coordinates: { lat: 47.4582, lng: 8.5555 },
    hubTier: 'major_regional',
    directDestinations: [
      'london', 'paris', 'frankfurt', 'amsterdam', 'berlin', 'madrid', 'ibiza', 'istanbul',
      'new_york', 'miami', 'los_angeles', 'toronto', 'sao_paulo',
      'dubai', 'singapore', 'tokyo', 'bangkok', 'hong_kong', 'johannesburg'
    ],
  },
  istanbul: {
    cityId: 'istanbul',
    iata: 'IST',
    airportName: 'Istanbul Airport',
    terminals: 1,
    coordinates: { lat: 41.2753, lng: 28.7519 },
    hubTier: 'mega_global',
    directDestinations: [
      'london', 'paris', 'frankfurt', 'amsterdam', 'berlin', 'madrid', 'zurich',
      'dubai', 'singapore', 'bangkok', 'hong_kong', 'tokyo',
      'lagos', 'johannesburg',
      'new_york', 'los_angeles', 'toronto', 'sao_paulo', 'mexico_city'
    ],
  },
  mexico_city: {
    cityId: 'mexico_city',
    iata: 'MEX',
    airportName: 'Benito Juárez International',
    terminals: 2,
    coordinates: { lat: 19.4361, lng: -99.0719 },
    hubTier: 'major_regional',
    directDestinations: [
      'tijuana', 'los_angeles', 'miami', 'new_york', 'detroit', 'vancouver', 'toronto',
      'panama_city', 'bogota', 'medellin', 'sao_paulo',
      'madrid', 'paris', 'london', 'frankfurt', 'tokyo'
    ],
  },
  frankfurt: {
    cityId: 'frankfurt',
    iata: 'FRA',
    airportName: 'Frankfurt Airport am Main',
    terminals: 2,
    coordinates: { lat: 50.0379, lng: 8.5622 },
    hubTier: 'mega_global',
    directDestinations: [
      'london', 'paris', 'amsterdam', 'berlin', 'madrid', 'zurich', 'ibiza', 'istanbul',
      'new_york', 'miami', 'los_angeles', 'detroit', 'vancouver', 'toronto',
      'bogota', 'sao_paulo', 'rio_de_janeiro', 'mexico_city',
      'dubai', 'singapore', 'bangkok', 'hong_kong', 'tokyo',
      'johannesburg', 'lagos'
    ],
  },
  sao_paulo: {
    cityId: 'sao_paulo',
    iata: 'GRU',
    airportName: 'Guarulhos International',
    terminals: 3,
    coordinates: { lat: -23.4356, lng: -46.4731 },
    hubTier: 'major_regional',
    directDestinations: [
      'rio_de_janeiro', 'bogota', 'panama_city', 'mexico_city',
      'miami', 'new_york',
      'madrid', 'london', 'paris', 'frankfurt', 'amsterdam', 'zurich', 'istanbul',
      'johannesburg', 'lagos', 'dubai'
    ],
  },
  madrid: {
    cityId: 'madrid',
    iata: 'MAD',
    airportName: 'Adolfo Suárez Madrid–Barajas',
    terminals: 4,
    coordinates: { lat: 40.4839, lng: -3.568 },
    hubTier: 'mega_global',
    directDestinations: [
      'london', 'paris', 'amsterdam', 'berlin', 'frankfurt', 'zurich', 'ibiza', 'istanbul',
      'bogota', 'medellin', 'panama_city', 'sao_paulo', 'rio_de_janeiro', 'mexico_city',
      'miami', 'new_york', 'dubai'
    ],
  },
  toronto: {
    cityId: 'toronto',
    iata: 'YYZ',
    airportName: 'Toronto Pearson International',
    terminals: 2,
    coordinates: { lat: 43.6777, lng: -79.6248 },
    hubTier: 'major_regional',
    directDestinations: [
      'vancouver', 'new_york', 'miami', 'los_angeles', 'detroit',
      'mexico_city', 'panama_city', 'sao_paulo',
      'london', 'paris', 'amsterdam', 'frankfurt', 'zurich',
      'dubai', 'hong_kong', 'tokyo'
    ],
  },
  kuala_lumpur: {
    cityId: 'kuala_lumpur',
    iata: 'KUL',
    airportName: 'Kuala Lumpur International Airport',
    terminals: 2,
    coordinates: { lat: 2.7456, lng: 101.7099 },
    hubTier: 'major_regional',
    directDestinations: [
      'singapore', 'penang', 'bangkok', 'jakarta', 'hong_kong', 'dubai', 'london', 'tokyo', 'ho_chi_minh', 'surabaya'
    ],
  },
  penang: {
    cityId: 'penang',
    iata: 'PEN',
    airportName: 'Penang International Airport',
    terminals: 1,
    coordinates: { lat: 5.2971, lng: 100.2768 },
    hubTier: 'specialized',
    directDestinations: ['kuala_lumpur', 'singapore', 'bangkok', 'jakarta', 'hong_kong'],
  },
  chiang_mai: {
    cityId: 'chiang_mai',
    iata: 'CNX',
    airportName: 'Chiang Mai International Airport',
    terminals: 2,
    coordinates: { lat: 18.7668, lng: 98.9626 },
    hubTier: 'specialized',
    directDestinations: ['bangkok', 'vientiane', 'hanoi', 'singapore', 'hong_kong'],
  },
  jakarta: {
    cityId: 'jakarta',
    iata: 'CGK',
    airportName: 'Soekarno-Hatta International Airport',
    terminals: 3,
    coordinates: { lat: -6.1256, lng: 106.6559 },
    hubTier: 'major_regional',
    directDestinations: [
      'singapore', 'kuala_lumpur', 'surabaya', 'bangkok', 'hong_kong', 'tokyo', 'sydney', 'dubai'
    ],
  },
  surabaya: {
    cityId: 'surabaya',
    iata: 'SUB',
    airportName: 'Juanda International Airport',
    terminals: 2,
    coordinates: { lat: -7.3798, lng: 112.7874 },
    hubTier: 'specialized',
    directDestinations: ['jakarta', 'singapore', 'kuala_lumpur', 'sydney'],
  },
  ho_chi_minh: {
    cityId: 'ho_chi_minh',
    iata: 'SGN',
    airportName: 'Tan Son Nhat International Airport',
    terminals: 2,
    coordinates: { lat: 10.8188, lng: 106.6519 },
    hubTier: 'major_regional',
    directDestinations: [
      'hanoi', 'phnom_penh', 'singapore', 'bangkok', 'kuala_lumpur', 'hong_kong', 'tokyo', 'paris'
    ],
  },
  hanoi: {
    cityId: 'hanoi',
    iata: 'HAN',
    airportName: 'Noi Bai International Airport',
    terminals: 2,
    coordinates: { lat: 21.2212, lng: 105.8072 },
    hubTier: 'major_regional',
    directDestinations: [
      'ho_chi_minh', 'bangkok', 'vientiane', 'hong_kong', 'tokyo', 'singapore', 'paris', 'frankfurt'
    ],
  },
  vientiane: {
    cityId: 'vientiane',
    iata: 'VTE',
    airportName: 'Wattay International Airport',
    terminals: 1,
    coordinates: { lat: 17.9883, lng: 102.5633 },
    hubTier: 'specialized',
    directDestinations: ['bangkok', 'hanoi', 'chiang_mai', 'phnom_penh', 'singapore'],
  },
  phnom_penh: {
    cityId: 'phnom_penh',
    iata: 'PNH',
    airportName: 'Phnom Penh International Airport',
    terminals: 1,
    coordinates: { lat: 11.5466, lng: 104.8441 },
    hubTier: 'specialized',
    directDestinations: ['bangkok', 'ho_chi_minh', 'singapore', 'kuala_lumpur', 'vientiane', 'hong_kong'],
  },
};

export const AIRLINE_PREFIXES: Record<string, { code: string; name: string }[]> = {
  Americas: [
    { code: 'AA', name: 'American Airlines' },
    { code: 'DL', name: 'Delta Air Lines' },
    { code: 'UA', name: 'United Airlines' },
    { code: 'AV', name: 'Avianca' },
    { code: 'CM', name: 'Copa Airlines' },
    { code: 'AM', name: 'Aeroméxico' },
    { code: 'LA', name: 'LATAM Airlines' },
    { code: 'AC', name: 'Air Canada' },
  ],
  Europe: [
    { code: 'BA', name: 'British Airways' },
    { code: 'AF', name: 'Air France' },
    { code: 'LH', name: 'Lufthansa' },
    { code: 'KL', name: 'KLM Royal Dutch' },
    { code: 'IB', name: 'Iberia' },
    { code: 'LX', name: 'SWISS International' },
  ],
  'Asia-Pacific': [
    { code: 'SQ', name: 'Singapore Airlines' },
    { code: 'CX', name: 'Cathay Pacific' },
    { code: 'JL', name: 'Japan Airlines' },
    { code: 'QF', name: 'Qantas Airways' },
    { code: 'TG', name: 'Thai Airways' },
  ],
  'Middle East & Africa': [
    { code: 'EK', name: 'Emirates' },
    { code: 'TK', name: 'Turkish Airlines' },
    { code: 'SA', name: 'South African Airways' },
    { code: 'P4', name: 'Air Peace' },
  ],
};

/**
 * Generates an airport departure board showing live flights from current location.
 */
export function generateAirportFlightBoard(
  currentCityId: string,
  currentDay: number = 1
): RealFlightSchedule[] {
  const originAirport = AIRPORT_REGISTRY[currentCityId];
  if (!originAirport) return [];

  const schedules: RealFlightSchedule[] = [];
  const currentCity = CITY_MAP.get(currentCityId);
  const region = currentCity?.region || 'Americas';
  const airlines = AIRLINE_PREFIXES[region] || AIRLINE_PREFIXES['Americas'];

  for (const destination of CITIES) {
    if (destination.id === currentCityId) continue;

    const destAirport = AIRPORT_REGISTRY[destination.id];
    if (!destAirport) continue;

    const isDirect = originAirport.directDestinations.includes(destination.id);

    // Pick deterministic airline & flight number based on city IDs and day
    const seed = (currentCityId.length * 37 + destination.id.length * 13 + currentDay * 7) % 997;
    const airlineObj = airlines[seed % airlines.length];
    const flightNumInt = 100 + (seed % 890);
    const flightNumber = `${airlineObj.code} ${flightNumInt}`;

    // Calculate realistic distance/flight duration
    const dLat = (destAirport.coordinates.lat - originAirport.coordinates.lat);
    const dLng = (destAirport.coordinates.lng - originAirport.coordinates.lng);
    const approxDistKm = Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 111);
    const baseDurationMins = Math.max(65, Math.round(approxDistKm / 14));
    const durationMinutes = isDirect ? baseDurationMins : Math.round(baseDurationMins * 1.45 + 90);

    // Departure time (e.g. 08:35, 14:20)
    const hour = (6 + (seed % 17)).toString().padStart(2, '0');
    const minute = ((seed * 11) % 60).toString().padStart(2, '0');
    const departureTime = `${hour}:${minute}`;

    // Gate & Terminal
    const termNum = 1 + (seed % originAirport.terminals);
    const gateLetter = ['A', 'B', 'C', 'D', 'E'][seed % 5];
    const gateNum = 1 + (seed % 30);
    const gate = `${gateLetter}${gateNum}`;
    const terminal = `Terminal ${termNum}`;

    // Flight Status
    const statusRoll = (seed * 3) % 100;
    let status: RealFlightSchedule['status'] = 'On Time';
    if (statusRoll < 18) status = 'Boarding';
    else if (statusRoll < 35) status = 'Gate Open';
    else if (statusRoll < 48 && destination.policeRisk > 0.26) status = 'Customs Alert';
    else if (statusRoll < 55) status = 'Delayed';

    // Pricing: direct flights base, connecting flights have 35% surcharge
    const ticketCost = isDirect
      ? destination.flightCost
      : Math.round(destination.flightCost * 1.35);

    // Transit city for connecting routes
    let transitCityId: string | undefined;
    let transitCityName: string | undefined;
    if (!isDirect) {
      // Pick a connecting hub common between both or a mega hub
      const commonHub = originAirport.directDestinations.find((hubId) => {
        const hubAir = AIRPORT_REGISTRY[hubId];
        return hubAir && hubAir.directDestinations.includes(destination.id);
      }) || (originAirport.directDestinations.includes('london') ? 'london' : 'panama_city');
      transitCityId = commonHub;
      transitCityName = CITY_MAP.get(commonHub)?.name ?? 'International Hub';
    }

    schedules.push({
      flightId: `FL-${currentCityId}-${destination.id}-${currentDay}`,
      flightNumber,
      airline: airlineObj.name,
      originCityId: currentCityId,
      originIata: originAirport.iata,
      originAirport: originAirport.airportName,
      destinationCityId: destination.id,
      destinationIata: destAirport.iata,
      destinationAirport: destAirport.airportName,
      destinationCityName: destination.name,
      departureTime,
      durationMinutes,
      gate,
      terminal,
      status,
      ticketCost,
      isDirect,
      transitCityId,
      transitCityName,
      policeAlertRisk: status === 'Customs Alert' ? 0.15 : 0,
    });
  }

  // Sort: direct flights first, then alphabetical by city name
  return schedules.sort((a, b) => {
    if (a.isDirect && !b.isDirect) return -1;
    if (!a.isDirect && b.isDirect) return 1;
    return a.destinationCityName.localeCompare(b.destinationCityName);
  });
}

/**
 * Calculates ticket costs, customs risk reduction, and luggage concealment according to seat class.
 */
export function calculateSeatClassDetails(
  baseTicketCost: number,
  seatClass: FlightSeatClass
): {
  finalCost: number;
  customsRiskReduction: number;
  description: string;
} {
  switch (seatClass) {
    case 'business':
      return {
        finalCost: Math.round(baseTicketCost * 2.2 + 650),
        customsRiskReduction: 0.25, // 25% lower dog/customs risk
        description: 'Priority Customs Fast-Track Lane & Diplomatic Velvet Rope (-25% Customs Risk)',
      };
    case 'private_narco':
      return {
        finalCost: Math.max(18000, Math.round(baseTicketCost * 12 + 15000)),
        customsRiskReduction: 0.60, // 60% lower dog/customs risk
        description: 'Sub Rosa Executive Narco-Jet Charter • Private Hangar Takeoff (-60% Customs Risk, Non-Stop Guaranteed)',
      };
    case 'economy':
    default:
      return {
        finalCost: baseTicketCost,
        customsRiskReduction: 0,
        description: 'Standard Commercial Coach • Full Airport Security Scanners',
      };
  }
}
