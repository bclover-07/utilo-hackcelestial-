"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  CloudRain,
  Thermometer,
  Wind,
  Droplets,
  AlertTriangle,
  Activity,
  Zap,
  TrendingDown,
  TrendingUp,
  MapPin,
  Globe,
  MessageCircle,
  ArrowRight,
  RefreshCw,
  Layers,
  Eye,
  Gauge,
  Shield,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Sun,
  Cloud,
  CloudSnow,
  CloudLightning,
  Search,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  useData,
  State,
  Heading,
  Badge,
  money,
  colors,
  Field,
  ActionForm,
} from "./ui";

const SEVERITY_COLORS = {
  clear: "#4CAF50",
  mild: "#8BC34A",
  moderate: "#FFC107",
  high: "#FF9800",
  severe: "#F44336",
  extreme: "#9C27B0",
};

const RISK_COLORS = {
  normal: "#4CAF50",
  elevated: "#FF9800",
  critical: "#F44336",
};

function WeatherCard({ weather, compact }) {
  if (!weather || weather.error) return null;
  const sev = weather.severity || {};
  return (
    <div
      className="dt-weather-card"
      style={{ borderLeft: `4px solid ${SEVERITY_COLORS[sev.key] || "#4CAF50"}` }}
    >
      <div className="dt-weather-header">
        <span className="dt-weather-icon">{weather.icon}</span>
        <div>
          <h3 className="dt-weather-city">{weather.city}</h3>
          <span className="dt-weather-desc">{weather.desc}</span>
        </div>
        <span
          className="dt-severity-badge"
          style={{ background: SEVERITY_COLORS[sev.key] || "#4CAF50" }}
        >
          {sev.label || "Normal"}
        </span>
      </div>
      <div className="dt-weather-metrics">
        <div className="dt-metric">
          <Thermometer size={14} />
          <span>{weather.temperature}°C</span>
          <small>Feels {weather.feelsLike}°C</small>
        </div>
        <div className="dt-metric">
          <CloudRain size={14} />
          <span>{weather.precipitation}mm</span>
          <small>Rain</small>
        </div>
        <div className="dt-metric">
          <Wind size={14} />
          <span>{weather.windSpeed}km/h</span>
          <small>Wind</small>
        </div>
        <div className="dt-metric">
          <Droplets size={14} />
          <span>{weather.humidity}%</span>
          <small>Humidity</small>
        </div>
      </div>
    </div>
  );
}

function ImpactGauge({ label, value, maxVal, color, suffix }) {
  const pct = Math.min(100, Math.abs(value) / (maxVal || 100) * 100);
  return (
    <div className="dt-impact-gauge">
      <div className="dt-gauge-label">{label}</div>
      <div className="dt-gauge-bar-track">
        <div
          className="dt-gauge-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="dt-gauge-value" style={{ color }}>
        {value > 0 ? "+" : ""}{value}{suffix || "%"}
      </div>
    </div>
  );
}

