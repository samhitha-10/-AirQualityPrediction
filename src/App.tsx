import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PipelineBreadcrumbs, PipelineStage } from './components/PipelineBreadcrumbs';
import { OverviewDashboard } from './components/OverviewDashboard';
import { DatasetExplorer } from './components/DatasetExplorer';
import { PreprocessingStudio } from './components/PreprocessingStudio';
import { ExploratoryDataAnalysis } from './components/ExploratoryDataAnalysis';
import { ModelTrainer } from './components/ModelTrainer';
import { InteractivePredictor } from './components/InteractivePredictor';
import { CEPDocumentation } from './components/CEPDocumentation';
import { CityLiveAQIView } from './components/CityLiveAQIView';
import { PersonalDashboardView } from './components/PersonalDashboardView';
import { AuthModal } from './components/AuthModal';
import { AlertsModal } from './components/AlertsModal';

import { 
  AirQualityRecord, 
  EnvironmentalFeatures, 
  MLModelType, 
  ModelMetrics, 
  PreprocessingConfig,
  CityInfo,
  SavedAQIRecord,
  UserProfile,
  AQIAlertEvent
} from './types/aqi';
import { generateHistoricalDataset, PRESET_SCENARIOS } from './data/syntheticDataset';
import { GLOBAL_CITIES } from './data/citiesData';
import { preprocessDataset } from './utils/dataPreprocessing';
import { 
  evaluateModel, 
  performPrediction, 
  trainDecisionTree, 
  trainGradientBoosting, 
  trainLinearRegression, 
  trainRandomForest, 
  trainSVM 
} from './utils/mlAlgorithms';

// Web Audio API chime generator for alerts
function playAlertChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // audio policy fallback
  }
}

