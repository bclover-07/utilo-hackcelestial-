"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Action } from "./ui";

const providerSections = [
  {
    title: "PROVIDER TOOLS",
    links: [
      ["listings", "My listings", "▦"],
      ["calendar", "Availability & Calendar", "▤"],
      ["smart-pricing", "Smart pricing advisor", "₹"],
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
      ["planner", "AI Event copilot", "✳"],
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
    ],
  },
];

export default function DashboardShell({ children, admin = false }) {
  const auth = useAuth(),
    router = useRouter(),
    path = usePathname(),
    [menu, setMenu] = useState(false);

  const base = admin ? "/admin" : "/dashboard";

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
      {/* Mobile Drawer Backdrop Overlay */}
      <div
        className={`sidebar-backdrop ${menu ? "is-open" : ""}`}
        onClick={() => setMenu(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${menu ? "is-open" : ""}`}>
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
          <div
            className="sidebar-mode-badge"
            data-mode={auth.dashboardRole}
            style={{
              background: auth.dashboardRole === "provider" ? "#FFE66D" : "#4ECDC4",
              border: "2.5px solid var(--ink)",
              borderRadius: "14px",
              padding: "10px 14px",
              boxShadow: "3px 3px 0 var(--ink)",
              margin: "10px 0 16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "13px" }}>
                {auth.dashboardRole === "provider" ? "↗ PROVIDER ACTIVE" : "⌕ SEEKER ACTIVE"}
              </strong>
              <button
                type="button"
                className="comic-star-badge"
                style={{
                  background: "white",
                  cursor: "pointer",
                  fontSize: "10px",
                  padding: "2px 8px",
                }}
                onClick={() =>
                  auth.setDashboardRole(
                    auth.dashboardRole === "provider" ? "seeker" : "provider"
                  )
                }
              >
                Switch ↺
              </button>
            </div>
            <small style={{ display: "block", marginTop: "4px", color: "#36362f", fontSize: "11px" }}>
              {auth.dashboardRole === "provider"
                ? "Showing capacity monetization tools"
                : "Showing resource discovery & RFQ tools"}
            </small>
          </div>
        )}

        <nav aria-label="Dashboard navigation">
          {sections.map((section) => (
            <div key={section.title} className="sidebar-section">
              <span className="sidebar-section-title">{section.title}</span>
              {section.links.map(([slug, label, icon]) => {
                const target = `${base}${slug ? "/" + slug : ""}`;
                const isActive =
                  path === target || (slug && path.startsWith(`${base}/${slug}/`));
                return (
                  <Link
                    key={slug}
                    onClick={() => setMenu(false)}
                    className={isActive ? "active" : ""}
                    href={target}
                  >
                    <span className="nav-icon">{icon}</span>
                    <span className="nav-label">{label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
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
          <button
            className="mobile-menu quiet"
            onClick={() => setMenu(!menu)}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>

          <div className="workspace-top-title">
            <span className="live-dot" />
            <span className="workspace-tagline">
              {admin ? "Platform Governance" : "Hospitality Resource Exchange"}
            </span>
            {!admin && (
              <span
                className={`top-mode-pill ${auth.dashboardRole}`}
                style={{
                  background: auth.dashboardRole === "provider" ? "#FFE66D" : "#4ECDC4",
                  fontWeight: 800,
                  border: "2px solid var(--ink)",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  boxShadow: "2px 2px 0 var(--ink)",
                }}
              >
                {auth.dashboardRole === "provider" ? "↗ Provider Mode" : "⌕ Seeker Mode"}
              </span>
            )}
          </div>

          {!admin && (
            <div className="segmented">
              {["provider", "seeker"].map((mode) => (
                <Action
                  key={mode}
                  className={auth.dashboardRole === mode ? "selected" : ""}
                  run={() => auth.setDashboardRole(mode)}
                >
                  {mode === "provider" ? "↗ Provider" : "⌕ Seeker"}
                </Action>
              ))}
            </div>
          )}

          <Link
            className="avatar"
            aria-label="Account profile"
            href={admin ? "/admin/settings" : "/dashboard/profile"}
          >
            {auth.user.name.slice(0, 1).toUpperCase()}
          </Link>
        </header>

        <main className="dashboard-content" key={path}>
          {children}
        </main>

        <footer className="workspace-footer">
          <div>
            UTLIO B2B EXCHANGE <span>· Less idle. More possible.</span>
          </div>
          <div className="footer-links">
            <Link href="/">Home</Link>
            <Link href="/dashboard/notifications">Alerts</Link>
            <Link href="/dashboard/profile">Account</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