function CategoryImpactCard({ cat, data }) {
  const [open, setOpen] = useState(false);
  const imp = data.weatherImpact;
  const riskColor = RISK_COLORS[data.riskLevel] || RISK_COLORS.normal;
  return (
    <div className="dt-category-card" style={{ borderTop: `3px solid ${riskColor}` }}>
      <div className="dt-cat-header" onClick={() => setOpen(!open)} role="button" tabIndex={0}>
        <div>
          <h4 className="dt-cat-title">{cat.replace(/_/g, " ")}</h4>
          <span className="dt-risk-label" style={{ color: riskColor }}>
            {data.riskLevel.toUpperCase()} RISK
          </span>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      <div className="dt-cat-kpi-row">
        <div className="dt-cat-kpi">
          <span className="dt-kpi-val">{data.supply.activeListings}</span>
          <span className="dt-kpi-label">Listings</span>
        </div>
        <div className="dt-cat-kpi">
          <span className="dt-kpi-val">{data.supply.totalUnits}</span>
          <span className="dt-kpi-label">Units</span>
        </div>
        <div className="dt-cat-kpi">
          <span className="dt-kpi-val">{data.demand.activeBookings}</span>
          <span className="dt-kpi-label">Bookings</span>
        </div>
        <div className="dt-cat-kpi">
          <span className="dt-kpi-val">{data.demand.openRequests}</span>
          <span className="dt-kpi-label">Open RFQs</span>
        </div>
      </div>
      <div className="dt-impact-gauges">
        <ImpactGauge label="Demand" value={imp.demandChange} maxVal={50} color={imp.demandChange < -10 ? "#F44336" : imp.demandChange < 0 ? "#FF9800" : "#4CAF50"} />
        <ImpactGauge label="Supply" value={imp.supplyChange} maxVal={50} color={imp.supplyChange < -10 ? "#F44336" : imp.supplyChange < 0 ? "#FF9800" : "#4CAF50"} />
        <ImpactGauge label="Cancel Risk" value={imp.cancellationRisk} maxVal={100} color={imp.cancellationRisk > 60 ? "#F44336" : imp.cancellationRisk > 30 ? "#FF9800" : "#4CAF50"} />
      </div>
      {open && (
        <div className="dt-cat-detail">
          <div className="dt-detail-row">
            <span>Confidence</span>
            <strong>{imp.confidence}%</strong>
          </div>
          <div className="dt-detail-row">
            <span>Price Adj.</span>
            <strong style={{ color: imp.priceAdjustment < 0 ? "#F44336" : "#4CAF50" }}>
              {imp.priceAdjustment > 0 ? "+" : ""}{imp.priceAdjustment}%
            </strong>
          </div>
          <div className="dt-detail-row">
            <span>Avg Price</span>
            <strong>{money(data.supply.avgPrice)}</strong>
          </div>
          <div className="dt-detail-row">
            <span>Adjusted Price</span>
            <strong>{money(data.adjustedSupply.adjustedPrice)}</strong>
          </div>
          <div className="dt-detail-row">
            <span>Effective Units</span>
            <strong>{data.adjustedSupply.effectiveUnits} / {data.supply.totalUnits}</strong>
          </div>
          <h5 style={{ marginTop: 12, fontSize: 11, opacity: 0.7 }}>IMPACT FACTORS</h5>
          <div className="dt-factor-chips">
            <span className="dt-chip">🌡️ Temp Stress: {imp.factors.temperatureStress}%</span>
            <span className="dt-chip">🌧️ Rain: {imp.factors.precipitationImpact}%</span>
            <span className="dt-chip">💨 Wind: {imp.factors.windImpact}%</span>
            <span className="dt-chip">⚡ Severity: {imp.factors.weatherSeverity}/5</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CascadingEffects({ effects }) {
  if (!effects?.length) return null;
  return (
    <section className="dt-cascade-section">
      <div className="dt-section-head">
        <Zap size={18} />
        <h3>Cascading Effects</h3>
        <Badge>{effects.length} chains detected</Badge>
      </div>
      <div className="dt-cascade-timeline">
        {effects.map((eff, i) => (
          <div key={i} className="dt-cascade-item">
            <div className="dt-cascade-order">
              <span className="dt-order-badge">{eff.order}°</span>
            </div>
            <div className="dt-cascade-body">
              <div className="dt-cascade-flow">
                <span className="dt-cascade-trigger">{eff.trigger}</span>
                <ArrowRight size={14} />
                <span className="dt-cascade-effect">{eff.effect}</span>
              </div>
              <p className="dt-cascade-desc">{eff.description}</p>
              <div className="dt-cascade-tags">
                {eff.affected.map((a) => (
                  <span key={a} className="dt-cascade-tag">{a.replace(/_/g, " ")}</span>
                ))}
                <span className={`dt-magnitude dt-mag-${eff.magnitude}`}>
                  {eff.magnitude}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EcosystemImpactBanner({ impact, city }) {
  if (!impact) return null;
  return (
    <div className="dt-ecosystem-banner">
      <div className="dt-eco-header">
        <Shield size={18} />
        <h4>Utilo Ecosystem Operational Impact & Recommendations</h4>
        <span className="dt-eco-badge">Active Digital Twin Intelligence</span>
      </div>
      <div className="dt-eco-grid">
        <div className="dt-eco-card">
          <div className="dt-eco-card-head">
            <span className="dt-eco-icon">💡</span>
            <span className="dt-eco-label">Weather Smart Pricing</span>
          </div>
          <div className="dt-eco-val" style={{ color: impact.smartPricingMultiplier > 1 ? "#E65100" : "#2E7D32" }}>
            {impact.smartPricingMultiplier > 1 ? `+${Math.round((impact.smartPricingMultiplier - 1) * 100)}% Surge` : impact.smartPricingMultiplier < 1 ? `-${Math.round((1 - impact.smartPricingMultiplier) * 100)}% Discount` : "Baseline Rate"}
          </div>
          <p className="dt-eco-sub">{impact.pricingAdvice}</p>
        </div>

        <div className="dt-eco-card">
          <div className="dt-eco-card-head">
            <span className="dt-eco-icon">🚚</span>
            <span className="dt-eco-label">Fleet & Delivery Transit</span>
          </div>
          <div className="dt-eco-val" style={{ color: impact.logisticsDelayMinutes > 20 ? "#D32F2F" : "#388E3C" }}>
            {impact.logisticsDelayMinutes > 0 ? `+${impact.logisticsDelayMinutes} min delay` : "On Schedule"}
          </div>
          <p className="dt-eco-sub">Route transit latency based on road & wind conditions in {city}.</p>
        </div>

        <div className="dt-eco-card">
          <div className="dt-eco-card-head">
            <span className="dt-eco-icon">👨‍🍳</span>
            <span className="dt-eco-label">Kitchen & Crew Workforce</span>
          </div>
          <div className="dt-eco-val" style={{ color: impact.workforceAvailabilityIndex < 80 ? "#D32F2F" : "#1976D2" }}>
            {impact.workforceAvailabilityIndex}% Capacity
          </div>
          <p className="dt-eco-sub">Estimated commissary & setup staff mobility index.</p>
        </div>

        <div className="dt-eco-card">
          <div className="dt-eco-card-head">
            <span className="dt-eco-icon">🏢</span>
            <span className="dt-eco-label">Indoor Space Migration</span>
          </div>
          <div className="dt-eco-val" style={{ color: "#7B1FA2" }}>
            {impact.outdoorToIndoorShiftSurge}
          </div>
          <p className="dt-eco-sub">Banquet hall and marquee shelter demand reallocation.</p>
        </div>
      </div>
    </div>
  );
}

function ForecastChart({ forecast, forecastImpacts }) {
  if (!forecast?.length) return null;
  const [viewMode, setViewMode] = useState("weather");

  const weatherData = forecast.map((d) => ({
    date: d.date?.slice(5),
    tempMax: d.tempMax,
    tempMin: d.tempMin,
    rain: d.precipitation,
    wind: d.windMax,
    icon: d.icon,
    desc: d.desc,
  }));

  const probabilisticData = (forecastImpacts || []).map((d) => ({
    date: d.dateLabel || d.date?.slice(5),
    expectedDemand: d.expectedDemandIndex,
    upperConfidence: d.confidenceHigh,
    lowerConfidence: d.confidenceLow,
    cancellationRisk: d.cancellationProbability,
    revenueRisk: d.revenueAtRiskEst,
  }));

  return (
    <section className="dt-forecast-section">
      <div className="dt-section-head">
        <Activity size={18} />
        <h3>7-Day Environmental Forecast & Probabilistic Demand Trajectory</h3>
        <div className="dt-chart-toggle-group">
          <button
            className={`dt-chart-toggle-btn ${viewMode === "weather" ? "dt-toggle-active" : ""}`}
            onClick={() => setViewMode("weather")}
          >
            🌤️ Meteorological
          </button>
          <button
            className={`dt-chart-toggle-btn ${viewMode === "probabilistic" ? "dt-toggle-active" : ""}`}
            onClick={() => setViewMode("probabilistic")}
          >
            📈 Probabilistic Twin
          </button>
        </div>
      </div>

      <div className="dt-forecast-strip">
        {forecast.map((d, i) => (
          <div key={i} className="dt-forecast-day">
            <span className="dt-day-label">{d.date?.slice(5)}</span>
            <span className="dt-day-icon">{d.icon}</span>
            <span className="dt-day-temp">{d.tempMax}°/{d.tempMin}°</span>
            <span className="dt-day-rain">🌧{d.precipitation}mm</span>
            <span
              className="dt-day-sev"
              style={{ background: SEVERITY_COLORS[d.severity?.key] || "#4CAF50" }}
            >
              {d.severity?.label || "OK"}
            </span>
          </div>
        ))}
      </div>

      {viewMode === "weather" ? (
        <div style={{ width: "100%", height: 220, marginTop: 16 }}>
          <ResponsiveContainer>
            <AreaChart data={weatherData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e0cf" />
              <XAxis dataKey="date" stroke="#171915" tick={{ fontSize: 11, fontWeight: 700 }} />
              <YAxis stroke="#171915" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "#fffef8",
                  border: "1.5px solid #171915",
                  borderRadius: 10,
                  boxShadow: "2px 2px 0 #171915",
                  fontWeight: 700,
                }}
              />
              <Area type="monotone" dataKey="tempMax" stroke="#F44336" fill="#FFCDD2" fillOpacity={0.4} name="Max Temp °C" />
              <Area type="monotone" dataKey="tempMin" stroke="#2196F3" fill="#BBDEFB" fillOpacity={0.3} name="Min Temp °C" />
              <Area type="monotone" dataKey="rain" stroke="#4CAF50" fill="#C8E6C9" fillOpacity={0.3} name="Rain mm" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ width: "100%", height: 220, marginTop: 16 }}>
          <ResponsiveContainer>
            <AreaChart data={probabilisticData}>
              <defs>
                <linearGradient id="demandConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1976D2" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1976D2" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e0cf" />
              <XAxis dataKey="date" stroke="#171915" tick={{ fontSize: 11, fontWeight: 700 }} />
              <YAxis stroke="#171915" tick={{ fontSize: 10 }} domain={[40, 160]} />
              <Tooltip
                contentStyle={{
                  background: "#fffef8",
                  border: "1.5px solid #171915",
                  borderRadius: 10,
                  boxShadow: "2px 2px 0 #171915",
                  fontWeight: 700,
                }}
              />
              <Area type="monotone" dataKey="upperConfidence" stroke="#90CAF9" fill="url(#demandConfidence)" name="90% Upper Bound" />
              <Area type="monotone" dataKey="expectedDemand" stroke="#1565C0" strokeWidth={2.5} fill="transparent" name="Expected Demand Index (100 Base)" />
              <Area type="monotone" dataKey="lowerConfidence" stroke="#90CAF9" fill="transparent" strokeDasharray="4 4" name="90% Lower Bound" />
              <Area type="monotone" dataKey="cancellationRisk" stroke="#F44336" fill="#FFCDD2" fillOpacity={0.2} name="Cancel Risk %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

function SocialPulse({ social }) {
  if (!social) return null;
  const [sourceFilter, setSourceFilter] = useState("all");
  const [expanded, setExpanded] = useState(false);

  const filteredSignals = (social.signals || []).filter((s) => {
    if (sourceFilter === "news") return s.sourceType === "live_news";
    if (sourceFilter === "reddit") return s.sourceType === "reddit_community";
    if (sourceFilter === "pulse") return s.sourceType !== "live_news" && s.sourceType !== "reddit_community";
    return true;
  });

  const displaySignals = expanded ? filteredSignals : filteredSignals.slice(0, 6);

  return (
    <section className="dt-social-section">
      <div className="dt-section-head">
        <MessageCircle size={18} />
        <h3>Real-World Social & Public Signal Pulse</h3>
        <Badge>{social.relevantCount} live signals</Badge>
      </div>

      <div className="dt-source-filter-row">
        <button
          className={`dt-source-filter-btn ${sourceFilter === "all" ? "dt-source-active" : ""}`}
          onClick={() => setSourceFilter("all")}
        >
          All Feeds ({social.signals?.length || 0})
        </button>
        <button
          className={`dt-source-filter-btn ${sourceFilter === "news" ? "dt-source-active" : ""}`}
          onClick={() => setSourceFilter("news")}
        >
          📰 Live News Desk ({social.sourceBreakdown?.liveNews || 0})
        </button>
        <button
          className={`dt-source-filter-btn ${sourceFilter === "reddit" ? "dt-source-active" : ""}`}
          onClick={() => setSourceFilter("reddit")}
        >
          💬 Reddit Communities ({social.sourceBreakdown?.reddit || 0})
        </button>
        <button
          className={`dt-source-filter-btn ${sourceFilter === "pulse" ? "dt-source-active" : ""}`}
          onClick={() => setSourceFilter("pulse")}
        >
          📡 Traveler Pulse ({social.sourceBreakdown?.citizenPulse || 0})
        </button>
      </div>

      <div className="dt-sentiment-row">
        <div className="dt-sentiment-pill dt-sent-positive">
          🟢 {social.sentimentBreakdown?.positive || 0} Positive / Favorable
        </div>
        <div className="dt-sentiment-pill dt-sent-neutral">
          ⚪ {social.sentimentBreakdown?.neutral || 0} Neutral Reports
        </div>
        <div className="dt-sentiment-pill dt-sent-negative">
          🔴 {social.sentimentBreakdown?.negative || 0} Disruption / Negative Alerts
        </div>
      </div>

      {social.trendingTopics?.length > 0 && (
        <div className="dt-trend-chips">
          <span className="dt-trend-label">Trending Signals:</span>
          {social.trendingTopics.slice(0, 8).map((t) => (
            <span key={t.word} className="dt-trend-chip">#{t.word} ({t.count})</span>
          ))}
        </div>
      )}

      <div className="dt-signal-list">
        {displaySignals.map((s, i) => (
          <div key={i} className="dt-signal-item">
            <div className="dt-signal-head">
              <span className="dt-signal-emoji">{s.sentiment?.emoji || "⚪"}</span>
              <a
                href={s.url && s.url !== "#" ? s.url : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="dt-signal-title"
              >
                {s.title}
              </a>
              <span className={`dt-source-badge dt-src-${s.sourceType || "pulse"}`}>
                {s.sourceType === "live_news"
                  ? "📰 Live News"
                  : s.sourceType === "reddit_community"
                    ? `r/${s.subreddit}`
                    : "📡 Traveler Pulse"}
              </span>
            </div>
            <div className="dt-signal-meta">
              <span>{s.author ? `By ${s.author}` : "Verified Signal"}</span>
              <span>⬆️ {s.score} impact</span>
              <span>💬 {s.numComments} comments</span>
              {s.mentionedCities?.length > 0 && (
                <span>📍 {s.mentionedCities.join(", ")}</span>
              )}
              {s.weatherRelevant && <span className="dt-tag-weather">🌧 Weather</span>}
              {s.hospitalityRelevant && <span className="dt-tag-hosp">🏨 Hospitality</span>}
            </div>
          </div>
        ))}
      </div>

      {filteredSignals.length > 6 && (
        <button className="dt-show-more" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show fewer signals" : `Show all ${filteredSignals.length} signals`}
        </button>
      )}
    </section>
  );
}

function WhatIfSimulator({ city, baseWeather }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [presets, setPresets] = useState([]);
  const [activePreset, setActivePreset] = useState(null);
  const [overrides, setOverrides] = useState({
    temperature: baseWeather?.temperature || 30,
    precipitation: baseWeather?.precipitation || 0,
    windSpeed: baseWeather?.windSpeed || 10,
    humidity: baseWeather?.humidity || 65,
    weatherCode: baseWeather?.weatherCode || 0,
  });

  useEffect(() => {
    api("/digital-twin/presets").then(setPresets).catch(() => {});
  }, []);

  useEffect(() => {
    if (baseWeather) {
      setOverrides({
        temperature: baseWeather.temperature,
        precipitation: baseWeather.precipitation,
        windSpeed: baseWeather.windSpeed,
        humidity: baseWeather.humidity || 65,
        weatherCode: baseWeather.weatherCode,
      });
    }
  }, [baseWeather]);

  const runSimulation = async (preset) => {
    setLoading(true);
    setActivePreset(preset || null);
    try {
      const body = preset
        ? { city, preset: preset.id }
        : { city, overrides };
      const data = await api("/digital-twin/simulate", { method: "POST", body });
      setResult(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <section className="dt-sim-section">
      <div className="dt-section-head">
        <Layers size={18} />
        <h3>Digital Twin What-If Counterfactual Simulator</h3>
        <Badge>AI SIMULATION ENGINE</Badge>
      </div>

      <p style={{ fontSize: 13, opacity: 0.8, margin: "0 0 14px", lineHeight: 1.5 }}>
        Manipulate environmental parameters to simulate counterfactual weather events and observe cascading disruptions across bookings, supply chains, dynamic pricing, and asset utilization.
      </p>

      <div className="dt-preset-row">
        {presets.map((p) => (
          <button
            key={p.id}
            className={`dt-preset-btn ${activePreset?.id === p.id ? "dt-preset-active" : ""}`}
            onClick={() => runSimulation(p)}
            disabled={loading}
          >
            <span className="dt-preset-name">{p.name}</span>
            <span className="dt-preset-desc">{p.description}</span>
          </button>
        ))}
      </div>

      <div className="dt-custom-sim">
        <h4>Custom Environmental Parameters</h4>
        <div className="dt-slider-grid">
          <div className="dt-slider-group">
            <label>🌡️ Temperature: {overrides.temperature}°C</label>
            <input
              type="range" min={-5} max={52} step={1}
              value={overrides.temperature}
              onChange={(e) => setOverrides({ ...overrides, temperature: +e.target.value })}
            />
          </div>
          <div className="dt-slider-group">
            <label>🌧️ Precipitation / Rainfall: {overrides.precipitation}mm</label>
            <input
              type="range" min={0} max={150} step={1}
              value={overrides.precipitation}
              onChange={(e) => setOverrides({ ...overrides, precipitation: +e.target.value })}
            />
          </div>
          <div className="dt-slider-group">
            <label>💨 Wind Speed: {overrides.windSpeed}km/h</label>
            <input
              type="range" min={0} max={130} step={1}
              value={overrides.windSpeed}
              onChange={(e) => setOverrides({ ...overrides, windSpeed: +e.target.value })}
            />
          </div>
          <div className="dt-slider-group">
            <label>💧 Humidity: {overrides.humidity}%</label>
            <input
              type="range" min={10} max={100} step={1}
              value={overrides.humidity}
              onChange={(e) => setOverrides({ ...overrides, humidity: +e.target.value })}
            />
          </div>
          <div className="dt-slider-group">
            <label>☁️ Weather Condition: {overrides.weatherCode}</label>
            <select
              value={overrides.weatherCode}
              onChange={(e) => setOverrides({ ...overrides, weatherCode: +e.target.value })}
            >
              <option value={0}>Clear sky</option>
              <option value={1}>Mainly clear</option>
              <option value={2}>Partly cloudy</option>
              <option value={3}>Overcast</option>
              <option value={45}>Dense Fog</option>
              <option value={61}>Slight rain</option>
              <option value={63}>Moderate rain</option>
              <option value={65}>Heavy rain / Monsoon</option>
              <option value={82}>Violent cloudburst showers</option>
              <option value={95}>Thunderstorm</option>
              <option value={99}>Severe Thunderstorm + Hail</option>
            </select>
          </div>
        </div>
        <button
          className="dt-run-btn"
          onClick={() => runSimulation(null)}
          disabled={loading}
        >
          {loading ? "Simulating Virtual Twin..." : "▶ Run What-If Digital Twin Simulation"}
        </button>
      </div>

      {result && <SimulationResult result={result} />}
    </section>
  );
}

function SimulationResult({ result }) {
  const { scenario, comparison, cascadingEffects, recommendations } = result;
  const cats = Object.entries(comparison);
  const radarData = cats.map(([cat, comp]) => ({
    category: cat.replace(/_/g, " ").slice(0, 12),
    demand: Math.abs(comp.demandDelta),
    risk: Math.abs(comp.riskDelta),
    supply: Math.abs(comp.supplyDelta),
  }));
  return (
    <div className="dt-sim-result">
      <div className="dt-sim-comparison-header">
        <div className="dt-sim-weather-box dt-sim-base">
          <h5>CURRENT</h5>
          <span className="dt-sim-temp">{scenario.baseWeather.temperature}°C</span>
          <span>{scenario.baseWeather.desc}</span>
          <span className="dt-sim-sev" style={{ background: SEVERITY_COLORS[scenario.baseWeather.severity?.key] || "#4CAF50" }}>
            {scenario.baseWeather.severity?.label}
          </span>
        </div>
        <div className="dt-sim-arrow">→</div>
        <div className="dt-sim-weather-box dt-sim-simulated">
          <h5>SIMULATED</h5>
          <span className="dt-sim-temp">{scenario.simulatedWeather.temperature}°C</span>
          <span>{scenario.simulatedWeather.desc}</span>
          <span className="dt-sim-sev" style={{ background: SEVERITY_COLORS[scenario.simulatedWeather.severity?.key] || "#F44336" }}>
            {scenario.simulatedWeather.severity?.label}
          </span>
        </div>
      </div>
      <div className="dt-sim-charts-grid">
        {radarData.length > 0 && (
          <div className="dt-sim-chart-box">
            <h5 className="dt-chart-subhead">Multi-Dimensional Sensitivity Radar</h5>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e0cf" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 9, fontWeight: 700 }} />
                  <PolarRadiusAxis tick={{ fontSize: 8 }} />
                  <Radar name="Demand Δ" dataKey="demand" stroke="#F44336" fill="#F44336" fillOpacity={0.3} />
                  <Radar name="Risk Δ" dataKey="risk" stroke="#FF9800" fill="#FF9800" fillOpacity={0.2} />
                  <Radar name="Supply Δ" dataKey="supply" stroke="#2196F3" fill="#2196F3" fillOpacity={0.2} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="dt-sim-chart-box">
          <h5 className="dt-chart-subhead">Category Demand vs Supply Delta (%)</h5>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={cats.map(([cat, comp]) => ({ name: cat.replace(/_/g, " ").slice(0, 10), demand: comp.demandDelta, supply: comp.supplyDelta }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e0cf" />
                <XAxis dataKey="name" stroke="#171915" tick={{ fontSize: 9, fontWeight: 700 }} />
                <YAxis stroke="#171915" tick={{ fontSize: 9 }} unit="%" />
                <Tooltip
                  contentStyle={{
                    background: "#fffef8",
                    border: "1.5px solid #171915",
                    borderRadius: 10,
                    fontWeight: 700,
                  }}
                />
                <Bar dataKey="demand" fill="#F44336" name="Demand Shift %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="supply" fill="#2196F3" name="Supply Shift %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="dt-comparison-grid">
        {cats.map(([cat, comp]) => (
          <div key={cat} className={`dt-comp-card dt-dir-${comp.direction}`}>
            <h5>{cat.replace(/_/g, " ")}</h5>
            <div className="dt-comp-metrics">
              <div>
                <span className="dt-comp-label">Demand</span>
                <span className={`dt-comp-val ${comp.demandDelta < 0 ? "dt-neg" : "dt-pos"}`}>
                  {comp.demandDelta > 0 ? "+" : ""}{comp.demandDelta}%
                </span>
              </div>
              <div>
                <span className="dt-comp-label">Supply</span>
                <span className={`dt-comp-val ${comp.supplyDelta < 0 ? "dt-neg" : "dt-pos"}`}>
                  {comp.supplyDelta > 0 ? "+" : ""}{comp.supplyDelta}%
                </span>
              </div>
              <div>
                <span className="dt-comp-label">Risk</span>
                <span className={`dt-comp-val ${comp.riskDelta > 0 ? "dt-neg" : "dt-pos"}`}>
                  {comp.riskDelta > 0 ? "+" : ""}{comp.riskDelta}%
                </span>
              </div>
            </div>
            <div className="dt-risk-transition">
              <span className="dt-risk-from" style={{ color: RISK_COLORS[comp.baseRisk] }}>
                {comp.baseRisk}
              </span>
              <ArrowRight size={12} />
              <span className="dt-risk-to" style={{ color: RISK_COLORS[comp.simulatedRisk] }}>
                {comp.simulatedRisk}
              </span>
            </div>
          </div>
        ))}
      </div>
      {cascadingEffects?.newEffects?.length > 0 && (
        <div className="dt-new-cascades">
          <h4>⚡ New Cascading Effects Triggered</h4>
          {cascadingEffects.newEffects.map((eff, i) => (
            <div key={i} className="dt-cascade-item dt-cascade-new">
              <span className="dt-order-badge dt-new">{eff.order}°</span>
              <div>
                <strong>{eff.trigger}</strong> → <strong>{eff.effect}</strong>
                <p>{eff.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {recommendations?.length > 0 && (
        <div className="dt-recommendations">
          <h4>📋 AI Recommendations</h4>
          {recommendations.map((rec, i) => (
            <div key={i} className={`dt-rec-card dt-rec-${rec.priority}`}>
              <div className="dt-rec-header">
                <span className={`dt-rec-priority dt-pri-${rec.priority}`}>
                  {rec.priority.toUpperCase()}
                </span>
                <span className="dt-rec-type">{rec.type.replace(/_/g, " ")}</span>
              </div>
              <p>{rec.action}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GeoMap({ locations, weather, city }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerGroupRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (typeof window === "undefined" || mapInstance.current) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setMapReady(true);
    document.head.appendChild(script);
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.L) return;

    const center = weather?.coordinates
      ? [weather.coordinates.lat, weather.coordinates.lon]
      : [20.5937, 78.9629];

    if (!mapInstance.current) {
      const map = window.L.map(mapRef.current, { zoomControl: true }).setView(center, 12);
      window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);
      layerGroupRef.current = window.L.layerGroup().addTo(map);
      mapInstance.current = map;
    } else {
      mapInstance.current.flyTo(center, 12, { duration: 1.2 });
    }

    const map = mapInstance.current;
    if (layerGroupRef.current) {
      layerGroupRef.current.clearLayers();
    }

    if (weather?.coordinates && layerGroupRef.current) {
      const sevColor = SEVERITY_COLORS[weather.severity?.key] || "#4CAF50";
      window.L.circle([weather.coordinates.lat, weather.coordinates.lon], {
        radius: 14000,
        color: sevColor,
        fillColor: sevColor,
        fillOpacity: 0.15,
        weight: 2,
        dashArray: "4, 6",
      }).addTo(layerGroupRef.current);

      const centerMarker = window.L.marker([weather.coordinates.lat, weather.coordinates.lon])
        .addTo(layerGroupRef.current)
        .bindPopup(
          `<div style="font-family:var(--font-dm);text-align:center;padding:4px">` +
          `<strong style="font-size:15px">${weather.icon} ${weather.city} Weather Hub</strong><br/>` +
          `<span style="font-size:22px;font-weight:900;color:#171915">${weather.temperature}°C</span><br/>` +
          `<span style="font-size:12px;font-weight:600">${weather.desc} · Wind ${weather.windSpeed}km/h</span><br/>` +
          `<div style="margin-top:6px"><span style="background:${sevColor};color:#fff;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:800;letter-spacing:0.5px">${weather.severity?.label?.toUpperCase() || "NORMAL"}</span></div>` +
          `</div>`,
        );

      if (!locations?.length) {
        centerMarker.openPopup();
      }
    }

    const filteredLocations = (locations || []).filter(
      (loc) => selectedCategory === "all" || loc.category === selectedCategory,
    );

    if (filteredLocations.length && layerGroupRef.current) {
      for (const loc of filteredLocations) {
        const impColor = loc.impact
          ? loc.impact.cancellationRisk > 60
            ? "#F44336"
            : loc.impact.cancellationRisk > 30
              ? "#FF9800"
              : "#4CAF50"
          : "#2196F3";

        const marker = window.L.circleMarker([loc.lat, loc.lon], {
          radius: 8,
          color: "#171915",
          fillColor: impColor,
          fillOpacity: 0.9,
          weight: 2,
        }).addTo(layerGroupRef.current);

        marker.bindPopup(
          `<div style="font-family:var(--font-dm);min-width:180px">` +
          `<strong style="font-size:13px">${loc.title || "Hospitality Asset"}</strong><br/>` +
          `<span style="font-size:11px;font-weight:700;color:#555;text-transform:capitalize">🏷️ ${loc.category?.replace(/_/g, " ")}</span><br/>` +
          `<span style="font-size:11px">📍 ${loc.city || city}</span>` +
          (loc.impact
            ? `<div style="margin-top:6px;padding:6px;background:#f5f5f5;border-radius:6px;border-left:3px solid ${impColor}">` +
              `<strong style="font-size:11px;color:${impColor}">Cancellation Risk: ${loc.impact.cancellationRisk}%</strong><br/>` +
              `<span style="font-size:10px">Demand Δ: ${loc.impact.demandChange}% | Supply Δ: ${loc.impact.supplyChange}%</span>` +
              `</div>`
            : "") +
          `</div>`,
        );
      }
    }

    setTimeout(() => map.invalidateSize(), 200);
  }, [mapReady, weather, locations, city, selectedCategory]);

  return (
    <section className="dt-map-section">
      <div className="dt-section-head">
        <Globe size={18} />
        <h3>Geospatial Real-Time Weather & Asset Impact Map</h3>
        <Badge>GEOSPATIAL TWIN</Badge>
      </div>

      <div className="dt-map-filter-bar">
        <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.7 }}>Filter Assets:</span>
        <button
          className={`dt-map-filter-btn ${selectedCategory === "all" ? "dt-map-btn-active" : ""}`}
          onClick={() => setSelectedCategory("all")}
        >
          All Assets ({locations?.length || 0})
        </button>
        {["banquet_hall", "vehicles", "parking_capacity", "kitchen", "av_equipment", "furniture", "chairs"].map((c) => (
          <button
            key={c}
            className={`dt-map-filter-btn ${selectedCategory === c ? "dt-map-btn-active" : ""}`}
            onClick={() => setSelectedCategory(c)}
          >
            {c.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="dt-map-container" ref={mapRef} />
      <div className="dt-map-legend">
        <span><span className="dt-legend-dot" style={{ background: "#4CAF50" }} /> Normal Risk (&lt;30%)</span>
        <span><span className="dt-legend-dot" style={{ background: "#FF9800" }} /> Elevated Risk (30-60%)</span>
        <span><span className="dt-legend-dot" style={{ background: "#F44336" }} /> Critical Risk (&gt;60%)</span>
        <span><span className="dt-legend-dot" style={{ background: "#9C27B0" }} /> Severe Weather Footprint</span>
      </div>
    </section>
  );
}

function SummaryBanner({ summary }) {
  if (!summary) return null;
  return (
    <div className={`dt-summary-banner dt-risk-${summary.overallRisk}`}>
      <div className="dt-summary-text">
        <p className="dt-headline">{summary.headline}</p>
        <p className="dt-temp">{summary.temperature}</p>
      </div>
      <div className="dt-summary-stats">
        <div className="dt-stat">
          <span className="dt-stat-val">{summary.categoriesMonitored}</span>
          <span className="dt-stat-label">Categories</span>
        </div>
        <div className="dt-stat">
          <span className="dt-stat-val" style={{ color: summary.criticalCategories > 0 ? "#F44336" : "#4CAF50" }}>
            {summary.criticalCategories}
          </span>
          <span className="dt-stat-label">Critical</span>
        </div>
        <div className="dt-stat">
          <span className="dt-stat-val" style={{ color: summary.elevatedCategories > 0 ? "#FF9800" : "#4CAF50" }}>
            {summary.elevatedCategories}
          </span>
          <span className="dt-stat-label">Elevated</span>
        </div>
        <div className="dt-stat">
          <span className="dt-stat-val">{summary.cascadingEffectsCount}</span>
          <span className="dt-stat-label">Cascades</span>
        </div>
      </div>
    </div>
  );
}

export function WeatherTwin() {
  const [city, setCity] = useState("Mumbai");
  const [inputCity, setInputCity] = useState("Mumbai");
  const dtState = useData(`/digital-twin/state?city=${city}`);
  return (
    <>
      <Heading
        eyebrow="WEATHER-DRIVEN DIGITAL TWIN"
        title="AI Simulation Layer"
        description="Real-time weather monitoring with cascading impact analysis, what-if simulations, and social signal intelligence across your hospitality ecosystem."
      />
      <div className="dt-city-selector">
        <div className="dt-city-input-group">
          <MapPin size={16} />
          <input
            type="text"
            value={inputCity}
            onChange={(e) => setInputCity(e.target.value)}
            placeholder="Enter city name..."
            className="dt-city-input"
            onKeyDown={(e) => { if (e.key === "Enter") setCity(inputCity); }}
          />
          <button className="dt-city-btn" onClick={() => setCity(inputCity)}>
            <Search size={14} /> Analyze
          </button>
        </div>
        <div className="dt-quick-cities">
          {["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Pune", "Goa", "Jaipur"].map((c) => (
            <button
              key={c}
              className={`dt-quick-city ${city === c ? "dt-active-city" : ""}`}
              onClick={() => { setCity(c); setInputCity(c); }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <State resource={dtState}>
        {(data) => (
          <div className="dt-main-layout">
            <SummaryBanner summary={data.summary} />
            <EcosystemImpactBanner impact={data.ecosystemOperationalImpact} city={city} />
            <WeatherCard weather={data.currentWeather} />
            <GeoMap
              locations={data.entityLocations}
              weather={data.currentWeather}
              city={city}
            />
            <ForecastChart forecast={data.forecast} forecastImpacts={data.forecastImpacts} />
            <section className="dt-impacts-section">
              <div className="dt-section-head">
                <BarChart3 size={18} />
                <h3>Category Impact Analysis</h3>
                <Badge>{Object.keys(data.categoryImpacts || {}).length} categories</Badge>
              </div>
              <div className="dt-category-grid">
                {Object.entries(data.categoryImpacts || {}).map(([cat, catData]) => (
                  <CategoryImpactCard key={cat} cat={cat} data={catData} />
                ))}
              </div>
            </section>
            <CascadingEffects effects={data.cascadingEffects} />
            <WhatIfSimulator city={city} baseWeather={data.currentWeather} />
            <SocialPulse social={data.socialSignals} />
          </div>
        )}
      </State>
    </>
  );
}
