"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Action } from "./ui";
import { motion, useReducedMotion } from "framer-motion";
import { Bot } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

const providerSections = [
  {
    title: "PROVIDER TOOLS",
    links: [
      ["listings", "My listings", "▦"],
      ["calendar", "Availability & Calendar", "▤"],
      ["smart-pricing", "Smart pricing advisor", "₹"],
      ["agents", "Agent Studio", "ai"],
      ["forecast", "Demand outlook & trends", "↟"],
      ["performance", "Provider performance", "☆"],
    ],
  },
  {
    title: "DEALS & FULFILMENT",
    links: [
      ["negotiations", "Incoming RFQs & Chat", "↔"],
      ["bookings", "Confirmed bookings", "▣"],
      ["reviews", "Reviews & reputation", "☆"],
      ["disputes", "Disputes & mediation", "⚑"],
    ],
  },
  {
    title: "MARKET INTELLIGENCE",
    links: [
      ["market-pulse", "Live market pulse", "◉"],
      ["analytics", "Market analytics", "↟"],
    ],
  },
  {
    title: "ACCOUNT & SETTINGS",
    links: [
      ["", "Overview summary", "◈"],
      ["notifications", "Alerts & updates", "◉"],
      ["profile", "Business profile & KYC", "◎"],
    ],
  },
];

const seekerSections = [
  {
    title: "SEEKER TOOLS",
    links: [
      ["search", "Discover resources", "⌕"],
      ["planner", "AI Conductor", "✳"],
      ["agents", "Agent Studio", "ai"],
      ["requests", "My requirements (RFQs)", "↗"],
      ["compare", "Saved & compare", "♡"],
    ],
  },
  {
    title: "DEALS & BOOKINGS",
    links: [
      ["negotiations", "Active quotes & chat", "↔"],
      ["bookings", "My bookings & calendar", "▣"],
      ["reviews", "Reviews given & received", "☆"],
      ["disputes", "Disputes & claims", "⚑"],
    ],
  },
  {
    title: "MARKET INTELLIGENCE",
    links: [
      ["market-pulse", "Live market pulse", "◉"],
      ["analytics", "Market analytics", "↟"],
    ],
  },
  {
    title: "ACCOUNT & SETTINGS",
    links: [
      ["", "Overview summary", "◈"],
      ["notifications", "Alerts & updates", "◉"],
      ["profile", "Business profile & KYC", "◎"],
    ],
  },
];

const adminSections = [
  {
    title: "OPERATIONS STUDIO",
    links: [
      ["", "Platform overview", "◈"],
      ["verifications", "Business KYC verifications", "✓"],
      ["disputes", "Dispute arbitration", "⚑"],
      ["moderation", "Content moderation", "◉"],
      ["categories", "Categories taxonomy", "▦"],
      ["analytics", "Marketplace liquidity", "↟"],
      ["settings", "Policies & integrations", "⚙"],
      ["agents", "AI operations & agents", "ai"],
    ],
  },
];

