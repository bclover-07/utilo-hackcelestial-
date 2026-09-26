"use client";
import { useState } from "react";
import { SmartPricingPage } from "./SmartPricing";
import { DemandForecastPage } from "./DemandForecast";

export default function YieldContainer() {
  const [activeTab, setActiveTab] = useState("pricing");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
        <div className="persona-toggle" aria-label="Toggle Mode" style={{ width: "100%", maxWidth: "600px", display: "flex" }}>
          <button
            type="button"
            aria-pressed={activeTab === "pricing"}
            className={activeTab === "pricing" ? "selected" : ""}
            onClick={() => setActiveTab("pricing")}
            style={{ flex: 1, padding: "0.75rem", fontSize: "1rem" }}
          >
            Smart pricing advisor
          </button>
          <button
            type="button"
            aria-pressed={activeTab === "forecast"}
            className={activeTab === "forecast" ? "selected" : ""}
            onClick={() => setActiveTab("forecast")}
            style={{ flex: 1, padding: "0.75rem", fontSize: "1rem" }}
          >
            Demand outlook & trends
          </button>
        </div>
      </div>
      <div style={{ animation: "fadeIn 0.2s ease-in-out" }}>
        {activeTab === "pricing" && <SmartPricingPage />}
        {activeTab === "forecast" && <DemandForecastPage />}
      </div>
    </div>
  );
}
