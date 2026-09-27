"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Action } from "./ui";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Bot,
  Search,
  Calendar,
  Sparkles,
  Inbox,
  BookmarkCheck,
  Package,
  DollarSign,
  Award,
  MessageSquare,
  CalendarCheck,
  Star,
  ShieldAlert,
  Activity,
  BarChart3,
  Bell,
  LayoutDashboard,
  ShieldCheck,
  CheckCircle,
  Sliders,
  ArrowLeftRight,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  CloudRain,
} from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "@/lib/i18n";
import { getSocket } from "@/lib/socket";
import { IncomingCallModal } from "./IncomingCallModal";
import { VideoCallModal } from "./VideoCallModal";
import NugenAssistant from "./NugenAssistant";

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
      ["inventory", "Inventory Hub & Fleet", <Boxes size={17} key="inventory" />],
      ["listings", "My listings", <Package size={17} key="listings" />],
      ["calendar", "Availability & Calendar", <Calendar size={17} key="calendar" />],
      ["smart-pricing", "Smart pricing & demand", <DollarSign size={17} key="pricing" />],
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
      ["weather-twin", "Weather Digital Twin", <CloudRain size={17} key="twin" />],
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
      ["weather-twin", "Weather Digital Twin", <CloudRain size={17} key="twin" />],
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

  // Global Video Call & Real-Time Alert State
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (notification) => {
    if (!notification) return;
    const id = notification._id || `toast_${Date.now()}_${Math.random()}`;
    const newToast = {
      id,
      title: notification.title || "Notification",
      body: notification.body || "",
      href: notification.href || "/dashboard/notifications",
      kind: notification.kind || "general",
    };
    setToasts((prev) => [...prev.slice(-2), newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  useEffect(() => {
    if (!auth.user) return;
    const socket = getSocket();
    if (!socket) return;

    if (!socket.connected) {
      socket.connect();
    }

    function handleIncoming(data) {
      if (!data || !data.caller) return;
      if (auth.user && String(data.caller._id) === String(auth.user._id)) {
        return; // Caller never sees incoming alert for their own call
      }
      setIncomingCall(data);
    }

    function handleAccepted() {
      setIncomingCall(null);
    }

    function handleDeclined() {
      setIncomingCall(null);
    }

    function handleNotification(data) {
      setHasNewAlert(true);
      if (data) {
        addToast(data);
      }
    }

    function handleCustomNotify(e) {
      if (e.detail) {
        setHasNewAlert(true);
        addToast(e.detail);
      }
    }

    function handleWindowStartCall(e) {
      if (e.detail) {
        setActiveCall(e.detail);
      }
    }

    socket.on("video_call_incoming", handleIncoming);
    socket.on("video_call_accepted", handleAccepted);
    socket.on("video_call_declined", handleDeclined);
    socket.on("notification", handleNotification);
    socket.on("notification_new", handleNotification);
    window.addEventListener("utilo:notify", handleCustomNotify);
    window.addEventListener("utlio:notify", handleCustomNotify);
    window.addEventListener("utilo:open-video-call", handleWindowStartCall);
    window.addEventListener("utlio:open-video-call", handleWindowStartCall);

    return () => {
      socket.off("video_call_incoming", handleIncoming);
      socket.off("video_call_accepted", handleAccepted);
      socket.off("video_call_declined", handleDeclined);
      socket.off("notification", handleNotification);
      socket.off("notification_new", handleNotification);
      window.removeEventListener("utilo:notify", handleCustomNotify);
      window.removeEventListener("utlio:notify", handleCustomNotify);
      window.removeEventListener("utilo:open-video-call", handleWindowStartCall);
      window.removeEventListener("utlio:open-video-call", handleWindowStartCall);
    };
  }, [auth.user]);

  const handleAcceptIncomingCall = (callData) => {
    const socket = getSocket();
    if (socket) {
      socket.emit("video_call_accept", {
        quoteId: callData.quoteId,
        roomId: callData.roomId,
        messageId: callData.messageId,
      });
    }
    setIncomingCall(null);
    setActiveCall({
      quoteId: callData.quoteId,
      roomId: callData.roomId,
      partnerId: callData.caller?._id,
      partnerName: callData.caller?.name,
      partnerRole: callData.callerRole || (auth.dashboardRole === "provider" ? "Seeker" : "Provider"),
      listingTitle: callData.listingTitle,
      isInitiator: false,
      messageId: callData.messageId,
    });
  };

  const handleDeclineIncomingCall = (callData) => {
    const socket = getSocket();
    if (socket) {
      socket.emit("video_call_decline", {
        quoteId: callData.quoteId,
        roomId: callData.roomId,
        messageId: callData.messageId,
        reason: "Provider is currently unavailable.",
      });
    }
    setIncomingCall(null);
  };

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
            <span>U</span>utilo<span className="brand-dot">✳</span>
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
                <strong>UTILO</strong>
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
              style={{ position: "relative" }}
              onClick={() => setHasNewAlert(false)}
            >
              <Bell size={18} />
              {hasNewAlert && (
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#ef4444",
                    border: "1.5px solid #20201e",
                  }}
                />
              )}
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
            UTILO B2B EXCHANGE <span>· Less idle. More possible.</span>
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

      {/* Real-Time Incoming Video Call Modal */}
      <IncomingCallModal
        incomingCall={incomingCall}
        onAccept={handleAcceptIncomingCall}
        onDecline={handleDeclineIncomingCall}
      />

      {/* Active WebRTC Video Conference Modal */}
      {activeCall && (
        <VideoCallModal
          isOpen={!!activeCall}
          onClose={() => setActiveCall(null)}
          quoteId={activeCall.quoteId}
          roomId={activeCall.roomId}
          partnerName={activeCall.partnerName}
          partnerId={activeCall.partnerId}
          partnerRole={activeCall.partnerRole}
          listingTitle={activeCall.listingTitle}
          isInitiator={activeCall.isInitiator}
          messageId={activeCall.messageId}
        />
      )}

      {/* Real-Time Floating Notification Alerts */}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          top: "80px",
          right: "24px",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "380px",
          width: "calc(100vw - 32px)",
          pointerEvents: "none",
        }}
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const isBooking = toast.kind === "booking" || toast.title.toLowerCase().includes("booking");
            const isCancelled = toast.title.toLowerCase().includes("cancel");
            const isMsg = toast.kind === "message" || toast.title.toLowerCase().includes("message");
            const isOffer = toast.kind === "negotiation" || toast.title.toLowerCase().includes("offer");

            const accentColor = isCancelled
              ? "#ef4444"
              : isBooking
              ? "#10b981"
              : isMsg
              ? "#3b82f6"
              : isOffer
              ? "#f59e0b"
              : "#6366f1";

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{
                  pointerEvents: "auto",
                  background: "#fffdf8",
                  border: "2px solid #171915",
                  borderRadius: "10px",
                  boxShadow: "4px 4px 0 #171915",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: accentColor,
                    border: "1.5px solid #171915",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: "#fff",
                    boxShadow: "1px 1px 0 #171915",
                  }}
                >
                  {isCancelled ? (
                    <AlertTriangle size={18} color="#fff" />
                  ) : isBooking ? (
                    <CheckCircle2 size={18} color="#fff" />
                  ) : isMsg ? (
                    <MessageSquare size={18} color="#fff" />
                  ) : (
                    <Bell size={18} color="#fff" />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "0.88rem",
                        fontWeight: 800,
                        color: "#171915",
                        letterSpacing: "-0.01em",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {toast.title}
                    </h4>
                    <button
                      onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px",
                        color: "#595852",
                        display: "flex",
                        alignItems: "center",
                      }}
                      aria-label="Dismiss notification"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p
                    style={{
                      margin: "3px 0 8px",
                      fontSize: "0.8rem",
                      color: "#475569",
                      lineHeight: 1.35,
                      wordBreak: "break-word",
                    }}
                  >
                    {toast.body}
                  </p>
                  {toast.href && (
                    <Link
                      href={toast.href}
                      onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "#171915",
                        textDecoration: "underline",
                      }}
                    >
                      <span>View details</span>
                      <ArrowRight size={12} />
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Floating Nugen Intelligence Copilot & Alignment Studio */}
      <NugenAssistant />
    </div>
  );
}
