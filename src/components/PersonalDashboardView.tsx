import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  Heart, 
  MapPin, 
  Bookmark, 
  AlertTriangle, 
  Trash2, 
  Download, 
  Activity, 
  Sparkles, 
  Calendar, 
  Sliders, 
  CheckCircle2, 
  Bell, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { UserProfile, SavedAQIRecord, CityInfo, EnvironmentalFeatures, AQIAlertEvent } from '../types/aqi';
import { getAQIColor } from '../utils/aqiStandards';

interface Props {
  user: UserProfile;
  savedHistory: SavedAQIRecord[];
  favoriteCities: CityInfo[];
  alertEvents: AQIAlertEvent[];
  onOpenAuthModal: () => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
  onExportHistoryCSV: () => void;
  onSelectCity: (city: CityInfo) => void;
  onUpdateAlertThreshold: (threshold: number) => void;
  onLoadFeaturesIntoPredictor: (features: EnvironmentalFeatures, name: string) => void;
}

export const PersonalDashboardView: React.FC<Props> = ({
  user,
  savedHistory,
  favoriteCities,
  alertEvents,
  onOpenAuthModal,
  onDeleteHistoryItem,
  onClearHistory,
  onExportHistoryCSV,
  onSelectCity,
  onUpdateAlertThreshold,
  onLoadFeaturesIntoPredictor,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'alerts' | 'sensitivity'>('history');

  // Compute Sensitivity-tailored health safety score
  const sensitivityGuidance: Record<UserProfile['sensitivity'], { label: string; desc: string; dangerThreshold: number }> = {
    general: {
      label: 'General Public (Healthy Adult)',
      desc: 'Standard EPA risk thresholds apply. Outdoor activity is fine until AQI exceeds 150.',
      dangerThreshold: 150,
    },
    asthma_respiratory: {
      label: 'Asthma / Respiratory Sensitive',
      desc: 'High sensitivity to PM2.5 and Ozone bronchoconstriction. Restrict physical exertion when AQI > 100.',
      dangerThreshold: 100,
    },
    cardiovascular: {
      label: 'Cardiovascular Condition',
      desc: 'Fine particulates PM2.5 trigger systemic arterial inflammation. High risk when AQI > 100.',
      dangerThreshold: 100,
    },
    children_pediatric: {
      label: 'Child / Pediatric Sensitivity',
      desc: 'Developing alveolar lung surface area has higher ventilation-to-mass ratio. Guard at AQI > 100.',
      dangerThreshold: 100,
    },
    elderly: {
      label: 'Senior Citizen (65+)',
      desc: 'Reduced pulmonary capacity and cardiovascular resilience. Guard when AQI > 100.',
      dangerThreshold: 100,
    },
    outdoor_athlete: {
      label: 'Outdoor Athlete / Cyclist',
      desc: 'Heavy minute-ventilation increases deep particulate lung deposition by 400%. Restrict strenuous cardio if AQI > 120.',
      dangerThreshold: 120,
    },
  };

  const currentSensitivity = sensitivityGuidance[user.sensitivity] || sensitivityGuidance.general;

  return (
    <div className="space-y-6 pb-12">
      {/* User Header Profile Card */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-850 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            style={{ backgroundColor: user.avatarColor }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg flex-shrink-0"
          >
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-semibold border border-emerald-500/20">
                {user.isLoggedIn ? 'Active User' : 'Guest Account'}
              </span>
            </div>
            <p className="text-xs text-slate-400">{user.email}</p>
            <div className="text-xs font-medium text-emerald-400 flex items-center gap-1.5 pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sensitivity Profile: {currentSensitivity.label}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAuthModal}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            {user.isLoggedIn ? 'Edit Profile / Sensitivity' : 'Log In / Register'}
          </button>
        </div>
      </div>

      {/* Personal Key Metrics Grid: Personalized Safety Index, Favorite Cities, Alert Rule */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Personalized Risk Threshold */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
              Personalized Risk Guard
            </span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>

          <div>
            <div className="text-3xl font-black font-mono text-white">
              AQI &gt; {currentSensitivity.dangerThreshold}
            </div>
            <div className="text-xs text-slate-300 mt-1 font-medium">
              Trigger threshold for your profile
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              {currentSensitivity.desc}
            </p>
          </div>

          <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 pt-1 border-t border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Health directive automatically adapted</span>
          </div>
        </div>

        {/* Metric 2: Alert System Threshold */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
              Alert Trigger Threshold
            </span>
            <Bell className="w-4 h-4 text-amber-400" />
          </div>

          <div>
            <div className="text-3xl font-black font-mono text-amber-400">
              {user.alertThresholdAQI} AQI
            </div>
            <div className="text-xs text-slate-300 mt-1 font-medium">
              Audio & Banner Alert Level
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              Trigger alarms when any monitored city or station crosses {user.alertThresholdAQI}.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <span className="text-[11px] text-slate-400">Set:</span>
            {[100, 150, 200].map((th) => (
              <button
                key={th}
                onClick={() => onUpdateAlertThreshold(th)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                  user.alertThresholdAQI === th
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {th}
              </button>
            ))}
          </div>
        </div>

        {/* Metric 3: Logged History Count */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
              Personal Exposure Logs
            </span>
            <Bookmark className="w-4 h-4 text-emerald-400" />
          </div>

          <div>
            <div className="text-3xl font-black font-mono text-emerald-400">
              {savedHistory.length}
            </div>
            <div className="text-xs text-slate-300 mt-1 font-medium">
              Saved Environmental Entries
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              Bookmarks of commuting, running, and home air readings with timestamps and notes.
            </p>
          </div>

          <button
            onClick={onExportHistoryCSV}
            disabled={savedHistory.length === 0}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 disabled:opacity-40 flex items-center gap-1 cursor-pointer pt-1 border-t border-slate-800"
          >
            <Download className="w-3 h-3" />
            <span>Export Personal Logs to CSV</span>
          </button>
        </div>
      </div>

      {/* Favorite Monitored Cities Quick Switcher */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Favorite Monitored Locations
            </h3>
            <p className="text-xs text-slate-400">
              Quick access to current telemetry for your bookmarked metropolitan areas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {favoriteCities.map((city) => {
            const colors = getAQIColor(city.category);

            return (
              <div
                key={city.id}
                onClick={() => onSelectCity(city)}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {city.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{city.country}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-1">
                    {city.weatherDescription}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span
                    style={{ color: colors.hex }}
                    className="text-xl font-mono font-black"
                  >
                    AQI {city.currentAQI}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${colors.badge}`}>
                    {city.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs: Saved AQI History, Active Alert Log, Health Plan */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Saved AQI History ({savedHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'alerts'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Threshold Alert History ({alertEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('sensitivity')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'sensitivity'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Tailored Health Plan
            </button>
          </div>

          {activeTab === 'history' && savedHistory.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={onExportHistoryCSV}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg text-xs font-mono transition-colors cursor-pointer border border-rose-800/40"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Saved History Table */}
        {activeTab === 'history' && (
          <div>
            {savedHistory.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-300">No Saved History Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When viewing Live AQI or running the Predictor, click "Log / Save to History" to bookmark readings with personal notes.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono text-slate-300">
                  <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-3 py-2.5 font-sans">Timestamp</th>
                      <th className="px-3 py-2.5 font-sans">City / Tag</th>
                      <th className="px-3 py-2.5 text-right">AQI</th>
                      <th className="px-3 py-2.5 font-sans">Category</th>
                      <th className="px-3 py-2.5 font-sans">User Notes</th>
                      <th className="px-3 py-2.5 text-right font-sans">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {savedHistory.map((item) => {
                      const colors = getAQIColor(item.category);

                      return (
                        <tr key={item.id} className="hover:bg-slate-800/40">
                          <td className="px-3 py-2.5 text-slate-400 text-[11px]">
                            {item.timestamp}
                          </td>
                          <td className="px-3 py-2.5 font-sans">
                            <span className="font-bold text-slate-200">{item.cityName}</span>
                            <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                              {item.tag}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-sm" style={{ color: colors.hex }}>
                            {item.aqi}
                          </td>
                          <td className="px-3 py-2.5 font-sans">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${colors.badge}`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-sans text-slate-300 max-w-xs truncate">
                            {item.userNotes || '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right space-x-2">
                            <button
                              onClick={() => onLoadFeaturesIntoPredictor(item.features, item.cityName)}
                              className="text-[11px] text-purple-400 hover:text-purple-300 cursor-pointer font-sans"
                            >
                              Simulate
                            </button>
                            <button
                              onClick={() => onDeleteHistoryItem(item.id)}
                              className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Alert Events Log */}
        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {alertEvents.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-300">No Alert Events Triggered</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Alerts will log here automatically whenever a city crosses your chosen threshold of AQI {user.alertThresholdAQI}.
                </p>
              </div>
            ) : (
              alertEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{evt.cityName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                        AQI {evt.aqi} ({evt.category})
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">{evt.triggerReason}</div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{evt.timestamp}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Tailored Health Plan */}
        {activeTab === 'sensitivity' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Medical Action Plan for: {currentSensitivity.label}
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Based on epidemiological toxicological research, your designated profile requires active risk mitigation at lower particulate thresholds than the general population:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-200">1. Outdoor Physical Activity</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  When AQI exceeds {currentSensitivity.dangerThreshold}, avoid high-ventilation cardio outdoors. Shift runs or cycling indoors to a HEPA-filtered environment.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-200">2. Respiratory Barrier (N95)</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Cloth and surgical masks do not filter fine particles ($&le; 2.5 \mu m$). Ensure an airtight N95/FFP2 respirator seal during high-traffic exposure.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-200">3. Indoor Microenvironment</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Keep windows sealed during morning and evening rush hours. Run indoor True HEPA filtration to maintain indoor AQI under 35.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
