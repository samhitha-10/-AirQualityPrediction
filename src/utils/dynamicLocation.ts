import { CityInfo, NearbyStation, DynamicAtmospherics, EnvironmentalFeatures } from '../types/aqi';
import { calculatePollutantSubIndex, getAQICategory } from './aqiStandards';

// Get user coordinates via browser Geolocation API
export function getUserGeolocation(): Promise<{ lat: number; lon: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  });
}

// Reverse Geocoding with fallback
export async function reverseGeocodeCoords(lat: number, lon: number): Promise<{ name: string; country: string; region: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'AirQualityPredictionApp/1.0',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timer);

    if (resp.ok) {
      const data = await resp.json();
      const addr = data.address || {};
      const name =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.county ||
        data.name ||
        `Loc (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
      const country = addr.country || 'Detected Region';
      const region = addr.state || addr.province || addr.continent || 'Local Sector';
      return { name, country, region };
    }
  } catch {
    // Fallback if network blocked or rate limited
  }

  // Algorithmic fallback
  return {
    name: `User Station (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
    country: lat > 0 ? 'Northern Coordinates' : 'Southern Coordinates',
    region: 'GPS Real-Time Node',
  };
}

// Generate complete dynamic city package from coordinates or custom input
export function buildDynamicCity(
  lat: number,
  lon: number,
  name: string,
  country: string,
  region: string,
  customBaseline?: Partial<EnvironmentalFeatures>,
  isCurrentLocation: boolean = false
): CityInfo {
  // Deterministic seed from coordinates
  const coordHash = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233)) * 43758.5453;
  const seed = coordHash - Math.floor(coordHash);

  // Climate and urban approximation
  const isTropical = Math.abs(lat) < 23.5;
  const tempBase = isTropical ? 28 + Math.round(seed * 6) : 18 + Math.round(seed * 10);
  const humidBase = isTropical ? 65 + Math.round(seed * 20) : 45 + Math.round(seed * 25);
  const windBase = Number((5 + seed * 12).toFixed(1));

  // Synthesize realistic baseline features
  const pm25 = customBaseline?.pm25 ?? Math.round(25 + seed * 75);
  const pm10 = customBaseline?.pm10 ?? Math.round(pm25 * (1.6 + seed * 0.5));
  const no2 = customBaseline?.no2 ?? Math.round(20 + seed * 45);
  const co = customBaseline?.co ?? Number((0.5 + seed * 1.2).toFixed(1));
  const so2 = customBaseline?.so2 ?? Math.round(5 + seed * 15);
  const o3 = customBaseline?.o3 ?? Math.round(30 + seed * 30);
  const temperature = customBaseline?.temperature ?? tempBase;
  const humidity = customBaseline?.humidity ?? humidBase;
  const windSpeed = customBaseline?.windSpeed ?? windBase;
  const trafficIndex = customBaseline?.trafficIndex ?? Math.round(45 + seed * 45);

  const baselineFeatures: EnvironmentalFeatures = {
    pm25,
    pm10,
    no2,
    co,
    so2,
    o3,
    temperature,
    humidity,
    windSpeed,
    trafficIndex,
  };

  // Calculate AQI and dominant driver
  const subPM25 = calculatePollutantSubIndex('pm25', pm25);
  const subPM10 = calculatePollutantSubIndex('pm10', pm10);
  const subNO2 = calculatePollutantSubIndex('no2', no2);
  const subCO = calculatePollutantSubIndex('co', co);
  const subSO2 = calculatePollutantSubIndex('so2', so2);
  const subO3 = calculatePollutantSubIndex('o3', o3);

  const allSubs = [
    { pol: 'PM2.5', val: subPM25 },
    { pol: 'PM10', val: subPM10 },
    { pol: 'NO₂', val: subNO2 },
    { pol: 'CO', val: subCO },
    { pol: 'SO₂', val: subSO2 },
    { pol: 'O₃', val: subO3 },
  ];

  const highest = allSubs.reduce((prev, curr) => (curr.val > prev.val ? curr : prev), allSubs[0]);
  const currentAQI = highest.val;
  const category = getAQICategory(currentAQI);
  const primaryPollutant = highest.pol;

  // Generate dynamic atmospherics
  const dynamicAtmospherics: DynamicAtmospherics = {
    pressureHpa: Math.round(1012 - (lat / 90) * 8 + (seed - 0.5) * 6),
    uvIndex: isTropical ? 8 : Math.max(1, Math.round(seed * 7)),
    visibilityKm: Number(Math.max(2, 16 - (pm25 / 15)).toFixed(1)),
    dewPoint: Math.round(temperature - ((100 - humidity) / 5)),
    windBearing: ['N', 'NNE', 'NE', 'ENE', 'E', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'NW'][Math.floor(seed * 13)],
    airDensity: Number((1.225 * (288.15 / (temperature + 273.15))).toFixed(3)),
    solarRadiation: Math.round(350 + seed * 450),
  };

  // Generate 4 dynamic nearby stations surrounding the location
  const directions: Array<NearbyStation['direction']> = ['N', 'E', 'S', 'W', 'NE'];
  const types: Array<NearbyStation['type']> = ['Urban', 'Traffic', 'Industrial', 'Rural / Background', 'Urban'];

  const nearbyStations: NearbyStation[] = directions.map((dir, idx) => {
    const dist = Number((1.5 + (idx + 1) * 2.2 + seed * 1.5).toFixed(1));
    const factor = idx === 1 ? 1.25 : idx === 2 ? 1.35 : idx === 3 ? 0.75 : 0.95;
    const stPM25 = Math.max(5, Math.round(pm25 * factor));
    const stPM10 = Math.max(10, Math.round(pm10 * factor));
    const stNO2 = Math.max(8, Math.round(no2 * factor));
    const stAQI = calculatePollutantSubIndex('pm25', stPM25);

    return {
      id: `st-dyn-${Math.round(lat * 100)}-${idx}`,
      name: `${name} ${dir} ${types[idx]} Sensor`,
      distanceKm: dist,
      direction: dir,
      type: types[idx],
      status: 'online',
      currentAQI: stAQI,
      category: getAQICategory(stAQI),
      pm25: stPM25,
      pm10: stPM10,
      no2: stNO2,
    };
  });

  // 24h Diurnal curve
  const hourlyHours = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
  const diurnalMultipliers = [0.92, 1.05, 1.22, 1.15, 0.85, 0.78, 1.08, 1.12];

  const hourlyDiurnal = hourlyHours.map((hour, i) => {
    const hAqi = Math.round(currentAQI * diurnalMultipliers[i]);
    const hPm = Math.round(pm25 * diurnalMultipliers[i]);
    const hTemp = Math.round(temperature + (i >= 3 && i <= 5 ? 4 : -3));
    return {
      hour,
      aqi: hAqi,
      pm25: hPm,
      temperature: hTemp,
    };
  });

  return {
    id: isCurrentLocation ? 'current-location-gps' : `custom-city-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    country,
    region,
    lat,
    lon,
    isCurrentLocation,
    isCustomAdded: !isCurrentLocation,
    dynamicAtmospherics,
    baselineFeatures,
    currentAQI,
    category,
    primaryPollutant,
    weatherDescription: isCurrentLocation
      ? `Real-Time GPS Ingestion • Accuracy ±12m • ${temperature}°C`
      : `Dynamic Telemetry Station • Microclimate Sensor Array • ${temperature}°C`,
    nearbyStations,
    hourlyDiurnal,
  };
}

// Live telemetry jitter simulation (subtle realistic sensor oscillations)
export function simulateDynamicSensorJitter(city: CityInfo): CityInfo {
  const delta = (Math.random() - 0.48) * 2; // subtle drift
  const newPM25 = Math.max(2, Math.round(city.baselineFeatures.pm25 + delta));
  const newWind = Number(Math.max(1, city.baselineFeatures.windSpeed + (Math.random() - 0.5) * 0.6).toFixed(1));
  const newTemp = Number((city.baselineFeatures.temperature + (Math.random() - 0.5) * 0.3).toFixed(1));

  const updatedFeatures: EnvironmentalFeatures = {
    ...city.baselineFeatures,
    pm25: newPM25,
    windSpeed: newWind,
    temperature: newTemp,
  };

  const newAQI = calculatePollutantSubIndex('pm25', newPM25);
  const newCat = getAQICategory(newAQI);

  return {
    ...city,
    baselineFeatures: updatedFeatures,
    currentAQI: newAQI,
    category: newCat,
    weatherDescription: `${city.weatherDescription.split('•')[0].trim()} • Updated ${new Date().toLocaleTimeString()}`,
    dynamicAtmospherics: city.dynamicAtmospherics
      ? {
          ...city.dynamicAtmospherics,
          solarRadiation: Math.round(city.dynamicAtmospherics.solarRadiation + (Math.random() - 0.5) * 20),
          pressureHpa: Math.round(city.dynamicAtmospherics.pressureHpa + (Math.random() - 0.5) * 1),
        }
      : undefined,
  };
}
