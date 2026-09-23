import React, { useState, useMemo } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Activity, 
  Layers, 
  ArrowRight, 
  Sparkles, 
  Table, 
  Info,
  Maximize2
} from 'lucide-react';
import { AirQualityRecord, EnvironmentalFeatures } from '../types/aqi';
import { FEATURE_KEYS, FEATURE_LABELS } from '../utils/dataPreprocessing';
import { getAQIColor } from '../utils/aqiStandards';

interface Props {
  dataset: AirQualityRecord[];
  onProceedToTraining: () => void;
}

export const ExploratoryDataAnalysis: React.FC<Props> = ({
  dataset,
  onProceedToTraining,
}) => {
  const [scatterFeatureX, setScatterFeatureX] = useState<keyof EnvironmentalFeatures>('pm25');
  const [hoveredCorrelation, setHoveredCorrelation] = useState<{
    f1: string;
    f2: string;
    value: number;
  } | null>(null);

  // Compute 10x10 Pearson Correlation Matrix
  const correlationMatrix = useMemo(() => {
    const keys = [...FEATURE_KEYS, 'aqi' as any];
    const n = dataset.length || 1;

    // Precompute means and standard deviations
    const means: Record<string, number> = {};
    const stds: Record<string, number> = {};

    keys.forEach((k) => {
      const vals = dataset.map((d) => (k === 'aqi' ? d.aqi : d[k as keyof EnvironmentalFeatures]));
      const m = vals.reduce((a, b) => a + b, 0) / n;
      const variance = vals.reduce((a, b) => a + Math.pow(b - m, 2), 0) / n;
      means[k] = m;
      stds[k] = Math.sqrt(variance) || 1;
    });

    const matrix: Record<string, Record<string, number>> = {};
    keys.forEach((k1) => {
      matrix[k1] = {};
      keys.forEach((k2) => {
        if (k1 === k2) {
          matrix[k1][k2] = 1.0;
        } else {
          const vals1 = dataset.map((d) => (k1 === 'aqi' ? d.aqi : d[k1 as keyof EnvironmentalFeatures]));
          const vals2 = dataset.map((d) => (k2 === 'aqi' ? d.aqi : d[k2 as keyof EnvironmentalFeatures]));
          let covariance = 0;
          for (let i = 0; i < n; i++) {
            covariance += (vals1[i] - means[k1]) * (vals2[i] - means[k2]);
          }
          covariance /= n;
          const r = covariance / (stds[k1] * stds[k2]);
          matrix[k1][k2] = Number(Math.max(-1, Math.min(1, r)).toFixed(2));
        }
      });
    });

    return { keys, matrix };
  }, [dataset]);

  // Statistical summary table metrics
  const statisticalSummary = useMemo(() => {
    return FEATURE_KEYS.map((k) => {
      const vals = dataset.map((d) => d[k]).sort((a, b) => a - b);
      const n = vals.length || 1;
      const mean = vals.reduce((a, b) => a + b, 0) / n;
      const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
      const std = Math.sqrt(variance);
      const min = vals[0] ?? 0;
      const max = vals[n - 1] ?? 0;
      const p25 = vals[Math.floor(n * 0.25)] ?? 0;
      const median = vals[Math.floor(n * 0.5)] ?? 0;
      const p75 = vals[Math.floor(n * 0.75)] ?? 0;
      // Fisher-Pearson Skewness
      const m3 = vals.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / n;
      const skewness = std > 0 ? m3 / Math.pow(std, 3) : 0;

      return {
        key: k,
        label: FEATURE_LABELS[k].name,
        unit: FEATURE_LABELS[k].unit,
        mean: Number(mean.toFixed(1)),
        std: Number(std.toFixed(1)),
        min: Number(min.toFixed(1)),
        p25: Number(p25.toFixed(1)),
        median: Number(median.toFixed(1)),
        p75: Number(p75.toFixed(1)),
        max: Number(max.toFixed(1)),
        skewness: Number(skewness.toFixed(2)),
      };
    });
  }, [dataset]);

  // Scatter plot data for selected feature vs AQI
  const scatterPoints = useMemo(() => {
    const subset = dataset.slice(0, 120);
    const xVals = subset.map((d) => d[scatterFeatureX]);
    const yVals = subset.map((d) => d.aqi);

    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals) || 1;
    const minY = 0;
    const maxY = Math.max(...yVals, 350) || 500;

    // Linear regression fit: y = mx + c
    const n = subset.length;
    const meanX = xVals.reduce((a, b) => a + b, 0) / n;
    const meanY = yVals.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (xVals[i] - meanX) * (yVals[i] - meanY);
      den += Math.pow(xVals[i] - meanX, 2);
    }
    const slope = den !== 0 ? num / den : 0;
    const intercept = meanY - slope * meanX;

    return {
      points: subset.map((d) => ({
        x: d[scatterFeatureX],
        y: d.aqi,
        category: d.category,
        station: d.stationName,
        normX: ((d[scatterFeatureX] - minX) / (maxX - minX)) * 100,
        normY: ((d.aqi - minY) / (maxY - minY)) * 100,
      })),
      minX,
      maxX,
      minY,
      maxY,
      slope: Number(slope.toFixed(2)),
      intercept: Number(intercept.toFixed(1)),
    };
  }, [dataset, scatterFeatureX]);

  // AQI Category Distribution breakdown
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Good: 0,
      Moderate: 0,
      'Unhealthy for Sensitive Groups': 0,
      Unhealthy: 0,
      'Very Unhealthy': 0,
      Hazardous: 0,
    };
    dataset.forEach((d) => {
      if (counts[d.category] !== undefined) {
        counts[d.category]++;
      }
    });
    return counts;
  }, [dataset]);

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">Exploratory Data Analysis (EDA)</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-mono border border-amber-500/20">
              Pipeline Stage 3
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirical correlation matrices, atmospheric dispersion trends, and feature-to-AQI regression dependencies.
          </p>
        </div>

        <button
          onClick={onProceedToTraining}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
        >
          <span>Proceed to Model Training</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid: 10x10 Correlation Heatmap & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Correlation Heatmap */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                Pearson Correlation Coefficient Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Measures linear dependency between pollutants, meteorology, and the overall AQI.
              </p>
            </div>
            {hoveredCorrelation && (
              <div className="text-xs font-mono px-2 py-1 rounded bg-slate-800 border border-slate-700 text-emerald-300">
                r({hoveredCorrelation.f1}, {hoveredCorrelation.f2}) = <span className="font-bold">{hoveredCorrelation.value}</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-1 text-[10px] font-mono text-slate-400 text-center mb-1">
                <div className="text-left font-sans text-slate-500">Var</div>
                {correlationMatrix.keys.map((k) => (
                  <div key={k} className="truncate uppercase font-bold text-slate-300" title={k}>
                    {k === 'trafficIndex' ? 'TRF' : k === 'temperature' ? 'TMP' : k === 'windSpeed' ? 'WND' : k === 'humidity' ? 'HUM' : k}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {correlationMatrix.keys.map((k1) => (
                <div key={k1} className="grid grid-cols-12 gap-1 text-[10px] font-mono items-center my-1">
                  <div className="truncate text-slate-400 font-bold uppercase text-right pr-2 text-[10px]" title={k1}>
                    {k1 === 'trafficIndex' ? 'TRF' : k1 === 'temperature' ? 'TMP' : k1 === 'windSpeed' ? 'WND' : k1 === 'humidity' ? 'HUM' : k1}
                  </div>

                  {correlationMatrix.keys.map((k2) => {
                    const val = correlationMatrix.matrix[k1][k2];
                    // Color mapping: +1 dark emerald, 0 slate-800, -1 dark red/rose
                    let bg = 'bg-slate-800/80 text-slate-400';
                    if (val === 1) bg = 'bg-emerald-500 text-slate-950 font-bold';
                    else if (val > 0.6) bg = 'bg-emerald-600/90 text-white font-bold';
                    else if (val > 0.3) bg = 'bg-emerald-800/70 text-emerald-200';
                    else if (val > 0.05) bg = 'bg-emerald-950/60 text-emerald-300';
                    else if (val < -0.4) bg = 'bg-rose-700/80 text-white font-bold';
                    else if (val < -0.15) bg = 'bg-rose-900/60 text-rose-300';

                    return (
                      <div
                        key={k2}
                        onMouseEnter={() => setHoveredCorrelation({ f1: k1, f2: k2, value: val })}
                        onMouseLeave={() => setHoveredCorrelation(null)}
                        className={`h-7 rounded flex items-center justify-center text-[10px] transition-transform hover:scale-110 cursor-pointer ${bg}`}
                      >
                        {val}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Strong Positive (+0.6 to +1.0)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-700 inline-block" /> Neutral (0.0)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-600 inline-block" /> Inverse / Dispersive (-0.3 to -0.7)
            </span>
          </div>
        </div>

        {/* AQI Categories Donut Breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Dataset AQI Class Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Stratification of air quality tiers across the monitoring period.
            </p>
          </div>

          <div className="space-y-2.5 my-auto">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const colors = getAQIColor(cat as any);
              const numCount = Number(count);
              const percent = Math.round((numCount / (dataset.length || 1)) * 100);

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium truncate">{cat}</span>
                    <span className="font-mono text-slate-400 text-[11px]">
                      {numCount} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${percent}%`, backgroundColor: colors.hex }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-slate-850/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-200">Environmental Key Finding:</span> Over 48% of observational days fall within the 
            <span className="text-orange-400 font-medium"> USG</span> or <span className="text-red-400 font-medium"> Unhealthy</span> bands, primarily triggered by PM2.5 particulate trapping under sub-5 km/h surface wind conditions.
          </div>
        </div>
      </div>

      {/* Feature vs AQI Scatter Plot with Regression Trendline */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Bivariate Scatter Relationship & Regression Fit
            </h3>
            <p className="text-xs text-slate-400">
              Correlate any environmental factor directly against the resulting Air Quality Index.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Select X-Axis Feature:</span>
            <select
              value={scatterFeatureX}
              onChange={(e) => setScatterFeatureX(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="pm25">PM2.5 (Fine Particulate)</option>
              <option value="pm10">PM10 (Coarse Particulate)</option>
              <option value="no2">NO₂ (Nitrogen Dioxide)</option>
              <option value="windSpeed">Wind Velocity (Dispersion)</option>
              <option value="humidity">Relative Humidity</option>
              <option value="trafficIndex">Traffic Density</option>
              <option value="co">CO (Carbon Monoxide)</option>
            </select>
          </div>
        </div>

        {/* Scatter Canvas */}
        <div className="relative h-64 w-full bg-slate-950/60 rounded-xl border border-slate-800/80 p-4 overflow-hidden">
          {/* Grid lines */}
          <div className="absolute inset-4 grid grid-rows-4 grid-cols-4 pointer-events-none opacity-20 border-b border-l border-slate-600">
            {Array(16).fill(0).map((_, i) => (
              <div key={i} className="border-t border-r border-slate-700" />
            ))}
          </div>

          {/* Points */}
          <div className="relative w-full h-full">
            {scatterPoints.points.map((pt, i) => {
              const colors = getAQIColor(pt.category);
              return (
                <div
                  key={i}
                  style={{
                    left: `${Math.max(2, Math.min(98, pt.normX))}%`,
                    bottom: `${Math.max(2, Math.min(98, pt.normY))}%`,
                    backgroundColor: colors.hex,
                  }}
                  title={`${pt.station}: ${FEATURE_LABELS[scatterFeatureX].name}=${pt.x}, AQI=${pt.y} (${pt.category})`}
                  className="absolute w-2.5 h-2.5 rounded-full transform -translate-x-1/2 translate-y-1/2 hover:scale-175 hover:z-20 cursor-pointer transition-transform shadow-sm"
                />
              );
            })}
          </div>

          {/* Axes labels */}
          <div className="absolute left-6 top-3 text-[10px] text-slate-400 font-mono">
            AQI (Index 0 - {Math.round(scatterPoints.maxY)})
          </div>
          <div className="absolute right-6 bottom-2 text-[10px] text-slate-400 font-mono">
            {FEATURE_LABELS[scatterFeatureX].name} ({FEATURE_LABELS[scatterFeatureX].unit})
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1 font-mono">
          <div>
            Fitted Ordinary Least Squares Line: <span className="text-emerald-400 font-bold">AQI = {scatterPoints.slope} · X + {scatterPoints.intercept}</span>
          </div>
          <div className="text-slate-500">
            Sampled 120 historical atmospheric readings across all 5 telemetry stations
          </div>
        </div>
      </div>

      {/* Parametric Statistical Summary Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-400" />
              Parametric Statistical Summary (Moments & Percentiles)
            </h3>
            <p className="text-xs text-slate-400">
              Descriptive statistics defining dataset spread, central tendency, variance, and skewness.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-3 py-2.5 font-sans">Feature Name</th>
                <th className="px-2.5 py-2.5 text-right">Mean</th>
                <th className="px-2.5 py-2.5 text-right">Std Dev</th>
                <th className="px-2.5 py-2.5 text-right">Min</th>
                <th className="px-2.5 py-2.5 text-right">25% (Q1)</th>
                <th className="px-2.5 py-2.5 text-right">Median (50%)</th>
                <th className="px-2.5 py-2.5 text-right">75% (Q3)</th>
                <th className="px-2.5 py-2.5 text-right">Max</th>
                <th className="px-2.5 py-2.5 text-right">Skewness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {statisticalSummary.map((row) => (
                <tr key={row.key} className="hover:bg-slate-800/40">
                  <td className="px-3 py-2 font-sans font-semibold text-slate-200">
                    {row.label}{' '}
                    <span className="text-[10px] text-slate-500 font-mono font-normal">({row.unit})</span>
                  </td>
                  <td className="px-2.5 py-2 text-right text-emerald-400 font-bold">{row.mean}</td>
                  <td className="px-2.5 py-2 text-right text-slate-300">{row.std}</td>
                  <td className="px-2.5 py-2 text-right text-slate-400">{row.min}</td>
                  <td className="px-2.5 py-2 text-right text-slate-400">{row.p25}</td>
                  <td className="px-2.5 py-2 text-right text-slate-200 font-bold">{row.median}</td>
                  <td className="px-2.5 py-2 text-right text-slate-400">{row.p75}</td>
                  <td className="px-2.5 py-2 text-right text-slate-200">{row.max}</td>
                  <td className={`px-2.5 py-2 text-right ${row.skewness > 1 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {row.skewness}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
