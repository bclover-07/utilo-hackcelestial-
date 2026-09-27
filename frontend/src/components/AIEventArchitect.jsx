"use client";
import { useState } from "react";
import Link from "next/link";
import { Sparkles, BrainCircuit, Users, MapPin, IndianRupee, Clock, ArrowRight, CheckCircle2, ChevronRight, Layers, ExternalLink, Zap, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Badge, money } from "./ui";

const PRESETS = [
  {
    label: "🎓 Tech Summit (350 Attendees)",
    prompt: "A full-day technical conference for 350 developers and tech founders in Mumbai. We need auditorium seating, high-lumen projectors with screens, wireless microphones and audio system, registration counters, and high-speed Wi-Fi router setup.",
    city: "Mumbai",
    guests: 350,
    budget: 150000,
  },
  {
    label: "💍 Grand Wedding (500 Guests)",
    prompt: "An outdoor evening wedding celebration for 500 guests in Mumbai. Requires 50 round dining tables, 500 banquet chairs, decorative fairy & truss stage lighting, heavy-duty 62.5 kVA diesel generator for backup power, and premium DJ sound setup.",
    city: "Mumbai",
    guests: 500,
    budget: 350000,
  },
  {
    label: "🎸 College Music Fest (800 Attendees)",
    prompt: "Outdoor college cultural fest for 800 students. Needs concert line-array sound system, truss lighting with moving heads, 800 plastic chairs, stage barricades, and heavy duty silent generator backup.",
    city: "Mumbai",
    guests: 800,
    budget: 250000,
  },
  {
    label: "🏢 Corporate Workshop (120 VIPs)",
    prompt: "Corporate leadership workshop for 120 executives for 6 hours. Requires premium ergonomic chairs, 12 round discussion tables, 85-inch 4K LED interactive display, podium mic, and delivery setup.",
    city: "Mumbai",
    guests: 120,
    budget: 75000,
  },
];

