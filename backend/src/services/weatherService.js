const CITY_COORDS = {
  mumbai: { lat: 19.076, lon: 72.8777 },
  delhi: { lat: 28.6139, lon: 77.209 },
  bangalore: { lat: 12.9716, lon: 77.5946 },
  bengaluru: { lat: 12.9716, lon: 77.5946 },
  hyderabad: { lat: 17.385, lon: 78.4867 },
  chennai: { lat: 13.0827, lon: 80.2707 },
  kolkata: { lat: 22.5726, lon: 88.3639 },
  pune: { lat: 18.5204, lon: 73.8567 },
  ahmedabad: { lat: 23.0225, lon: 72.5714 },
  jaipur: { lat: 26.9124, lon: 75.7873 },
  lucknow: { lat: 26.8467, lon: 80.9462 },
  goa: { lat: 15.2993, lon: 74.124 },
  udaipur: { lat: 24.5854, lon: 73.7125 },
  shimla: { lat: 31.1048, lon: 77.1734 },
  manali: { lat: 32.2396, lon: 77.1887 },
  gurgaon: { lat: 28.4595, lon: 77.0266 },
  noida: { lat: 28.5355, lon: 77.391 },
  kochi: { lat: 9.9312, lon: 76.2673 },
  mysore: { lat: 12.2958, lon: 76.6394 },
  varanasi: { lat: 25.3176, lon: 82.9739 },
  surat: { lat: 21.1702, lon: 72.8311 },
  nagpur: { lat: 21.1458, lon: 79.0882 },
  indore: { lat: 22.7196, lon: 75.8577 },
  coimbatore: { lat: 11.0168, lon: 76.9558 },
  chandigarh: { lat: 30.7333, lon: 76.7794 },
  bhopal: { lat: 23.2599, lon: 77.4126 },
  visakhapatnam: { lat: 17.6868, lon: 83.2185 },
  patna: { lat: 25.6093, lon: 85.1376 },
  agra: { lat: 27.1767, lon: 78.0081 },
  ranchi: { lat: 23.3441, lon: 85.3096 },
  thiruvananthapuram: { lat: 8.5241, lon: 76.9366 },
  bhubaneswar: { lat: 20.2961, lon: 85.8245 },
  dehradun: { lat: 30.3165, lon: 78.0322 },
  amritsar: { lat: 31.634, lon: 74.8723 },
};

const WMO_CODES = {
  0: { desc: "Clear sky", icon: "☀️", severity: "clear" },
  1: { desc: "Mainly clear", icon: "🌤️", severity: "clear" },
  2: { desc: "Partly cloudy", icon: "⛅", severity: "mild" },
  3: { desc: "Overcast", icon: "☁️", severity: "mild" },
  45: { desc: "Fog", icon: "🌫️", severity: "moderate" },
  48: { desc: "Depositing rime fog", icon: "🌫️", severity: "moderate" },
  51: { desc: "Light drizzle", icon: "🌦️", severity: "mild" },
  53: { desc: "Moderate drizzle", icon: "🌦️", severity: "moderate" },
  55: { desc: "Dense drizzle", icon: "🌧️", severity: "moderate" },
  61: { desc: "Slight rain", icon: "🌧️", severity: "moderate" },
  63: { desc: "Moderate rain", icon: "🌧️", severity: "high" },
  65: { desc: "Heavy rain", icon: "🌧️", severity: "severe" },
  66: { desc: "Light freezing rain", icon: "🌨️", severity: "high" },
  67: { desc: "Heavy freezing rain", icon: "🌨️", severity: "severe" },
  71: { desc: "Slight snow fall", icon: "❄️", severity: "moderate" },
  73: { desc: "Moderate snow fall", icon: "❄️", severity: "high" },
  75: { desc: "Heavy snow fall", icon: "❄️", severity: "severe" },
  77: { desc: "Snow grains", icon: "❄️", severity: "moderate" },
  80: { desc: "Slight rain showers", icon: "🌦️", severity: "moderate" },
  81: { desc: "Moderate rain showers", icon: "🌧️", severity: "high" },
  82: { desc: "Violent rain showers", icon: "🌧️", severity: "severe" },
  85: { desc: "Slight snow showers", icon: "🌨️", severity: "moderate" },
  86: { desc: "Heavy snow showers", icon: "🌨️", severity: "severe" },
  95: { desc: "Thunderstorm", icon: "⛈️", severity: "severe" },
  96: { desc: "Thunderstorm with slight hail", icon: "⛈️", severity: "extreme" },
  99: { desc: "Thunderstorm with heavy hail", icon: "⛈️", severity: "extreme" },
};

const SEVERITY_LEVELS = {
  clear: { level: 0, label: "Normal", color: "#4CAF50" },
  mild: { level: 1, label: "Mild", color: "#8BC34A" },
  moderate: { level: 2, label: "Moderate", color: "#FFC107" },
  high: { level: 3, label: "High Impact", color: "#FF9800" },
  severe: { level: 4, label: "Severe", color: "#F44336" },
  extreme: { level: 5, label: "Extreme", color: "#9C27B0" },
};

