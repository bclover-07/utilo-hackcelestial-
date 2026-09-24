"use client";
import { Component, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { colors } from "./ui";

const Scene = dynamic(() => import("./ResourceScene"), {
  ssr: false,
  loading: () => (
    <div className="scene-label">
      <span className="comic-star-badge">⚡ 3D SCULPTURE</span>
      <br />
      LOADING CARTOON MODELS…
    </div>
  ),
});

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-label">
        <span className="comic-star-badge">✳ UTLIO B2B</span>
        <br />
        MORE IDLE. MORE POSSIBLE.
      </div>
    ) : (
      this.props.children
    );
  }
}

// 8 AI Agents Data
const aiAgents = [
  {
    name: "Request Parser",
    role: "Natural Language to RFQ",
    desc: "Transforms freeform event briefs into structured multi-item inventory queries.",
    icon: "📝",
    tag: "LangChain",
    color: "#FFE66D",
  },
  {
    name: "Bundle Planner",
    role: "Multi-Item Decomposer",
    desc: "Splits complex requests (hall + 300 chairs + AV) into independent fulfillable sub-deals.",
    icon: "📦",
    tag: "LangGraph",
    color: "#4ECDC4",
  },
  {
    name: "Ranking Explainer",
    role: "Transparent Match Engine",
    desc: "Scores candidates on distance, budget, capacity, and historical response rate.",
    icon: "🎯",
    tag: "Deterministic",
    color: "#C3B1E1",
  },
  {
    name: "Negotiation Advisor",
    role: "Tactical Deal Copilot",
    desc: "Analyzes counter-offers and suggests mutually beneficial concession strategies.",
    icon: "🤝",
    tag: "LangGraph Checkpointer",
    color: "#FF85A1",
  },
  {
    name: "Demand Forecaster",
    role: "Predictive Analytics",
    desc: "Identifies upcoming geographic demand surges and high-liquidity resource categories.",
    icon: "📈",
    tag: "Aggregation + LLM",
    color: "#A6F420",
  },
  {
    name: "Smart Pricing",
    role: "Dynamic Yield Optimization",
    desc: "Recommends competitive weekday and weekend pricing based on local market comps.",
    icon: "💎",
    tag: "Gemini",
    color: "#FFD13B",
  },
  {
    name: "Sentiment Analyst",
    role: "Negotiation Climate Monitor",
    desc: "Monitors tone in deal conversations to proactively detect friction or agreement.",
    icon: "💬",
    tag: "Classifier",
    color: "#85E8B8",
  },
  {
    name: "Urgency Scorer",
    role: "Emergency Dispatch",
    desc: "Boosts broadcast priority for urgent event requirements happening in <72 hours.",
    icon: "⚡",
    tag: "Real-time",
    color: "#FF7A59",
  },
];

