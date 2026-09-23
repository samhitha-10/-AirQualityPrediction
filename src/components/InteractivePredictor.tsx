import React, { useState } from 'react';
import { 
  Sparkles, 
  Wind, 
  Droplets, 
  Thermometer, 
  Car, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Layers, 
  Info,
  RotateCcw,
  Sliders,
  ChevronRight,
  Gauge
} from 'lucide-react';
import { EnvironmentalFeatures, MLModelType, PredictionResult } from '../types/aqi';
import { PRESET_SCENARIOS } from '../data/syntheticDataset';
import { getAQIColor } from '../utils/aqiStandards';

interface Props {
  features: EnvironmentalFeatures;
  prediction: PredictionResult;
  activeModelType: MLModelType;
  onUpdateFeatures: (features: EnvironmentalFeatures) => void;
  onSelectModel: (type: MLModelType) => void;
  onResetFeatures: () => void;
  onSelectPreset: (scenarioId: string) => void;
}

export const InteractivePredictor: React.FC<Props> = ({
  features,
  prediction,
  activeModelType,
  onUpdateFeatures,
  onSelectModel,
  onResetFeatures,
  onSelectPreset,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('user_example');

  const aqiColors = getAQIColor(prediction.category);

  // Gauge angle calculation (0 to 500 AQI -> 0 to 180 degrees)
  const clampedAQI = Math.min(500, Math.max(0, prediction.predictedAQI));
  const gaugePercent = (clampedAQI / 500) * 100;
  const needleRotation = (clampedAQI / 500) * 180 - 90; // -90 deg to +90 deg

  const handleSliderChange = (key: keyof EnvironmentalFeatures, value: number) => {
    setSelectedPresetId('');
    onUpdateFeatures({
      ...features,
      [key]: value,
    });
  };

  const handlePresetClick = (presetId: string) => {
    setSelectedPresetId(presetId);
    onSelectPreset(presetId);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Presets Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">Live Machine Learning AQI Simulator</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-mono border border-teal-500/20">
              Inference Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Adjust meteorological conditions and chemical concentrations in real-time to observe ML inference and EPA breakpoints.
          </p>
        </div>

        {/* Model Engine Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">ML Engine:</span>
          <select
            value={activeModelType}
            onChange={(e) => onSelectModel(e.target.value as MLModelType)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="random_forest">Random Forest Regressor (Recommended)</option>
            <option value="gradient_boost">Gradient Boosting (XGBoost)</option>
            <option value="linear_regression">Multiple Linear Regression (OLS)</option>
            <option value="decision_tree">Decision Tree Regressor</option>
            <option value="svm">Support Vector Machine (SVR)</option>
          </select>

          <button
            onClick={onResetFeatures}
            title="Reset to default baseline"
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preset Environmental Scenarios Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300">
            Rapid Scenario Benchmarks:
          </span>
          <span>Click to instantly load atmospheric conditions</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          {PRESET_SCENARIOS.map((scenario) => {
            const isSelected = selectedPresetId === scenario.id;
            return (
              <button
                key={scenario.id}
                onClick={() => handlePresetClick(scenario.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-950/30 shadow-md shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                      {scenario.badge}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      ~{scenario.expectedAQI}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 truncate">{scenario.name}</h4>
                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                    {scenario.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Grid: Sliders on Left, Prediction Gauge & Health Advisory on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Environmental Feature Sliders (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Atmospheric & Chemical Telemetry Controls
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">10 Multi-Modal Parameters</span>
            </div>

            <div className="space-y-4">
              {/* PM2.5 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    PM2.5 (Fine Particulate)
                    <span className="text-[10px] text-slate-500 font-normal">Aerodynamic diameter ≤ 2.5 µm</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={features.pm25}
                      onChange={(e) => handleSliderChange('pm25', Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-right text-xs font-mono font-bold text-emerald-400"
                    />
                    <span className="text-[11px] text-slate-400 font-mono">µg/m³</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="350"
                  value={features.pm25}
                  onChange={(e) => handleSliderChange('pm25', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* PM10 */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    PM10 (Coarse Inhalable Particulate)
                    <span className="text-[10px] text-slate-500 font-normal">≤ 10 µm dust & pollen</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={features.pm10}
                      onChange={(e) => handleSliderChange('pm10', Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-right text-xs font-mono font-bold text-teal-400"
                    />
                    <span className="text-[11px] text-slate-400 font-mono">µg/m³</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={features.pm10}
                  onChange={(e) => handleSliderChange('pm10', Number(e.target.value))}
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>

              {/* Grid for Gas Pollutants: NO2, CO, SO2, O3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                {/* NO2 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">NO₂ (Nitrogen Dioxide)</span>
                    <span className="font-mono text-cyan-400 font-bold">{features.no2} µg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    value={features.no2}
                    onChange={(e) => handleSliderChange('no2', Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* CO */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">CO (Carbon Monoxide)</span>
                    <span className="font-mono text-amber-400 font-bold">{features.co} mg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.1"
                    value={features.co}
                    onChange={(e) => handleSliderChange('co', Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* SO2 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">SO₂ (Sulfur Dioxide)</span>
                    <span className="font-mono text-orange-400 font-bold">{features.so2} µg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="150"
                    value={features.so2}
                    onChange={(e) => handleSliderChange('so2', Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>

                {/* O3 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">O₃ (Tropospheric Ozone)</span>
                    <span className="font-mono text-blue-400 font-bold">{features.o3} µg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="220"
                    value={features.o3}
                    onChange={(e) => handleSliderChange('o3', Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Grid for Meteorology: Temperature, Humidity, Wind, Traffic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                {/* Wind Velocity */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5 text-blue-400" />
                      Wind Velocity (Dispersion)
                    </span>
                    <span className="font-mono text-blue-400 font-bold">{features.windSpeed} km/h</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="35"
                    step="0.5"
                    value={features.windSpeed}
                    onChange={(e) => handleSliderChange('windSpeed', Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                {/* Humidity */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                      Relative Humidity
                    </span>
                    <span className="font-mono text-cyan-400 font-bold">{features.humidity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={features.humidity}
                    onChange={(e) => handleSliderChange('humidity', Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* Temperature */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-red-400" />
                      Ambient Temperature
                    </span>
                    <span className="font-mono text-red-400 font-bold">{features.temperature}°C</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="48"
                    value={features.temperature}
                    onChange={(e) => handleSliderChange('temperature', Number(e.target.value))}
                    className="w-full accent-red-500 cursor-pointer"
                  />
                </div>

                {/* Traffic Index */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-purple-400" />
                      Traffic Density Index
                    </span>
                    <span className="font-mono text-purple-400 font-bold">{features.trafficIndex} / 100</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={features.trafficIndex}
                    onChange={(e) => handleSliderChange('trafficIndex', Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Prediction Gauge, Breakdowns & Health Advisory (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Output Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                Predicted Air Quality Index
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {prediction.modelName.split('(')[0]}
              </span>
            </div>

            {/* Gauge Display */}
            <div className="relative flex flex-col items-center justify-center pt-2">
              {/* Radial Arc SVG */}
              <div className="relative w-64 h-36 flex items-center justify-center">
                <svg viewBox="0 0 200 110" className="w-full h-full">
                  {/* Background Arc */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  {/* Colored Arc Segment */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke={aqiColors.hex}
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - Math.min(1, clampedAQI / 500))}
                    className="transition-all duration-700 ease-out"
                  />
                  {/* Needle pointer */}
                  <line
                    x1="100"
                    y1="100"
                    x2="100"
                    y2="28"
                    stroke="#f8fafc"
                    strokeWidth="3"
                    strokeLinecap="round"
                    transform={`rotate(${needleRotation}, 100, 100)`}
                    className="transition-all duration-700 ease-out origin-[100px_100px]"
                  />
                  <circle cx="100" cy="100" r="6" fill="#f8fafc" />
                </svg>

                {/* Center Value Badge */}
                <div className="absolute bottom-0 text-center">
                  <div className="text-4xl font-black font-mono tracking-tight text-white">
                    {prediction.predictedAQI}
                  </div>
                </div>
              </div>

              {/* Category Pill */}
              <div className="mt-3">
                <span className={`inline-block px-4 py-1.5 rounded-full text-xs ${aqiColors.badge} shadow-lg`}>
                  {prediction.category}
                </span>
              </div>

              <div className="text-xs text-slate-400 mt-2 flex items-center gap-1 font-mono">
                <span>Dominant Driver:</span>
                <span className="font-bold text-slate-200">{prediction.primaryPollutant}</span>
                <span className="text-slate-500">• Confidence: {prediction.confidenceScore}%</span>
              </div>
            </div>

            {/* EPA Sub-Indices Breakdown */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                EPA Breakpoint Sub-Index Breakdown:
              </span>

              <div className="space-y-1.5">
                {prediction.subIndices.map((sub) => {
                  const subColor = getAQIColor(sub.category);
                  const isPrimary = sub.name === prediction.primaryPollutant;

                  return (
                    <div
                      key={sub.name}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono transition-colors ${
                        isPrimary ? 'bg-slate-800/90 border border-slate-700' : 'bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{sub.name}</span>
                        {isPrimary && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-sans font-semibold">
                            Primary
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-[11px]">
                          {sub.value} {sub.unit}
                        </span>
                        <span
                          style={{ color: subColor.hex }}
                          className="font-bold text-right w-12"
                        >
                          Idx {sub.subIndex}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Health Advisory & Precautionary Actions */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              Public Health Advisory & Protection
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed">
              {prediction.healthAdvisory.generalSummary}
            </p>

            <div className="p-3 rounded-xl bg-slate-850/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-slate-300">
                  <span className="font-semibold text-slate-200">Sensitive Groups: </span>
                  {prediction.healthAdvisory.sensitiveGroupsGuidance}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-[11px] text-slate-400">
                <span>N95 Mask Needed:</span>
                <span className={`font-bold ${prediction.healthAdvisory.maskRequired ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {prediction.healthAdvisory.maskRequired ? 'Mandatory Outdoors' : 'Not Required'}
                </span>
                <span className="text-slate-600">•</span>
                <span>Air Purifier:</span>
                <span className={`font-bold ${prediction.healthAdvisory.airPurifierRecommended ? 'text-amber-400' : 'text-slate-400'}`}>
                  {prediction.healthAdvisory.airPurifierRecommended ? 'Recommended Indoors' : 'Optional'}
                </span>
              </div>
            </div>

            {/* Micrometeorological Dynamics */}
            <div className="pt-1 text-[11px] text-slate-400 space-y-1 font-mono">
              <div className="flex items-center gap-1.5">
                <Wind className="w-3 h-3 text-blue-400" />
                <span>{prediction.meteorologicalInfluence.windDispersionImpact}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Droplets className="w-3 h-3 text-cyan-400" />
                <span>{prediction.meteorologicalInfluence.humidityStagnationImpact}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
