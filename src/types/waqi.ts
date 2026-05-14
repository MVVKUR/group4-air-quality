export type PollutantKey = 'pm25' | 'pm10' | 'o3' | 'no2' | 'so2' | 'co';
export type WeatherKey = 't' | 'h' | 'p' | 'w';
export type IAQIKey = PollutantKey | WeatherKey;

export interface IAQIValue {
  v: number;
}

export type IAQIMap = Partial<Record<IAQIKey, IAQIValue>>;

export interface WaqiCity {
  name: string;
  geo: [number, number];
  url?: string;
}

export interface WaqiTime {
  iso?: string;
  s?: string;
  tz?: string;
}

export interface WaqiAttribution {
  name: string;
  url?: string;
  logo?: string;
}

export interface WaqiForecastPoint {
  avg: number;
  day: string;
  max: number;
  min: number;
}

export interface WaqiForecastDaily {
  pm25?: WaqiForecastPoint[];
  pm10?: WaqiForecastPoint[];
  o3?: WaqiForecastPoint[];
  uvi?: WaqiForecastPoint[];
}

export interface WaqiFeed {
  aqi: number | '-';
  idx: number;
  city: WaqiCity;
  dominentpol?: string;
  iaqi: IAQIMap;
  time: WaqiTime;
  forecast?: { daily?: WaqiForecastDaily };
  attributions?: WaqiAttribution[];
}

export interface NormalizedStation {
  uid: number;
  name: string;
  lat: number;
  lon: number;
  aqi: number | null;
  updatedAt: string;
  isDemo?: boolean;
}
