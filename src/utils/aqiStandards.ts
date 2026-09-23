import { AQICategory, EnvironmentalFeatures, PollutantSubIndex } from '../types/aqi';

export interface AQIBreakpoint {
  lowC: number;
  highC: number;
  lowI: number;
  highI: number;
  category: AQICategory;
}

// Official US EPA & CPCB harmonized standard breakpoints
export const BREAKPOINTS: Record<string, AQIBreakpoint[]> = {
  pm25: [
    { lowC: 0.0, highC: 12.0, lowI: 0, highI: 50, category: 'Good' },
    { lowC: 12.1, highC: 35.4, lowI: 51, highI: 100, category: 'Moderate' },
    { lowC: 35.5, highC: 55.4, lowI: 101, highI: 150, category: 'Unhealthy for Sensitive Groups' },
    { lowC: 55.5, highC: 150.4, lowI: 151, highI: 200, category: 'Unhealthy' },
    { lowC: 150.5, highC: 250.4, lowI: 201, highI: 300, category: 'Very Unhealthy' },
    { lowC: 250.5, highC: 500.0, lowI: 301, highI: 500, category: 'Hazardous' },
  ],
  pm10: [
    { lowC: 0, highC: 54, lowI: 0, highI: 50, category: 'Good' },
    { lowC: 55, highC: 154, lowI: 51, highI: 100, category: 'Moderate' },
    { lowC: 155, highC: 254, lowI: 101, highI: 150, category: 'Unhealthy for Sensitive Groups' },
    { lowC: 255, highC: 354, lowI: 151, highI: 200, category: 'Unhealthy' },
    { lowC: 355, highC: 424, lowI: 201, highI: 300, category: 'Very Unhealthy' },
    { lowC: 425, highC: 604, lowI: 301, highI: 500, category: 'Hazardous' },
  ],
  no2: [
    { lowC: 0, highC: 53, lowI: 0, highI: 50, category: 'Good' },
    { lowC: 54, highC: 100, lowI: 51, highI: 100, category: 'Moderate' },
    { lowC: 101, highC: 360, lowI: 101, highI: 150, category: 'Unhealthy for Sensitive Groups' },
    { lowC: 361, highC: 649, lowI: 151, highI: 200, category: 'Unhealthy' },
    { lowC: 650, highC: 1249, lowI: 201, highI: 300, category: 'Very Unhealthy' },
    { lowC: 1250, highC: 2049, lowI: 301, highI: 500, category: 'Hazardous' },
  ],
  co: [
    { lowC: 0.0, highC: 4.4, lowI: 0, highI: 50, category: 'Good' },
    { lowC: 4.5, highC: 9.4, lowI: 51, highI: 100, category: 'Moderate' },
    { lowC: 9.5, highC: 12.4, lowI: 101, highI: 150, category: 'Unhealthy for Sensitive Groups' },
    { lowC: 12.5, highC: 15.4, lowI: 151, highI: 200, category: 'Unhealthy' },
    { lowC: 15.5, highC: 30.4, lowI: 201, highI: 300, category: 'Very Unhealthy' },
    { lowC: 30.5, highC: 50.4, lowI: 301, highI: 500, category: 'Hazardous' },
  ],
  so2: [
    { lowC: 0, highC: 35, lowI: 0, highI: 50, category: 'Good' },
    { lowC: 36, highC: 75, lowI: 51, highI: 100, category: 'Moderate' },
    { lowC: 76, highC: 185, lowI: 101, highI: 150, category: 'Unhealthy for Sensitive Groups' },
    { lowC: 186, highC: 304, lowI: 151, highI: 200, category: 'Unhealthy' },
    { lowC: 305, highC: 604, lowI: 201, highI: 300, category: 'Very Unhealthy' },
    { lowC: 605, highC: 1004, lowI: 301, highI: 500, category: 'Hazardous' },
  ],
  o3: [
    { lowC: 0, highC: 54, lowI: 0, highI: 50, category: 'Good' },
    { lowC: 55, highC: 70, lowI: 51, highI: 100, category: 'Moderate' },
    { lowC: 71, highC: 85, lowI: 101, highI: 150, category: 'Unhealthy for Sensitive Groups' },
    { lowC: 86, highC: 105, lowI: 151, highI: 200, category: 'Unhealthy' },
    { lowC: 106, highC: 200, lowI: 201, highI: 300, category: 'Very Unhealthy' },
    { lowC: 201, highC: 500, lowI: 301, highI: 500, category: 'Hazardous' },
  ],
};

/**
 * Standard EPA linear piecewise equation:
 * Ip = [(I_hi - I_lo) / (BP_hi - BP_lo)] * (Cp - BP_lo) + I_lo
 */
export function calculatePollutantSubIndex(pollutant: string, concentration: number): number {
  const bps = BREAKPOINTS[pollutant.toLowerCase()];
  if (!bps) return Math.min(500, Math.max(0, Math.round(concentration)));

  const validC = Math.max(0, concentration);

  for (const bp of bps) {
    if (validC >= bp.lowC && validC <= bp.highC) {
      const idx = ((bp.highI - bp.lowI) / (bp.highC - bp.lowC)) * (validC - bp.lowC) + bp.lowI;
      return Math.round(idx);
    }
  }

  // Beyond upper breakpoint
  const lastBp = bps[bps.length - 1];
  if (validC > lastBp.highC) {
    return 500;
  }
  return 0;
}