export default function DashboardShell({ children, admin = false }) {
  const reduced = useReducedMotion();
  const auth = useAuth(),
    router = useRouter(),
    path = usePathname(),
    [menu, setMenu] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState("");
  const switchMode = async (mode) => {
    if (switching || mode === auth.dashboardRole) return;
    setSwitching(true);
    setSwitchError("");
    try {
      await auth.setDashboardRole(mode);
      router.push("/dashboard");
      setMenu(false);
    } catch (error) {
      setSwitchError(error.message);
    } finally {
      setSwitching(false);
    }
  };

  const base = admin ? "/admin" : "/dashboard";

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    if (!auth.loading && !auth.error) {
      if (!auth.user) router.replace(`/login?next=${encodeURIComponent(path)}`);
      else if ((auth.user.role === "admin") !== admin)
        router.replace(auth.user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [auth.loading, auth.error, auth.user, admin, router, path]);

  if (auth.loading) return <div className="state">Checking your session…</div>;
  if (auth.error)
    return (
      <div className="state">
        <p role="alert">{auth.error}</p>
        <Action run={auth.refresh}>Retry connection</Action>
      </div>
    );
  if (!auth.user || (auth.user.role === "admin") !== admin)
    return <div className="state">Redirecting…</div>;

  const sections = admin
    ? adminSections
    : auth.dashboardRole === "provider"
      ? providerSections
      : seekerSections;

  return (
    <div className="workspace">
      <a className="skip-link" href="#workspace-content">
        Skip to workspace
      </a>
      { }
      <div
        className={`sidebar-backdrop ${menu ? "is-open" : ""}`}
        onClick={() => setMenu(false)}
        aria-hidden="true"
      />

      <aside
        id="workspace-navigation"
        className={`sidebar ${menu ? "is-open" : ""}`}
      >
        <div className="sidebar-top-row">
          <Link className="brand" href="/" onClick={() => setMenu(false)}>
            <span>U</span>utlio<span className="brand-dot">✳</span>
          </Link>
          <button
            className="sidebar-close quiet"
            onClick={() => setMenu(false)}
            aria-label="Close sidebar menu"
          >
            ✕
          </button>
        </div>

        <div className="workspace-label">
          {admin
            ? "OPERATIONS STUDIO"
            : auth.dashboardRole === "provider"
              ? "PROVIDER DASHBOARD"
              : "SEEKER DASHBOARD"}
        </div>

        {!admin && (
          <div className="sidebar-role-card">
            <div className="sidebar-role-header">
              <span className="sidebar-role-label">ACTIVE ROLE</span>
              <span
                className="comic-pill-badge"
                style={{
                  background:
                    auth.dashboardRole === "provider" ? "var(--yellow)" : "var(--teal)",
                }}
              >
                {auth.dashboardRole === "provider" ? "↗ PROVIDER" : "⌕ SEEKER"}
              </span>
            </div>
            <p className="sidebar-role-desc">
              {auth.dashboardRole === "provider"
                ? "Monetizing capacity: listings, calendar, dynamic pricing & RFQ offers."
                : "Discovering resources: search, Event Conductor planner & negotiations."}
            </p>
            <button
              type="button"
              className="sidebar-role-toggle-btn"
              disabled={switching}
              onClick={() =>
                switchMode(
                  auth.dashboardRole === "provider" ? "seeker" : "provider",
                )
              }
            >
              <span>
                {switching
                  ? "Switching mode..."
                  : `Switch to ${auth.dashboardRole === "provider" ? "⌕ Seeker Mode" : "↗ Provider Mode"}`}
              </span>
              <span className="toggle-icon">↺</span>
            </button>
          </div>
        )}

        <nav aria-label="Dashboard navigation">
          {sections.map((section) => (
            <div key={section.title} className="sidebar-section">
              <span className="sidebar-section-title">{section.title}</span>
              {section.links.map(([slug, label, icon]) => {
                const target = `${base}${slug ? "/" + slug : ""}`;
                const isActive =
                  path === target ||
                  (slug && path.startsWith(`${base}/${slug}/`));
                return (
                  <Link
                    key={slug}
                    onClick={() => setMenu(false)}
                    className={isActive ? "active" : ""}
                    aria-current={isActive ? "page" : undefined}
                    href={target}
                  >
                    <span className="nav-icon">{icon === "ai" ? <Bot size={18} /> : icon}</span>
                    <span className="nav-label">{label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div style={{ marginBottom: "12px" }}>
            <LanguageSwitcher />
          </div>
          <div className="sidebar-user-info">
            <strong>{auth.user.name}</strong>
            <small>{auth.user.email}</small>
          </div>
          <Action
            className="quiet"
            run={async () => {
              await auth.logout();
              router.replace("/login");
            }}
          >
            Log out ↗
          </Action>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="workspace-top">
          <div className="workspace-top-left">
            <button
              className="mobile-menu quiet"
              onClick={() => setMenu(!menu)}
              aria-label="Toggle navigation menu"
              aria-expanded={menu}
              aria-controls="workspace-navigation"
            >
              ☰
            </button>

            <div className="workspace-brand-badge">
              <span className="live-dot" />
              <strong className="workspace-title-text">
                {admin ? "OPERATIONS STUDIO" : "UTLIO EXCHANGE"}
              </strong>
              <span className="workspace-doodle-star">✳</span>
              <span className="workspace-subtag desktop-only">
                {admin ? "Governance & KYC" : "B2B Hospitality Network"}
              </span>
            </div>
          </div>

          {!admin && (
            <div className="comic-role-switch-wrapper">
              <div
                className="comic-role-switch"
                role="group"
                aria-label="Dashboard role mode"
              >
                <button
                  type="button"
                  className={`role-btn provider-role ${auth.dashboardRole === "provider" ? "active" : ""}`}
                  disabled={switching}
                  onClick={() => switchMode("provider")}
                  aria-pressed={auth.dashboardRole === "provider"}
                  title="Switch to Provider Mode (Monetize capacity, listings & calendar)"
                >
                  <span className="role-icon">↗</span>
                  <span className="role-text">Provider</span>
                  {auth.dashboardRole === "provider" && (
                    <span className="role-active-spark">✳</span>
                  )}
                </button>
                <button
                  type="button"
                  className={`role-btn seeker-role ${auth.dashboardRole === "seeker" ? "active" : ""}`}
                  disabled={switching}
                  onClick={() => switchMode("seeker")}
                  aria-pressed={auth.dashboardRole === "seeker"}
                  title="Switch to Seeker Mode (Search, Event Conductor & RFQs)"
                >
                  <span className="role-icon">⌕</span>
                  <span className="role-text">Seeker</span>
                  {auth.dashboardRole === "seeker" && (
                    <span className="role-active-spark">✳</span>
                  )}
                </button>
              </div>
              <span className="role-mode-caption desktop-only">
                {switching
                  ? "Updating tools..."
                  : auth.dashboardRole === "provider"
                    ? "Capacity Monetization Active"
                    : "Resource Discovery Active"}
              </span>
            </div>
          )}

          <div className="workspace-top-right">
            <LanguageSwitcher compact />

            <Link
              className="avatar comic-avatar"
              aria-label="Account profile"
              href={admin ? "/admin/settings" : "/dashboard/profile"}
              title={`Logged in as ${auth.user.name}`}
            >
              <span>{auth.user.name.slice(0, 1).toUpperCase()}</span>
            </Link>
          </div>
        </header>

        <motion.main
          initial={{ opacity: 0.6, y: reduced ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : .25 }}
          id="workspace-content"
          className="dashboard-content"
          key={`${path}:${auth.dashboardRole}`}
        >
          {switchError && (
            <p className="error" role="alert">
              {switchError}
            </p>
          )}
          {!admin && auth.user?.verification === "rejected" && (
            <div className="notice business-verification-banner">
              <strong>Business verification restricted.</strong>
              <p>
                Please review your business profile and verification documents or contact operations support.
              </p>
              <Link href="/dashboard/profile">Complete your business profile →</Link>
            </div>
          )}
          {children}
        </motion.main>

        <footer className="workspace-footer">
          <div>
            UTLIO B2B EXCHANGE <span>· Less idle. More possible.</span>
          </div>
          <div className="footer-links">
            <Link href="/">Home</Link>
            <Link
              href={admin ? "/admin/verifications" : "/dashboard/notifications"}
            >
              {admin ? "Verifications" : "Alerts"}
            </Link>
            <Link href={admin ? "/admin/settings" : "/dashboard/profile"}>
              {admin ? "Settings" : "Account"}
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
