import React from 'react';
import { Database, Filter, BarChart3, Cpu, Sparkles, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';

export type PipelineStage = 
  | 'overview'
  | 'collection'
  | 'preprocessing'
  | 'eda'
  | 'models'
  | 'predictor'
  | 'cep_docs';

interface Props {
  currentStage: PipelineStage;
  onSelectStage: (stage: PipelineStage) => void;
  isModelTrained: boolean;
  isPreprocessed: boolean;
}

export const PipelineBreadcrumbs: React.FC<Props> = ({
  currentStage,
  onSelectStage,
  isModelTrained,
  isPreprocessed,
}) => {
  const stages: { id: PipelineStage; label: string; icon: React.ReactNode; isReady: boolean }[] = [
    { id: 'collection', label: '1. Data Collection', icon: <Database className="w-4 h-4" />, isReady: true },
    { id: 'preprocessing', label: '2. Preprocessing', icon: <Filter className="w-4 h-4" />, isReady: isPreprocessed },
    { id: 'eda', label: '3. Data Analysis (EDA)', icon: <BarChart3 className="w-4 h-4" />, isReady: isPreprocessed },
    { id: 'models', label: '4. ML Model Training', icon: <Cpu className="w-4 h-4" />, isReady: isModelTrained },
    { id: 'predictor', label: '5. AQI Prediction', icon: <Sparkles className="w-4 h-4" />, isReady: true },
    { id: 'cep_docs', label: '6. CEP Report & Docs', icon: <FileText className="w-4 h-4" />, isReady: true },
  ];

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-16 z-30 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar gap-2">
        <div className="flex items-center gap-1.5 min-w-max text-xs">
          <span className="text-slate-400 font-medium mr-1 hidden sm:inline-block">System Pipeline:</span>
          {stages.map((st, idx) => {
            const isActive = currentStage === st.id;
            return (
              <React.Fragment key={st.id}>
                <button
                  onClick={() => onSelectStage(st.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>{st.icon}</span>
                  <span>{st.label}</span>
                  {st.isReady && st.id !== 'collection' && st.id !== 'predictor' && st.id !== 'cep_docs' && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-0.5" />
                  )}
                </button>
                {idx < stages.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
