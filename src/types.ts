import { DateTime } from 'luxon'

export interface WeatherInfo {
  temperature: number
  apparent_temperature: number
  precipitation_probability: number
  cloudcover: number
  windspeed: number
}

export interface WeatherForHour extends WeatherInfo {
  time: DateTime
}

export interface WeatherForDate extends WeatherInfo {
  date: DateTime
  suitability: number
}
