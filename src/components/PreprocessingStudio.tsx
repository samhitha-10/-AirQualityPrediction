import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Layers, 
  ArrowRight, 
  Sparkles, 
  RefreshCw, 
  Split, 
  BarChart, 
  ShieldCheck,
  TrendingDown
} from 'lucide-react';
import { 
  AirQualityRecord, 
  EnvironmentalFeatures, 
  ImputationStrategy, 
  OutlierStrategy, 
  PreprocessingConfig, 
  PreprocessingSummary, 
  ScalingStrategy 
} from '../types/aqi';
import { FEATURE_KEYS, FEATURE_LABELS, generateHistogramData } from '../utils/dataPreprocessing';

interface Props {
  rawDataset: AirQualityRecord[];
  cleanedDataset: AirQualityRecord[];
  summary: PreprocessingSummary;
  config: PreprocessingConfig;
  onUpdateConfig: (config: PreprocessingConfig) => void;
  onRunPreprocessing: () => void;
  onProceedToEDA: () => void;
}

export const PreprocessingStudio: React.FC<Props> = ({
  rawDataset,
  cleanedDataset,
  summary,
  config,
  onUpdateConfig,
  onRunPreprocessing,
  onProceedToEDA,
}) => {
  const [selectedFeature, setSelectedFeature] = useState<keyof EnvironmentalFeatures | 'aqi'>('pm25');

  // Distribution data before vs after
  const rawHist = useMemo(() => {
    return generateHistogramData(rawDataset, selectedFeature, 8);
  }, [rawDataset, selectedFeature]);

  const cleanedHist = useMemo(() => {
    return generateHistogramData(cleanedDataset, selectedFeature, 8);
  }, [cleanedDataset, selectedFeature]);

  const maxRawCount = Math.max(...rawHist.map((h) => h.count), 1);
  const maxCleanedCount = Math.max(...cleanedHist.map((h) => h.count), 1);

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Action Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">Data Preprocessing & Cleaning Pipeline</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
              Pipeline Stage 2
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Resolve data corruption, sensor dropouts, calibration drift, and variance skew before mathematical model training.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRunPreprocessing}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Re-run Pipeline</span>
          </button>

          <button
            onClick={onProceedToEDA}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
          >
            <span>Proceed to EDA Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Summary Metrics of Data Hygiene */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
          <div className="text-[11px] text-slate-400 font-medium">Input Telemetry Rows</div>
          <div className="text-xl font-extrabold text-slate-100 font-mono mt-1">{summary.rawCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Raw observational records</div>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-3.5">
          <div className="text-[11px] text-amber-400 font-medium">Missing Values Imputed</div>
          <div className="text-xl font-extrabold text-amber-400 font-mono mt-1">{summary.missingValuesHandled}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{config.imputationStrategy.toUpperCase()} strategy applied</div>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-3.5">
          <div className="text-[11px] text-rose-400 font-medium">Outliers Suppressed</div>
          <div className="text-xl font-extrabold text-rose-400 font-mono mt-1">{summary.outliersDetected}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">1.5× IQR boundary clipping</div>
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-purple-950/10 p-3.5">
          <div className="text-[11px] text-purple-400 font-medium">Duplicates Purged</div>
          <div className="text-xl font-extrabold text-purple-400 font-mono mt-1">{summary.duplicatesRemoved}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Timestamp & sensor collision</div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3.5">
          <div className="text-[11px] text-emerald-400 font-medium">Train / Test Samples</div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
            {summary.trainCount} / {summary.testCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{Math.round(config.trainSplitRatio * 100)}% / {Math.round((1 - config.trainSplitRatio) * 100)}% Split</div>
        </div>
      </div>

      {/* Interactive Preprocessing Pipeline Configuration Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Preprocessing Hyperparameters & Cleaning Rules
            </h3>
            <p className="text-xs text-slate-400">Configure how noisy sensor samples are transformed prior to model fitting.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Missing Value Imputation */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              1. Missing Value Strategy
            </label>
            <p className="text-[11px] text-slate-400">
              Sensor drops or NaN telemetry handling.
            </p>
            <div className="space-y-1.5 pt-1">
              {[
                { id: 'mean' as ImputationStrategy, label: 'Feature Mean Imputation' },
                { id: 'median' as ImputationStrategy, label: 'Feature Median (Robust)' },
                { id: 'knn_forward' as ImputationStrategy, label: 'Forward Temporal Fill' },
                { id: 'drop' as ImputationStrategy, label: 'Drop Corrupted Rows' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    config.imputationStrategy === opt.id
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-semibold'
                      : 'border-slate-800 bg-slate-850/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{opt.label}</span>
                  <input
                    type="radio"
                    name="imputation"
                    checked={config.imputationStrategy === opt.id}
                    onChange={() => onUpdateConfig({ ...config, imputationStrategy: opt.id })}
                    className="accent-emerald-500"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Outlier Handling */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              2. Outlier Suppression
            </label>
            <p className="text-[11px] text-slate-400">
              Sensor glitch spikes & electrical noise.
            </p>
            <div className="space-y-1.5 pt-1">
              {[
                { id: 'iqr_clip' as OutlierStrategy, label: 'IQR Boundaries (Q1 - 1.5×IQR, Q3 + 1.5×IQR)' },
                { id: 'zscore_filter' as OutlierStrategy, label: 'Z-Score Filter (|z| > 3 Standard Deviations)' },
                { id: 'keep' as OutlierStrategy, label: 'Retain Raw Spikes (Noisy)' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    config.outlierStrategy === opt.id
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-300 font-semibold'
                      : 'border-slate-800 bg-slate-850/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="leading-tight">{opt.label}</span>
                  <input
                    type="radio"
                    name="outlier"
                    checked={config.outlierStrategy === opt.id}
                    onChange={() => onUpdateConfig({ ...config, outlierStrategy: opt.id })}
                    className="accent-rose-500 ml-2"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Feature Scaling */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              3. Feature Normalization
            </label>
            <p className="text-[11px] text-slate-400">
              Balances gradient descent & distance metrics.
            </p>
            <div className="space-y-1.5 pt-1">
              {[
                { id: 'standard' as ScalingStrategy, label: 'StandardScaler (Z-Score Normalization)' },
                { id: 'minmax' as ScalingStrategy, label: 'MinMaxScaler ([0, 1] Range)' },
                { id: 'none' as ScalingStrategy, label: 'Raw Engineering Units (µg/m³)' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    config.scalingStrategy === opt.id
                      ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 font-semibold'
                      : 'border-slate-800 bg-slate-850/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="leading-tight">{opt.label}</span>
                  <input
                    type="radio"
                    name="scaling"
                    checked={config.scalingStrategy === opt.id}
                    onChange={() => onUpdateConfig({ ...config, scalingStrategy: opt.id })}
                    className="accent-cyan-500 ml-2"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Train/Test Split & Deduplication */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block">
                4. Train / Test Split Ratio
              </label>
              <div className="flex justify-between items-center text-xs text-slate-400 mt-1 font-mono">
                <span>Training: {Math.round(config.trainSplitRatio * 100)}%</span>
                <span>Testing: {Math.round((1 - config.trainSplitRatio) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="0.9"
                step="0.05"
                value={config.trainSplitRatio}
                onChange={(e) => onUpdateConfig({ ...config, trainSplitRatio: Number(e.target.value) })}
                className="w-full mt-2 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.removeDuplicates}
                  onChange={(e) => onUpdateConfig({ ...config, removeDuplicates: e.target.checked })}
                  className="rounded accent-emerald-500"
                />
                <span className="font-semibold">Purge Duplicate Sensor Telemetry</span>
              </label>
              <p className="text-[10px] text-slate-500 mt-1">
                Eliminates multi-packet transmitter echoes across sensor network channels.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Before vs After Feature Distribution Histograms */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BarChart className="w-4 h-4 text-emerald-400" />
              Distribution Shape Analysis: Raw vs Preprocessed
            </h3>
            <p className="text-xs text-slate-400">
              Examine how outlier clipping and missing value imputation suppress long-tail noise and restore bell-curve normality.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Inspect Feature:</span>
            <select
              value={selectedFeature}
              onChange={(e) => setSelectedFeature(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="pm25">PM2.5 (Fine Particulate)</option>
              <option value="pm10">PM10 (Coarse Particulate)</option>
              <option value="no2">NO₂ (Nitrogen Dioxide)</option>
              <option value="windSpeed">Wind Velocity</option>
              <option value="humidity">Relative Humidity</option>
              <option value="aqi">Air Quality Index (AQI)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Raw Distribution */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-950/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Raw Observational Distribution
              </span>
              <span className="text-[11px] font-mono text-slate-500">Unprocessed Spikes Present</span>
            </div>

            <div className="h-44 flex items-end gap-2 pt-6">
              {rawHist.map((bin, i) => {
                const heightPercent = Math.max(4, Math.round((bin.count / maxRawCount) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-slate-200 text-[10px] px-2 py-0.5 rounded border border-slate-700 pointer-events-none whitespace-nowrap z-10 font-mono">
                      {bin.count} rows ({bin.binLabel})
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-rose-500/60 rounded-t group-hover:bg-rose-400 transition-all"
                    />
                    <span className="text-[9px] font-mono text-slate-500 truncate w-full text-center">
                      {bin.binLabel.split('-')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="text-[11px] text-slate-400 text-center font-mono">
              Value Bins ({selectedFeature === 'aqi' ? 'AQI Index' : FEATURE_LABELS[selectedFeature as keyof EnvironmentalFeatures]?.unit || 'units'})
            </div>
          </div>

          {/* Cleaned Distribution */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Cleaned & Scaled Distribution
              </span>
              <span className="text-[11px] font-mono text-emerald-400/80">Normal Variance Restored</span>
            </div>

            <div className="h-44 flex items-end gap-2 pt-6">
              {cleanedHist.map((bin, i) => {
                const heightPercent = Math.max(4, Math.round((bin.count / maxCleanedCount) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-slate-200 text-[10px] px-2 py-0.5 rounded border border-slate-700 pointer-events-none whitespace-nowrap z-10 font-mono">
                      {bin.count} rows ({bin.binLabel})
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-emerald-500/70 rounded-t group-hover:bg-emerald-400 transition-all"
                    />
                    <span className="text-[9px] font-mono text-slate-500 truncate w-full text-center">
                      {bin.binLabel.split('-')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="text-[11px] text-slate-400 text-center font-mono">
              Value Bins ({selectedFeature === 'aqi' ? 'AQI Index' : FEATURE_LABELS[selectedFeature as keyof EnvironmentalFeatures]?.unit || 'units'})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