// Interactive Event Bundle Presets
const simulatorPresets = [
  {
    title: "Tech Summit Gala (250 Pax)",
    icon: "💻",
    description: "Annual fintech leadership summit requiring acoustic hall, luxury seating, and 4K projection.",
    items: [
      { name: "Executive Banquet Ballroom", qty: "1 Hall", budget: "₹45,000 - ₹65,000" },
      { name: "Cushioned Chiavari Chairs", qty: "250 Units", budget: "₹18,000 - ₹22,000" },
      { name: "4K Laser Projector & Dual Line-Array", qty: "1 Setup", budget: "₹25,000 - ₹32,000" },
    ],
    totalRange: "₹88,000 - ₹1,19,000",
    timeSaved: "Save ~14 hours of broker calls",
  },
  {
    title: "Royal Wedding Reception (500 Pax)",
    icon: "👑",
    description: "Large-scale wedding overflow requiring pillar-less hall, round dining tables, and stage lighting.",
    items: [
      { name: "Grand Pillar-less Ballroom", qty: "1 Hall", budget: "₹75,000 - ₹1,10,000" },
      { name: "Gold Chiavari Banquet Chairs", qty: "500 Units", budget: "₹38,000 - ₹45,000" },
      { name: "Round Banquet Tables with Linens", qty: "50 Tables", budget: "₹20,000 - ₹28,000" },
      { name: "Stage Lighting & Ambient Truss", qty: "Full Rig", budget: "₹30,000 - ₹40,000" },
    ],
    totalRange: "₹1,63,000 - ₹2,23,000",
    timeSaved: "Save ~22 hours of supplier coordination",
  },
  {
    title: "Catering Overflow & Pop-up (100 Pax)",
    icon: "🍳",
    description: "Weekend pop-up kitchen needing commercial prep space and food warmers.",
    items: [
      { name: "Commercial Prep Kitchen (12hr Shift)", qty: "1 Space", budget: "₹14,000 - ₹20,000" },
      { name: "Buffet Warmers & Chafing Dishes", qty: "12 Sets", budget: "₹4,500 - ₹7,000" },
      { name: "Cocktail High-Top Tables", qty: "15 Tables", budget: "₹6,000 - ₹9,000" },
    ],
    totalRange: "₹24,500 - ₹36,000",
    timeSaved: "Save ~8 hours of WhatsApp hunt",
  },
  {
    title: "Rooftop Networking Mixer (80 Pax)",
    icon: "🍸",
    description: "Sunset business networking requiring terrace lounge, PA audio, and cocktail furniture.",
    items: [
      { name: "Terrace Event Space", qty: "1 Venue", budget: "₹20,000 - ₹30,000" },
      { name: "Lounge Seating & Bar Stools", qty: "60 Units", budget: "₹9,000 - ₹14,000" },
      { name: "Compact Portable PA & Wireless Mics", qty: "1 Kit", budget: "₹8,000 - ₹12,000" },
    ],
    totalRange: "₹37,000 - ₹56,000",
    timeSaved: "Save ~6 hours of enquiry calls",
  },
];

