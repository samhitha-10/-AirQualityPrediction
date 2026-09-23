export type AQICategory = 
  | 'Good'
  | 'Moderate'
  | 'Unhealthy for Sensitive Groups'
  | 'Unhealthy'
  | 'Very Unhealthy'
  | 'Hazardous';

export interface EnvironmentalFeatures {
  pm25: number;        // µg/m³ (fine particulate matter)
  pm10: number;        // µg/m³ (coarse particulate matter)
  no2: number;         // µg/m³ (nitrogen dioxide from combustion/vehicles)
  co: number;          // mg/m³ (carbon monoxide)
  so2: number;         // µg/m³ (sulfur dioxide from industrial/coal)
  o3: number;          // µg/m³ (ground-level ozone)
  temperature: number; // °C
  humidity: number;    // %
  windSpeed: number;   // km/h
  trafficIndex: number;// 0 - 100 normalized traffic density
}

export interface AirQualityRecord extends EnvironmentalFeatures {
  id: string;
  timestamp: string;
  stationName: string;
  locationType: 'Urban Corridor' | 'Industrial Zone' | 'Residential Suburban' | 'Commercial Downtown' | 'Green Park';
  aqi: number;
  category: AQICategory;
  primaryPollutant: string;
  isMissing?: boolean;
  isOutlier?: boolean;
  isDuplicate?: boolean;
}

export type ImputationStrategy = 'mean' | 'median' | 'knn_forward' | 'drop';
export type OutlierStrategy = 'iqr_clip' | 'zscore_filter' | 'keep';
export type ScalingStrategy = 'standard' | 'minmax' | 'none';

export interface PreprocessingConfig {
  imputationStrategy: ImputationStrategy;
  outlierStrategy: OutlierStrategy;
  scalingStrategy: ScalingStrategy;
  trainSplitRatio: number; // e.g. 0.8 for 80% train, 20% test
  removeDuplicates: boolean;
  randomSeed: number;
}

export interface PreprocessingSummary {
  rawCount: number;
  cleanedCount: number;
  missingValuesHandled: number;
  outliersDetected: number;
  duplicatesRemoved: number;
  trainCount: number;
  testCount: number;
  featureMeans: Record<keyof EnvironmentalFeatures, number>;
  featureStds: Record<keyof EnvironmentalFeatures, number>;
}

export type MLModelType = 
  | 'random_forest'
  | 'linear_regression'
  | 'decision_tree'
  | 'gradient_boost'
  | 'svm';

export interface ModelMetrics {
  modelType: MLModelType;
  modelName: string;
  description: string;
  r2Score: number;
  rmse: number;
  mae: number;
  mape: number;
  accuracy: number; // Category classification accuracy %
  trainingTimeMs: number;
  featureImportance: { feature: keyof EnvironmentalFeatures; label: string; importance: number }[];
  confusionMatrix: {
    categories: AQICategory[];
    matrix: number[][]; // [actual][predicted]
  };
  samplePredictions: {
    actual: number;
    predicted: number;
    category: AQICategory;
  }[];
}

export interface PollutantSubIndex {
  name: string;
  formula: string;
  value: number;
  unit: string;
  subIndex: number;
  category: AQICategory;
  weight: number;
}

export interface PredictionResult {
  predictedAQI: number;
  category: AQICategory;
  primaryPollutant: string;
  subIndices: PollutantSubIndex[];
  meteorologicalInfluence: {
    windDispersionImpact: string;
    humidityStagnationImpact: string;
    temperatureInversionRisk: string;
  };
  healthAdvisory: {
    generalSummary: string;
    sensitiveGroupsGuidance: string;
    outdoorActivityRecommendation: string;
    maskRequired: boolean;
    airPurifierRecommended: boolean;
  };
  modelName: string;
  confidenceScore: number;
}

export interface PresetScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  values: EnvironmentalFeatures;
  expectedAQI: number;
  expectedCategory: AQICategory;
}

export interface NearbyStation {
  id: string;
  name: string;
  distanceKm: number;
  direction: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
  type: 'Urban' | 'Industrial' | 'Traffic' | 'Rural / Background';
  status: 'online' | 'calibrating';
  currentAQI: number;
  category: AQICategory;
  pm25: number;
  pm10: number;
  no2: number;
}

export interface DynamicAtmospherics {
  pressureHpa: number;
  uvIndex: number;
  visibilityKm: number;
  dewPoint: number;
  windBearing: string;
  airDensity: number; // kg/m³
  solarRadiation: number; // W/m²
}

export interface CityInfo {
  id: string;
  name: string;
  country: string;
  region: string;
  lat: number;
  lon: number;
  isCurrentLocation?: boolean;
  isCustomAdded?: boolean;
  dynamicAtmospherics?: DynamicAtmospherics;
  baselineFeatures: EnvironmentalFeatures;
  currentAQI: number;
  category: AQICategory;
  primaryPollutant: string;
  weatherDescription: string;
  nearbyStations: NearbyStation[];
  hourlyDiurnal: {
    hour: string;
    aqi: number;
    pm25: number;
    temperature: number;
  }[];
}

export interface FutureAQIForecast {
  timeHorizon: string; // e.g. "+6h", "+12h", "+24h", "+48h", "+7d"
  label: string;
  predictedAQI: number;
  category: AQICategory;
  primaryPollutant: string;
  confidence: number;
  expectedFeatures: EnvironmentalFeatures;
  atmosphericRationale: string;
}

export interface SavedAQIRecord {
  id: string;
  timestamp: string;
  cityName: string;
  aqi: number;
  category: AQICategory;
  primaryPollutant: string;
  features: EnvironmentalFeatures;
  userNotes?: string;
  tag: 'Home' | 'Work' | 'Travel' | 'Commute' | 'Exercise' | 'General';
}

export type HealthSensitivity = 
  | 'general'
  | 'asthma_respiratory'
  | 'cardiovascular'
  | 'children_pediatric'
  | 'elderly'
  | 'outdoor_athlete';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  isLoggedIn: boolean;
  avatarColor: string;
  sensitivity: HealthSensitivity;
  favoriteCityIds: string[];
  alertThresholdAQI: number; // e.g. 100, 150, 200
  enableAudioAlerts: boolean;
  enableBrowserNotifications: boolean;
  registeredAt?: string;
}

export interface AQIAlertEvent {
  id: string;
  timestamp: string;
  cityName: string;
  aqi: number;
  category: AQICategory;
  triggerReason: string;
  isRead: boolean;
  severity: 'warning' | 'critical' | 'info';
}
