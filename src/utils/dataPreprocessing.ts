import {
  AirQualityRecord,
  EnvironmentalFeatures,
  PreprocessingConfig,
  PreprocessingSummary,
} from '../types/aqi';

export const FEATURE_KEYS: (keyof EnvironmentalFeatures)[] = [
  'pm25',
  'pm10',
  'no2',
  'co',
  'so2',
  'o3',
  'temperature',
  'humidity',
  'windSpeed',
  'trafficIndex',
];

export const FEATURE_LABELS: Record<keyof EnvironmentalFeatures, { name: string; unit: string }> = {
  pm25: { name: 'PM2.5 (Fine Particulate)', unit: 'µg/m³' },
  pm10: { name: 'PM10 (Coarse Particulate)', unit: 'µg/m³' },
  no2: { name: 'NO₂ (Nitrogen Dioxide)', unit: 'µg/m³' },
  co: { name: 'CO (Carbon Monoxide)', unit: 'mg/m³' },
  so2: { name: 'SO₂ (Sulfur Dioxide)', unit: 'µg/m³' },
  o3: { name: 'O₃ (Tropospheric Ozone)', unit: 'µg/m³' },
  temperature: { name: 'Ambient Temperature', unit: '°C' },
  humidity: { name: 'Relative Humidity', unit: '%' },
  windSpeed: { name: 'Wind Velocity', unit: 'km/h' },
  trafficIndex: { name: 'Traffic Density Index', unit: '0-100' },
};

function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateStd(values: number[], mean: number): number {
  if (values.length <= 1) return 1;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance) || 1;
}

