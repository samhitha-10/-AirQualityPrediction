import React from 'react';
import { Bell, AlertTriangle, Volume2, VolumeX, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { AQIAlertEvent } from '../types/aqi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  alertEvents: AQIAlertEvent[];
  thresholdAQI: number;
  onUpdateThreshold: (th: number) => void;
  enableAudio: boolean;
  onToggleAudio: (enable: boolean) => void;
  onClearAlerts: () => void;
  onTestChime: () => void;
}

export const AlertsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  alertEvents,
  thresholdAQI,
  onUpdateThreshold,
  enableAudio,
  onToggleAudio,
  onClearAlerts,
  onTestChime,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">AQI Alert Center & Notification Rules</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Threshold Selector */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200">Alert Trigger Threshold</span>
            <span className="font-mono font-bold text-amber-400 text-sm">AQI &gt; {thresholdAQI}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Whenever any selected city or nearby monitoring station crosses this index, an alert event is logged and an alarm banner is surfaced.
          </p>

          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {[
              { val: 50, label: 'Moderate' },
              { val: 100, label: 'USG' },
              { val: 150, label: 'Unhealthy' },
              { val: 200, label: 'Very Unhealthy' },
              { val: 300, label: 'Hazardous' },
            ].map((th) => (
              <button
                key={th.val}
                onClick={() => onUpdateThreshold(th.val)}
                className={`py-1.5 px-1 rounded-lg text-center transition-colors cursor-pointer ${
                  thresholdAQI === th.val
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-mono text-xs">{th.val}</div>
                <div className="text-[9px] truncate">{th.label}</div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleAudio(!enableAudio)}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                {enableAudio ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <span>Audible Chime: {enableAudio ? 'Enabled' : 'Muted'}</span>
              </button>
            </div>

            <button
              onClick={onTestChime}
              className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 font-mono transition-colors cursor-pointer"
            >
              Test Chime 🔔
            </button>
          </div>
        </div>

        {/* Active Alert Log */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">
              Active Alert Notifications ({alertEvents.length})
            </span>
            {alertEvents.length > 0 && (
              <button
                onClick={onClearAlerts}
                className="text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer font-mono"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {alertEvents.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500/50 mx-auto" />
                <div>All monitored locations within safe parameters.</div>
              </div>
            ) : (
              alertEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{evt.cityName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-800/40 font-bold">
                        AQI {evt.aqi} • {evt.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{evt.triggerReason}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{evt.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