export function getAQICategory(aqi: number): AQICategory {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

export function getAQIColor(category: AQICategory): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  hex: string;
} {
  switch (category) {
    case 'Good':
      return {
        bg: 'bg-emerald-950/40',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-500 text-slate-950 font-semibold',
        hex: '#10b981',
      };
    case 'Moderate':
      return {
        bg: 'bg-yellow-950/40',
        text: 'text-yellow-400',
        border: 'border-yellow-500/30',
        badge: 'bg-yellow-400 text-slate-950 font-semibold',
        hex: '#eab308',
      };
    case 'Unhealthy for Sensitive Groups':
      return {
        bg: 'bg-orange-950/40',
        text: 'text-orange-400',
        border: 'border-orange-500/30',
        badge: 'bg-orange-500 text-white font-semibold',
        hex: '#f97316',
      };
    case 'Unhealthy':
      return {
        bg: 'bg-red-950/40',
        text: 'text-red-400',
        border: 'border-red-500/30',
        badge: 'bg-red-600 text-white font-semibold',
        hex: '#ef4444',
      };
    case 'Very Unhealthy':
      return {
        bg: 'bg-purple-950/40',
        text: 'text-purple-400',
        border: 'border-purple-500/30',
        badge: 'bg-purple-600 text-white font-semibold',
        hex: '#a855f7',
      };
    case 'Hazardous':
    default:
      return {
        bg: 'bg-rose-950/50',
        text: 'text-rose-400',
        border: 'border-rose-600/40',
        badge: 'bg-rose-700 text-white font-semibold',
        hex: '#be123c',
      };
  }
}

export function computeSubIndices(features: EnvironmentalFeatures): PollutantSubIndex[] {
  const list = [
    { key: 'pm25', name: 'PM2.5', unit: 'µg/m³', formula: 'Particulate Matter ≤ 2.5 µm', value: features.pm25 },
    { key: 'pm10', name: 'PM10', unit: 'µg/m³', formula: 'Particulate Matter ≤ 10 µm', value: features.pm10 },
    { key: 'no2', name: 'NO₂', unit: 'µg/m³', formula: 'Nitrogen Dioxide', value: features.no2 },
    { key: 'co', name: 'CO', unit: 'mg/m³', formula: 'Carbon Monoxide', value: features.co },
    { key: 'so2', name: 'SO₂', unit: 'µg/m³', formula: 'Sulfur Dioxide', value: features.so2 },
    { key: 'o3', name: 'O₃', unit: 'µg/m³', formula: 'Ground-level Ozone', value: features.o3 },
  ];

  return list.map((item) => {
    const subIdx = calculatePollutantSubIndex(item.key, item.value);
    return {
      name: item.name,
      formula: item.formula,
      value: item.value,
      unit: item.unit,
      subIndex: subIdx,
      category: getAQICategory(subIdx),
      weight: 1,
    };
  });
}

export function getHealthAdvisory(category: AQICategory, primaryPollutant: string) {
  switch (category) {
    case 'Good':
      return {
        generalSummary: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
        sensitiveGroupsGuidance: 'None. Safe for all individuals to participate in outdoor sports, walks, and activities.',
        outdoorActivityRecommendation: 'Ideal conditions for outdoor recreation and exercise.',
        maskRequired: false,
        airPurifierRecommended: false,
      };
    case 'Moderate':
      return {
        generalSummary: `Air quality is acceptable; however, for some pollutants (${primaryPollutant}), there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution.`,
        sensitiveGroupsGuidance: 'Active children and adults, and people with respiratory disease, such as asthma, should limit prolonged outdoor exertion.',
        outdoorActivityRecommendation: 'General public can enjoy normal activities.',
        maskRequired: false,
        airPurifierRecommended: false,
      };
    case 'Unhealthy for Sensitive Groups':
      return {
        generalSummary: `Members of sensitive groups may experience health effects. The general public is not likely to be affected. High concentration of ${primaryPollutant}.`,
        sensitiveGroupsGuidance: 'People with lung disease, older adults, and children are at greater risk from exposure to ozone and particles.',
        outdoorActivityRecommendation: 'Active children and adults with respiratory disease should avoid prolonged outdoor exertion.',
        maskRequired: true,
        airPurifierRecommended: true,
      };
    case 'Unhealthy':
      return {
        generalSummary: `Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects. Elevated ${primaryPollutant} levels detected.`,
        sensitiveGroupsGuidance: 'People with heart or lung disease, older adults, and children should strictly avoid prolonged outdoor exertion.',
        outdoorActivityRecommendation: 'Everyone else should limit prolonged outdoor exertion. Wear N95/FFP2 masks outdoors.',
        maskRequired: true,
        airPurifierRecommended: true,
      };
    case 'Very Unhealthy':
      return {
        generalSummary: 'Health alert: The risk of health effects is increased for everyone in the population.',
        sensitiveGroupsGuidance: 'People with respiratory or heart disease, the elderly and children should remain indoors and keep activity levels low.',
        outdoorActivityRecommendation: 'Avoid all outdoor physical activity. Keep windows sealed and operate HEPA purifiers.',
        maskRequired: true,
        airPurifierRecommended: true,
      };
    case 'Hazardous':
    default:
      return {
        generalSummary: 'Health warning of emergency conditions: The entire population is more likely to be affected by serious health complications.',
        sensitiveGroupsGuidance: 'Everyone should remain indoors and avoid any outdoor physical activities. Strict quarantine from outside ambient air advised.',
        outdoorActivityRecommendation: 'Emergency status: Do not venture outside without industrial-grade particulate filtration masks.',
        maskRequired: true,
        airPurifierRecommended: true,
      };
  }
}
