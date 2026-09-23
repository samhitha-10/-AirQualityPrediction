import React from 'react';
import { 
  Database, 
  Filter, 
  BarChart3, 
  Cpu, 
  Sparkles, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Globe2, 
  LayoutDashboard,
  MapPin
} from 'lucide-react';

export type PipelineStage = 
  | 'overview'
  | 'city_live'
  | 'collection'
  | 'preprocessing'
  | 'eda'
  | 'models'
  | 'predictor'
  | 'dashboard'
  | 'cep_docs';

interface Props {
  currentStage: PipelineStage;
  onSelectStage: (stage: PipelineStage) => void;
  isModelTrained: boolean;
  isPreprocessed: boolean;
  activeCityName?: string;
  savedCount?: number;
}

export const PipelineBreadcrumbs: React.FC<Props> = ({
  currentStage,
  onSelectStage,
  isModelTrained,
  isPreprocessed,
  activeCityName = 'New Delhi',
  savedCount = 0,
}) => {
  const primaryFlow: { id: PipelineStage; label: string; icon: React.ReactNode; isReady: boolean }[] = [
    { id: 'collection', label: '1. Ingestion', icon: <Database className="w-3.5 h-3.5" />, isReady: true },
    { id: 'preprocessing', label: '2. Cleaning', icon: <Filter className="w-3.5 h-3.5" />, isReady: isPreprocessed },
    { id: 'eda', label: '3. EDA & Stats', icon: <BarChart3 className="w-3.5 h-3.5" />, isReady: isPreprocessed },
    { id: 'models', label: '4. ML Models', icon: <Cpu className="w-3.5 h-3.5" />, isReady: isModelTrained },
    { id: 'predictor', label: '5. AQI Predictor', icon: <Sparkles className="w-3.5 h-3.5" />, isReady: true },
    { id: 'cep_docs', label: '6. CEP Dossier', icon: <FileText className="w-3.5 h-3.5" />, isReady: true },
  ];

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-16 z-30 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar gap-4">
        {/* Left: Quick City & Dashboard Switchers */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onSelectStage('city_live')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentStage === 'city_live'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Cities: <strong className="text-white">{activeCityName}</strong></span>
          </button>

          <button
            onClick={() => onSelectStage('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentStage === 'dashboard'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
            <span>Dashboard {savedCount > 0 && `(${savedCount})`}</span>
          </button>
        </div>

        {/* Right: Pipeline Stages Stepper */}
        <div className="flex items-center gap-1.5 min-w-max text-xs pl-2 border-l border-slate-800">
          <span className="text-slate-500 font-medium mr-1 hidden lg:inline-block">CEP Pipeline:</span>
          {primaryFlow.map((st, idx) => {
            const isActive = currentStage === st.id;
            return (
              <React.Fragment key={st.id}>
                <button
                  onClick={() => onSelectStage(st.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-400' : 'text-slate-500'}>{st.icon}</span>
                  <span>{st.label}</span>
                  {st.isReady && st.id !== 'collection' && st.id !== 'predictor' && st.id !== 'cep_docs' && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-0.5" />
                  )}
                </button>
                {idx < primaryFlow.length - 1 && (
                  <ArrowRight className="w-2.5 h-2.5 text-slate-700 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
