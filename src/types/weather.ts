export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperatureCelsius: number;
  weatherCode: number;
  conditionLabel: string;
  observedAt: string; // Data/hora ISO local retornada pela API.
}

export interface ForecastDay {
  date: string; // YYYY-MM-DD no fuso da cidade.
  minCelsius: number;
  maxCelsius: number;
  weatherCode: number;
  conditionLabel: string;
}

export interface WeatherData {
  city: City;
  current: CurrentWeather;
  forecast: ForecastDay[];
  timeZone: string;
}

export type WeatherErrorKind = 'network' | 'http' | 'timeout' | 'invalid-response';

export interface WeatherError {
  kind: WeatherErrorKind;
  operation: 'search' | 'weather';
  message: string;
}