export default function AIEventArchitect({ onApplyToConductor, defaultCity = "Mumbai" }) {
  const [prompt, setPrompt] = useState("");
  const [city, setCity] = useState(defaultCity || "Mumbai");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  async function handlePlan(selectedPrompt = null, selectedCity = null, selectedBudget = null) {
    const textToPlan = selectedPrompt || prompt;
    if (!textToPlan || textToPlan.trim().length < 5) {
      setError("Please describe your event or select a preset.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setActiveStep(1);

    try {
      const stepTimer1 = setTimeout(() => setActiveStep(2), 500);
      const stepTimer2 = setTimeout(() => setActiveStep(3), 1100);

      const payload = {
        prompt: textToPlan.trim(),
        city: selectedCity !== null ? selectedCity : (city || "Mumbai"),
        budget: Number(selectedBudget !== null ? selectedBudget : budget) || undefined,
      };

      const res = await api("/ai/event-planner", {
        method: "POST",
        body: payload,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setActiveStep(4);
      setResult(res);
    } catch (err) {
      setError(err?.message || "Failed to generate autonomous event plan. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(p) {
    setPrompt(p.prompt);
    setCity(p.city);
    setBudget(String(p.budget));
    handlePlan(p.prompt, p.city, p.budget);
  }

  return (
    <div className="panel" style={{
      background: "linear-gradient(135deg, #fdfbf7 0%, #f4effa 100%)",
      border: "2px solid #171915",
      borderRadius: "24px",
      boxShadow: "6px 6px 0px #171915",
      padding: "2rem",
      marginBottom: "2rem",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Header with Nugen AI Alignment Badge */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
            <span style={{
              background: "#b6e880",
              border: "1.5px solid #171915",
              borderRadius: "99px",
              padding: "4px 10px",
              fontSize: "0.75rem",
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <BrainCircuit size={14} /> AUTONOMOUS AI AGENT
            </span>
            <span style={{
              background: "#c8beff",
              border: "1.5px solid #171915",
              borderRadius: "99px",
              padding: "4px 10px",
              fontSize: "0.75rem",
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <Zap size={14} /> NUGEN ALIGNED (QWEN 2.5)
            </span>
          </div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 900, letterSpacing: "-0.04em", margin: 0 }}>
            AI Event Resource Architect
          </h2>
          <p style={{ margin: "0.4rem 0 0", color: "#555", fontSize: "0.95rem", maxWidth: "650px" }}>
            State the event, guest count, and city. Our domain-aligned LangGraph multi-node agent derives equipment ratios, queries live MongoDB inventory, and synthesizes multi-vendor packages automatically.
          </p>
        </div>

        {/* Quick Presets */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#777" }}>
            Try Instant Presets:
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", maxWidth: "420px" }}>
            {PRESETS.map((p, i) => (
              <button
                key={i}
                type="button"
                className="quiet"
                disabled={loading}
                onClick={() => applyPreset(p)}
                style={{
                  fontSize: "0.78rem",
                  padding: "5px 10px",
                  borderRadius: "10px",
                  background: "#fff",
                  border: "1.5px solid #171915",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "2px 2px 0px #171915",
                  textAlign: "left"
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Bar */}
      <div style={{
        background: "#ffffff",
        border: "2px solid #171915",
        borderRadius: "16px",
        padding: "1rem",
        boxShadow: "4px 4px 0px #171915",
        marginBottom: "1.5rem"
      }}>
        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Describe your event plan, guest count, and special equipment needs:
        </label>
        <textarea
          rows={3}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="E.g., 300 guests corporate award night in Mumbai for 5 hours. We need 300 banquet chairs, 30 round tables, dual 4K projectors, PA sound system with 4 cordless mics, and stage lights with power backup."
          disabled={loading}
          style={{
            width: "100%",
            borderRadius: "10px",
            border: "1.5px solid #171915",
            padding: "0.75rem",
            fontSize: "0.95rem",
            fontFamily: "inherit",
            resize: "vertical",
            marginBottom: "0.75rem"
          }}
        />

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              <MapPin size={16} />
              <input
                type="text"
                placeholder="City (e.g. Mumbai)"
                value={city}
                onChange={e => setCity(e.target.value)}
                disabled={loading}
                style={{
                  border: "1.5px solid #171915",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "0.85rem",
                  width: "140px"
                }}
              />
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              <IndianRupee size={16} />
              <input
                type="number"
                placeholder="Budget ₹ (optional)"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                disabled={loading}
                style={{
                  border: "1.5px solid #171915",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "0.85rem",
                  width: "150px"
                }}
              />
            </div>
          </div>

          <button
            type="button"
            className="button"
            disabled={loading || !prompt.trim()}
            onClick={() => handlePlan()}
            style={{
              background: "#171915",
              color: "#fff",
              fontWeight: 800,
              padding: "10px 20px",
              borderRadius: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                Agent Pipeline Running...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Autonomous Plan
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: "#ffe6ed",
          border: "2px solid #171915",
          borderRadius: "12px",
          padding: "0.75rem 1rem",
          color: "#900",
          fontWeight: 600,
          marginBottom: "1rem"
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Live Pipeline Stepper Animation during execution or on result */}
      {(loading || result) && (
        <div style={{
          background: "#fff",
          border: "1.5px solid #171915",
          borderRadius: "14px",
          padding: "1rem",
          boxShadow: "3px 3px 0px #171915",
          marginBottom: "1.5rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.08em", color: "#666" }}>
              LANGGRAPH REASONING PIPELINE · EXECUTION TRACE
            </span>
            {result?.elapsedMs && (
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#166534" }}>
                ✓ Completed in {(result.elapsedMs / 1000).toFixed(2)}s
              </span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
            {(result?.pipeline || [
              { step: "Parse Event Intent", detail: "Extracting guests, type, duration..." },
              { step: "Load Categories", detail: "Fetching catalog from MongoDB..." },
              { step: "Nugen Requirement Model", detail: "Computing guest:equipment ratios..." },
              { step: "Search Inventory", detail: "Querying active verified suppliers..." },
              { step: "Build Plan & Package", detail: "Assembling multi-vendor solution..." },
            ]).map((pipe, idx) => {
              const isDone = result || activeStep > idx;
              const isCurrent = loading && activeStep === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: isDone ? "#f0fdf4" : isCurrent ? "#fffbeb" : "#fafafa",
                    border: `1.5px solid ${isDone ? "#166534" : isCurrent ? "#b45309" : "#ccc"}`,
                    borderRadius: "10px",
                    padding: "0.6rem 0.8rem",
                    transition: "all 0.3s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 700, color: isDone ? "#166534" : "#171915" }}>
                    {isDone ? <CheckCircle2 size={15} color="#166534" /> : <div style={{ width: 8, height: 8, borderRadius: "50%", background: isCurrent ? "#f59e0b" : "#aaa" }} />}
                    {pipe.step}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "3px" }}>
                    {pipe.detail}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Generated Results View */}
      {result && result.plan && (
        <div style={{ marginTop: "1rem" }}>
          {/* Summary Banner */}
          <div style={{
            background: "#b6e880",
            border: "2px solid #171915",
            borderRadius: "18px",
            padding: "1.25rem",
            boxShadow: "4px 4px 0px #171915",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.5rem"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                <Badge>{result.eventIntent?.eventType?.toUpperCase() || "EVENT PACKAGE"}</Badge>
                <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  👥 {result.eventIntent?.guestCount} Guests · ⏱️ {result.eventIntent?.durationHours}h · 📍 {result.eventIntent?.city}
                </span>
              </div>
              <h3 style={{ fontSize: "1.4rem", fontWeight: 900, margin: 0, letterSpacing: "-0.03em" }}>
                {result.plan.title}
              </h3>
              <p style={{ margin: "0.3rem 0 0", fontSize: "0.88rem", color: "#222" }}>
                {result.requirements?.reasoning}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>ESTIMATED TOTAL</span>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, lineHeight: 1.1 }}>
                  {money(result.plan.summary.estimatedTotal)}
                </div>
                <small style={{ color: "#333", fontWeight: 600 }}>
                  {result.plan.summary.coveragePercent}% of requested items available locally
                </small>
              </div>

              {onApplyToConductor && (
                <button
                  type="button"
                  className="button"
                  onClick={() => onApplyToConductor(result)}
                  style={{
                    background: "#171915",
                    color: "#ffe66d",
                    fontWeight: 800,
                    borderRadius: "10px",
                    padding: "8px 14px",
                    fontSize: "0.85rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Layers size={15} /> Apply to Conductor Engine <ChevronRight size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Equipment Requirements & Live Matched Inventory */}
          <h4 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Sparkles size={18} /> Required Equipment & Nearest Active Suppliers ({result.plan.items.length} items derived)
          </h4>

          <div style={{ display: "grid", gap: "1rem" }}>
            {result.plan.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "#fff",
                  border: "2px solid #171915",
                  borderRadius: "14px",
                  padding: "1rem",
                  boxShadow: "3px 3px 0px #171915"
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{
                        background: "#ffe66d",
                        border: "1px solid #171915",
                        borderRadius: "6px",
                        padding: "2px 7px",
                        fontSize: "0.75rem",
                        fontWeight: 800
                      }}>
                        {item.category.toUpperCase()}
                      </span>
                      <strong style={{ fontSize: "1.05rem" }}>{item.label}</strong>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#666", marginTop: "4px" }}>
                      Quantity required: <strong>{item.quantity} units</strong> (capacity ratio: {item.capacity} guests/unit)
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>
                      Est: {money(item.estimatedCost)}
                    </div>
                    <span style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: item.status === "matched" ? "#166534" : "#991b1b"
                    }}>
                      {item.status === "matched" ? `✓ ${item.availableMatches} suppliers in ${result.eventIntent?.city}` : "⚠️ Custom sourcing needed"}
                    </span>
                  </div>
                </div>

                {/* Available listings cards for this item */}
                {item.topListings && item.topListings.length > 0 ? (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "0.75rem",
                    marginTop: "0.5rem",
                    paddingTop: "0.75rem",
                    borderTop: "1px dashed #ccc"
                  }}>
                    {item.topListings.map(listing => (
                      <div
                        key={listing.id}
                        style={{
                          background: "#f9fafb",
                          border: "1.5px solid #171915",
                          borderRadius: "10px",
                          padding: "0.75rem",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "3px" }}>
                            {listing.title}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#555" }}>
                            ₹{listing.price}/{listing.unit || "day"} · Stock: {listing.quantity} units
                          </div>
                          {listing.delivery && (
                            <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 600 }}>
                              ✓ Delivery available (+₹{listing.deliveryFee || 0})
                            </span>
                          )}
                        </div>

                        <div style={{ marginTop: "0.6rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.75rem", color: "#777" }}>📍 {listing.city}</span>
                          <Link
                            href={`/dashboard/resources/${listing.id}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              color: "#171915"
                            }}
                          >
                            View & Contact <ExternalLink size={12} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.8rem", color: "#777", background: "#fdf8f6", padding: "0.5rem", borderRadius: "8px", border: "1px solid #fbd5c5" }}>
                    No exact listings currently active in {result.eventIntent?.city} for this category. Utlio's multi-vendor RFQ will broadcast this requirement to regional verified suppliers upon package creation.
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Autonomous RFQ / Contact Action */}
          <div style={{
            marginTop: "1.5rem",
            background: "#fff",
            border: "2px solid #171915",
            borderRadius: "16px",
            padding: "1.25rem",
            boxShadow: "4px 4px 0px #171915",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ShieldCheck size={20} color="#166534" />
                <strong style={{ fontSize: "1rem" }}>Ready to execute this multi-vendor package?</strong>
              </div>
              <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", color: "#666" }}>
                Load this package into the Conductor Engine to stress-test supplier dropouts, or open RFQ requests directly.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {onApplyToConductor && (
                <button
                  type="button"
                  className="button"
                  onClick={() => onApplyToConductor(result)}
                  style={{
                    background: "#ffe66d",
                    color: "#171915",
                    fontWeight: 800,
                    borderRadius: "10px",
                    padding: "9px 16px",
                    fontSize: "0.88rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Layers size={16} /> Pre-fill Conductor Solver
                </button>
              )}
              <Link
                href="/dashboard/requests"
                className="button"
                style={{
                  background: "#171915",
                  color: "#fff",
                  fontWeight: 800,
                  borderRadius: "10px",
                  padding: "9px 16px",
                  fontSize: "0.88rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Send size={15} /> Go to Requests
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
