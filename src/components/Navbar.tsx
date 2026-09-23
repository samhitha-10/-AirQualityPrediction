import React from 'react';
import { 
  Wind, 
  Download, 
  RefreshCw, 
  Sparkles, 
  BookOpen, 
  Globe2, 
  LayoutDashboard, 
  Bell, 
  User,
  AlertTriangle
} from 'lucide-react';
import { PipelineStage } from './PipelineBreadcrumbs';
import { UserProfile } from '../types/aqi';

interface Props {
  currentStage: PipelineStage;
  onSelectStage: (stage: PipelineStage) => void;
  onResetData: () => void;
  onExportCSV: () => void;
  onOpenAuthModal: () => void;
  user: UserProfile;
  unreadAlertCount: number;
  onOpenAlerts: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentStage,
  onSelectStage,
  onResetData,
  onExportCSV,
  onOpenAuthModal,
  user,
  unreadAlertCount,
  onOpenAlerts,
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div 
          onClick={() => onSelectStage('overview')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Wind className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm md:text-base font-bold text-slate-100 tracking-tight">
                Air Quality ML System
              </h1>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                CEP 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal hidden sm:block">
              Intelligent Telemetry & Environmental Analytics
            </p>
          </div>
        </div>

        {/* Center / Navigation Shortcuts */}
        <div className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onSelectStage('city_live')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              currentStage === 'city_live'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Cities & Stations</span>
          </button>

          <button
            onClick={() => onSelectStage('predictor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              currentStage === 'predictor'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Live Predictor</span>
          </button>

          <button
            onClick={() => onSelectStage('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              currentStage === 'dashboard'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onSelectStage('cep_docs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              currentStage === 'cep_docs'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>CEP Dossier</span>
          </button>
        </div>

        {/* Action Controls & User Account */}
        <div className="flex items-center gap-2">
          {/* Alerts Bell */}
          <button
            onClick={onOpenAlerts}
            title="AQI Threshold Alerts"
            className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold font-mono text-white flex items-center justify-center animate-bounce">
                {unreadAlertCount}
              </span>
            )}
          </button>

          {/* User Profile / Register Button */}
          <button
            onClick={onOpenAuthModal}
            className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
              user.isLoggedIn
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/70'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
            }`}
            title="User Account, Registration & Health Sensitivity"
          >
            {user.isLoggedIn ? (
              <>
                <div
                  style={{ backgroundColor: user.avatarColor }}
                  className="w-6 h-6 rounded-lg text-white font-bold text-[11px] flex items-center justify-center shadow"
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold hidden sm:inline max-w-[90px] truncate">
                  {user.name.split(' ')[0]}
                </span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">Register / Sign In</span>
              </>
            )}
          </button>

          <button
            onClick={onExportCSV}
            title="Download Cleaned Telemetry Dataset"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700/70 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={onResetData}
            title="Reset telemetry baseline"
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700 border border-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
