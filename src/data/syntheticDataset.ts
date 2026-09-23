import { AirQualityRecord, EnvironmentalFeatures, PresetScenario } from '../types/aqi';
import { calculatePollutantSubIndex, getAQICategory } from '../utils/aqiStandards';

export const MONITORING_STATIONS = [
  { id: 'st-01', name: 'Downtown Central Station', type: 'Commercial Downtown' as const, lat: 28.6139, lon: 77.2090 },
  { id: 'st-02', name: 'West Expressway Highway', type: 'Urban Corridor' as const, lat: 28.5355, lon: 77.3910 },
  { id: 'st-03', name: 'North Industrial Sector', type: 'Industrial Zone' as const, lat: 28.7041, lon: 77.1025 },
  { id: 'st-04', name: 'Green Valley Eco-Park', type: 'Green Park' as const, lat: 28.4595, lon: 77.0266 },
  { id: 'st-05', name: 'Oakridge Suburb Station', type: 'Residential Suburban' as const, lat: 28.5700, lon: 77.3200 },
];

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'user_example',
    name: "User Problem Example",
    badge: 'Benchmark',
    description: 'The exact environmental condition specified in the problem statement (PM2.5: 85, PM10: 140, NO2: 42, CO: 1.2).',
    values: {
      pm25: 85,
      pm10: 140,
      no2: 42,
      co: 1.2,
      so2: 18,
      o3: 45,
      temperature: 30,
      humidity: 70,
      windSpeed: 5,
      trafficIndex: 65,
    },
    expectedAQI: 165,
    expectedCategory: 'Unhealthy',
  },
  {
    id: 'winter_inversion',
    name: 'Winter Temperature Inversion',
    badge: 'Hazardous Event',
    description: 'Cold air trapped near ground with stagnant winds (1.5 km/h) and high humidity causing dense particulate trapping.',
    values: {
      pm25: 220,
      pm10: 340,
      no2: 88,
      co: 3.8,
      so2: 45,
      o3: 22,
      temperature: 11,
      humidity: 89,
      windSpeed: 2,
      trafficIndex: 85,
    },
    expectedAQI: 270,
    expectedCategory: 'Very Unhealthy',
  },
  {
    id: 'post_rain_clean',
    name: 'Post-Monsoon Clean Atmosphere',
    badge: 'Clean Air Baseline',
    description: 'Atmospheric wet deposition (rain washout) with brisk winds dispersing all surface suspended particulates.',
    values: {
      pm25: 14,
      pm10: 28,
      no2: 12,
      co: 0.4,
      so2: 5,
      o3: 25,
      temperature: 24,
      humidity: 55,
      windSpeed: 18,
      trafficIndex: 30,
    },
    expectedAQI: 35,
    expectedCategory: 'Good',
  },
  {
    id: 'dust_storm',
    name: 'Arid Mineral Dust Storm',
    badge: 'Coarse Particle Spike',
    description: 'Strong regional winds lofting coarse crustal particles (PM10) while combustion gases remain moderate.',
    values: {
      pm25: 75,
      pm10: 390,
      no2: 24,
      co: 0.8,
      so2: 14,
      o3: 35,
      temperature: 38,
      humidity: 22,
      windSpeed: 28,
      trafficIndex: 40,
    },
    expectedAQI: 225,
    expectedCategory: 'Very Unhealthy',
  },
  {
    id: 'summer_ozone_heatwave',
    name: 'Photochemical Smog (Ozone)',
    badge: 'Photochemical',
    description: 'Intense ultraviolet radiation, stagnant breeze, and vehicle emissions catalyzing ground-level tropospheric ozone (O3).',
    values: {
      pm25: 45,
      pm10: 68,
      no2: 52,
      co: 1.5,
      so2: 12,
      o3: 135,
      temperature: 39,
      humidity: 35,
      windSpeed: 4,
      trafficIndex: 78,
    },
    expectedAQI: 168,
    expectedCategory: 'Unhealthy',
  },
];