async function resolveCoords(city) {
  if (!city) return null;
  const key = city.toLowerCase().trim().replace(/\s+/g, "");
  if (CITY_COORDS[key]) return CITY_COORDS[key];

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=en&format=json`;
    const res = await fetch(geoUrl);
    if (res.ok) {
      const data = await res.json();
      if (data?.results?.[0]) {
        const item = data.results[0];
        const resolved = {
          lat: Number(item.latitude.toFixed(4)),
          lon: Number(item.longitude.toFixed(4)),
          country: item.country,
          name: item.name,
        };
        CITY_COORDS[key] = resolved;
        return resolved;
      }
    }
  } catch (err) {
    // Fallback if geocoding times out
  }
  return null;
}

function decodeWeatherCode(code) {
  return WMO_CODES[code] || { desc: "Unknown", icon: "❓", severity: "mild" };
}

function classifySeverity(weather) {
  const factors = [];
  const wmo = decodeWeatherCode(weather.weatherCode);
  factors.push(SEVERITY_LEVELS[wmo.severity]?.level || 0);
  if (weather.temperature > 42) factors.push(4);
  else if (weather.temperature > 38) factors.push(3);
  else if (weather.temperature > 35) factors.push(2);
  if (weather.temperature < 5) factors.push(3);
  else if (weather.temperature < 10) factors.push(2);
  if (weather.windSpeed > 60) factors.push(4);
  else if (weather.windSpeed > 40) factors.push(3);
  else if (weather.windSpeed > 25) factors.push(2);
  if (weather.precipitation > 50) factors.push(4);
  else if (weather.precipitation > 20) factors.push(3);
  else if (weather.precipitation > 5) factors.push(2);
  if (weather.humidity > 90) factors.push(2);
  const maxSeverity = Math.max(...factors);
  const severityKey = Object.entries(SEVERITY_LEVELS).find(
    ([, v]) => v.level === maxSeverity,
  )?.[0] || "clear";
  return { ...SEVERITY_LEVELS[severityKey], key: severityKey };
}

export async function getCurrentWeather(city) {
  const coords = await resolveCoords(city);
  if (!coords) return { error: `Unable to locate coordinates for city: ${city}` };
  const params = new URLSearchParams({
    latitude: coords.lat,
    longitude: coords.lon,
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "rain",
      "weather_code",
      "wind_speed_10m",
      "wind_gusts_10m",
      "cloud_cover",
      "surface_pressure",
    ].join(","),
    timezone: "auto",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  const data = await res.json();
  const c = data.current;
  const weather = {
    city,
    coordinates: coords,
    temperature: c.temperature_2m,
    feelsLike: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    precipitation: c.precipitation,
    rain: c.rain,
    weatherCode: c.weather_code,
    windSpeed: c.wind_speed_10m,
    windGusts: c.wind_gusts_10m,
    cloudCover: c.cloud_cover,
    pressure: c.surface_pressure,
    time: c.time,
    ...decodeWeatherCode(c.weather_code),
  };
  weather.severity = classifySeverity(weather);
  return weather;
}

export async function getWeatherForecast(city, days = 7) {
  const coords = await resolveCoords(city);
  if (!coords) return { error: `Unable to locate coordinates for city: ${city}` };
  const params = new URLSearchParams({
    latitude: coords.lat,
    longitude: coords.lon,
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "rain_sum",
      "weather_code",
      "wind_speed_10m_max",
      "wind_gusts_10m_max",
      "precipitation_probability_max",
      "uv_index_max",
    ].join(","),
    hourly: [
      "temperature_2m",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "relative_humidity_2m",
    ].join(","),
    forecast_days: days,
    timezone: "auto",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  const data = await res.json();
  const daily = data.daily.time.map((date, i) => {
    const code = data.daily.weather_code[i];
    const wmo = decodeWeatherCode(code);
    const dayWeather = {
      date,
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      precipitation: data.daily.precipitation_sum[i],
      rain: data.daily.rain_sum[i],
      weatherCode: code,
      windMax: data.daily.wind_speed_10m_max[i],
      gustMax: data.daily.wind_gusts_10m_max[i],
      precipProb: data.daily.precipitation_probability_max[i],
      uvIndex: data.daily.uv_index_max[i],
      ...wmo,
    };
    dayWeather.severity = classifySeverity({
      temperature: dayWeather.tempMax,
      windSpeed: dayWeather.windMax,
      precipitation: dayWeather.precipitation,
      humidity: 70,
      weatherCode: code,
    });
    return dayWeather;
  });
  const hourly = data.hourly.time.map((time, i) => ({
    time,
    temperature: data.hourly.temperature_2m[i],
    precipitation: data.hourly.precipitation[i],
    weatherCode: data.hourly.weather_code[i],
    windSpeed: data.hourly.wind_speed_10m[i],
    humidity: data.hourly.relative_humidity_2m[i],
    ...decodeWeatherCode(data.hourly.weather_code[i]),
  }));
  return { city, coordinates: coords, daily, hourly };
}

export async function getMultiCityWeather(cities) {
  const results = await Promise.allSettled(
    cities.map((city) => getCurrentWeather(city)),
  );
  return results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { city: cities[i], error: r.reason?.message },
  );
}

export { CITY_COORDS, WMO_CODES, SEVERITY_LEVELS, resolveCoords, decodeWeatherCode, classifySeverity };
