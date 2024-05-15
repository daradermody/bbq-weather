import axios from 'axios'
import { DateTime } from 'luxon'
import { generateHtml, send } from './emailer'
import { WeatherForDate, WeatherForHour, WeatherInfo } from './types'
import config from '../.env.json'

async function main() {
  const data = await getForecastData()
  const hourlyWeatherInWindow = getDataBetweenHours(data.hourly, 14, 20)
  const weatherByDay = Object.groupBy(hourlyWeatherInWindow, weatherForHour => weatherForHour.time.toISODate()!) as Record<string, WeatherForHour[]>

  const averageWeatherByDate: Record<string, WeatherForDate> = {}
  for (const [date, hourlyWeather] of Object.entries(weatherByDay)) {
    averageWeatherByDate[date] = averageWeather(hourlyWeather)
  }

  for (const recipientEmail of config.recipients) {
    await send(recipientEmail, 'Weather update', await generateHtml(averageWeatherByDate))
  }
}

async function getForecastData(): Promise<Forecast> {
  const params = {
    latitude: 53.42,
    longitude: -7.94,
    hourly: 'temperature_2m,apparent_temperature,precipitation_probability,cloudcover,windspeed_10m',
    timeformat: 'unixtime'
  }

  const {data} = await axios.get<Forecast>(`https://api.open-meteo.com/v1/forecast`, {params})
  return data;
}

function getDataBetweenHours(hourlyData: Forecast['hourly'], fromHour: number, toHour: number): WeatherForHour[] {
  return hourlyData.time
    .map((time, i) => ({
      time: DateTime.fromSeconds(time),
      temperature: hourlyData.temperature_2m[i],
      apparent_temperature: hourlyData.apparent_temperature[i],
      precipitation_probability: hourlyData.precipitation_probability[i],
      cloudcover: hourlyData.cloudcover[i],
      windspeed: hourlyData.windspeed_10m[i],
    }))
    .filter(({time}: { time: DateTime }) => {
      const startOfWindow = time.startOf('day').plus({hours: fromHour})
      const endOfWindow = time.startOf('day').plus({hours: toHour})
      return startOfWindow <= time && time <= endOfWindow
    })
}

function averageWeather(hourlyWeather: WeatherForHour[]): WeatherForDate {
  const averagedWeather = {
    date: hourlyWeather[0].time.startOf('day'),
    temperature: Math.round(average(hourlyWeather.map(h => h.temperature))),
    apparent_temperature: Math.round(average(hourlyWeather.map(h => h.apparent_temperature))),
    precipitation_probability: Math.round(average(hourlyWeather.map(h => h.precipitation_probability))),
    cloudcover: Math.round(average(hourlyWeather.map(h => h.cloudcover))),
    windspeed: Math.round(average(hourlyWeather.map(h => h.windspeed))),
  }
  return {
    ...averagedWeather,
    suitability: calculateSuitability(averagedWeather),
  }
}

function average(list: number[]): number {
  return list.reduce((a, b) => a + b) / list.length
}

function calculateSuitability(weatherInfo: WeatherInfo): number {
  return (
    Number(weatherInfo.temperature >= 15) +
    Number(weatherInfo.apparent_temperature >= 10) +
    Number(weatherInfo.precipitation_probability <= 50) +
    Number(weatherInfo.cloudcover <= 80) +
    Number(weatherInfo.windspeed <= 20)
  ) / 5
}

main().catch(console.error)

interface Forecast {
  hourly: {
    time: number[]
    temperature_2m: number[]
    apparent_temperature: number[]
    precipitation_probability: number[]
    cloudcover: number[]
    windspeed_10m: number[]
  }
}
