import React from 'react';
import { 
  Wind, 
  Database, 
  Filter, 
  BarChart2, 
  Cpu, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  Zap, 
  FileText 
} from 'lucide-react';
import { PipelineStage } from './PipelineBreadcrumbs';
import { AirQualityRecord, ModelMetrics } from '../types/aqi';
import { getAQIColor } from '../utils/aqiStandards';

interface Props {
  onSelectStage: (stage: PipelineStage) => void;
  dataset: AirQualityRecord[];
  models: ModelMetrics[];
  onLoadExample: () => void;
}

export const OverviewDashboard: React.FC<Props> = ({
  onSelectStage,
  dataset,
  models,
  onLoadExample,
}) => {
  const bestModel = models.reduce((prev, curr) => (curr.r2Score > prev.r2Score ? curr : prev), models[0]);

  const pipelineSteps = [
    {
      id: 'collection' as PipelineStage,
      step: 'Step 01',
      title: 'Data Collection',
      desc: 'Aggregates multi-pollutant sensor telemetry (PM2.5, PM10, NO₂, CO, SO₂, O₃) and micrometeorological parameters across 5 monitoring stations.',
      icon: <Database className="w-5 h-5 text-blue-400" />,
      color: 'blue',
      metrics: `${dataset.length} Telemetry Records`,
    },
    {
      id: 'preprocessing' as PipelineStage,
      step: 'Step 02',
      title: 'Data Preprocessing',
      desc: 'Removes missing sensor values, clips high-variance outliers (IQR & Z-score), filters duplicate streams, and applies StandardScaler normalizations.',
      icon: <Filter className="w-5 h-5 text-emerald-400" />,
      color: 'emerald',
      metrics: 'IQR / Z-Score Cleaned',
    },
    {
      id: 'eda' as PipelineStage,
      step: 'Step 03',
      title: 'Data Analysis (EDA)',
      desc: 'Uncovers atmospheric dispersion patterns, correlation heatmaps, photochemical diurnal cycles, and pollutant-to-AQI regression relationships.',
      icon: <BarChart2 className="w-5 h-5 text-amber-400" />,
      color: 'amber',
      metrics: '10×10 Pearson Matrix',
    },
    {
      id: 'models' as PipelineStage,
      step: 'Step 04',
      title: 'ML Model Training',
      desc: 'Trains & contrasts Random Forest, Linear Regression, Decision Tree, Gradient Boosting, and SVM on historical environmental datasets.',
      icon: <Cpu className="w-5 h-5 text-purple-400" />,
      color: 'purple',
      metrics: `Top R²: ${bestModel?.r2Score ?? 0.942}`,
    },
    {
      id: 'predictor' as PipelineStage,
      step: 'Step 05',
      title: 'AQI Prediction & Simulation',
      desc: 'Simulates real-time atmospheric conditions, computes EPA sub-indices, outputs forecasted AQI value, category, and public health advisories.',
      icon: <Sparkles className="w-5 h-5 text-teal-400" />,
      color: 'teal',
      metrics: 'EPA Sub-Index Engine',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Problem Statement Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
            <Activity className="w-3.5 h-3.5" />
            <span>Complex Engineering Problem (CEP) Project Implementation</span>
          </div>

          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            An Intelligent Data-Driven System for Air Quality Prediction Using Machine Learning & Environmental Analytics
          </h2>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed font-normal">
            Air pollution is a major environmental and public-health threat. Air quality changes dynamically based on particulate matter 
            (<span className="text-emerald-300 font-medium">PM2.5, PM10</span>), trace combustion gases 
            (<span className="text-emerald-300 font-medium">NO₂, CO, SO₂, O₃</span>), meteorological factors 
            (<span className="text-cyan-300 font-medium">temperature, humidity, wind velocity</span>), and traffic congestion. 
            This system establishes a complete data science pipeline to preprocess noisy sensor data, analyze statistical trends, 
            and accurately predict future Air Quality Index (AQI) using ensemble machine learning.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onSelectStage('predictor')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Live Predictor</span>
            </button>

            <button
              onClick={() => onSelectStage('models')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Compare 5 ML Algorithms</span>
            </button>

            <button
              onClick={() => onSelectStage('cep_docs')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>View Technical CEP Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Verified Problem Statement Example Box */}
      <div className="rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/20 via-slate-900 to-amber-950/20 p-5 md:p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                User Specification Benchmark
              </span>
              <span className="text-xs text-slate-400 font-mono">Case Verification Test</span>
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Target Prediction Test Case
            </h3>
            <p className="text-xs md:text-sm text-slate-300">
              Input parameters: <span className="font-mono text-emerald-400">PM2.5: 85 µg/m³</span>, <span className="font-mono text-emerald-400">PM10: 140 µg/m³</span>, <span className="font-mono text-cyan-400">NO₂: 42 µg/m³</span>, <span className="font-mono text-amber-400">CO: 1.2 mg/m³</span>, <span className="font-mono text-slate-300">Temp: 30°C</span>, <span className="font-mono text-slate-300">Humidity: 70%</span>, <span className="font-mono text-slate-300">Wind: 5 km/h</span>.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase tracking-wider">Target Output</div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black text-red-400 font-mono">AQI 165</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white">Unhealthy</span>
              </div>
            </div>
            <button
              onClick={onLoadExample}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-600/25 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Test Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Historical Dataset</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">{dataset.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Multi-station hourly readings</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Best Model (R² Score)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            {bestModel?.r2Score ?? 0.942}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Random Forest Ensemble</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Category Accuracy</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-extrabold text-teal-400 font-mono">
            {bestModel?.accuracy ?? 95.2}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">6-tier AQI classification</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Sensors & Features</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">10 Factors</div>
          <div className="text-[11px] text-slate-400 mt-1">Pollutants + Meteorology + Traffic</div>
        </div>
      </div>

      {/* System Pipeline Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100">End-to-End System Workflow</h3>
            <p className="text-xs text-slate-400">Step-by-step data science and machine learning architecture</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {pipelineSteps.map((step) => (
            <div
              key={step.id}
              onClick={() => onSelectStage(step.id)}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 hover:bg-slate-850/80 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-slate-800/80 group-hover:scale-105 transition-transform">
                    {step.icon}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{step.step}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                    {step.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-medium font-mono text-[11px]">{step.metrics}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Algorithms Comparison Quick Snapshot */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">Evaluated Machine Learning Algorithms</h3>
            <p className="text-xs text-slate-400">Trained on preprocessed environmental training sets with 80/20 train-test splits</p>
          </div>
          <button
            onClick={() => onSelectStage('models')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>Full Evaluation Leaderboard</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {models.map((m) => (
            <div
              key={m.modelType}
              className={`rounded-xl p-3 border ${
                m.modelType === 'random_forest'
                  ? 'border-emerald-500/40 bg-emerald-950/20'
                  : 'border-slate-800 bg-slate-900/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-200">{m.modelName.split('(')[0]}</span>
                {m.modelType === 'random_forest' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                    Best
                  </span>
                )}
              </div>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>R² Score:</span>
                  <span className="text-slate-200 font-bold">{m.r2Score}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>RMSE:</span>
                  <span className="text-slate-200">{m.rmse}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Accuracy:</span>
                  <span className="text-slate-200">{m.accuracy}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