// Pseudorandom generator with fixed seed for reproducibility
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateHistoricalDataset(): AirQualityRecord[] {
  const records: AirQualityRecord[] = [];
  const rand = seededRandom(1337);

  // Generate 420 historical daily/hourly records across the 5 stations
  const totalDays = 84;
  const baseDate = new Date('2025-01-01T08:00:00Z');

  for (let d = 0; d < totalDays; d++) {
    const currentDate = new Date(baseDate.getTime() + d * 24 * 3600 * 1000);
    const dateStr = currentDate.toISOString().split('T')[0];

    // Seasonal factor: Jan-Feb (Winter high pollution), Mar-Apr (Spring moderate), May-Jun (Summer ozone), Jul-Aug (Monsoon clean)
    const month = currentDate.getMonth(); // 0 to 11
    const isWinter = month === 0 || month === 1 || month === 11;
    const isSummer = month >= 4 && month <= 6;
    const isMonsoon = month >= 6 && month <= 8;

    for (let sIdx = 0; sIdx < MONITORING_STATIONS.length; sIdx++) {
      const station = MONITORING_STATIONS[sIdx];

      // Base environmental parameters depending on station archetype
      let baseTraffic = station.type === 'Urban Corridor' ? 78 : station.type === 'Commercial Downtown' ? 70 : station.type === 'Industrial Zone' ? 62 : 35;
      let baseTemp = isWinter ? 12 + rand() * 10 : isSummer ? 32 + rand() * 10 : 25 + rand() * 8;
      let baseHumidity = isMonsoon ? 75 + rand() * 20 : isWinter ? 65 + rand() * 25 : 35 + rand() * 25;
      let baseWind = 3 + rand() * 16;

      // Inversion penalty on wind
      if (isWinter && rand() > 0.4) {
        baseWind = 1.5 + rand() * 4;
      }

      // Traffic variation
      const traffic = Math.min(100, Math.max(10, Math.round(baseTraffic + (rand() - 0.5) * 25)));

      // Meteorological dispersion factor: high wind cleans air, low wind traps air
      const dispersionFactor = Math.max(0.4, 18 / (baseWind + 4));
      // Stagnation factor: high humidity + cold or dense air traps particulates
      const stagnationFactor = 0.8 + (baseHumidity / 100) * 0.4;

      // Pollutant generation based on physical source dynamics
      let no2 = Math.round((traffic * 0.6 + (station.type === 'Industrial Zone' ? 35 : 10) + (rand() - 0.5) * 15) * dispersionFactor * 0.7);
      no2 = Math.max(5, Math.min(180, no2));

      let co = Number(((traffic * 0.02 + 0.3 + (rand() - 0.5) * 0.4) * dispersionFactor * 0.6).toFixed(1));
      co = Math.max(0.1, Math.min(8.5, co));

      let so2 = station.type === 'Industrial Zone' ? Math.round((30 + rand() * 45) * dispersionFactor * 0.6) : Math.round((8 + rand() * 18) * dispersionFactor * 0.5);
      so2 = Math.max(2, Math.min(150, so2));

      let o3 = isSummer 
        ? Math.round((40 + (traffic * 0.4) + (baseTemp * 1.5) + (rand() - 0.5) * 20))
        : Math.round((20 + (rand() * 40)));
      o3 = Math.max(5, Math.min(220, o3));

      // Particulate Matter (PM2.5 & PM10)
      let pm25Base = (no2 * 0.75 + so2 * 0.5 + traffic * 0.4) * dispersionFactor * stagnationFactor;
      if (isWinter) pm25Base *= 1.4; // Biomass & domestic heating + inversion
      if (isMonsoon) pm25Base *= 0.45; // Wet deposition

      let pm25 = Math.round(pm25Base + (rand() - 0.5) * 18);
      pm25 = Math.max(6, Math.min(380, pm25));

      // PM10 is typically 1.4 - 2.2x PM2.5 in urban environments
      let pm10 = Math.round(pm25 * (1.4 + rand() * 0.6) + (rand() - 0.5) * 15);
      pm10 = Math.max(pm25 + 5, Math.min(550, pm10));

      const temp = Math.round(baseTemp * 10) / 10;
      const humidity = Math.round(baseHumidity);
      const windSpeed = Math.round(baseWind * 10) / 10;

      // Standard EPA sub-index calculation
      const subPm25 = calculatePollutantSubIndex('pm25', pm25);
      const subPm10 = calculatePollutantSubIndex('pm10', pm10);
      const subNo2 = calculatePollutantSubIndex('no2', no2);
      const subCo = calculatePollutantSubIndex('co', co);
      const subSo2 = calculatePollutantSubIndex('so2', so2);
      const subO3 = calculatePollutantSubIndex('o3', o3);

      const subIndicesMap: Record<string, number> = {
        'PM2.5': subPm25,
        'PM10': subPm10,
        'NO₂': subNo2,
        'CO': subCo,
        'SO₂': subSo2,
        'O₃': subO3,
      };

      // Primary pollutant has the highest sub-index
      let primary = 'PM2.5';
      let maxSub = subPm25;
      for (const [k, v] of Object.entries(subIndicesMap)) {
        if (v > maxSub) {
          maxSub = v;
          primary = k;
        }
      }

      const aqi = maxSub;
      const category = getAQICategory(aqi);

      // Noise injection for real-world CEP characteristics:
      // ~3.5% missing value indicator
      const isMissing = rand() < 0.035;
      // ~2% outlier anomaly indicator
      const isOutlier = !isMissing && rand() < 0.02;

      let finalPm25 = pm25;
      let finalPm10 = pm10;
      let finalNo2 = no2;

      if (isOutlier) {
        // Sensor glitch spike (e.g. 750 µg/m³ PM2.5 or negative humidity)
        finalPm25 = Math.round(pm25 * 3.8);
        finalPm10 = Math.round(pm10 * 3.2);
      }

      records.push({
        id: `aqi-rec-${d}-${sIdx}`,
        timestamp: `${dateStr} 12:00`,
        stationName: station.name,
        locationType: station.type,
        pm25: finalPm25,
        pm10: finalPm10,
        no2: finalNo2,
        co,
        so2,
        o3,
        temperature: temp,
        humidity,
        windSpeed,
        trafficIndex: traffic,
        aqi,
        category,
        primaryPollutant: primary,
        isMissing,
        isOutlier,
      });
    }
  }

  // Inject 4 intentional duplicate rows to demonstrate deduplication in Preprocessing
  if (records.length > 20) {
    const dup1 = { ...records[5], id: 'dup-rec-01', isDuplicate: true };
    const dup2 = { ...records[12], id: 'dup-rec-02', isDuplicate: true };
    const dup3 = { ...records[25], id: 'dup-rec-03', isDuplicate: true };
    records.splice(6, 0, dup1);
    records.splice(15, 0, dup2);
    records.splice(30, 0, dup3);
  }

  // Ensure user's exact example row is present as a notable verified benchmark record
  records.unshift({
    id: 'user-benchmark-case',
    timestamp: '2025-04-15 14:00',
    stationName: 'Downtown Central Station',
    locationType: 'Commercial Downtown',
    pm25: 85,
    pm10: 140,
    no2: 42,
    co: 1.2,
    so2: 18,
    o3: 45,
    temperature: 30,
    humidity: 70,
    windSpeed: 5,
    trafficIndex: 65,
    aqi: 165,
    category: 'Unhealthy',
    primaryPollutant: 'PM2.5',
    isMissing: false,
    isOutlier: false,
  });

  return records;
}
