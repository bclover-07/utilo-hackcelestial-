import { getCurrentWeather, getWeatherForecast, getMultiCityWeather } from "../services/weatherService.js";
import { getDigitalTwinState } from "../services/digitalTwinService.js";
import { runWhatIfSimulation, PRESET_SCENARIOS } from "../services/simulatorService.js";
import { getSocialSignals } from "../services/socialSignalService.js";

export const digitalTwinController = {
  async state(req, res) {
    const city = req.query.city || req.user.city || "Mumbai";
    const state = await getDigitalTwinState(city);
    res.json(state);
  },
  async weather(req, res) {
    const city = req.query.city || req.user.city || "Mumbai";
    const weather = await getCurrentWeather(city);
    res.json(weather);
  },
  async forecast(req, res) {
    const city = req.query.city || req.user.city || "Mumbai";
    const days = Math.min(Number(req.query.days) || 7, 16);
    const forecast = await getWeatherForecast(city, days);
    res.json(forecast);
  },
  async multiCity(req, res) {
    const cities = (req.query.cities || "Mumbai,Delhi,Bangalore,Chennai,Kolkata,Pune,Goa,Jaipur")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
      .slice(0, 12);
    const data = await getMultiCityWeather(cities);
    res.json(data);
  },
  async simulate(req, res) {
    const city = req.body.city || req.user.city || "Mumbai";
    const overrides = req.body.overrides || {};
    const presetId = req.body.preset;
    let finalOverrides = overrides;
    if (presetId) {
      const preset = PRESET_SCENARIOS.find((p) => p.id === presetId);
      if (preset) finalOverrides = { ...preset.overrides, ...overrides };
    }
    const baseWeather = await getCurrentWeather(city);
    if (baseWeather.error) return res.status(400).json(baseWeather);
    const result = await runWhatIfSimulation(baseWeather, finalOverrides, city);
    res.json(result);
  },
  async presets(_req, res) {
    res.json(PRESET_SCENARIOS);
  },
  async socialSignals(req, res) {
    const city = req.query.city || req.user.city;
    const data = await getSocialSignals(city);
    res.json(data);
  },
};