export default function Landing() {
  const router = useRouter();
  const auth = useAuth();
  const reduced = useReducedMotion();
  const [webgl, setWebgl] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const canvas = document.createElement("canvas");
      setWebgl(!!(canvas.getContext("webgl2") || canvas.getContext("webgl")));
    });
    const handleResize = () => {
      if (window.innerWidth > 860) {
        setMobileNav(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleQuickDemo = async (role) => {
    try {
      const email =
        role === "provider"
          ? "provider@utlio.com"
          : role === "seeker"
            ? "seeker@utlio.com"
            : "admin@utlio.com";
      await auth.login({
        email,
        password: "Password123!",
        role: role === "admin" ? "admin" : "business",
      });
      router.push(role === "admin" ? "/admin" : "/dashboard");
    } catch (e) {
      router.push(`/login?role=${role}`);
    }
  };

  return (
    <div className="landing">
      {/* 1. Comic Navigation Bar */}
      <nav className="landing-nav">
        <Link href="/" className="brand">
          <span>U</span>utlio<span className="brand-dot">✳</span>
        </Link>

        <div className="landing-links">
          <a href="#demo-access">Demo Credentials</a>
          <a href="#how">How it works</a>
          <a href="#categories">Categories</a>
          <a href="#ai-agents">8 AI Agents</a>
          <a href="#simulator">Bundle Simulator</a>
          <a href="#questions">FAQ</a>
        </div>

        <div className="actions">
          <Link className="button quiet" href="/login">
            Log in
          </Link>
          <Link className="button" href="/register">
            Join Exchange ↗
          </Link>
        </div>

        <button
          className="landing-mobile-toggle quiet"
          onClick={() => setMobileNav(!mobileNav)}
          aria-label="Toggle navigation"
        >
          {mobileNav ? "✕" : "☰"}
        </button>

        {mobileNav && (
          <div className="landing-mobile-drawer">
            <a href="#demo-access" onClick={() => setMobileNav(false)}>
              ⚡ Demo Credentials
            </a>
            <a href="#how" onClick={() => setMobileNav(false)}>
              How it works
            </a>
            <a href="#categories" onClick={() => setMobileNav(false)}>
              Categories
            </a>
            <a href="#ai-agents" onClick={() => setMobileNav(false)}>
              8 AI Agents
            </a>
            <a href="#simulator" onClick={() => setMobileNav(false)}>
              Bundle Simulator
            </a>
            <a href="#questions" onClick={() => setMobileNav(false)}>
              Questions
            </a>
            <div className="landing-mobile-actions">
              <Link
                className="button quiet"
                href="/login"
                onClick={() => setMobileNav(false)}
              >
                Log in
              </Link>
              <Link
                className="button"
                href="/register"
                onClick={() => setMobileNav(false)}
              >
                Join Exchange ↗
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main>
        {/* 2. Hero Section */}
        <section className="landing-hero">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
              <span className="comic-sticker" style={{ background: "#FFE66D" }}>
                ★ 100% B2B VERIFIED
              </span>
              <span className="comic-sticker" style={{ background: "#4ECDC4" }}>
                ⚡ ZERO BROKERAGE
              </span>
              <span className="comic-sticker" style={{ background: "#C3B1E1" }}>
                🤖 8 AI AGENTS
              </span>
            </div>

            <h1 className="comic-hero-title">
              Less Idle.
              <br />
              More <span className="comic-highlight">Possible!</span>
              <sup style={{ fontSize: "32px", color: "var(--coral)" }}>✳</sup>
            </h1>

            <p style={{ fontSize: "17px", maxWidth: "580px", color: "#383832" }}>
              Your spare hall. Their big event day.
              <br />
              Stop chasing brokers and fragmented WhatsApp groups. Share banquet spaces,
              commercial kitchens, seating, and sound across nearby verified hospitality businesses.
            </p>

            {/* Instant 1-Click Demo Bar */}
            <div className="demo-cred-bar" id="demo-access">
              <div className="demo-cred-header">
                <h4>
                  <span style={{ fontSize: "20px" }}>⚡</span> Instant Demo Login (1-Click Judge Access)
                </h4>
                <span className="comic-star-badge">READY WITH SEED DATA</span>
              </div>
              <div className="demo-buttons-grid">
                <button
                  type="button"
                  className="demo-btn provider"
                  onClick={() => handleQuickDemo("provider")}
                >
                  <strong>↗ Launch Demo Provider</strong>
                  <small>The Grand Mumbai Palace (Hotel & Banquets)</small>
                  <span className="cred-hint">provider@utlio.com · Password123!</span>
                </button>
                <button
                  type="button"
                  className="demo-btn seeker"
                  onClick={() => handleQuickDemo("seeker")}
                >
                  <strong>⌕ Launch Demo Seeker</strong>
                  <small>Elite Corporate Events (Event Planner)</small>
                  <span className="cred-hint">seeker@utlio.com · Password123!</span>
                </button>
                <button
                  type="button"
                  className="demo-btn admin"
                  onClick={() => handleQuickDemo("admin")}
                >
                  <strong>🛡️ Launch Demo Admin</strong>
                  <small>Operations Studio (Verifications & Disputes)</small>
                  <span className="cred-hint">admin@utlio.com · Password123!</span>
                </button>
              </div>
            </div>

            <div className="actions" style={{ marginTop: "16px" }}>
              <Link className="button" href="/register">
                Start Exchanging Resources ↗
              </Link>
              <a className="button quiet" href="#how">
                See How It Works ↓
              </a>
            </div>
          </motion.div>

          <div className="hero-art">
            <div className="hero-sticker top" style={{ background: "#FFE66D" }}>
              NEVER LET A HALL
              <br />
              <strong>SIT EMPTY ⚡</strong>
            </div>

            <div className="scene-frame">
              {webgl && !reduced ? (
                <SceneBoundary>
                  <Scene />
                </SceneBoundary>
              ) : (
                <div className="scene-label">
                  ⌂ ✳ ▦<br />
                  3D HOSPITALITY SCULPTURE
                </div>
              )}
            </div>

            <div className="hero-sticker bottom" style={{ background: "#4ECDC4" }}>
              MULTI-ITEM RFQ
              <br />
              <strong>AI COLLISION SHIELD 🛡️</strong>
            </div>
            <span className="art-orbit" aria-hidden="true">
              ✺
            </span>
          </div>
        </section>

        {/* Comic Continuous Ticker */}
        <div className="ticker" aria-hidden="true">
          <div>
            BANQUET BALLROOMS ✳ 250 CHIAVARI CHAIRS ✳ JBL LINE ARRAYS ✳ 4K LASER SCREENS ✳ COMMERCIAL KITCHENS ✳ TENTS & LINENS ✳ ZERO DOUBLE-BOOKINGS ✳
            BANQUET BALLROOMS ✳ 250 CHIAVARI CHAIRS ✳ JBL LINE ARRAYS ✳ 4K LASER SCREENS ✳ COMMERCIAL KITCHENS ✳ TENTS & LINENS ✳ ZERO DOUBLE-BOOKINGS ✳
          </div>
        </div>

        {/* 3. The Problem: WhatsApp Chaos vs. The Utlio Exchange */}
        <section className="landing-section" id="problem">
          <span className="eyebrow">THE BROKEN BROKER PLAYBOOK VS. UTLIO</span>
          <div className="section-intro">
            <h2>
              Why WhatsApp groups
              <br />
              <span className="comic-highlight-pink">cost you thousands</span> every weekend.
            </h2>
            <p>
              When a venue owner has an open date, they broadcast to WhatsApp groups. When an event planner
              needs 200 chairs, they make 12 phone calls. Here is what changes today.
            </p>
          </div>

          <div className="comic-chaos-grid">
            <div className="comic-chaos-card broken">
              <span className="comic-star-badge" style={{ background: "white", color: "#1e1e1e" }}>
                ❌ THE OLD FRAGMENTED WAY
              </span>
              <h3 style={{ marginTop: "14px", fontSize: "22px" }}>Chaos, Brokers & Guesswork</h3>
              <div className="comic-list-item">
                <span className="comic-list-icon">✕</span>
                <div>
                  <strong>15% to 25% Broker Surcharge:</strong> Middlemen mark up prices with zero transparency.
                </div>
              </div>
              <div className="comic-list-item">
                <span className="comic-list-icon">✕</span>
                <div>
                  <strong>Double-Booking Nightmares:</strong> Informal verbal locks lead to last-minute cancellations.
                </div>
              </div>
              <div className="comic-list-item">
                <span className="comic-list-icon">✕</span>
                <div>
                  <strong>Endless Disconnected DMs:</strong> Hunting across WhatsApp chats with zero price comparison.
                </div>
              </div>
              <div className="comic-list-item">
                <span className="comic-list-icon">✕</span>
                <div>
                  <strong>No Quality Guarantee:</strong> Unverified suppliers, broken gear, and zero dispute recourse.
                </div>
              </div>
            </div>

            <div className="comic-chaos-card solved">
              <span className="comic-star-badge" style={{ background: "white", color: "#1e1e1e" }}>
                ✓ THE UTLIO B2B EXCHANGE
              </span>
              <h3 style={{ marginTop: "14px", fontSize: "22px" }}>Atomic, Transparent & Verified</h3>
              <div className="comic-list-item">
                <span className="comic-list-icon">✓</span>
                <div>
                  <strong>Direct Peer Pricing:</strong> 0% broker markup; clear security deposit and cancellation terms.
                </div>
              </div>
              <div className="comic-list-item">
                <span className="comic-list-icon">✓</span>
                <div>
                  <strong>Collision-Proof Booking:</strong> MongoDB ACID transactions mathematically guarantee zero double-bookings.
                </div>
              </div>
              <div className="comic-list-item">
                <span className="comic-list-icon">✓</span>
                <div>
                  <strong>One-Click Multi-Item RFQ:</strong> 1 request auto-broadcasts to all verified providers in your city radius.
                </div>
              </div>
              <div className="comic-list-item">
                <span className="comic-list-icon">✓</span>
                <div>
                  <strong>Verified GST & Real Reviews:</strong> Every business is vetted, and reviews are tied to confirmed bookings.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Live Category Showcase */}
        <section className="landing-section" id="categories">
          <span className="eyebrow">HOSPITALITY TAXONOMY</span>
          <div className="section-intro">
            <h2>
              Everything an event needs.
              <br />
              <span className="comic-highlight">All in one network.</span>
            </h2>
            <p>
              Whether you have 4 spare hours in your banquet hall or 300 unused chiavari chairs,
              turn your idle assets into recurring revenue.
            </p>
          </div>

          <div className="comic-cat-grid">
            {[
              {
                icon: "🏛️",
                title: "Banquet Halls & Venues",
                desc: "Ballrooms, terrace lawns, and conference halls with capacity tracking and parking metadata.",
                count: "12+ Venues",
                color: "#FFE66D",
              },
              {
                icon: "🪑",
                title: "Chairs & Seating",
                desc: "Chiavari chairs, cushioned banquet seats, sofas, and lounge seating sets.",
                count: "2,500+ Units",
                color: "#4ECDC4",
              },
              {
                icon: "🍽️",
                title: "Tables & Setups",
                desc: "Round banquet dining tables, cocktail high-tops, and banquet buffet counters.",
                count: "350+ Tables",
                color: "#FFB347",
              },
              {
                icon: "🔊",
                title: "Audio, Visual & LED",
                desc: "JBL line arrays, digital mixers, Shure wireless mics, and 4K laser projectors.",
                count: "45+ Packages",
                color: "#C3B1E1",
              },
              {
                icon: "🎪",
                title: "Linens & Decor Tents",
                desc: "Ivory table linens, velvet chair bows, waterproof German marquees, and staging trusses.",
                count: "800+ Linens",
                color: "#FF85A1",
              },
              {
                icon: "🍳",
                title: "Commercial Kitchens",
                desc: "Licensed cloud prep spaces, industrial combi ovens, refrigeration, and buffet chafing gear.",
                count: "18+ Kitchens",
                color: "#85E8B8",
              },
            ].map((cat) => (
              <div
                className="comic-cat-card"
                key={cat.title}
                style={{ background: cat.color }}
              >
                <div>
                  <div className="icon-bubble">{cat.icon}</div>
                  <h3 style={{ fontSize: "19px", marginBottom: "8px" }}>{cat.title}</h3>
                  <p style={{ fontSize: "14px", color: "#2d2d27" }}>{cat.desc}</p>
                </div>
                <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="comic-star-badge" style={{ background: "white" }}>
                    {cat.count}
                  </span>
                  <Link
                    href="/dashboard/search"
                    style={{ fontWeight: 800, fontSize: "13px", textDecoration: "underline" }}
                  >
                    Explore →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. How It Works: 4-Step Comic Storyboard */}
        <section className="landing-section" id="how">
          <span className="eyebrow">FOUR SIMPLE MOVES</span>
          <div className="section-intro">
            <h2>
              From requirement
              <br />
              to <span className="comic-highlight">confirmed booking.</span>
            </h2>
            <p>A unified workflow designed specifically for high-stakes hospitality transactions.</p>
          </div>

          <div className="comic-storyboard-grid">
            {[
              {
                step: "01",
                title: "Broadcast Your Need",
                desc: "Post a natural-language brief or pick exact categories, dates, quantity, and budget. One RFQ automatically reaches all matching suppliers.",
                badge: "AI PARSED",
                color: "#FFE66D",
              },
              {
                step: "02",
                title: "AI Match & Distance Rank",
                desc: "Deterministic matching algorithm ranks providers by distance, verified review score, inventory compatibility, and budget fit.",
                badge: "EXPLAINABLE",
                color: "#4ECDC4",
              },
              {
                step: "03",
                title: "Structured Bargaining",
                desc: "Negotiate price, security deposit, and logistics inside a version-tracked offer thread. AI negotiation advisor suggests fair counter-offers.",
                badge: "VERSION TRACKED",
                color: "#C3B1E1",
              },
              {
                step: "04",
                title: "Atomic Lock & Fulfil",
                desc: "On offer acceptance, MongoDB ACID transactions automatically lock dates, generate iCal sync, and issue an immutable deal receipt.",
                badge: "ZERO CONFLICT",
                color: "#FF85A1",
              },
            ].map((step) => (
              <div className="comic-story-card" key={step.step}>
                <span className="comic-step-pill" style={{ background: step.color }}>
                  STEP {step.step}
                </span>
                <span
                  style={{
                    alignSelf: "flex-end",
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "1px",
                    color: "#5e5e54",
                  }}
                >
                  {step.badge}
                </span>
                <h3 style={{ fontSize: "20px", marginTop: "16px", marginBottom: "10px" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "14px", color: "#45453e" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. The 8 AI Agents Control Room */}
        <section className="landing-section" id="ai-agents">
          <span className="eyebrow">LANGGRAPH AGENTIC WORKFLOW</span>
          <div className="section-intro">
            <h2>
              8 specialized AI agents.
              <br />
              <span className="comic-highlight">Zero decorative fluff.</span>
            </h2>
            <p>
              Instead of an arbitrary chatbot, Utlio runs a stateful LangGraph multi-agent pipeline
              where each agent owns an explicit responsibility in the booking lifecycle.
            </p>
          </div>

          <div className="agents-control-grid">
            {aiAgents.map((agent) => (
              <div className="agent-card" key={agent.name}>
                <div className="agent-card-header">
                  <span className="agent-icon">{agent.icon}</span>
                  <span
                    className="comic-star-badge"
                    style={{ background: agent.color }}
                  >
                    {agent.tag}
                  </span>
                </div>
                <h3 style={{ fontSize: "18px", marginBottom: "4px" }}>{agent.name}</h3>
                <small style={{ fontWeight: 800, color: "#66665e", textTransform: "uppercase" }}>
                  {agent.role}
                </small>
                <p style={{ fontSize: "13px", marginTop: "10px", color: "#404038" }}>
                  {agent.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Interactive Event Bundle Simulator */}
        <section className="landing-section" id="simulator">
          <span className="eyebrow">TRY IT IN ACTION</span>
          <div className="section-intro">
            <h2>
              Interactive Event
              <br />
              <span className="comic-highlight">Bundle Simulator.</span>
            </h2>
            <p>Select an event scenario below to see how Utlio decomposes the requirements into a live inventory bundle.</p>
          </div>

          <div className="simulator-sandbox">
            <h3 style={{ fontSize: "20px", marginBottom: "14px" }}>
              1. Choose an Event Scenario:
            </h3>

            <div className="simulator-presets">
              {simulatorPresets.map((preset, index) => (
                <button
                  type="button"
                  key={preset.title}
                  className={`sim-preset-btn ${selectedPreset === index ? "active" : ""}`}
                  onClick={() => setSelectedPreset(index)}
                >
                  <span style={{ marginRight: "6px" }}>{preset.icon}</span>
                  {preset.title}
                </button>
              ))}
            </div>

            <div
              className="panel"
              style={{ background: "#FFE66D", padding: "18px 24px", marginTop: "10px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "18px" }}>
                    {simulatorPresets[selectedPreset].title}
                  </h4>
                  <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#36362e" }}>
                    {simulatorPresets[selectedPreset].description}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="comic-star-badge" style={{ background: "white" }}>
                    {simulatorPresets[selectedPreset].timeSaved}
                  </span>
                  <div style={{ fontWeight: 900, fontSize: "18px", marginTop: "4px" }}>
                    {simulatorPresets[selectedPreset].totalRange}
                  </div>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: "18px", marginTop: "24px", marginBottom: "12px" }}>
              2. Decomposed Resource Bundle:
            </h3>

            <div className="simulator-results-grid">
              {simulatorPresets[selectedPreset].items.map((item) => (
                <div className="sim-item-card" key={item.name}>
                  <span className="comic-star-badge" style={{ background: "#4ECDC4" }}>
                    {item.qty}
                  </span>
                  <h4 style={{ fontSize: "15px", margin: "10px 0 6px" }}>{item.name}</h4>
                  <small style={{ fontWeight: 800, color: "#54544d" }}>
                    Est. Market Rate:
                  </small>
                  <div style={{ fontWeight: 850, fontSize: "14px", color: "var(--ink)" }}>
                    {item.budget}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link className="button" href="/dashboard/planner">
                Open Full AI Event Planner ✳
              </Link>
              <Link className="button quiet" href="/dashboard/requests/create">
                Post This RFQ to Mumbai Network ↗
              </Link>
            </div>
          </div>
        </section>

        {/* 8. B2B Trust Vault & Anti-Collision Shield */}
        <section className="landing-section">
          <div className="planner-banner" style={{ background: "#C3B1E1" }}>
            <div>
              <span className="eyebrow">BANK-GRADE MARKETPLACE GOVERNANCE</span>
              <h2 style={{ fontSize: "36px" }}>
                Built for businesses
                <br />
                that cannot afford failure.
              </h2>
              <p style={{ fontSize: "16px", color: "#303028" }}>
                Hospitality events happen once. There is no second chance for a bride or a corporate keynote.
                Utlio enforces strict business verification, cryptographic session tracking, and atomic inventory locks.
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px" }}>
                <span className="comic-star-badge" style={{ background: "white" }}>
                  ✓ GST & TRADE AUDIT
                </span>
                <span className="comic-star-badge" style={{ background: "white" }}>
                  ✓ ATOMIC ACID LOCKS
                </span>
                <span className="comic-star-badge" style={{ background: "white" }}>
                  ✓ REPUTATION LEDGER
                </span>
              </div>
            </div>

            <div className="planner-art">
              <div className="comic-bubble" style={{ background: "#FFE66D" }}>
                <strong>🛡️ Anti-Collision Shield</strong>
                <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                  Locks dates during booking checkout to mathematically prevent double-booking.
                </p>
              </div>
              <div className="comic-bubble" style={{ background: "#4ECDC4", marginTop: "12px" }}>
                <strong>📄 Digital Audit & Receipt</strong>
                <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                  Generates tamper-proof PDF summaries and standard iCal sync files.
                </p>
              </div>
              <div className="comic-bubble" style={{ background: "#FF85A1", marginTop: "12px" }}>
                <strong>⚖️ Operations Arbitration</strong>
                <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                  Admin Operations Studio mediates any condition or damage disputes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 9. Comic FAQ Accordion */}
        <section id="questions" className="landing-section faq">
          <span className="eyebrow">COMMON QUESTIONS</span>
          <h2>Glad you asked.</h2>
          {[
            [
              "How does Utlio prevent two businesses from booking the same hall?",
              "When an offer is accepted, MongoDB transactions perform an atomic consistency check. If another party accepted a competing offer in the same millisecond, the second transaction is safely rolled back with a 409 conflict, guaranteeing zero double-bookings.",
            ],
            [
              "Can I both list resources and rent resources from other hotels?",
              "Yes! One business account gives you full access to both Provider Mode (list halls, set availability, run pricing intelligence) and Seeker Mode (discover resources, post RFQs, compare options). You can switch modes instantly with one click.",
            ],
            [
              "How do payments work between businesses?",
              "Businesses arrange payment directly (bank transfer, UPI, or corporate invoice). Utlio records the agreed price, deposit terms, cancellation policies, and handover logistics to create a legally accountable audit trail.",
            ],
            [
              "What role does AI actually play?",
              "AI does not make arbitrary financial bookings. Instead, 8 specialized LangGraph agents handle NLP request parsing, multi-item bundle decomposition, ranking explanation, counter-offer tactical advice, and seasonal demand forecasting.",
            ],
            [
              "How are demo credentials set up for judges?",
              "Demo credentials are built into the platform! On both the landing page and login page, click 'Demo Provider', 'Demo Seeker', or 'Demo Admin' to immediately log in with realistic seed data.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>

        {/* 10. Grand Finale CTA */}
        <section className="landing-cta" style={{ background: "#FFE66D" }}>
          <span aria-hidden="true" style={{ fontSize: "48px" }}>
            ✳
          </span>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)" }}>
            Turn idle square footage
            <br />
            into <span className="comic-highlight-pink">profitable partnerships.</span>
          </h2>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap", marginTop: "20px" }}>
            <Link className="button" href="/register">
              Join the B2B Exchange ↗
            </Link>
            <button
              type="button"
              className="button quiet"
              onClick={() => handleQuickDemo("provider")}
            >
              ⚡ Instant Demo Launch
            </button>
          </div>
        </section>
      </main>

      {/* Comic Footer */}
      <footer className="landing-footer">
        <Link className="brand" href="/">
          <span>U</span>utlio
        </Link>
        <p style={{ fontWeight: 700 }}>Less idle. More possible. · Built for Hospitality Leaders.</p>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <Link href="/login">Log in</Link>
          <Link href="/register">Register</Link>
          <a href="#demo-access">Demo Credentials</a>
        </div>
      </footer>
    </div>
  );
}
