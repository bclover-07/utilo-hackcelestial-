"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ActionForm, Field, Flow } from "./ui";

export default function AuthPage({ register = false }) {
  const [role, setRole] = useState("business");
  const [registerMode, setRegisterMode] = useState("seeker");
  const [loginMode, setLoginMode] = useState("seeker");
  const [emailVal, setEmailVal] = useState("");
  const [passwordVal, setPasswordVal] = useState("");
  const [demoNotice, setDemoNotice] = useState("");
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  const auth = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (auth.loading || !auth.user) return;
    const home = auth.user.role === "admin" ? "/admin" : "/dashboard";
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(
      next &&
        (next === home || next.startsWith(`${home}/`)) &&
        !next.includes("\\")
        ? next
        : home
    );
  }, [auth.loading, auth.user, router]);

  // Check URL query on mount for ?role= or ?demo=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demoParam = params.get("demo") || params.get("role");
    if (demoParam && !register) {
      if (demoParam === "provider") {
        fillAndLogin("provider@utlio.com", "Password123!", "business", "provider");
      } else if (demoParam === "seeker") {
        fillAndLogin("seeker@utlio.com", "Password123!", "business", "seeker");
      } else if (demoParam === "admin") {
        fillAndLogin("admin@utlio.com", "Password123!", "admin");
      }
    }
  }, [register]);

  const fillAndLogin = async (email, password, loginRole, businessMode) => {
    setEmailVal(email);
    setPasswordVal(password);
    setRole(loginRole);
    if (businessMode) setLoginMode(businessMode);
    setDemoNotice(`⚡ 1-Click Demo: Logging in as ${email}...`);
    setAutoSubmitting(true);

    try {
      await auth.login({
        email,
        password,
        role: loginRole,
        mode: businessMode,
      });
      if (businessMode) {
        auth.setDashboardRole(businessMode);
      }
      router.replace(loginRole === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setDemoNotice(`Demo login failed: ${err.message}. Please try manual login.`);
      setAutoSubmitting(false);
    }
  };

  if (auth.loading || auth.user) {
    return (
      <main className="state" role="status">
        <span className="live-dot" />
        {auth.loading ? "Checking your active session…" : "Opening your dashboard workspace…"}
      </main>
    );
  }

  return (
    <main className="auth-page">
      <Link className="brand" href="/">
        <span>U</span>utlio<span className="brand-dot">✳</span>
      </Link>

      <div className="auth-grid">
        {/* Story & Comic Accents */}
        <section className="auth-story">
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            <span className="comic-sticker" style={{ background: "#FFE66D" }}>
              ★ 100% VERIFIED B2B
            </span>
            <span className="comic-sticker" style={{ background: "#4ECDC4" }}>
              🛡️ ZERO DOUBLE-BOOKINGS
            </span>
          </div>

          <h1 className="comic-hero-title" style={{ fontSize: "clamp(34px, 4.5vw, 52px)" }}>
            Your Next Event.
            <br />
            <span className="comic-highlight">Already Within Reach.</span>
          </h1>

          <p style={{ fontSize: "16px", color: "#111111", fontWeight: 550 }}>
            Put idle hospitality resources to work. Connect directly with nearby hotels,
            banquet spaces, and equipment vendors to share capacity.
          </p>

          <Flow steps={["Explore", "RFQ Match", "Negotiate", "Atomic Lock", "Fulfil"]} active={2} />

          <div className="comic-bubble" style={{ background: "#C3B1E1", marginTop: "24px" }}>
            <h3 style={{ fontSize: "18px", margin: "0 0 6px" }}>One Business Account. Both Modes.</h3>
            <p style={{ margin: 0, fontSize: "14px", color: "#111111" }}>
              Toggle seamlessly between <strong>Provider Mode</strong> (list & earn) and{" "}
              <strong>Seeker Mode</strong> (post requirements & rent).
            </p>
          </div>
        </section>

        {/* Form Panel */}
        <section className="panel auth-form" style={{ border: "3px solid var(--ink)", borderRadius: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h2>{register ? "Join the B2B Exchange" : "Welcome Back!"}</h2>
            <span className="comic-star-badge" style={{ background: "#FFE66D" }}>
              {register ? "SIGN UP" : "SECURE LOGIN"}
            </span>
          </div>

          <p style={{ fontSize: "14px", color: "#1a1a1a", margin: "4px 0 12px" }}>
            {register
              ? "Create your business profile to start listing or requesting hospitality assets."
              : "Choose an account type or click a Demo Persona below for instant judge evaluation."}
          </p>

          {/* Compact 1-Click Demo Evaluation Bar (on Login) */}
          {!register && (
            <div className="demo-compact-bar">
              <div className="demo-compact-header">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "15px" }}>⚡</span>
                  <span style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "0.5px" }}>
                    1-CLICK DEMO EVALUATION
                  </span>
                </div>
                <span className="comic-star-badge" style={{ background: "#4ECDC4", fontSize: "9px", padding: "2px 6px" }}>
                  AUTO-LOGIN
                </span>
              </div>
              <div className="demo-compact-grid">
                <button
                  type="button"
                  className="demo-compact-btn provider"
                  onClick={() => fillAndLogin("provider@utlio.com", "Password123!", "business", "provider")}
                  disabled={autoSubmitting}
                  title="Login as The Grand Mumbai Palace"
                >
                  <span className="demo-btn-icon">↗</span>
                  <div className="demo-btn-text">
                    <strong>Provider</strong>
                    <small>provider@utlio.com</small>
                  </div>
                </button>
                <button
                  type="button"
                  className="demo-compact-btn seeker"
                  onClick={() => fillAndLogin("seeker@utlio.com", "Password123!", "business", "seeker")}
                  disabled={autoSubmitting}
                  title="Login as Elite Corporate Events"
                >
                  <span className="demo-btn-icon">⌕</span>
                  <div className="demo-btn-text">
                    <strong>Seeker</strong>
                    <small>seeker@utlio.com</small>
                  </div>
                </button>
                <button
                  type="button"
                  className="demo-compact-btn admin"
                  onClick={() => fillAndLogin("admin@utlio.com", "Password123!", "admin")}
                  disabled={autoSubmitting}
                  title="Login as Operations Director"
                >
                  <span className="demo-btn-icon">🛡️</span>
                  <div className="demo-btn-text">
                    <strong>Admin</strong>
                    <small>admin@utlio.com</small>
                  </div>
                </button>
              </div>
              {demoNotice && (
                <div className="demo-compact-notice">
                  {demoNotice}
                </div>
              )}
            </div>
          )}

          {/* Account Role Selector */}
          <div className="segmented" style={{ marginBottom: "14px" }}>
            {["business", "admin"].map((r) => (
              <button
                className={role === r ? "selected" : ""}
                type="button"
                key={r}
                onClick={() => setRole(r)}
              >
                {r === "business" ? "Hospitality Business" : "Platform Administrator"}
              </button>
            ))}
          </div>

          {/* Persona Mode Switcher for Business Login */}
          {!register && role === "business" && (
            <div style={{ marginBottom: "14px" }}>
              <label className="field">
                <span style={{ fontWeight: 800, fontSize: "11px", letterSpacing: "0.5px" }}>
                  LOGIN WORKSPACE MODE
                </span>
              </label>
              <div className="segmented" style={{ marginTop: "4px" }}>
                <button
                  type="button"
                  className={loginMode === "seeker" ? "selected" : ""}
                  onClick={() => setLoginMode("seeker")}
                >
                  ⌕ Seeker (Discovery & RFQ)
                </button>
                <button
                  type="button"
                  className={loginMode === "provider" ? "selected" : ""}
                  onClick={() => setLoginMode("provider")}
                >
                  ↗ Provider (Monetize & List)
                </button>
              </div>
            </div>
          )}

          <ActionForm
            label={register ? "Create Account ↗" : "Log In to Workspace →"}
            onSubmit={async (form) => {
              const data = Object.fromEntries(form);
              await auth[register ? "register" : "login"]({
                ...data,
                role,
                mode: role === "business" ? (register ? registerMode : loginMode) : undefined,
              });
            }}
          >
            {register && (
              <>
                <Field
                  label="Business / Enterprise Name"
                  name="name"
                  placeholder="e.g. Royal Orchid Hotel & Banquets"
                  autoComplete="organization"
                  required
                />

                <div className="form-grid">
                  <Field label="City" name="city" placeholder="e.g. Mumbai" required />
                  <Field label="Phone" name="phone" type="tel" placeholder="+91 98200 00000" required />
                </div>

                <Field label="Business Category" as="select" name="category">
                  <option value="hotel">Hotel & Resort</option>
                  <option value="venue">Banquet Venue</option>
                  <option value="caterer">Caterer & Dining Supplier</option>
                  <option value="event_organizer">Event Management Agency</option>
                  <option value="vendor">Equipment & AV Vendor</option>
                </Field>

                {role === "business" ? (
                  <div>
                    <label className="field">
                      <span>Primary Mode to Start</span>
                    </label>
                    <div className="segmented" style={{ marginTop: "6px" }}>
                      <button
                        type="button"
                        className={registerMode === "seeker" ? "selected" : ""}
                        onClick={() => setRegisterMode("seeker")}
                      >
                        ⌕ Seeker (Find & Rent)
                      </button>
                      <button
                        type="button"
                        className={registerMode === "provider" ? "selected" : ""}
                        onClick={() => setRegisterMode("provider")}
                      >
                        ↗ Provider (List & Earn)
                      </button>
                    </div>
                    <small style={{ display: "block", marginTop: "6px" }}>
                      You can switch between Provider and Seeker modes at any time inside your dashboard.
                    </small>
                  </div>
                ) : (
                  <Field
                    label="Administrator Invitation Code"
                    name="inviteCode"
                    type="password"
                    placeholder="Enter confidential invite token"
                    required
                    autoComplete="off"
                  />
                )}
              </>
            )}

            <Field
              label="Email Address"
              name="email"
              type="email"
              value={emailVal}
              onChange={(e) => setEmailVal(e.target.value)}
              placeholder="you@hospitality-firm.com"
              autoComplete="email"
              required
            />

            <Field
              label={register ? "Password (at least 10 characters)" : "Password"}
              name="password"
              type="password"
              value={passwordVal}
              onChange={(e) => setPasswordVal(e.target.value)}
              minLength={register ? 10 : undefined}
              maxLength={128}
              autoComplete={register ? "new-password" : "current-password"}
              required
            />
          </ActionForm>

          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "2px dashed #d6d3c9" }}>
            <p style={{ margin: 0 }}>
              {register ? "Already registered?" : "New hospitality business?"}{" "}
              <Link
                href={register ? "/login" : "/register"}
                style={{ fontWeight: 800, textDecoration: "underline" }}
              >
                {register ? "Log in here" : "Create an account"}
              </Link>
            </p>
            {role === "admin" && (
              <small style={{ display: "block", marginTop: "8px", color: "#8a5800" }}>
                🔒 Administrator access is restricted to verified platform operations teams.
              </small>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
