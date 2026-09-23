import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapPin, 
  RefreshCw, 
  Wind, 
  Droplets, 
  Thermometer, 
  Car, 
  ShieldAlert, 
  Compass, 
  TrendingUp, 
  Bookmark, 
  BookmarkCheck, 
  Calendar, 
  Activity, 
  CheckCircle2, 
  Radio, 
  ChevronRight, 
  Sliders, 
  Sparkles, 
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Navigation,
  PlusCircle,
  Sun,
  Gauge,
  Eye,
  Waves,
  Zap,
  Globe
} from 'lucide-react';
import { 
  CityInfo, 
  NearbyStation, 
  FutureAQIForecast, 
  SavedAQIRecord, 
  EnvironmentalFeatures,
  DynamicAtmospherics 
} from '../types/aqi';
import { GLOBAL_CITIES, generateCityForecasts, getDynamicAtmospherics } from '../data/citiesData';
import { getAQIColor } from '../utils/aqiStandards';
import { 
  getUserGeolocation, 
  reverseGeocodeCoords, 
  buildDynamicCity, 
  simulateDynamicSensorJitter 
} from '../utils/dynamicLocation';

interface Props {
  selectedCity: CityInfo;
  availableCities?: CityInfo[];
  onSelectCity: (city: CityInfo) => void;
  onAddNewDynamicCity?: (city: CityInfo) => void;
  onSaveToHistory: (record: Omit<SavedAQIRecord, 'id' | 'timestamp'>) => void;
  onLoadIntoPredictor: (features: EnvironmentalFeatures, name: string) => void;
  isSavedInHistory: boolean;
  alertThreshold: number;
}

