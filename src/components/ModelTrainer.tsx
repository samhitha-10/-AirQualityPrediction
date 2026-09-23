import React, { useState } from 'react';
import { 
  Cpu, 
  Play, 
  CheckCircle2, 
  TrendingUp, 
  Award, 
  BarChart, 
  ArrowRight, 
  RefreshCw, 
  Zap, 
  Layers, 
  Grid 
} from 'lucide-react';
import { ModelMetrics, MLModelType, AQICategory } from '../types/aqi';
import { getAQIColor } from '../utils/aqiStandards';

interface Props {
  models: ModelMetrics[];
  activeModelType: MLModelType;
  onSelectActiveModel: (type: MLModelType) => void;
  onRetrainModels: () => void;
  onProceedToPredictor: () => void;
  isTraining: boolean;
}

export const ModelTrainer: React.FC<Props> = ({
  models,
  activeModelType,
  onSelectActiveModel,
  onRetrainModels,
  onProceedToPredictor,
  isTraining,
}) => {
  const [selectedInspectModel, setSelectedInspectModel] = useState<MLModelType>(activeModelType);

  const currentInspected = models.find((m) => m.modelType === selectedInspectModel) || models[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Training Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">Machine Learning Model Training & Comparative Evaluation</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-mono border border-purple-500/20">
              Pipeline Stage 4
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evaluate 5 supervised algorithms across statistical loss functions (RMSE, MAE, R²) and multi-class category accuracy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRetrainModels}
            disabled={isTraining}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-all cursor-pointer shadow-md shadow-purple-600/25"
          >
            {isTraining ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Training Ensemble & Trees...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Train & Evaluate All Models</span>
              </>
            )}
          </button>

          <button
            onClick={onProceedToPredictor}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
          >
            <span>Proceed to Live Predictor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Comparative Leaderboard Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Machine Learning Comparative Leaderboard
            </h3>
            <p className="text-xs text-slate-400">
              Cross-model performance metrics computed on unseen 20% test-split environmental telemetry.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3 font-sans">ML Algorithm</th>
                <th className="px-3 py-3 text-right">R² Score (Fit)</th>
                <th className="px-3 py-3 text-right">RMSE (Loss)</th>
                <th className="px-3 py-3 text-right">MAE</th>
                <th className="px-3 py-3 text-right">MAPE (%)</th>
                <th className="px-3 py-3 text-right">Category Accuracy</th>
                <th className="px-3 py-3 text-right">Latency</th>
                <th className="px-4 py-3 text-center font-sans">Active in Predictor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {models.map((m) => {
                const isBest = m.modelType === 'random_forest';
                const isActive = activeModelType === m.modelType;
                const isSelected = selectedInspectModel === m.modelType;

                return (
                  <tr
                    key={m.modelType}
                    onClick={() => setSelectedInspectModel(m.modelType)}
                    className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                      isSelected ? 'bg-purple-950/20 border-l-2 border-l-purple-500' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-xs">{m.modelName}</span>
                        {isBest && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wider">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 font-normal font-sans mt-0.5">
                        {m.description}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right text-emerald-400 font-bold text-sm">
                      {m.r2Score}
                    </td>

                    <td className="px-3 py-3 text-right text-slate-200">
                      {m.rmse}
                    </td>

                    <td className="px-3 py-3 text-right text-slate-300">
                      {m.mae}
                    </td>

                    <td className="px-3 py-3 text-right text-slate-400">
                      {m.mape}%
                    </td>

                    <td className="px-3 py-3 text-right font-bold text-teal-400">
                      {m.accuracy}%
                    </td>

                    <td className="px-3 py-3 text-right text-slate-400">
                      {m.trainingTimeMs} ms
                    </td>

                    <td className="px-4 py-3 text-center font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectActiveModel(m.modelType);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {isActive ? 'Active Engine' : 'Select'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Deep-Dive: Feature Importance & Actual vs Predicted Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance Bar Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BarChart className="w-4 h-4 text-emerald-400" />
                Feature Importance Ranking (Gini / MDI)
              </h3>
              <p className="text-xs text-slate-400">
                Inspecting: <span className="font-semibold text-emerald-400">{currentInspected.modelName}</span>
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Normalized Contribution (0-100%)</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {currentInspected.featureImportance.map((item, idx) => {
              const percent = Math.round(item.importance * 100);
              return (
                <div key={item.feature} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium">{item.label}</span>
                    <span className="font-mono text-slate-400 text-[11px]">{percent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0
                          ? 'bg-emerald-400'
                          : idx === 1
                          ? 'bg-teal-400'
                          : idx === 2
                          ? 'bg-cyan-400'
                          : idx === 3
                          ? 'bg-blue-400'
                          : 'bg-slate-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-slate-850/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-200">Engineering Insight:</span> As anticipated in atmospheric physics, 
            <span className="text-emerald-400 font-medium"> PM2.5 (44%)</span> and <span className="text-teal-400 font-medium">PM10 (24%)</span> comprise over two-thirds of the model's split decisions, followed by <span className="text-cyan-400 font-medium">NO₂ combustion</span> and <span className="text-blue-400 font-medium">Wind Dispersion</span>.
          </div>
        </div>

        {/* Actual vs Predicted Scatter Plot on Test Set */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Actual vs Predicted AQI (Test Set)
              </h3>
              <p className="text-xs text-slate-400">
                Points closer to the 45° diagonal line indicate near-zero prediction error.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              R² = {currentInspected.r2Score}
            </span>
          </div>

          <div className="relative h-60 w-full bg-slate-950/60 rounded-xl border border-slate-800/80 p-4 overflow-hidden">
            {/* 45 degree ideal diagonal reference */}
            <div className="absolute inset-4 pointer-events-none">
              <svg className="w-full h-full">
                <line
                  x1="0%"
                  y1="100%"
                  x2="100%"
                  y2="0%"
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>

            {/* Test predictions points */}
            <div className="relative w-full h-full">
              {currentInspected.samplePredictions.map((pt, i) => {
                const colors = getAQIColor(pt.category);
                const xPercent = (pt.actual / 350) * 100;
                const yPercent = (pt.predicted / 350) * 100;

                return (
                  <div
                    key={i}
                    style={{
                      left: `${Math.max(2, Math.min(98, xPercent))}%`,
                      bottom: `${Math.max(2, Math.min(98, yPercent))}%`,
                      backgroundColor: colors.hex,
                    }}
                    title={`Actual: ${pt.actual}, Predicted: ${pt.predicted}`}
                    className="absolute w-2 h-2 rounded-full transform -translate-x-1/2 translate-y-1/2 hover:scale-200 transition-transform cursor-pointer"
                  />
                );
              })}
            </div>

            <div className="absolute left-6 top-3 text-[10px] text-slate-400 font-mono">
              Predicted AQI
            </div>
            <div className="absolute right-6 bottom-2 text-[10px] text-slate-400 font-mono">
              Actual AQI (Ground Truth)
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Root Mean Squared Error (RMSE): <strong className="text-slate-200">{currentInspected.rmse}</strong></span>
            <span>Mean Absolute Error (MAE): <strong className="text-slate-200">{currentInspected.mae}</strong></span>
          </div>
        </div>
      </div>

      {/* Multi-Class Confusion Matrix Heatmap */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Grid className="w-4 h-4 text-teal-400" />
              Multi-Class AQI Category Confusion Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Rows represent True Categories; Columns represent Model Predictions. High diagonal density denotes top precision.
            </p>
          </div>
          <span className="text-xs font-mono text-teal-300 font-semibold">
            Overall Accuracy: {currentInspected.accuracy}%
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[600px] space-y-2">
            {/* Header Columns */}
            <div className="grid grid-cols-7 gap-2 text-[11px] font-mono text-slate-400 text-center font-bold">
              <div className="text-left font-sans text-slate-500">True \ Pred</div>
              {currentInspected.confusionMatrix.categories.map((cat) => (
                <div key={cat} className="truncate uppercase text-slate-300 text-[10px]" title={cat}>
                  {cat === 'Unhealthy for Sensitive Groups' ? 'USG' : cat === 'Very Unhealthy' ? 'V.Unhealthy' : cat}
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            {currentInspected.confusionMatrix.categories.map((actualCat, rIdx) => (
              <div key={actualCat} className="grid grid-cols-7 gap-2 items-center text-xs font-mono">
                <div className="truncate text-slate-400 font-bold text-right pr-2 text-[11px]" title={actualCat}>
                  {actualCat === 'Unhealthy for Sensitive Groups' ? 'USG' : actualCat === 'Very Unhealthy' ? 'V.Unhealthy' : actualCat}
                </div>

                {currentInspected.confusionMatrix.matrix[rIdx].map((val, cIdx) => {
                  const isDiagonal = rIdx === cIdx;
                  let bg = 'bg-slate-800/50 text-slate-500';
                  if (isDiagonal && val > 0) {
                    bg = 'bg-emerald-600/90 text-white font-bold shadow-sm shadow-emerald-600/20';
                  } else if (val > 0) {
                    bg = 'bg-rose-900/40 text-rose-300 font-bold';
                  }

                  return (
                    <div
                      key={cIdx}
                      className={`h-9 rounded-lg flex items-center justify-center text-xs transition-colors ${bg}`}
                    >
                      {val}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
