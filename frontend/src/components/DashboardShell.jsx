"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Action } from "./ui";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bot,
  Search,
  Calendar,
  Sparkles,
  Inbox,
  BookmarkCheck,
  Package,
  DollarSign,
  TrendingUp,
  Award,
  MessageSquare,
  CalendarCheck,
  Star,
  ShieldAlert,
  Activity,
  BarChart3,
  Bell,
  User,
  LayoutDashboard,
  ShieldCheck,
  CheckCircle,
  Sliders,
  ArrowLeftRight,
} from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "@/lib/i18n";

const providerSections = [
  {
    title: "MAIN",
    categoryKey: "main",
    links: [
      ["", "Overview", <LayoutDashboard size={17} key="overview" />],
    ],
  },
  {
    title: "INVENTORY & YIELD",
    categoryKey: "inventory",
    links: [
      ["listings", "My listings", <Package size={17} key="listings" />],
      ["calendar", "Availability & Calendar", <Calendar size={17} key="calendar" />],
      ["smart-pricing", "Smart pricing & demand", <DollarSign size={17} key="pricing" />],
      ["performance", "Provider performance", <Award size={17} key="performance" />],
    ],
  },
  {
    title: "DEALS & FULFILMENT",
    categoryKey: "deals",
    links: [
      ["negotiations", "Incoming RFQs & Chat", <MessageSquare size={17} key="negotiations" />],
      ["bookings", "Confirmed bookings", <CalendarCheck size={17} key="bookings" />],
      ["reviews", "Reviews & reputation", <Star size={17} key="reviews" />],
      ["disputes", "Disputes & mediation", <ShieldAlert size={17} key="disputes" />],
    ],
  },
  {
    title: "MARKET INTELLIGENCE",
    categoryKey: "intelligence",
    links: [
      ["agents", "Agent Studio", <Bot size={17} key="agents" />],
      ["market-pulse", "Live market pulse", <Activity size={17} key="pulse" />],
      ["analytics", "Market analytics", <BarChart3 size={17} key="analytics" />],
    ],
  },
  {
    title: "SETTINGS",
    categoryKey: "settings",
    links: [
      ["profile", "Settings", <Sliders size={17} key="settings" />],
    ],
  },
];

const seekerSections = [
  {
    title: "MAIN",
    categoryKey: "main",
    links: [
      ["", "Overview", <LayoutDashboard size={17} key="overview" />],
    ],
  },
  {
    title: "DISCOVER & PLAN",
    categoryKey: "discovery",
    links: [
      ["search", "Discover resources", <Search size={17} key="search" />],
      ["planner", "AI Conductor", <Sparkles size={17} key="planner" />],
      ["requests", "My requirements (RFQs)", <Inbox size={17} key="requests" />],
      ["compare", "Saved & compare", <BookmarkCheck size={17} key="compare" />],
    ],
  },
  {
    title: "DEALS & BOOKINGS",
    categoryKey: "deals",
    links: [
      ["negotiations", "Active quotes & chat", <MessageSquare size={17} key="negotiations" />],
      ["bookings", "My bookings & calendar", <CalendarCheck size={17} key="bookings" />],
      ["reviews", "Reviews given & received", <Star size={17} key="reviews" />],
      ["disputes", "Disputes & claims", <ShieldAlert size={17} key="disputes" />],
    ],
  },
  {
    title: "MARKET INTELLIGENCE",
    categoryKey: "intelligence",
    links: [
      ["agents", "Agent Studio", <Bot size={17} key="agents" />],
      ["market-pulse", "Live market pulse", <Activity size={17} key="pulse" />],
      ["analytics", "Market analytics", <BarChart3 size={17} key="analytics" />],
    ],
  },
  {
    title: "SETTINGS",
    categoryKey: "settings",
    links: [
      ["profile", "Settings", <Sliders size={17} key="settings" />],
    ],
  },
];

const adminSections = [
  {
    title: "OPERATIONS STUDIO",
    categoryKey: "admin",
    links: [
      ["", "Platform overview", <LayoutDashboard size={17} key="overview" />],
      ["verifications", "Business KYC verifications", <CheckCircle size={17} key="verifications" />],
      ["disputes", "Dispute arbitration", <ShieldAlert size={17} key="disputes" />],
      ["moderation", "Content moderation", <ShieldCheck size={17} key="moderation" />],
      ["categories", "Categories taxonomy", <Package size={17} key="categories" />],
      ["analytics", "Marketplace liquidity", <BarChart3 size={17} key="analytics" />],
      ["settings", "Policies & integrations", <Sliders size={17} key="settings" />],
      ["agents", "AI operations & agents", <Bot size={17} key="agents" />],
    ],
  },
];