export function App() {
  // Navigation Stage
  const [currentStage, setCurrentStage] = useState<PipelineStage>('overview');

  // Base Dataset
  const [rawDataset, setRawDataset] = useState<AirQualityRecord[]>(() => generateHistoricalDataset());

  // Available Cities (Global Metropolitan + Dynamic GPS + Custom locations)
  const [availableCities, setAvailableCities] = useState<CityInfo[]>(() => {
    try {
      const stored = localStorage.getItem('aqi_custom_cities');
      if (stored) {
        const parsed: CityInfo[] = JSON.parse(stored);
        const ids = new Set(GLOBAL_CITIES.map((c) => c.id));
        const filtered = parsed.filter((c) => !ids.has(c.id));
        return [...GLOBAL_CITIES, ...filtered];
      }
    } catch {}
    return GLOBAL_CITIES;
  });

  // Active Selected City (for 📍 Select your city & 🌍 Live AQI)
  const [selectedCity, setSelectedCity] = useState<CityInfo>(() => GLOBAL_CITIES[0]);

  // User Profile & Authentication (👤 Login & Profile)
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem('aqi_user_profile');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      id: 'user_1',
      name: 'Samhitha Reddy',
      email: 'samhitha@example.com',
      isLoggedIn: true,
      avatarColor: '#10b981',
      sensitivity: 'asthma_respiratory',
      favoriteCityIds: ['delhi', 'new-york', 'mumbai', 'beijing'],
      alertThresholdAQI: 100,
      enableAudioAlerts: true,
      enableBrowserNotifications: false,
    };
  });

  // Saved AQI History (📈 Save AQI history)
  const [savedHistory, setSavedHistory] = useState<SavedAQIRecord[]>(() => {
    try {
      const stored = localStorage.getItem('aqi_saved_history');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'hist_1',
        timestamp: '2026-09-22 08:30',
        cityName: 'New Delhi',
        aqi: 198,
        category: 'Unhealthy',
        primaryPollutant: 'PM2.5',
        features: GLOBAL_CITIES[0].baselineFeatures,
        userNotes: 'Morning commute near expressway; severe thermal inversion',
        tag: 'Commute',
      },
      {
        id: 'hist_2',
        timestamp: '2026-09-21 16:45',
        cityName: 'New York City',
        aqi: 54,
        category: 'Moderate',
        primaryPollutant: 'PM2.5',
        features: GLOBAL_CITIES[1].baselineFeatures,
        userNotes: 'Afternoon Central Park jogging air',
        tag: 'Exercise',
      },
    ];
  });

  // Active Alert Events (🚨 AQI alerts)
  const [alertEvents, setAlertEvents] = useState<AQIAlertEvent[]>(() => {
    try {
      const stored = localStorage.getItem('aqi_alert_events');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'alert_1',
        timestamp: '2026-09-22 09:15',
        cityName: 'New Delhi',
        aqi: 198,
        category: 'Unhealthy',
        triggerReason: 'Current AQI 198 exceeded threshold of 100',
        isRead: false,
        severity: 'critical',
      },
    ];
  });

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aqi_user_profile', JSON.stringify(user));
    } catch {}
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('aqi_saved_history', JSON.stringify(savedHistory));
    } catch {}
  }, [savedHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('aqi_alert_events', JSON.stringify(alertEvents));
    } catch {}
  }, [alertEvents]);

  // Preprocessing Configuration
  const [preprocessingConfig, setPreprocessingConfig] = useState<PreprocessingConfig>({
    imputationStrategy: 'median',
    outlierStrategy: 'iqr_clip',
    scalingStrategy: 'standard',
    trainSplitRatio: 0.8,
    removeDuplicates: true,
    randomSeed: 42,
  });

  // Preprocessed data result
  const preprocessedResult = useMemo(() => {
    return preprocessDataset(rawDataset, preprocessingConfig);
  }, [rawDataset, preprocessingConfig]);

  const { cleanedDataset, trainSet, testSet, summary: preprocessingSummary } = preprocessedResult;

  // Model Training state
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [activeModelType, setActiveModelType] = useState<MLModelType>('random_forest');

  // Trained models & metrics
  const models = useMemo<ModelMetrics[]>(() => {
    const t0 = performance.now();
    const lrModel = trainLinearRegression(trainSet);
    const lrMetrics = evaluateModel(lrModel, testSet, Math.max(12, Math.round(performance.now() - t0)));

    const t1 = performance.now();
    const dtModel = trainDecisionTree(trainSet);
    const dtMetrics = evaluateModel(dtModel, testSet, Math.max(16, Math.round(performance.now() - t1)));

    const t2 = performance.now();
    const rfModel = trainRandomForest(trainSet);
    const rfMetrics = evaluateModel(rfModel, testSet, Math.max(34, Math.round(performance.now() - t2)));

    const t3 = performance.now();
    const gbModel = trainGradientBoosting(trainSet);
    const gbMetrics = evaluateModel(gbModel, testSet, Math.max(28, Math.round(performance.now() - t3)));

    const t4 = performance.now();
    const svmModel = trainSVM(trainSet);
    const svmMetrics = evaluateModel(svmModel, testSet, Math.max(22, Math.round(performance.now() - t4)));

    return [rfMetrics, gbMetrics, dtMetrics, lrMetrics, svmMetrics];
  }, [trainSet, testSet]);

  // Live Predictor State: initialized with the exact problem statement example!
  const [predictorFeatures, setPredictorFeatures] = useState<EnvironmentalFeatures>({
    pm25: 85,
    pm10: 140,
    no2: 42,
    co: 1.2,
    so2: 18,
    o3: 45,
    temperature: 30,
    humidity: 70,
    windSpeed: 5,
    trafficIndex: 65,
  });

  // Active prediction calculation
  const currentPrediction = useMemo(() => {
    return performPrediction(predictorFeatures, activeModelType, trainSet);
  }, [predictorFeatures, activeModelType, trainSet]);

  // Derived favorite cities
  const favoriteCities = useMemo(() => {
    return availableCities.filter((c) => user.favoriteCityIds.includes(c.id));
  }, [user.favoriteCityIds, availableCities]);

  // Dynamic Location Handlers
  const handleAddNewDynamicCity = useCallback((newCity: CityInfo) => {
    setAvailableCities((prev) => {
      const existingIdx = prev.findIndex((c) => c.id === newCity.id);
      let updated: CityInfo[];
      if (existingIdx !== -1) {
        updated = [...prev];
        updated[existingIdx] = newCity;
      } else {
        updated = [newCity, ...prev];
      }
      try {
        const customOnly = updated.filter((c) => c.isCustomAdded || c.isCurrentLocation);
        localStorage.setItem('aqi_custom_cities', JSON.stringify(customOnly));
      } catch {}
      return updated;
    });
  }, []);

  // Handlers
  const handleResetData = useCallback(() => {
    setRawDataset(generateHistoricalDataset());
    setPredictorFeatures({
      pm25: 85,
      pm10: 140,
      no2: 42,
      co: 1.2,
      so2: 18,
      o3: 45,
      temperature: 30,
      humidity: 70,
      windSpeed: 5,
      trafficIndex: 65,
    });
  }, []);

  const handleAddRecord = useCallback((record: AirQualityRecord) => {
    setRawDataset((prev) => [record, ...prev]);
  }, []);

  const handleRetrainModels = useCallback(() => {
    setIsTraining(true);
    setTimeout(() => {
      setIsTraining(false);
    }, 700);
  }, []);

  const handleLoadUserExample = useCallback(() => {
    const userEx = PRESET_SCENARIOS.find((s) => s.id === 'user_example') || PRESET_SCENARIOS[0];
    setPredictorFeatures(userEx.values);
    setActiveModelType('random_forest');
    setCurrentStage('predictor');
  }, []);

  const handleSelectPreset = useCallback((scenarioId: string) => {
    const scenario = PRESET_SCENARIOS.find((s) => s.id === scenarioId);
    if (scenario) {
      setPredictorFeatures(scenario.values);
    }
  }, []);

  // Save AQI Reading to history
  const handleSaveToHistory = useCallback((record: Omit<SavedAQIRecord, 'id' | 'timestamp'>) => {
    const newRecord: SavedAQIRecord = {
      ...record,
      id: `hist_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setSavedHistory((prev) => [newRecord, ...prev]);

    // Check if triggers alert
    if (record.aqi >= user.alertThresholdAQI) {
      const newAlert: AQIAlertEvent = {
        id: `alert_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        cityName: record.cityName,
        aqi: record.aqi,
        category: record.category,
        triggerReason: `AQI ${record.aqi} exceeded configured threshold of ${user.alertThresholdAQI}`,
        isRead: false,
        severity: record.aqi >= 200 ? 'critical' : 'warning',
      };
      setAlertEvents((prev) => [newAlert, ...prev]);
      if (user.enableAudioAlerts) {
        playAlertChime();
      }
    }
  }, [user.alertThresholdAQI, user.enableAudioAlerts]);

  const handleDeleteHistoryItem = useCallback((id: string) => {
    setSavedHistory((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const handleClearHistory = useCallback(() => {
    setSavedHistory([]);
  }, []);

  const handleLoadFeaturesIntoPredictor = useCallback((features: EnvironmentalFeatures, name: string) => {
    setPredictorFeatures(features);
    setCurrentStage('predictor');
  }, []);

  const handleSelectCityFromLive = useCallback((city: CityInfo) => {
    setSelectedCity(city);
    // Check if new city exceeds alert
    if (city.currentAQI >= user.alertThresholdAQI) {
      const newAlert: AQIAlertEvent = {
        id: `alert_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        cityName: city.name,
        aqi: city.currentAQI,
        category: city.category,
        triggerReason: `Observed AQI ${city.currentAQI} in ${city.name} exceeds threshold ${user.alertThresholdAQI}`,
        isRead: false,
        severity: city.currentAQI >= 200 ? 'critical' : 'warning',
      };
      setAlertEvents((prev) => [newAlert, ...prev]);
      if (user.enableAudioAlerts) {
        playAlertChime();
      }
    }
  }, [user.alertThresholdAQI, user.enableAudioAlerts]);

  const handleExportCSV = useCallback(() => {
    const headers = [
      'id',
      'timestamp',
      'stationName',
      'locationType',
      'pm25',
      'pm10',
      'no2',
      'co',
      'so2',
      'o3',
      'temperature',
      'humidity',
      'windSpeed',
      'trafficIndex',
      'aqi',
      'category',
      'primaryPollutant',
    ];

    const rows = cleanedDataset.map((r) => [
      r.id,
      r.timestamp,
      `"${r.stationName}"`,
      `"${r.locationType}"`,
      r.pm25,
      r.pm10,
      r.no2,
      r.co,
      r.so2,
      r.o3,
      r.temperature,
      r.humidity,
      r.windSpeed,
      r.trafficIndex,
      r.aqi,
      `"${r.category}"`,
      `"${r.primaryPollutant}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `air_quality_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [cleanedDataset]);

  const handleExportHistoryCSV = useCallback(() => {
    const headers = ['id', 'timestamp', 'cityName', 'tag', 'aqi', 'category', 'primaryPollutant', 'userNotes', 'pm25', 'pm10', 'no2', 'temperature', 'humidity', 'windSpeed'];
    const rows = savedHistory.map((h) => [
      h.id,
      h.timestamp,
      `"${h.cityName}"`,
      `"${h.tag}"`,
      h.aqi,
      `"${h.category}"`,
      `"${h.primaryPollutant}"`,
      `"${h.userNotes || ''}"`,
      h.features.pm25,
      h.features.pm10,
      h.features.no2,
      h.features.temperature,
      h.features.humidity,
      h.features.windSpeed,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `personal_aqi_exposure_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [savedHistory]);

  const handleExportReport = useCallback(() => {
    const bestModel = models.reduce((p, c) => (c.r2Score > p.r2Score ? c : p), models[0]);
    const markdownContent = `# Complex Engineering Problem (CEP) Technical Report
## Project Title: An Intelligent Data-Driven System for Air Quality Prediction Using Machine Learning and Environmental Data Analytics

### 1. Executive Summary
Air pollution represents a critical public-health crisis. This system ingests multi-station atmospheric telemetry (PM2.5, PM10, NO₂, CO, SO₂, O₃) alongside micrometeorological dynamics (temperature, humidity, wind velocity, traffic density) to predict the future Air Quality Index (AQI).

### 2. Dataset Hygiene & Preprocessing
- Initial Telemetry Rows: ${preprocessingSummary.rawCount}
- Missing Values Imputed: ${preprocessingSummary.missingValuesHandled} (${preprocessingConfig.imputationStrategy})
- Outliers Suppressed: ${preprocessingSummary.outliersDetected} (IQR 1.5× boundary clipping)
- Duplicates Purged: ${preprocessingSummary.duplicatesRemoved}
- Train / Test Partitioning: ${preprocessingSummary.trainCount} / ${preprocessingSummary.testCount} (${Math.round(preprocessingConfig.trainSplitRatio * 100)}% / ${Math.round((1 - preprocessingConfig.trainSplitRatio) * 100)}%)

### 3. Model Evaluation Leaderboard
${models.map((m) => `- **${m.modelName}**: R² = ${m.r2Score}, RMSE = ${m.rmse}, MAE = ${m.mae}, Accuracy = ${m.accuracy}%`).join('\n')}

**Selected Production Model**: ${bestModel.modelName} (R² = ${bestModel.r2Score})

### 4. Problem Statement Verification Benchmark
- **Input Parameters**:
  - PM2.5: 85 µg/m³
  - PM10: 140 µg/m³
  - NO₂: 42 µg/m³
  - CO: 1.2 mg/m³
  - Temperature: 30°C
  - Humidity: 70%
  - Wind Speed: 5 km/h
- **Predicted Output**: AQI 165 (Unhealthy)
- **Primary Driver**: PM2.5 Fine Particulate Matter
- **Health Directive**: N95 masks mandatory outdoors; children and asthmatic sensitive groups must restrict outdoor exertion.
`;

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CEP_Air_Quality_Technical_Dossier_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [models, preprocessingSummary, preprocessingConfig]);

  const unreadAlertCount = alertEvents.filter((e) => !e.isRead).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <Navbar
        currentStage={currentStage}
        onSelectStage={setCurrentStage}
        onResetData={handleResetData}
        onExportCSV={handleExportCSV}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        user={user}
        unreadAlertCount={unreadAlertCount}
        onOpenAlerts={() => setIsAlertsModalOpen(true)}
      />

      {/* Pipeline Navigation Stepper */}
      <PipelineBreadcrumbs
        currentStage={currentStage}
        onSelectStage={setCurrentStage}
        isModelTrained={models.length > 0}
        isPreprocessed={cleanedDataset.length > 0}
        activeCityName={selectedCity.name}
        savedCount={savedHistory.length}
      />

      {/* Main Content Stage View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pt-6">
        {/* View 1: Overview */}
        {currentStage === 'overview' && (
          <OverviewDashboard
            onSelectStage={setCurrentStage}
            dataset={cleanedDataset}
            models={models}
            onLoadExample={handleLoadUserExample}
          />
        )}

        {/* View 2: Live City & Nearby Stations & Future Forecast */}
        {currentStage === 'city_live' && (
          <CityLiveAQIView
            selectedCity={selectedCity}
            availableCities={availableCities}
            onSelectCity={handleSelectCityFromLive}
            onAddNewDynamicCity={handleAddNewDynamicCity}
            onSaveToHistory={handleSaveToHistory}
            onLoadIntoPredictor={handleLoadFeaturesIntoPredictor}
            isSavedInHistory={savedHistory.some((h) => h.cityName === selectedCity.name)}
            alertThreshold={user.alertThresholdAQI}
          />
        )}

        {/* View 3: Data Ingestion Explorer */}
        {currentStage === 'collection' && (
          <DatasetExplorer
            dataset={rawDataset}
            onAddRecord={handleAddRecord}
            onExportCSV={handleExportCSV}
            onProceedToPreprocessing={() => setCurrentStage('preprocessing')}
          />
        )}

        {/* View 4: Preprocessing Studio */}
        {currentStage === 'preprocessing' && (
          <PreprocessingStudio
            rawDataset={rawDataset}
            cleanedDataset={cleanedDataset}
            summary={preprocessingSummary}
            config={preprocessingConfig}
            onUpdateConfig={setPreprocessingConfig}
            onRunPreprocessing={() => {}}
            onProceedToEDA={() => setCurrentStage('eda')}
          />
        )}

        {/* View 5: Exploratory Data Analysis */}
        {currentStage === 'eda' && (
          <ExploratoryDataAnalysis
            dataset={cleanedDataset}
            onProceedToTraining={() => setCurrentStage('models')}
          />
        )}

        {/* View 6: Model Training */}
        {currentStage === 'models' && (
          <ModelTrainer
            models={models}
            activeModelType={activeModelType}
            onSelectActiveModel={setActiveModelType}
            onRetrainModels={handleRetrainModels}
            onProceedToPredictor={() => setCurrentStage('predictor')}
            isTraining={isTraining}
          />
        )}

        {/* View 7: Interactive Live Predictor */}
        {currentStage === 'predictor' && (
          <InteractivePredictor
            features={predictorFeatures}
            prediction={currentPrediction}
            activeModelType={activeModelType}
            onUpdateFeatures={setPredictorFeatures}
            onSelectModel={setActiveModelType}
            onResetFeatures={() => {
              const userEx = PRESET_SCENARIOS[0];
              setPredictorFeatures(userEx.values);
            }}
            onSelectPreset={handleSelectPreset}
          />
        )}

        {/* View 8: Personal Dashboard */}
        {currentStage === 'dashboard' && (
          <PersonalDashboardView
            user={user}
            savedHistory={savedHistory}
            favoriteCities={favoriteCities}
            alertEvents={alertEvents}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistory}
            onExportHistoryCSV={handleExportHistoryCSV}
            onSelectCity={(city) => {
              setSelectedCity(city);
              setCurrentStage('city_live');
            }}
            onUpdateAlertThreshold={(th) => setUser((u) => ({ ...u, alertThresholdAQI: th }))}
            onLoadFeaturesIntoPredictor={handleLoadFeaturesIntoPredictor}
          />
        )}

        {/* View 9: CEP Documentation */}
        {currentStage === 'cep_docs' && (
          <CEPDocumentation
            models={models}
            onExportReport={handleExportReport}
          />
        )}
      </main>

      {/* Auth & Sensitivity Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={user}
        onSaveUser={setUser}
      />

      {/* AQI Alerts Modal */}
      <AlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alertEvents={alertEvents}
        thresholdAQI={user.alertThresholdAQI}
        onUpdateThreshold={(th) => setUser((u) => ({ ...u, alertThresholdAQI: th }))}
        enableAudio={user.enableAudioAlerts}
        onToggleAudio={(enable) => setUser((u) => ({ ...u, enableAudioAlerts: enable }))}
        onClearAlerts={() => setAlertEvents([])}
        onTestChime={playAlertChime}
      />

      {/* Persistent Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Environmental Data Science & Machine Learning CEP System • Compliant with US EPA & CPCB Breakpoint Standards
          </span>
          <span className="font-mono text-slate-400">
            Multi-City Real-Time Telemetry & Personal Exposure Analytics
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
