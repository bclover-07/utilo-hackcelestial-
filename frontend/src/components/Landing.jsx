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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ExchangeWorkflow from "./ExchangeWorkflow";
import AgentShowcase from "./AgentShowcase";
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
          <a href="#intelligence" onClick={() => setMenu(false)}>
            A little AI magic <Sparkles size={14} />
          </a>
        </div>
        <div className="neo-nav-actions">
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
        <AgentShowcase destination={user ? home : "/login?role=seeker"} />
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
      </footer>
    </div>
  );
}
