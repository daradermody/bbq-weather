import { createTransport } from 'nodemailer'
import { WeatherForDate } from './types'
import config from '../.env.json'

export async function send(to: string, subject: string, body: string): Promise<void> {
  const transporter = createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: config.emailer.email,
      pass: config.emailer.password
    }
  })

  const mailOptions = {
    from: `"${config.emailer.name}" <${config.emailer.email}>`,
    to,
    subject,
    html: body
  }

  await transporter.sendMail(mailOptions)
}

export async function generateHtml(weatherByDate: Record<string, WeatherForDate>) {
  return `
    <div>
      <p>Average metrics between 14:00—20:00</p>
      <table style="border: 1px solid black;">
        <tr style="border: 1px solid black;">
          <th style="border: 1px solid black;">Date</th>
          <th style="border: 1px solid black;">Temp</th>
          <th style="border: 1px solid black;">Feels like</th>
          <th style="border: 1px solid black;">Probability of rain</th>
          <th style="border: 1px solid black;">Cloud cover</th>
          <th style="border: 1px solid black;">Wind speed</th>
          <th style="border: 1px solid black;">Suitability</th>
        </tr>
        ${
          Object.entries(weatherByDate)
            .sort(([dateA], [dateB]) => dateA < dateB ? -1 : 1)
            .map(([_date, weatherForDay]) => `
              <tr style="border: 1px solid black;">
                <td style="border: 1px solid black;">${weatherForDay.date.toFormat('cccc, dd LLL')}</td>
                <td style="border: 1px solid black;">${weatherForDay.temperature}°C</td>
                <td style="border: 1px solid black;">${weatherForDay.apparent_temperature}°C</td>
                <td style="border: 1px solid black;">${weatherForDay.precipitation_probability}%</td>
                <td style="border: 1px solid black;">${weatherForDay.cloudcover}%</td>
                <td style="border: 1px solid black;">${weatherForDay.windspeed} km/h</td>
                <td style="border: 1px solid black;">${colorSuitability(weatherForDay.suitability)}</td>
              </tr>
            `)
            .join('\n')
        }
      </table>
    </div>
  `
}

function colorSuitability(suitability: number): string {
  let colour = palette.BAD
  if (suitability >= 0.8) {
    colour = palette.GREAT
  } else if (suitability >= 0.6) {
    colour = palette.GOOD
  } else if (suitability >= 0.4) {
    colour = palette.OK
  }
  return `<b style="color: ${colour}">${suitability * 100}%</b>`
}

const palette = {
  BAD: '#c90000',
  OK: '#b94d00',
  GOOD: '#a73e00',
  GREAT: '#006300'
}
