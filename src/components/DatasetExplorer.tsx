import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  PlusCircle, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  MapPin, 
  Layers, 
  ChevronLeft, 
  ChevronRight,
  TrendingDown,
  Wind
} from 'lucide-react';
import { AirQualityRecord, EnvironmentalFeatures } from '../types/aqi';
import { MONITORING_STATIONS } from '../data/syntheticDataset';
import { getAQIColor } from '../utils/aqiStandards';

interface Props {
  dataset: AirQualityRecord[];
  onAddRecord: (record: AirQualityRecord) => void;
  onExportCSV: () => void;
  onProceedToPreprocessing: () => void;
}

export const DatasetExplorer: React.FC<Props> = ({
  dataset,
  onAddRecord,
  onExportCSV,
  onProceedToPreprocessing,
}) => {
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [noiseFilter, setNoiseFilter] = useState<'all' | 'missing' | 'outlier' | 'duplicate'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Add record modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRecordData, setNewRecordData] = useState<EnvironmentalFeatures>({
    pm25: 75,
    pm10: 120,
    no2: 38,
    co: 1.1,
    so2: 15,
    o3: 40,
    temperature: 28,
    humidity: 65,
    windSpeed: 8,
    trafficIndex: 60,
  });
  const [newStation, setNewStation] = useState(MONITORING_STATIONS[0].name);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return dataset.filter((rec) => {
      if (selectedStation !== 'all' && rec.stationName !== selectedStation) {
        return false;
      }
      if (noiseFilter === 'missing' && !rec.isMissing) return false;
      if (noiseFilter === 'outlier' && !rec.isOutlier) return false;
      if (noiseFilter === 'duplicate' && !rec.isDuplicate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          rec.stationName.toLowerCase().includes(q) ||
          rec.timestamp.toLowerCase().includes(q) ||
          rec.category.toLowerCase().includes(q) ||
          rec.primaryPollutant.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [dataset, selectedStation, noiseFilter, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  // Aggregate stats
  const missingCount = dataset.filter((r) => r.isMissing).length;
  const outlierCount = dataset.filter((r) => r.isOutlier).length;
  const duplicateCount = dataset.filter((r) => r.isDuplicate).length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const st = MONITORING_STATIONS.find((s) => s.name === newStation) || MONITORING_STATIONS[0];
    const newRecord: AirQualityRecord = {
      ...newRecordData,
      id: `custom-rec-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      stationName: st.name,
      locationType: st.type,
      aqi: Math.round(newRecordData.pm25 * 1.5 + (newRecordData.humidity > 70 ? 10 : 0)),
      category: 'Unhealthy',
      primaryPollutant: 'PM2.5',
    };
    onAddRecord(newRecord);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">Historical Air Quality Dataset</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">
              {dataset.length} Total Rows
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Raw observational telemetry from 5 atmospheric monitoring stations containing realistic noise, missing values, and sensor spikes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Sensor Sample</span>
          </button>

          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={onProceedToPreprocessing}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
          >
            <span>Proceed to Preprocessing</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dataset Health & Noise Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Monitoring Stations</span>
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-slate-100 mt-1">{MONITORING_STATIONS.length} Stations</div>
          <div className="text-[10px] text-slate-400">Urban, Industrial & Suburban</div>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-3.5">
          <div className="text-[11px] font-medium text-amber-400 flex items-center justify-between">
            <span>Missing Sensor Values</span>
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1">{missingCount} Records</div>
          <div className="text-[10px] text-slate-400">Requires imputation in Step 2</div>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-3.5">
          <div className="text-[11px] font-medium text-rose-400 flex items-center justify-between">
            <span>Sensor Glitch Outliers</span>
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1">{outlierCount} Records</div>
          <div className="text-[10px] text-slate-400">High variance spikes (IQR filtered)</div>
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-purple-950/10 p-3.5">
          <div className="text-[11px] font-medium text-purple-400 flex items-center justify-between">
            <span>Duplicate Telemetry</span>
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold text-purple-400 mt-1">{duplicateCount} Records</div>
          <div className="text-[10px] text-slate-400">Identical timestamps & readings</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by date, station name, category, or dominant pollutant..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Station:</span>
            </div>
            <select
              value={selectedStation}
              onChange={(e) => {
                setSelectedStation(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="all">All 5 Stations</option>
              {MONITORING_STATIONS.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>

            <div className="flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => { setNoiseFilter('all'); setPage(1); }}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  noiseFilter === 'all' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setNoiseFilter('missing'); setPage(1); }}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  noiseFilter === 'missing' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Missing ({missingCount})
              </button>
              <button
                onClick={() => { setNoiseFilter('outlier'); setPage(1); }}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  noiseFilter === 'outlier' ? 'bg-rose-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Outliers ({outlierCount})
              </button>
              <button
                onClick={() => { setNoiseFilter('duplicate'); setPage(1); }}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  noiseFilter === 'duplicate' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Duplicates ({duplicateCount})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-700/80">
              <tr>
                <th className="px-3.5 py-3">Timestamp / Station</th>
                <th className="px-3 py-3">Zone</th>
                <th className="px-2.5 py-3 text-right">PM2.5 (µg/m³)</th>
                <th className="px-2.5 py-3 text-right">PM10 (µg/m³)</th>
                <th className="px-2.5 py-3 text-right">NO₂ (µg/m³)</th>
                <th className="px-2.5 py-3 text-right">CO (mg/m³)</th>
                <th className="px-2.5 py-3 text-right">Temp (°C)</th>
                <th className="px-2.5 py-3 text-right">Humidity (%)</th>
                <th className="px-2.5 py-3 text-right">Wind (km/h)</th>
                <th className="px-3 py-3 text-center">AQI</th>
                <th className="px-3 py-3 text-center">Category</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-slate-500 font-sans">
                    No matching environmental telemetry records found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const colors = getAQIColor(row.category);
                  const isBenchmark = row.id === 'user-benchmark-case';

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isBenchmark
                          ? 'bg-red-950/20 border-l-2 border-l-red-500'
                          : row.isOutlier
                          ? 'bg-rose-950/15'
                          : row.isMissing
                          ? 'bg-amber-950/15'
                          : row.isDuplicate
                          ? 'bg-purple-950/15'
                          : ''
                      }`}
                    >
                      <td className="px-3.5 py-2.5 font-sans">
                        <div className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                          <span>{row.stationName}</span>
                          {isBenchmark && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-600 text-white font-bold uppercase tracking-wider">
                              Target Case
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{row.timestamp}</div>
                      </td>

                      <td className="px-3 py-2.5 font-sans">
                        <span className="text-[11px] text-slate-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60">
                          {row.locationType}
                        </span>
                      </td>

                      <td className={`px-2.5 py-2.5 text-right font-bold ${row.isOutlier ? 'text-rose-400' : 'text-slate-200'}`}>
                        {row.isMissing ? <span className="text-amber-400 italic font-sans">NaN</span> : row.pm25}
                      </td>

                      <td className={`px-2.5 py-2.5 text-right font-bold ${row.isOutlier ? 'text-rose-400' : 'text-slate-200'}`}>
                        {row.isMissing ? <span className="text-amber-400 italic font-sans">NaN</span> : row.pm10}
                      </td>

                      <td className="px-2.5 py-2.5 text-right text-slate-300">
                        {row.isMissing ? <span className="text-amber-400 italic font-sans">NaN</span> : row.no2}
                      </td>

                      <td className="px-2.5 py-2.5 text-right text-slate-300">
                        {row.co}
                      </td>

                      <td className="px-2.5 py-2.5 text-right text-slate-400">
                        {row.temperature}°
                      </td>

                      <td className="px-2.5 py-2.5 text-right text-slate-400">
                        {row.humidity}%
                      </td>

                      <td className="px-2.5 py-2.5 text-right text-slate-400">
                        {row.windSpeed}
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <span className="font-extrabold text-sm text-slate-100">{row.aqi}</span>
                      </td>

                      <td className="px-3 py-2.5 text-center font-sans">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${colors.badge}`}>
                          {row.category}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 font-sans">
                        {row.isMissing ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Missing Value
                          </span>
                        ) : row.isOutlier ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Outlier Spike
                          </span>
                        ) : row.isDuplicate ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            Duplicate
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-slate-850/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{(page - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-slate-200">
              {Math.min(page * pageSize, filteredData.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-200">{filteredData.length}</span> records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-300 font-mono">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Custom Record Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                Add New Atmospheric Telemetry Sample
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Monitoring Station
                </label>
                <select
                  value={newStation}
                  onChange={(e) => setNewStation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {MONITORING_STATIONS.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400">PM2.5 (µg/m³)</label>
                  <input
                    type="number"
                    value={newRecordData.pm25}
                    onChange={(e) =>
                      setNewRecordData({ ...newRecordData, pm25: Number(e.target.value) })
                    }
                    className="w-full mt-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400">PM10 (µg/m³)</label>
                  <input
                    type="number"
                    value={newRecordData.pm10}
                    onChange={(e) =>
                      setNewRecordData({ ...newRecordData, pm10: Number(e.target.value) })
                    }
                    className="w-full mt-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400">NO₂ (µg/m³)</label>
                  <input
                    type="number"
                    value={newRecordData.no2}
                    onChange={(e) =>
                      setNewRecordData({ ...newRecordData, no2: Number(e.target.value) })
                    }
                    className="w-full mt-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400">CO (mg/m³)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRecordData.co}
                    onChange={(e) =>
                      setNewRecordData({ ...newRecordData, co: Number(e.target.value) })
                    }
                    className="w-full mt-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400">Temperature (°C)</label>
                  <input
                    type="number"
                    value={newRecordData.temperature}
                    onChange={(e) =>
                      setNewRecordData({ ...newRecordData, temperature: Number(e.target.value) })
                    }
                    className="w-full mt-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400">Humidity (%)</label>
                  <input
                    type="number"
                    value={newRecordData.humidity}
                    onChange={(e) =>
                      setNewRecordData({ ...newRecordData, humidity: Number(e.target.value) })
                    }
                    className="w-full mt-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400">Wind Velocity (km/h)</label>
                  <input
                    type="number"
                    value={newRecordData.windSpeed}
                    onChange={(e) =>
                      setNewRecordData({ ...newRecordData, windSpeed: Number(e.target.value) })
                    }
                    className="w-full mt-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400">Traffic Density (0-100)</label>
                  <input
                    type="number"
                    value={newRecordData.trafficIndex}
                    onChange={(e) =>
                      setNewRecordData({ ...newRecordData, trafficIndex: Number(e.target.value) })
                    }
                    className="w-full mt-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-slate-200 bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Insert Sample Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