export const CityLiveAQIView: React.FC<Props> = ({
  selectedCity,
  availableCities = GLOBAL_CITIES,
  onSelectCity,
  onAddNewDynamicCity,
  onSaveToHistory,
  onLoadIntoPredictor,
  isSavedInHistory,
  alertThreshold,
}) => {
  // Modal & Search States
  const [isCitySearchOpen, setIsCitySearchOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'browse' | 'custom' | 'gps'>('browse');
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Live Auto-Stream simulation
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [streamUpdatesCount, setStreamUpdatesCount] = useState(0);

  // Save to history form
  const [saveTag, setSaveTag] = useState<SavedAQIRecord['tag']>('General');
  const [saveNotes, setSaveNotes] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [forecastHorizon, setForecastHorizon] = useState<string>('+6 Hours');

  // Custom Dynamic City Form
  const [customName, setCustomName] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [customLat, setCustomLat] = useState<number>(37.77);
  const [customLon, setCustomLon] = useState<number>(-122.41);
  const [customPM25, setCustomPM25] = useState<number>(45);
  const [customTemp, setCustomTemp] = useState<number>(22);
  const [customWind, setCustomWind] = useState<number>(8);

  // Multi-horizon forecast
  const forecasts = useMemo(() => {
    return generateCityForecasts(selectedCity);
  }, [selectedCity]);

  const activeForecast = forecasts.find((f) => f.timeHorizon === forecastHorizon) || forecasts[0];

  // Dynamic Atmospherics
  const dynamicAtm = useMemo(() => {
    return getDynamicAtmospherics(selectedCity);
  }, [selectedCity]);

  // Cities filter
  const filteredCities = useMemo(() => {
    return availableCities.filter(
      (c) =>
        c.name.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
        c.country.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
        c.region.toLowerCase().includes(citySearchQuery.toLowerCase())
    );
  }, [availableCities, citySearchQuery]);

  const aqiColors = getAQIColor(selectedCity.category);
  const isAlertTriggered = selectedCity.currentAQI >= alertThreshold;

  // Live Streaming auto-interval
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      const updated = simulateDynamicSensorJitter(selectedCity);
      onSelectCity(updated);
      setStreamUpdatesCount((prev) => prev + 1);
    }, 3500);

    return () => clearInterval(interval);
  }, [isLiveStreaming, selectedCity, onSelectCity]);

  // Handle manual Refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const updated = simulateDynamicSensorJitter(selectedCity);
      onSelectCity(updated);
      setIsRefreshing(false);
    }, 500);
  };

  // Handle Acquire User GPS Current Location
  const handleGetGPSLocation = async () => {
    setIsLocatingGPS(true);
    setGpsError(null);
    try {
      const coords = await getUserGeolocation();
      const geoInfo = await reverseGeocodeCoords(coords.lat, coords.lon);

      const dynamicCity = buildDynamicCity(
        coords.lat,
        coords.lon,
        geoInfo.name,
        geoInfo.country,
        geoInfo.region,
        undefined,
        true // isCurrentLocation
      );

      if (onAddNewDynamicCity) {
        onAddNewDynamicCity(dynamicCity);
      }
      onSelectCity(dynamicCity);
      setIsCitySearchOpen(false);
    } catch (err: any) {
      setGpsError(
        err?.message || 'Could not acquire GPS position. Please check location permissions in your browser.'
      );
    } finally {
      setIsLocatingGPS(false);
    }
  };

  // Handle Add Custom Dynamic City
  const handleCreateCustomCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newCity = buildDynamicCity(
      customLat,
      customLon,
      customName.trim(),
      customCountry.trim() || 'Custom Dynamic Region',
      'User Sensor Node',
      {
        pm25: customPM25,
        temperature: customTemp,
        windSpeed: customWind,
      },
      false
    );

    if (onAddNewDynamicCity) {
      onAddNewDynamicCity(newCity);
    }
    onSelectCity(newCity);
    setIsCitySearchOpen(false);
    setCustomName('');
    setCustomCountry('');
  };

  // Handle Trigger Sensor Perturbation / Spike
  const handleTriggerSpike = () => {
    const spikedPM = Math.round(selectedCity.baselineFeatures.pm25 * 1.5);
    const spikedFeatures = {
      ...selectedCity.baselineFeatures,
      pm25: spikedPM,
      pm10: Math.round(selectedCity.baselineFeatures.pm10 * 1.4),
      trafficIndex: Math.min(100, selectedCity.baselineFeatures.trafficIndex + 25),
    };

    const updated = {
      ...selectedCity,
      baselineFeatures: spikedFeatures,
      currentAQI: Math.min(500, Math.round(selectedCity.currentAQI * 1.45)),
      weatherDescription: `⚡ Sensor Perturbation Active • Localized Plume Detected • ${new Date().toLocaleTimeString()}`,
    };
    onSelectCity(updated);
  };

  // Save reading to history
  const handleSave = () => {
    onSaveToHistory({
      cityName: selectedCity.name,
      aqi: selectedCity.currentAQI,
      category: selectedCity.category,
      primaryPollutant: selectedCity.primaryPollutant,
      features: selectedCity.baselineFeatures,
      userNotes: saveNotes.trim() || `Live reading logged for ${selectedCity.name}`,
      tag: saveTag,
    });
    setShowSaveSuccess(true);
    setSaveNotes('');
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* City Selector Header & Live Pulse */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry Feed
            </span>

            {selectedCity.isCurrentLocation ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Navigation className="w-3 h-3 text-blue-400" />
                📍 Real-Time GPS User Location
              </span>
            ) : selectedCity.isCustomAdded ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Custom Dynamic Location
              </span>
            ) : null}

            <span className="text-xs text-slate-400 font-mono">
              Lat: {selectedCity.lat.toFixed(2)}°, Lon: {selectedCity.lon.toFixed(2)}°
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 mt-1.5">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <MapPin className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>{selectedCity.name}</span>
              <span className="text-slate-400 font-medium text-xl">, {selectedCity.country}</span>
            </h1>

            {/* City Switcher Trigger */}
            <button
              onClick={() => {
                setModalTab('browse');
                setIsCitySearchOpen(true);
              }}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 cursor-pointer"
            >
              Change City / Search
            </button>

            {/* 1-Click GPS Button */}
            <button
              onClick={handleGetGPSLocation}
              disabled={isLocatingGPS}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4 cursor-pointer disabled:opacity-50"
              title="Acquire your current real-time GPS coordinates"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocatingGPS ? 'animate-spin' : ''}`} />
              <span>{isLocatingGPS ? 'Locating GPS...' : 'Use My Current Location'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">{selectedCity.weatherDescription}</p>
        </div>

        {/* Action Controls & Live Stream Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Stream Toggle */}
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              isLiveStreaming
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="Toggle live telemetry background streaming simulation"
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveStreaming ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <span>{isLiveStreaming ? `Streaming (${streamUpdatesCount})` : 'Live Stream Off'}</span>
          </button>

          {/* Refresh Sensor Button */}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Fetch live sensor telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
          </button>

          {/* Simulate Sensor Perturbation */}
          <button
            onClick={handleTriggerSpike}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
            title="Simulate a sudden emissions burst or rush hour plume"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Plume Spike</span>
          </button>

          {/* Simulate in Predictor */}
          <button
            onClick={() => onLoadIntoPredictor(selectedCity.baselineFeatures, selectedCity.name)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer shadow-md shadow-purple-600/20"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Simulate in Predictor</span>
          </button>
        </div>
      </div>

      {/* Threshold Alert Banner if triggered */}
      {isAlertTriggered && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-600/40 flex items-start gap-3 text-xs text-rose-200 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-rose-300 text-sm">
              AQI Alert Triggered: {selectedCity.name} AQI {selectedCity.currentAQI} exceeds your configured threshold of {alertThreshold}!
            </span>
            <p className="text-rose-300/80 leading-relaxed">
              Air quality in {selectedCity.name} is currently rated <strong className="text-rose-200">{selectedCity.category}</strong>. Sensitive individuals, asthmatics, and children should avoid prolonged outdoor exposure. N95 respiratory protection recommended outdoors.
            </p>
          </div>
        </div>
      )}

      {/* Live AQI Hero Card & 24h Diurnal Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hero AQI Score (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div
            style={{ backgroundColor: aqiColors.hex }}
            className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl opacity-15 pointer-events-none"
          />

          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Current Real-Time AQI
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Primary: {selectedCity.primaryPollutant}
            </span>
          </div>

          <div className="flex items-center gap-6 my-auto">
            <div
              style={{ borderColor: aqiColors.hex }}
              className="w-28 h-28 rounded-2xl border-4 flex flex-col items-center justify-center bg-slate-950/70 shadow-inner"
            >
              <span className="text-4xl font-black font-mono tracking-tight text-white">
                {selectedCity.currentAQI}
              </span>
              <span className="text-[10px] font-mono uppercase text-slate-400">AQI Index</span>
            </div>

            <div className="space-y-1.5">
              <span className={`inline-block px-3 py-1 rounded-full text-xs ${aqiColors.badge}`}>
                {selectedCity.category}
              </span>
              <div className="text-xs text-slate-300 font-medium">
                Dominant impact from <strong className="text-white">{selectedCity.primaryPollutant}</strong>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                PM2.5: <span className="text-emerald-400 font-bold">{selectedCity.baselineFeatures.pm25} µg/m³</span> • PM10: {selectedCity.baselineFeatures.pm10} µg/m³
              </div>
            </div>
          </div>

          {/* Save to Personal History Quick Bar */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
                Save Reading to Personal History
              </span>
              <div className="flex items-center gap-1">
                {(['Home', 'Work', 'Commute', 'Exercise', 'General'] as const).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSaveTag(tag)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                      saveTag === tag
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={saveNotes}
                onChange={(e) => setSaveNotes(e.target.value)}
                placeholder={`Notes e.g. "Morning commute" or "Gym run"`}
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleSave}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                {showSaveSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                <span>{showSaveSuccess ? 'Saved!' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 24-Hour Diurnal Curve (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                24-Hour Diurnal Progression & Boundary Layer Dynamics
              </h3>
              <p className="text-xs text-slate-400">
                Hourly fluctuation modeling thermal inversion spikes at dawn and photochemical oxidation at midday.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              Diurnal Cycle
            </span>
          </div>

          {/* Bar / Column Chart Representation */}
          <div className="grid grid-cols-8 gap-2 items-end h-40 pt-4 px-2">
            {selectedCity.hourlyDiurnal.map((item, idx) => {
              const maxAQI = Math.max(...selectedCity.hourlyDiurnal.map((d) => d.aqi), 220);
              const heightPct = Math.min(100, Math.max(15, Math.round((item.aqi / maxAQI) * 100)));
              const colorInfo = getAQIColor(
                item.aqi <= 50
                  ? 'Good'
                  : item.aqi <= 100
                  ? 'Moderate'
                  : item.aqi <= 150
                  ? 'Unhealthy for Sensitive Groups'
                  : item.aqi <= 200
                  ? 'Unhealthy'
                  : item.aqi <= 300
                  ? 'Very Unhealthy'
                  : 'Hazardous'
              );

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-mono font-bold text-slate-300 opacity-80 group-hover:opacity-100">
                    {item.aqi}
                  </span>
                  <div className="w-full bg-slate-800/80 rounded-t-md h-full flex items-end overflow-hidden p-0.5">
                    <div
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: colorInfo.hex,
                      }}
                      className="w-full rounded-t transition-all duration-500 group-hover:brightness-125"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{item.hour}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-2 border-t border-slate-800/80">
            <span>Morning Rush Hour (06:00 - 09:00): Nocturnal Inversion Peak</span>
            <span>Afternoon (12:00 - 15:00): Solar Mixing & Dispersion</span>
          </div>
        </div>
      </div>

      {/* 🔬 DYNAMIC ATMOSPHERIC PHYSICS & SENSORS DETAILS (User Request: Dynamic Details) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400" />
              Dynamic Atmospheric Physics & Micro-Meteorological Parameters
            </h3>
            <p className="text-xs text-slate-400">
              Live thermodynamic barometrics, solar flux, dew point depression, and aerodynamic density affecting pollutant dispersion.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 px-2.5 py-1 rounded-lg">
            Real-Time Ingestion
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Pressure */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-cyan-400" />
              Barometer
            </span>
            <div className="text-base font-black font-mono text-slate-100">
              {dynamicAtm.pressureHpa} <span className="text-xs font-normal text-slate-400">hPa</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {dynamicAtm.pressureHpa > 1013 ? 'High Pressure Cell' : 'Thermal Low'}
            </div>
          </div>

          {/* Solar UV Index */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-400" />
              Solar UV Index
            </span>
            <div className="text-base font-black font-mono text-amber-300">
              {dynamicAtm.uvIndex} <span className="text-xs font-normal text-slate-400">/ 11</span>
            </div>
            <div className="text-[10px] text-amber-400/80 font-mono">
              {dynamicAtm.uvIndex >= 8 ? 'Very High UV Risk' : dynamicAtm.uvIndex >= 6 ? 'High UV Flux' : 'Moderate UV'}
            </div>
          </div>

          {/* Visibility */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Eye className="w-3 h-3 text-emerald-400" />
              Optical Visibility
            </span>
            <div className="text-base font-black font-mono text-slate-100">
              {dynamicAtm.visibilityKm} <span className="text-xs font-normal text-slate-400">km</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {dynamicAtm.visibilityKm < 5 ? 'Aerosol Haze Obscuration' : 'Clear Line of Sight'}
            </div>
          </div>

          {/* Dew Point */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blue-400" />
              Dew Point
            </span>
            <div className="text-base font-black font-mono text-slate-100">
              {dynamicAtm.dewPoint}° <span className="text-xs font-normal text-slate-400">C</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Condensation threshold
            </div>
          </div>

          {/* Wind Vector Bearing */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Compass className="w-3 h-3 text-purple-400" />
              Wind Bearing
            </span>
            <div className="text-base font-black font-mono text-slate-100 flex items-center gap-1.5">
              <span>{dynamicAtm.windBearing}</span>
              <span className="text-xs font-normal text-slate-400 font-mono">({selectedCity.baselineFeatures.windSpeed} km/h)</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Horizontal advection
            </div>
          </div>

          {/* Air Density */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Waves className="w-3 h-3 text-indigo-400" />
              Air Density
            </span>
            <div className="text-base font-black font-mono text-slate-100">
              {dynamicAtm.airDensity} <span className="text-xs font-normal text-slate-400">kg/m³</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Solar: {dynamicAtm.solarRadiation} W/m²
            </div>
          </div>
        </div>
      </div>

      {/* 6 Ambient Sensors Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-amber-400" />
            Ambient Temp
          </span>
          <div className="text-lg font-bold font-mono text-slate-100">
            {selectedCity.baselineFeatures.temperature}°C
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Droplets className="w-3 h-3 text-blue-400" />
            Humidity
          </span>
          <div className="text-lg font-bold font-mono text-slate-100">
            {selectedCity.baselineFeatures.humidity}%
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Wind className="w-3 h-3 text-emerald-400" />
            Wind Velocity
          </span>
          <div className="text-lg font-bold font-mono text-slate-100">
            {selectedCity.baselineFeatures.windSpeed} km/h
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Car className="w-3 h-3 text-purple-400" />
            Traffic Flow
          </span>
          <div className="text-lg font-bold font-mono text-slate-100">
            {selectedCity.baselineFeatures.trafficIndex}/100
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            NO₂ (Nitrogen)
          </span>
          <div className="text-lg font-bold font-mono text-slate-100">
            {selectedCity.baselineFeatures.no2} µg/m³
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            CO (Carbon Monoxide)
          </span>
          <div className="text-lg font-bold font-mono text-slate-100">
            {selectedCity.baselineFeatures.co} mg/m³
          </div>
        </div>
      </div>

      {/* 🤖 Predict Future AQI Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Machine Learning Future AQI Projections
            </h3>
            <p className="text-xs text-slate-400">
              Multi-horizon forecast models combining temporal regression, atmospheric advection, and diurnal trends.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {forecasts.map((f) => (
              <button
                key={f.timeHorizon}
                onClick={() => setForecastHorizon(f.timeHorizon)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  forecastHorizon === f.timeHorizon
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.timeHorizon}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Horizon Card */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div
                style={{ borderColor: getAQIColor(activeForecast.category).hex }}
                className="w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center bg-slate-900 shadow-md shrink-0"
              >
                <span className="text-2xl font-black font-mono text-white">
                  {activeForecast.predictedAQI}
                </span>
                <span className="text-[9px] font-mono uppercase text-slate-400">AQI</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{activeForecast.label}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${getAQIColor(activeForecast.category).badge}`}>
                    {activeForecast.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{activeForecast.atmosphericRationale}</p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-mono text-purple-400 font-semibold block">
                Model Confidence: {activeForecast.confidence}%
              </span>
              <button
                onClick={() => onLoadIntoPredictor(activeForecast.expectedFeatures, `${selectedCity.name} (${activeForecast.timeHorizon})`)}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 underline underline-offset-4 mt-1 cursor-pointer"
              >
                Load Horizon into ML Predictor →
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-850">
            <span>Projected PM2.5: <strong className="text-slate-200">{activeForecast.expectedFeatures.pm25} µg/m³</strong></span>
            <span>Projected Wind: <strong className="text-slate-200">{activeForecast.expectedFeatures.windSpeed} km/h</strong></span>
            <span>Dominant: <strong className="text-slate-200">{activeForecast.primaryPollutant}</strong></span>
          </div>
        </div>
      </div>

      {/* 🗺️ Nearby Stations Array */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              Nearby Micro-Telemetry Stations in {selectedCity.name}
            </h3>
            <p className="text-xs text-slate-400">
              Observational nodes distributed across highway corridors, industrial clusters, and residential pockets.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {selectedCity.nearbyStations.length} Active Nodes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {selectedCity.nearbyStations.map((station) => {
            const stationColor = getAQIColor(station.category);

            return (
              <div
                key={station.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {station.distanceKm} km {station.direction} • {station.type}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {station.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-200 mt-1">{station.name}</h4>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ color: stationColor.hex }}
                      className="text-lg font-mono font-black"
                    >
                      {station.currentAQI}
                    </span>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      <div className="font-semibold text-slate-300">{station.category}</div>
                      <div>PM2.5: {station.pm25} µg/m³</div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onLoadIntoPredictor(
                        {
                          ...selectedCity.baselineFeatures,
                          pm25: station.pm25,
                          pm10: station.pm10,
                          no2: station.no2,
                        },
                        station.name
                      )
                    }
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Simulate station values in predictor"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic City Switcher & Add Location Modal */}
      {isCitySearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Location Selector & Dynamic Ingestion
                </h3>
              </div>
              <button
                onClick={() => setIsCitySearchOpen(false)}
                className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setModalTab('browse')}
                className={`flex-1 py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === 'browse' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Global Cities ({availableCities.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('gps')}
                className={`flex-1 py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === 'gps' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>My GPS Location</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('custom')}
                className={`flex-1 py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === 'custom' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Custom Location</span>
              </button>
            </div>

            {/* TAB 1: BROWSE CITIES */}
            {modalTab === 'browse' && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={citySearchQuery}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  placeholder="Search by city name or country (e.g. Delhi, London, Tokyo)..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {filteredCities.map((city) => {
                    const colors = getAQIColor(city.category);
                    const isSelected = city.id === selectedCity.id;

                    return (
                      <button
                        key={city.id}
                        onClick={() => {
                          onSelectCity(city);
                          setIsCitySearchOpen(false);
                        }}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-950/20'
                            : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                            {city.isCurrentLocation && <Navigation className="w-3 h-3 text-blue-400" />}
                            <span>{city.name}</span>
                            <span className="text-[11px] text-slate-400 font-normal">({city.country})</span>
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {city.weatherDescription}
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            style={{ color: colors.hex }}
                            className="text-sm font-black font-mono"
                          >
                            AQI {city.currentAQI}
                          </span>
                          <span className="block text-[10px] text-slate-400">{city.category}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: GPS USER LOCATION */}
            {modalTab === 'gps' && (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 space-y-2 text-xs">
                  <div className="font-bold text-blue-300 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-blue-400" />
                    <span>Real-Time Browser Geolocation Sensor</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Uses the HTML5 Geolocation API to determine your current latitude and longitude, perform reverse-geocoding, and dynamically instantiate a localized micro-telemetry network with live diurnal atmospheric modeling.
                  </p>
                </div>

                {gpsError && (
                  <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/20 text-xs text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{gpsError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGetGPSLocation}
                  disabled={isLocatingGPS}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
                >
                  <Navigation className={`w-4 h-4 ${isLocatingGPS ? 'animate-spin' : ''}`} />
                  <span>{isLocatingGPS ? 'Acquiring GPS Satellite Fix...' : 'Acquire Current Position & Build Telemetry'}</span>
                </button>
              </div>
            )}

            {/* TAB 3: CUSTOM DYNAMIC LOCATION */}
            {modalTab === 'custom' && (
              <form onSubmit={handleCreateCustomCity} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Location / City Name</label>
                    <input
                      type="text"
                      required
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Hyderabad, Austin, Zurich"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Country / Region</label>
                    <input
                      type="text"
                      value={customCountry}
                      onChange={(e) => setCustomCountry(e.target.value)}
                      placeholder="e.g. India, USA, Switzerland"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Latitude (°)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={customLat}
                      onChange={(e) => setCustomLat(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Longitude (°)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={customLon}
                      onChange={(e) => setCustomLon(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">PM2.5 (µg/m³)</label>
                    <input
                      type="number"
                      value={customPM25}
                      onChange={(e) => setCustomPM25(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">Temp (°C)</label>
                    <input
                      type="number"
                      value={customTemp}
                      onChange={(e) => setCustomTemp(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">Wind (km/h)</label>
                    <input
                      type="number"
                      value={customWind}
                      onChange={(e) => setCustomWind(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Instantiate Dynamic Station & Forecast</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