export default function DashboardShell({ children, admin = false }) {
  const reduced = useReducedMotion();
  const auth = useAuth();
  const router = useRouter();
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState("");
  const { t } = useTranslation();

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

  const sections = useMemo(() => {
    if (admin) return adminSections;
    return auth.dashboardRole === "provider" ? providerSections : seekerSections;
  }, [admin, auth.dashboardRole]);

  // Current active page title for the breadcrumb
  const currentTitle = useMemo(() => {
    const currentSlug = path.replace(/^\/dashboard\/?/, "").replace(/^\/admin\/?/, "");
    if (currentSlug === "notifications") return "Alerts & updates";
    for (const section of sections) {
      for (const [slug, label] of section.links) {
        if (slug === currentSlug) return label;
        if (slug && currentSlug.startsWith(slug)) return label;
      }
    }
    return "Overview";
  }, [path, sections]);

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

  return (
    <div className="workspace">
      <a className="skip-link" href="#workspace-content">
        Skip to workspace
      </a>

      {/* Backdrop for mobile sidebar */}
      <div
        className={`sidebar-backdrop ${menu ? "is-open" : ""}`}
        onClick={() => setMenu(false)}
        aria-hidden="true"
      />

      {/* Sidebar Navigation */}
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

        {admin && (
          <div className="workspace-label">
            {t("OPERATIONS STUDIO")}
          </div>
        )}

        {/* Feature Navigation Sections */}
        <nav aria-label="Dashboard navigation" className="sidebar-nav">
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
                    <span className="nav-icon">{icon}</span>
                    <span className="nav-label">{t(label)}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer with User Info */}
        <div className="sidebar-bottom">
          <div className="sidebar-user-info">
            <strong>{auth.user.name}</strong>
            <small>{auth.user.email}</small>
          </div>
          <Action
            className="quiet sidebar-logout-btn"
            run={async () => {
              await auth.logout();
              router.replace("/login");
            }}
          >
            Log out ↗
          </Action>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="workspace-main">
        {/* Top Navbar */}
        <header className="workspace-top">
          {/* Left: Mobile Toggle & Clean Brand / Page Breadcrumb */}
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
              <Link href="/" className="workspace-title-link">
                <strong>UTLIO</strong>
                <span className="workspace-doodle-star">✳</span>
              </Link>
              <span className="workspace-nav-divider">/</span>
              <span className="workspace-current-page">
                {t(currentTitle)}
              </span>
            </div>
          </div>

          {/* Center: Segmented Role Toggle */}
          {!admin && (
            <div className="top-role-toggle-container">
              <div
                className="top-role-toggle"
                role="group"
                aria-label="Dashboard role mode"
              >
                <button
                  type="button"
                  className={`top-role-btn seeker-btn ${
                    auth.dashboardRole === "seeker" ? "active" : ""
                  }`}
                  disabled={switching}
                  onClick={() => switchMode("seeker")}
                  aria-pressed={auth.dashboardRole === "seeker"}
                  title="Seeker Mode: Discover resources, plan with AI Conductor & submit RFQs"
                >
                  <Search size={14} className="role-icon" />
                  <span className="role-btn-title">Seeker</span>
                  <span className="role-btn-badge desktop-only">Rent</span>
                  {auth.dashboardRole === "seeker" && (
                    <span className="role-active-dot" />
                  )}
                </button>

                <button
                  type="button"
                  className={`top-role-btn provider-btn ${
                    auth.dashboardRole === "provider" ? "active" : ""
                  }`}
                  disabled={switching}
                  onClick={() => switchMode("provider")}
                  aria-pressed={auth.dashboardRole === "provider"}
                  title="Provider Mode: Monetize capacity, manage listings & receive RFQs"
                >
                  <Package size={14} className="role-icon" />
                  <span className="role-btn-title">Provider</span>
                  <span className="role-btn-badge desktop-only">List</span>
                  {auth.dashboardRole === "provider" && (
                    <span className="role-active-dot" />
                  )}
                </button>
              </div>

              {switching && (
                <span className="top-role-loading-indicator">Switching...</span>
              )}
            </div>
          )}

          {/* Right: Language Switcher, Alerts & User Profile */}
          <div className="workspace-top-right">
            {/* Top Language Switcher */}
            <div className="top-language-container">
              <LanguageSwitcher compact={false} />
            </div>

            {/* Quick Link to Notifications */}
            <Link
              href={admin ? "/admin/disputes" : "/dashboard/notifications"}
              className={`top-icon-btn ${path.includes("notifications") ? "active" : ""}`}
              title="Alerts & Notifications"
              aria-label="Alerts & Notifications"
            >
              <Bell size={18} />
            </Link>

            {/* User Profile Avatar */}
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

        {/* Main Viewport Content */}
        <motion.main
          initial={{ opacity: 0.6, y: reduced ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
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

        {/* Footer */}
        <footer className="workspace-footer">
          <div>
            UTLIO B2B EXCHANGE <span>· Less idle. More possible.</span>
          </div>
          <div className="footer-links">
            <Link href="/">Home</Link>
            <Link href={admin ? "/admin/verifications" : "/dashboard/notifications"}>
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