export function preprocessDataset(
  rawDataset: AirQualityRecord[],
  config: PreprocessingConfig
): {
  cleanedDataset: AirQualityRecord[];
  trainSet: AirQualityRecord[];
  testSet: AirQualityRecord[];
  summary: PreprocessingSummary;
  scalers: {
    means: Record<keyof EnvironmentalFeatures, number>;
    stds: Record<keyof EnvironmentalFeatures, number>;
    mins: Record<keyof EnvironmentalFeatures, number>;
    maxs: Record<keyof EnvironmentalFeatures, number>;
  };
} {
  let records = rawDataset.map((r) => ({ ...r }));
  const initialCount = records.length;
  let duplicatesRemoved = 0;
  let missingImputed = 0;
  let outliersCleaned = 0;

  // 1. Duplicate Removal
  if (config.removeDuplicates) {
    const seen = new Set<string>();
    const deduplicated: AirQualityRecord[] = [];
    for (const r of records) {
      const fingerprint = `${r.stationName}_${r.timestamp}_${r.pm25}_${r.pm10}`;
      if (!seen.has(fingerprint)) {
        seen.add(fingerprint);
        deduplicated.push(r);
      } else {
        duplicatesRemoved++;
      }
    }
    records = deduplicated;
  }

  // 2. Missing Value Imputation / Handling
  // First compute valid feature values for imputation
  const featureValues: Record<keyof EnvironmentalFeatures, number[]> = {
    pm25: [],
    pm10: [],
    no2: [],
    co: [],
    so2: [],
    o3: [],
    temperature: [],
    humidity: [],
    windSpeed: [],
    trafficIndex: [],
  };

  records.forEach((r) => {
    if (!r.isMissing) {
      FEATURE_KEYS.forEach((k) => {
        if (typeof r[k] === 'number' && !isNaN(r[k])) {
          featureValues[k].push(r[k]);
        }
      });
    }
  });

  const means: Record<keyof EnvironmentalFeatures, number> = {} as any;
  const medians: Record<keyof EnvironmentalFeatures, number> = {} as any;
  FEATURE_KEYS.forEach((k) => {
    means[k] = calculateMean(featureValues[k]);
    medians[k] = calculateMedian(featureValues[k]);
  });

  if (config.imputationStrategy === 'drop') {
    const beforeDrop = records.length;
    records = records.filter((r) => !r.isMissing);
    missingImputed = beforeDrop - records.length;
  } else {
    records = records.map((r, idx) => {
      if (!r.isMissing) return r;
      missingImputed++;
      const copy = { ...r, isMissing: false };
      FEATURE_KEYS.forEach((k) => {
        if (config.imputationStrategy === 'mean') {
          copy[k] = Number(means[k].toFixed(1));
        } else if (config.imputationStrategy === 'median') {
          copy[k] = Number(medians[k].toFixed(1));
        } else if (config.imputationStrategy === 'knn_forward') {
          // Use previous or nearby record's value
          const prev = records[Math.max(0, idx - 1)];
          copy[k] = prev ? prev[k] : means[k];
        }
      });
      return copy;
    });
  }

  // 3. Outlier Detection & Treatment (IQR or Z-Score)
  if (config.outlierStrategy === 'iqr_clip') {
    // Interquartile Range
    FEATURE_KEYS.forEach((k) => {
      const vals = [...featureValues[k]].sort((a, b) => a - b);
      if (vals.length > 4) {
        const q1 = vals[Math.floor(vals.length * 0.25)];
        const q3 = vals[Math.floor(vals.length * 0.75)];
        const iqr = q3 - q1;
        const lowerLimit = Math.max(0, q1 - 1.5 * iqr);
        const upperLimit = q3 + 1.5 * iqr;

        records.forEach((r) => {
          if (r[k] > upperLimit || r[k] < lowerLimit) {
            r[k] = Number(Math.min(upperLimit, Math.max(lowerLimit, r[k])).toFixed(1));
            outliersCleaned++;
          }
        });
      }
    });
  } else if (config.outlierStrategy === 'zscore_filter') {
    // Z-Score Filter (|z| > 3 clipped)
    FEATURE_KEYS.forEach((k) => {
      const mean = means[k];
      const std = calculateStd(featureValues[k], mean);
      records.forEach((r) => {
        const z = Math.abs((r[k] - mean) / std);
        if (z > 3) {
          const sign = r[k] > mean ? 1 : -1;
          r[k] = Number((mean + sign * 2.8 * std).toFixed(1));
          outliersCleaned++;
        }
      });
    });
  }

  // 4. Compute Final Statistics & Scalers
  const finalMins: Record<keyof EnvironmentalFeatures, number> = {} as any;
  const finalMaxs: Record<keyof EnvironmentalFeatures, number> = {} as any;
  const finalMeans: Record<keyof EnvironmentalFeatures, number> = {} as any;
  const finalStds: Record<keyof EnvironmentalFeatures, number> = {} as any;

  FEATURE_KEYS.forEach((k) => {
    const vals = records.map((r) => r[k]);
    finalMeans[k] = calculateMean(vals);
    finalStds[k] = calculateStd(vals, finalMeans[k]);
    finalMins[k] = Math.min(...vals);
    finalMaxs[k] = Math.max(...vals);
  });

  // 5. Train / Test Split (e.g. 80 / 20) with deterministic pseudo-shuffling
  const shuffled = [...records].sort((a, b) => {
    const hashA = a.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hashB = b.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hashA % 17) - (hashB % 17);
  });

  const splitIdx = Math.floor(shuffled.length * config.trainSplitRatio);
  const trainSet = shuffled.slice(0, splitIdx);
  const testSet = shuffled.slice(splitIdx);

  const summary: PreprocessingSummary = {
    rawCount: initialCount,
    cleanedCount: records.length,
    missingValuesHandled: missingImputed,
    outliersDetected: outliersCleaned,
    duplicatesRemoved,
    trainCount: trainSet.length,
    testCount: testSet.length,
    featureMeans: finalMeans,
    featureStds: finalStds,
  };

  return {
    cleanedDataset: records,
    trainSet,
    testSet,
    summary,
    scalers: {
      means: finalMeans,
      stds: finalStds,
      mins: finalMins,
      maxs: finalMaxs,
    },
  };
}

/**
 * Generate frequency bins for histogram visualization before/after
 */
export function generateHistogramData(
  records: AirQualityRecord[],
  feature: keyof EnvironmentalFeatures | 'aqi',
  binCount = 10
): { binLabel: string; count: number; min: number; max: number }[] {
  if (records.length === 0) return [];
  const values = records.map((r) => (feature === 'aqi' ? r.aqi : r[feature]));
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const binWidth = (maxVal - minVal) / binCount || 1;

  const bins: { binLabel: string; count: number; min: number; max: number }[] = [];

  for (let i = 0; i < binCount; i++) {
    const bMin = minVal + i * binWidth;
    const bMax = i === binCount - 1 ? maxVal + 0.001 : minVal + (i + 1) * binWidth;
    const count = values.filter((v) => v >= bMin && v < bMax).length;
    bins.push({
      binLabel: `${Math.round(bMin)}-${Math.round(bMax)}`,
      count,
      min: bMin,
      max: bMax,
    });
  }

  return bins;
}
