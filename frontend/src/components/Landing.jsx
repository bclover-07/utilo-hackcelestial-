"use client";
import { Component, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Search,
  Package,
  ShieldCheck,
  MapPin,
  CalendarDays,
  Armchair,
  CookingPot,
  AudioLines,
  Truck,
  Building2,
  Check,
  Menu,
  X,
  MoveUpRight,
  TrendingUp,
  Zap,
  HelpCircle,
  ChevronDown,
  Star,
  CheckCircle,
  BarChart3,
  Database,
  Cpu,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ExchangeWorkflow from "./ExchangeWorkflow";
import AgentShowcase from "./AgentShowcase";
import LanguageSwitcher from "./LanguageSwitcher";
const Scene = dynamic(() => import("./ResourceScene"), {
  ssr: false,
  loading: () => (
    <div className="scene-placeholder">
      ✳<small>Making room for possibility…</small>
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
      <div className="scene-placeholder">
        ✳<small>Less idle. More possible.</small>
      </div>
    ) : (
      this.props.children
    );
  }
}
const categories = [
  [
    Building2,
    "Spaces & venues",
    "A little room for your big ideas.",
    "var(--lavender)",
  ],
  [
    Armchair,
    "Furniture & seating",
    "Make everyone feel invited.",
    "var(--yellow)",
  ],
  [
    AudioLines,
    "Sound & vision",
    "Set the tone. Steal the show.",
    "var(--pink)",
  ],
  [
    CookingPot,
    "Kitchens & catering",
    "Great events start in the kitchen.",
    "var(--teal)",
  ],
  [
    Truck,
    "Transport & logistics",
    "Get the good stuff where it belongs.",
    "var(--sky)",
  ],
  [
    Package,
    "The finishing touches",
    "Linens, decor and everything more.",
    "var(--peach)",
  ],
];
const agents = [
  [
    "01",
    "Brief → requirements",
    "Turn a natural-language event brief into structured resource needs.",
    "var(--yellow)",
  ],
  [
    "02",
    "An explained shortlist",
    "Find compatible, date-available resources and understand the ranking.",
    "var(--lavender)",
  ],
  [
    "03",
    "A little negotiation help",
    "Review suggestions grounded in the quote and conversation.",
    "var(--pink)",
  ],
  [
    "04",
    "A clearer market picture",
    "Explore demand signals and pricing guidance from recorded activity.",
    "var(--teal)",
  ],
];

const tickerStats = [
  {
    tag: "Verified Inventory",
    value: "4,850+",
    label: "Active hospitality resources across micro-markets",
    bg: "var(--yellow)",
  },
  {
    tag: "Liquidity Unlocked",
    value: "₹2.4 Cr+",
    label: "Idle capacity monetized for banquet & fleet operators",
    bg: "var(--teal)",
  },
  {
    tag: "Solving Speed",
    value: "15 min",
    label: "AI Conductor multi-supplier package resolution",
    bg: "var(--lavender)",
  },
  {
    tag: "Escrow Assurance",
    value: "99.4%",
    label: "Fulfilment SLA guarantee with dispute protection",
    bg: "var(--pink)",
  },
];

function MarketTickerSection({ reveal }) {
  return (
    <motion.section className="market-ticker-section" {...reveal}>
      <div className="market-ticker-grid">
        {tickerStats.map((item, idx) => (
          <div
            key={idx}
            className="ticker-card"
            style={{ background: item.bg }}
          >
            <div className="ticker-top">
              <span className="ticker-tag">{item.tag}</span>
              <span className="live-dot" />
            </div>
            <div>
              <div className="ticker-value">{item.value}</div>
              <div className="ticker-label">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

const categoriesCalc = [
  { name: "Venues & Banquets", rate: 22000, unitLabel: "halls", icon: Building2 },
  { name: "Sound & Lighting", rate: 5500, unitLabel: "rigs", icon: AudioLines },
  { name: "Banquet Chairs", rate: 65, unitLabel: "chairs", icon: Armchair },
  { name: "Cloud Kitchens", rate: 14000, unitLabel: "prep stations", icon: CookingPot },
  { name: "Fleet & Logistics", rate: 7500, unitLabel: "trips", icon: Truck },
];

function CapacityRoiCalculatorSection({ destination, reveal }) {
  const [selectedCat, setSelectedCat] = useState(0);
  const [idleDays, setIdleDays] = useState(8);
  const [units, setUnits] = useState(15);

  const cat = categoriesCalc[selectedCat];
  const monthlyRevenue = Math.round(idleDays * units * cat.rate * 0.65);
  const formattedRevenue = "₹" + monthlyRevenue.toLocaleString("en-IN");
  const seekerSavings = Math.round(monthlyRevenue * 0.28);
  const formattedSavings = "₹" + seekerSavings.toLocaleString("en-IN");

  return (
    <motion.section className="calculator-section" id="calculator" {...reveal}>
      <div className="calculator-wrapper">
        <div className="calculator-controls">
          <div>
            <span className="eyebrow">INTERACTIVE CAPACITY REVENUE CALCULATOR</span>
            <h2>Estimate Your Idle Asset Earnings</h2>
            <p>
              See how much ancillary revenue your unused spaces, furniture, or equipment could generate each month on Utlio.
            </p>
          </div>

          <div>
            <label style={{ fontSize: "13px", fontWeight: 800 }}>SELECT ASSET TYPE</label>
            <div className="calc-category-pills">
              {categoriesCalc.map((c, i) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.name}
                    type="button"
                    className={`calc-cat-btn ${selectedCat === i ? "active" : ""}`}
                    onClick={() => setSelectedCat(i)}
                  >
                    <Icon size={16} />
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="calc-slider-group">
            <div className="calc-slider-header">
              <span>Unused Days Per Month</span>
              <strong>{idleDays} Days</strong>
            </div>
            <input
              type="range"
              min="1"
              max="28"
              value={idleDays}
              onChange={(e) => setIdleDays(Number(e.target.value))}
              className="calc-slider"
            />
          </div>

          <div className="calc-slider-group">
            <div className="calc-slider-header">
              <span>Available {cat.unitLabel.toUpperCase()} Quantity</span>
              <strong>{units} {cat.unitLabel}</strong>
            </div>
            <input
              type="range"
              min="1"
              max={selectedCat === 2 ? 300 : 50}
              value={units}
              onChange={(e) => setUnits(Number(e.target.value))}
              className="calc-slider"
            />
          </div>
        </div>

        <div className="calculator-results-card">
          <div className="calc-result-header">ESTIMATED MONTHLY UNLOCKED REVENUE</div>
          <div>
            <div className="calc-revenue-amount">{formattedRevenue}</div>
            <div className="calc-revenue-sub">Projected net ancillary earnings / month</div>
          </div>

          <div className="calc-perks-list">
            <div className="calc-perk-item">
              <span className="calc-perk-icon"><Check size={14} /></span>
              <span>Seeker community saves ~{formattedSavings} vs spot brokers</span>
            </div>
            <div className="calc-perk-item">
              <span className="calc-perk-icon"><Check size={14} /></span>
              <span>100% Escrow protected with damage security hold</span>
            </div>
            <div className="calc-perk-item">
              <span className="calc-perk-icon"><Check size={14} /></span>
              <span>Dynamic pricing auto-pilot optimizes weekend surge</span>
            </div>
          </div>

          <Link href={destination} className="button" style={{ background: "var(--yellow)", textAlign: "center", justifyContent: "center" }}>
            Start Earning From Idle Capacity <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

const matrixCards = [
  {
    title: "Event Conductor Supervisor",
    tag: "MONTE CARLO RESILIENT",
    icon: Cpu,
    bg: "var(--yellow)",
    description: "Decomposes natural language briefs into structured multi-supplier packages. Runs single and dual supplier failure simulations to guarantee fallback continuity.",
    simTitle: "Monte Carlo Resilience Check",
    simScore: "94% Resilient",
    simBar: "94%",
    bullets: [
      "Auto-substitute recommendations for inventory gaps",
      "Route corridor grouping saves up to 34% in dispatch overhead",
      "Zero-hallucination verified against active database state",
    ],
  },
  {
    title: "Bilateral ZOPA Negotiator",
    tag: "SURPLUS OPTIMIZER",
    icon: TrendingUp,
    bg: "var(--teal)",
    description: "Calculates the real Zone of Possible Agreement between seeker budget and provider floor price, generating optimal counter-proposals with contract risk audits.",
    simTitle: "ZOPA Convergence Rate",
    simScore: "88% Deal Likelihood",
    simBar: "88%",
    bullets: [
      "1-click autonomous counter-offer blueprints",
      "Contract dispute and missing protection detection",
      "Sentiment-aware bilateral concessions",
    ],
  },
  {
    title: "Dynamic Pricing Auto-Pilot",
    tag: "CANNIBALIZATION SHIELD",
    icon: BarChart3,
    bg: "var(--lavender)",
    description: "Monitors real-time regional demand to apply surge multipliers while enforcing strict price floor and ceiling bounds to protect your brand equity.",
    simTitle: "Weekend Yield Multiplier",
    simScore: "+35% Projected Surge",
    simBar: "75%",
    bullets: [
      "Cross-listing cannibalization protection alerts",
      "Automatic floor price preservation below cost",
      "Historical liquidity & demand velocity indexing",
    ],
  },
  {
    title: "Episodic & Semantic Working Memory",
    tag: "CROSS-SESSION RETENTION",
    icon: Database,
    bg: "var(--pink)",
    description: "Preserves your business preferences, dietary rules, logistics corridors, and vendor affinities across every interaction without repetitive re-prompting.",
    simTitle: "Working Memory Affinity",
    simScore: "Zero-Latency Recall",
    simBar: "100%",
    bullets: [
      "Dedicated preferences, constraints & logistics store",
      "Critic reflection verifies every claim against active listings",
      "Full privacy: view, add, or delete memory anytime in Conductor",
    ],
  },
];

function AutonomousAgentMatrixSection({ destination, reveal }) {
  return (
    <motion.section className="landing-section" id="agent-matrix" {...reveal}>
      <div className="landing-section-heading">
        <div>
          <span className="eyebrow">AUTONOMOUS MULTI-AGENT ARCHITECTURE</span>
          <h2>
            Smarter matching.
            <br />
            Ironclad reliability.
          </h2>
        </div>
        <p>
          Utlio runs specialized AI worker agents coordinated by a Supervisor Planner, verified by a reflection critic node.
        </p>
      </div>

      <div className="agent-matrix-grid">
        {matrixCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <article
              key={i}
              className="agent-matrix-card"
              style={{ background: card.bg }}
            >
              <div>
                <div className="matrix-header">
                  <div className="matrix-title-wrap">
                    <span className="matrix-icon-box" style={{ background: "white" }}>
                      <Icon size={22} />
                    </span>
                    <h3 style={{ margin: 0, fontSize: "19px" }}>{card.title}</h3>
                  </div>
                  <span className="matrix-live-pill">
                    <span className="live-dot" /> {card.tag}
                  </span>
                </div>

                <p style={{ fontSize: "14px", lineHeight: "1.5", margin: "14px 0" }}>
                  {card.description}
                </p>

                <div className="matrix-sim-preview">
                  <div className="matrix-sim-top">
                    <strong>{card.simTitle}</strong>
                    <span style={{ fontWeight: 800, color: "#1a7336" }}>{card.simScore}</span>
                  </div>
                  <div className="matrix-sim-bar">
                    <div className="matrix-sim-fill" style={{ width: card.simBar }} />
                  </div>
                </div>

                <ul style={{ margin: "14px 0 0", paddingLeft: "18px", fontSize: "13px", lineHeight: "1.6" }}>
                  {card.bullets.map((b, bi) => (
                    <li key={bi} style={{ fontWeight: 600 }}>{b}</li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </motion.section>
  );
}

const testimonials = [
  {
    quote: "Utlio transformed our vacant weekday banquets into ₹4.8 Lakhs of extra monthly revenue. The escrow-backed bookings give us complete peace of mind.",
    name: "Rajesh Singhania",
    business: "Grand Palace Banquets, Mumbai BKC",
    metric: "+₹4.8L/mo idle yield",
    avatar: "R",
    bg: "var(--yellow)",
  },
  {
    quote: "When an event suddenly expanded, the AI Conductor matched 4 line-array audio rigs and 2 transport vans within 12 minutes. Fast and completely hassle-free.",
    name: "Pooja Hegde",
    business: "Aura Sound & Visuals, Bengaluru Indiranagar",
    metric: "12-min multi-vendor match",
    avatar: "P",
    bg: "var(--teal)",
  },
  {
    quote: "The ZOPA negotiation advisor and dynamic pricing tool helped us quote competitive prices while keeping our margins protected. We closed 19 deals in month one.",
    name: "Vikram Malhotra",
    business: "Apex Hospitality Fleet, Delhi Aerocity",
    metric: "19 deals in 30 days",
    avatar: "V",
    bg: "var(--lavender)",
  },
];

function HospitalityTestimonialsSection({ reveal }) {
  return (
    <motion.section className="testimonials-section" id="reviews" {...reveal}>
      <div className="landing-section-heading">
        <div>
          <span className="eyebrow">HOSPITALITY COMMUNITY STORIES</span>
          <h2>
            Trusted by operators.
            <br />
            Loved by planners.
          </h2>
        </div>
        <p>
          Real stories from banquet venues, AV rental houses, and event coordinators sharing idle capacity across India.
        </p>
      </div>

      <div className="testimonials-grid">
        {testimonials.map((t, idx) => (
          <article key={idx} className="testimonial-card">
            <div>
              <div className="testimonial-stars">
                {[...Array(5)].map((_, s) => (
                  <Star key={s} size={16} fill="#f59e0b" stroke="none" />
                ))}
              </div>
              <p className="testimonial-quote">“{t.quote}”</p>
            </div>
            <div className="testimonial-author">
              <span className="author-avatar" style={{ background: t.bg }}>
                {t.avatar}
              </span>
              <div className="author-details">
                <strong>{t.name}</strong>
                <small>{t.business}</small>
              </div>
              <span className="author-badge">{t.metric}</span>
            </div>
          </article>
        ))}
      </div>
    </motion.section>
  );
}

const faqs = [
  {
    q: "How does Utlio ensure asset security and transaction safety?",
    a: "Every business undergoes verification before publishing resources. Transactions are protected through structured escrow milestones, damage security holds, and automated dispute mediation protocols.",
  },
  {
    q: "Can I use the same business account as both a Seeker and a Provider?",
    a: "Yes! Utlio features a dual-role exchange model. A single business account allows you to discover and book resources as a Seeker, and list excess capacity as a Provider with a seamless one-click switch.",
  },
  {
    q: "How does the AI Event Conductor assemble multi-supplier packages?",
    a: "The Conductor uses a Supervisor Planner to break down complex briefs (e.g. '300-person banquet setup in Mumbai') into discrete categories. It performs Monte Carlo failure simulation and corridor clustering to ensure reliable delivery.",
  },
  {
    q: "Does Utlio support multiple regional and global languages?",
    a: "Yes! Utlio features dynamic multi-language translation powered by Google Translate, supporting 14 languages including Hindi, Marathi, Bengali, Gujarati, Tamil, Telugu, Spanish, French, and German across all dashboards, forms, and workflows.",
  },
  {
    q: "How does dynamic pricing work for providers?",
    a: "Providers can enable Auto-Pilot Dynamic Pricing on any listing. It automatically applies weekend surge factors (+35%) while respecting your strict minimum floor price and preventing cannibalization across your items.",
  },
];

function InteractiveFaqSection({ reveal }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <motion.section className="faq-section" id="faq" {...reveal}>
      <div className="landing-section-heading" style={{ textAlign: "center", margin: "0 auto 30px" }}>
        <div>
          <span className="eyebrow">COMMON QUESTIONS</span>
          <h2>Frequently Asked Questions</h2>
        </div>
        <p style={{ margin: "10px auto 0" }}>
          Everything you need to know about Utlio’s resource exchange, AI agents, and security.
        </p>
      </div>

      <div className="faq-list">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className="faq-item">
              <button
                type="button"
                className="faq-question-btn"
                onClick={() => setOpenIndex(isOpen ? -1 : i)}
                aria-expanded={isOpen}
              >
                <span>{faq.q}</span>
                <ChevronDown size={20} className={`faq-arrow ${isOpen ? "open" : ""}`} />
              </button>
              {isOpen && (
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const reduced = useReducedMotion();
  const [menu, setMenu] = useState(false);
  const [mode, setMode] = useState("seeker");
  const [sceneMoving, setSceneMoving] = useState(true);
  const home = user?.role === "admin" ? "/admin" : "/dashboard";
  const destination = user ? home : "/register";
  const reveal = {
    initial: { opacity: 0, y: reduced ? 0 : 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.12 },
    transition: { duration: reduced ? 0 : 0.5 },
  };
  return (
    <div className="neo-landing">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <nav className="neo-nav" aria-label="Main navigation">
        <Link className="brand" href="/">
          <span>u</span>utlio<span className="brand-dot">✳</span>
        </Link>
        <div className={`neo-nav-links ${menu ? "open" : ""}`}>
          <a href="#how-it-works" onClick={() => setMenu(false)}>
            How it works
          </a>
          <a href="#resources" onClick={() => setMenu(false)}>
            The good stuff
          </a>
          <a href="#calculator" onClick={() => setMenu(false)}>
            ROI Calculator
          </a>
          <a href="#intelligence" onClick={() => setMenu(false)}>
            A little AI magic <Sparkles size={14} />
          </a>
          <a href="#reviews" onClick={() => setMenu(false)}>
            Stories
          </a>
          <a href="#faq" onClick={() => setMenu(false)}>
            FAQ
          </a>
          <div className="mobile-only-lang" style={{ padding: "8px 0" }}>
            <LanguageSwitcher />
          </div>
        </div>
        <div className="neo-nav-actions">
          <LanguageSwitcher compact />
          <Link className="neo-login-link" href={user ? home : "/login"}>
            {user ? "My workspace" : "Log in"}
          </Link>
          <Link className="button" href={destination}>
            Let’s get sharing <ArrowUpRight size={18} />
          </Link>
          <button
            className="neo-mobile-nav quiet"
            aria-label={menu ? "Close navigation" : "Open navigation"}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>
      <main id="main-content">
        <section className="neo-hero">
          <motion.div className="neo-hero-copy" {...reveal}>
            <span className="hero-kicker">
              <span className="tiny-spark">✳</span> THE HOSPITALITY SHARING CLUB
            </span>
            <h1>
              Less idle.
              <br />
              More <span className="marker-text">possible.</span>
              <span className="heading-spark" aria-hidden="true">
                ✳
              </span>
            </h1>
            <p>
              Your spare space is someone’s perfect venue.
              <br className="desktop-break" /> Your extra chairs? Their full
              house. Share resources,
              <br className="desktop-break" /> find your people, and make more
              happen.
            </p>
            <div className="hero-buttons">
              <Link
                className="button hero-primary"
                href={user ? home : "/register?role=seeker"}
              >
                Find your next possibility <ArrowUpRight size={21} />
              </Link>
              <Link
                className="text-link"
                href={user ? home : "/register?role=provider"}
              >
                I have something to share <ArrowRight size={17} />
              </Link>
            </div>
            <div className="hero-footnote">
              <span className="mini-avatar">H</span>
              <span className="mini-avatar">E</span>
              <span className="mini-avatar">V</span>
              <p>
                Hotels. Event makers. Local businesses.
                <br />
                <strong>Better, together.</strong>
              </p>
            </div>
          </motion.div>
          <motion.div className="neo-hero-art" {...reveal}>
            <div className="art-board">
              <div className="art-board-top">
                <span>
                  <span className="live-dot" /> A WORLD OF SHARED POSSIBILITIES
                </span>
                <span>↗</span>
              </div>
              <div className="scene-stage">
                <SceneBoundary>
                  <Scene paused={!sceneMoving || !!reduced} />
                </SceneBoundary>
              </div>
              <div className="art-board-bottom">
                <span>YOUR NEXT EVENT, COMING TOGETHER.</span>
                <button
                  type="button"
                  className="scene-toggle"
                  onClick={() => setSceneMoving(!sceneMoving)}
                  aria-pressed={sceneMoving}
                >
                  {sceneMoving ? "Pause motion" : "Play motion"}
                </button>
              </div>
            </div>
            <div className="art-sticker sticker-match">
              <span className="sticker-icon">
                <Sparkles size={22} />
              </span>
              <div>
                <small>A LITTLE AI MAGIC</small>
                <strong>Your perfect match awaits.</strong>
              </div>
            </div>
            <div className="art-sticker sticker-shared">
              <Check size={19} />
              <span>Made to be shared.</span>
            </div>
            <span className="art-spark" aria-hidden="true">
              ✳
            </span>
          </motion.div>
        </section>

        <MarketTickerSection reveal={reveal} />

        <div className="community-strip">
          <span>LESS WASTE</span>
          <i>✳</i>
          <span>MORE OPPORTUNITY</span>
          <i>✳</i>
          <span>LOCAL CONNECTIONS</span>
          <i>✳</i>
          <span>SHARED POSSIBILITIES</span>
          <i>✳</i>
        </div>
        <motion.section className="landing-section" id="resources" {...reveal}>
          <div className="landing-section-heading">
            <div>
              <span className="eyebrow">THERE’S PLENTY TO GO AROUND</span>
              <h2>
                Good resources.
                <br />
                Even better neighbours.
              </h2>
            </div>
            <p>
              From the big space to the little details.
              <br />
              Discover what your neighbourhood has to offer.
            </p>
          </div>
          <div className="resource-tiles">
            {categories.map(([Icon, title, description, color], i) => (
              <Link
                key={title}
                className="resource-tile"
                href={user ? home : "/login?role=seeker"}
                style={{ "--tile-color": color }}
              >
                <div className="tile-top">
                  <span className="tile-icon">
                    <Icon size={30} strokeWidth={1.8} />
                  </span>
                  <span className="tile-number">
                    0{i + 1} <ArrowUpRight size={20} />
                  </span>
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>

        <CapacityRoiCalculatorSection destination={destination} reveal={reveal} />
        <motion.section
          className="landing-section workflow-section"
          id="how-it-works"
          {...reveal}
        >
          <span className="eyebrow">FROM “WHAT IF” TO “IT’S HAPPENING”</span>
          <h2>
            A good idea.
            <br />A few good connections.
          </h2>
          <p>
            One clear path from your first brief to the final handover. Tap a
            step to explore.
          </p>
          <ExchangeWorkflow />
        </motion.section>
        <motion.section className="landing-section role-showcase" {...reveal}>
          <div className="role-copy">
            <span className="eyebrow">TWO SIDES. ONE GREAT NEIGHBOURHOOD.</span>
            <h2>
              Find what you need.
              <br />
              Share what you have.
            </h2>
            <p>
              One business account gives you both perspectives. Your next
              opportunity might be on either side.
            </p>
            <div className="persona-toggle landing-role-toggle">
              {["seeker", "provider"].map((item) => (
                <button
                  key={item}
                  aria-pressed={mode === item}
                  className={mode === item ? "selected" : ""}
                  onClick={() => setMode(item)}
                >
                  {item === "seeker" ? (
                    <Search size={18} />
                  ) : (
                    <Package size={18} />
                  )}{" "}
                  I’m a {item}
                </button>
              ))}
            </div>
            <Link
              className="text-link"
              href={user ? home : `/login?role=${mode}`}
            >
              Open the {mode} workspace <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className={`role-preview ${mode}`} key={mode}>
            <div className="preview-title">
              <span className="preview-dots">● ● ●</span>
              <span>YOUR {mode.toUpperCase()} WORKSPACE</span>
              <span>✳</span>
            </div>
            <div className="preview-body">
              <span className="badge">ILLUSTRATIVE WORKFLOW</span>
              <h3>
                {mode === "seeker"
                  ? "Let’s make it happen."
                  : "Your spare capacity. Put to work."}
              </h3>
              <div className="preview-metrics">
                <div style={{ background: "var(--yellow)" }}>
                  <Search size={20} />
                  <strong>{mode === "seeker" ? "Discover" : "List"}</strong>
                  <small>
                    {mode === "seeker"
                      ? "The right resources"
                      : "Your available resources"}
                  </small>
                </div>
                <div style={{ background: "var(--pink)" }}>
                  <CalendarDays size={20} />
                  <strong>Coordinate</strong>
                  <small>Every detail, together</small>
                </div>
              </div>
              <div className="preview-check">
                <span>
                  <Check size={17} />
                </span>
                {mode === "seeker"
                  ? "Compare availability, distance and terms"
                  : "Manage quantity and available dates"}
              </div>
              <div className="preview-check">
                <span>
                  <Check size={17} />
                </span>
                {mode === "seeker"
                  ? "Track quotes through to fulfilment"
                  : "Negotiate directly with local businesses"}
              </div>
              <div className="preview-check">
                <span>
                  <Check size={17} />
                </span>
                Switch perspectives anytime
              </div>
            </div>
          </div>
        </motion.section>
        <motion.section
          className="landing-section intelligence-section"
          id="intelligence"
          {...reveal}
        >
          <div className="landing-section-heading">
            <div>
              <span className="eyebrow">A COPILOT. WITH COMMON SENSE.</span>
              <h2>
                Less legwork.
                <br />
                More lightbulb moments.
              </h2>
            </div>
            <p>
              AI helps you connect the dots.
              <br />
              You stay in charge of the decisions.
            </p>
          </div>
          <div className="intelligence-grid">
            {agents.map(([number, title, description, color]) => (
              <article
                className="intelligence-card"
                key={number}
                style={{ "--tile-color": color }}
              >
                <span>
                  {number}
                  <Sparkles size={21} />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <div className="ai-trust-note">
            <ShieldCheck size={22} />
            <p>
              Recommendations are grounded in marketplace records. Missing
              information stays visible. Bookings always need your approval.
            </p>
            <Link href={user ? home : "/login?role=seeker"}>
              Meet your copilot <ArrowUpRight size={19} />
            </Link>
          </div>
        </motion.section>

        <AutonomousAgentMatrixSection destination={destination} reveal={reveal} />

        <AgentShowcase destination={user ? home : "/login?role=seeker"} />

        <HospitalityTestimonialsSection reveal={reveal} />

        <InteractiveFaqSection reveal={reveal} />

        <motion.section className="landing-section final-invite" {...reveal}>
          <span className="invite-spark" aria-hidden="true">
            ✳
          </span>
          <span className="eyebrow">A LITTLE SHARING GOES A LONG WAY</span>
          <h2>
            Your next big thing
            <br />
            is closer than you think.
          </h2>
          <p>
            Make room for better events, stronger connections, and more
            possibility.
          </p>
          <Link className="button" href={destination}>
            Come on in <ArrowUpRight size={22} />
          </Link>
          <span className="invite-scribble" aria-hidden="true">
            <MoveUpRight size={70} strokeWidth={1.2} />
          </span>
        </motion.section>
      </main>
      <footer className="neo-footer">
        <div>
          <Link className="brand" href="/">
            <span>u</span>utlio<span className="brand-dot">✳</span>
          </Link>
          <p>Less idle. More possible.</p>
        </div>
        <div>
          <span className="eyebrow">THE EXCHANGE</span>
          <Link href="/register?role=seeker">Find resources</Link>
          <Link href="/register?role=provider">Share resources</Link>
        </div>
        <div>
          <span className="eyebrow">YOUR WORKSPACE</span>
          <Link href="/login">Business login</Link>
          <Link href="/login?role=admin">Admin login</Link>
        </div>
        <div className="footer-location">
          <MapPin size={18} />
          <span>
            Made for local connections.
            <br />
            Built for hospitality.
          </span>
        </div>
        <div className="footer-lang-col" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span className="eyebrow">PREFERENCES</span>
          <LanguageSwitcher />
        </div>
      </footer>
    </div>
  );
}
