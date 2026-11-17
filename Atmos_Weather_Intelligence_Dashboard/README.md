# Atmos — Weather Intelligence Dashboard

Atmos is a responsive weather dashboard built with **HTML, CSS and vanilla JavaScript**. It uses live public data from Open-Meteo, so no API key or backend is required for the core experience.

## Features
- Current conditions, feels-like temperature and high/low
- City search powered by Open-Meteo Geocoding
- Optional browser geolocation (falls back to Gaya)
- 24-hour forecast with precipitation probability
- 7-day forecast and UV index
- Humidity, wind, visibility and pressure metrics
- Sunrise, sunset and daylight duration
- Current US AQI with PM2.5, PM10 and ozone
- Weather-based practical recommendations
- Celsius/Fahrenheit toggle
- Light/dark theme toggle
- Responsive desktop, tablet and mobile layouts

## Run locally
1. Extract the ZIP.
2. Open the `Atmos_Weather_Intelligence_Dashboard` folder in VS Code.
3. Start a local static server. Recommended: install the **Live Server** extension in VS Code, right-click `index.html`, then choose **Open with Live Server**.
4. Or run a simple local server if Python is installed:
   ```bash
   python -m http.server 5500
   ```
   Then open `http://localhost:5500`.

Opening through a local server is recommended rather than opening the HTML file directly.

## APIs
- Forecast: https://open-meteo.com/
- Geocoding: https://open-meteo.com/en/docs/geocoding-api
- Air quality: https://open-meteo.com/en/docs/air-quality-api

Open-Meteo's public APIs are called directly from the browser. Availability, rate limits and terms may change; review the provider's current terms before production/commercial use.

## Project structure
```text
Atmos_Weather_Intelligence_Dashboard/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
```

## Notes
- Browser location permission is optional. If declined or unavailable, Atmos loads Gaya by default.
- The app does not collect or send user data to a custom server.
- This is a frontend portfolio project. It does not provide emergency-grade weather alerts; always consult official local meteorological advisories for safety-critical decisions.
