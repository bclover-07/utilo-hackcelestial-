"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Search,
  Package,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Field } from "./ui";
import LanguageSwitcher from "./LanguageSwitcher";

const personas = {
  seeker: {
    icon: Search,
    title: "Seeker",
    detail: "Discover and reserve event resources.",
  },
  provider: {
    icon: Package,
    title: "Provider",
    detail: "List and monetize inventory & spaces.",
  },
  admin: {
    icon: ShieldCheck,
    title: "Admin",
    detail: "Manage operations & verifications.",
  },
};

export default function AuthPage({ register = false }) {
  return (
    <Suspense fallback={<main className="state">Preparing your workspace…</main>}>
      <AuthQuery register={register} />
    </Suspense>
  );
}

function AuthQuery({ register }) {
  const query = useSearchParams();
  const requested = query.get("role");
  const initialPersona = Object.hasOwn(personas, requested) && !(register && requested === "admin")
    ? requested
    : "seeker";
  return (
    <AuthForm
      key={`${register}:${initialPersona}`}
      register={register}
      initialPersona={initialPersona}
    />
  );
}

function AuthForm({ register, initialPersona }) {
  const [persona, setPersona] = useState(initialPersona);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const auth = useAuth();
  const router = useRouter();
  const role = persona === "admin" ? "admin" : "business";

  useEffect(() => {
    if (auth.loading || !auth.user) return;
    const home = auth.user.role === "admin" ? "/admin" : "/dashboard";
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(
      next && (next === home || next.startsWith(`${home}/`)) && !/[\\\r\n]/.test(next)
        ? next
        : home
    );
  }, [auth.loading, auth.user, router]);

  function selectPersona(next) {
    setPersona(next);
    setError("");
  }

  if (auth.loading || auth.user)
    return (
      <main className="state" role="status">
        <span className="live-dot" />{" "}
        {auth.loading ? "Checking your session…" : "Opening your workspace…"}
      </main>
    );

  return (
    <main className="auth-studio">
      <header className="auth-header">
        <Link className="brand" href="/">
          <span>u</span>utlio<span className="brand-dot">✳</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <LanguageSwitcher compact />
          <Link className="back-link" href="/">
            <ArrowLeft size={16} /> Back to home
          </Link>
        </div>
      </header>
      <div className="auth-layout">
        <section className="auth-editorial">
          <span className="eyebrow">
            <span className="tiny-spark">✳</span> SHARED HOSPITALITY EXCHANGE
          </span>
          <h1>
            Less idle.
            <br />
            More <span className="marker-text">possible.</span>
          </h1>
          <p>
            Connect directly with verified local hotels, venues, caterers, and equipment providers.
          </p>
          <div className="auth-illustration" aria-hidden="true">
            <div className="orbit-label orbit-one">
              <Package size={24} />
              <span>Space & Equipment<strong>Verified Inventory</strong></span>
            </div>
            <div className="orbit-hub">u<span>✳</span></div>
            <div className="orbit-label orbit-two">
              <Sparkles size={24} />
              <span>Smart AI Matching<strong>Real-time ZOPA</strong></span>
            </div>
            <span className="orbit-star">✳</span>
          </div>
        </section>

        <section className="panel auth-card">
          <div className="auth-card-heading">
            <span className="eyebrow">
              {register ? "CREATE ACCOUNT" : "AUTHENTICATION"}
            </span>
            <span className="stamp">UTLIO ✳</span>
          </div>
          <h2>{register ? "Get started." : "Welcome back."}</h2>

          <fieldset disabled={busy} className="persona-fieldset">
            <legend>Account type</legend>
            <div className="persona-toggle account-type-toggle" aria-label="Account type">
              <button
                type="button"
                aria-pressed={role === "business"}
                className={role === "business" ? "selected" : ""}
                onClick={() => selectPersona("seeker")}
              >
                <Package size={18} /> Business
              </button>
              {!register && (
                <button
                  type="button"
                  aria-pressed={role === "admin"}
                  className={role === "admin" ? "selected" : ""}
                  onClick={() => selectPersona("admin")}
                >
                  <ShieldCheck size={18} /> Admin
                </button>
              )}
            </div>

            {role === "business" && (
              <div className="persona-toggle business-mode-toggle" aria-label="Business mode" style={{ marginTop: "8px" }}>
                {Object.entries(personas).filter(([key]) => key !== "admin").map(([key, item]) => {
                  const Icon = item.icon;
                  return (
                    <button
                      type="button"
                      key={key}
                      data-persona={key}
                      aria-pressed={persona === key}
                      className={persona === key ? "selected" : ""}
                      onClick={() => selectPersona(key)}
                    >
                      <Icon size={17} />
                      {item.title}
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>

          {!register && (
            <div style={{ margin: "0.75rem 0 1rem", padding: "0.75rem", background: "#FAF8F5", borderRadius: "12px", border: "1.5px solid #171915" }}>
              <span className="eyebrow" style={{ fontSize: "0.7rem", letterSpacing: "0.08em", display: "block", marginBottom: "6px" }}>
                ONE-CLICK DEMO AUTOFILL
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                <button
                  type="button"
                  className="button"
                  style={{ fontSize: "0.8rem", padding: "5px 10px", background: "#FFE66D", border: "1.5px solid #171915", cursor: "pointer" }}
                  onClick={() => {
                    setEmail("shreshta@utlio.com");
                    setPassword("Password123!");
                    selectPersona("provider");
                  }}
                >
                  🏢 Shreshta (Provider)
                </button>
                <button
                  type="button"
                  className="button"
                  style={{ fontSize: "0.8rem", padding: "5px 10px", background: "#FFE66D", border: "1.5px solid #171915", cursor: "pointer" }}
                  onClick={() => {
                    setEmail("shreyas@utlio.com");
                    setPassword("Password123!");
                    selectPersona("provider");
                  }}
                >
                  🔊 Shreyas (Provider)
                </button>
                <button
                  type="button"
                  className="button"
                  style={{ fontSize: "0.8rem", padding: "5px 10px", background: "#4ECDC4", border: "1.5px solid #171915", cursor: "pointer" }}
                  onClick={() => {
                    setEmail("shivam@utlio.com");
                    setPassword("Password123!");
                    selectPersona("seeker");
                  }}
                >
                  🎯 Shivam (Seeker)
                </button>
                <button
                  type="button"
                  className="button"
                  style={{ fontSize: "0.8rem", padding: "5px 10px", background: "#C3B1E1", border: "1.5px solid #171915", cursor: "pointer" }}
                  onClick={() => {
                    setEmail("admin@utlio.com");
                    setPassword("Password123!");
                    selectPersona("admin");
                  }}
                >
                  🛡️ Admin
                </button>
              </div>
            </div>
          )}

          <form
            className="form-stack"
            aria-busy={busy}
            onSubmit={async (event) => {
              event.preventDefault();
              if (busy) return;
              const data = Object.fromEntries(new FormData(event.currentTarget));
              if (register && new TextEncoder().encode(password).length > 72) {
                setError("Use a password of at most 72 UTF-8 bytes.");
                return;
              }
              setBusy(true);
              setError("");
              try {
                await auth[register ? "register" : "login"]({
                  ...data,
                  email: email.trim(),
                  password,
                  role,
                  ...(role === "business" ? { mode: persona } : {}),
                });
              } catch (e) {
                setError(e.message);
                setBusy(false);
              }
            }}
          >
            <fieldset disabled={busy} className="auth-fields">
              {register && (
                <>
                  <Field
                    label={role === "admin" ? "Full name" : "Business name"}
                    name="name"
                    autoComplete={role === "admin" ? "name" : "organization"}
                    placeholder={role === "admin" ? "Your full name" : "Your hotel, venue or business"}
                    maxLength={500}
                    required
                  />
                  <div className="form-grid">
                    <Field
                      label="City"
                      name="city"
                      autoComplete="address-level2"
                      placeholder="Mumbai"
                      maxLength={500}
                      required
                    />
                    <Field
                      label="Phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+91 98765 43210"
                      maxLength={500}
                      required
                    />
                  </div>
                  {role === "business" ? (
                    <Field label="Business category" as="select" name="category">
                      <option value="hotel">Hotel / Resort</option>
                      <option value="venue">Banquet / Venue</option>
                      <option value="caterer">Caterer</option>
                      <option value="event_organizer">Event organizer</option>
                      <option value="vendor">Equipment vendor</option>
                      <option value="restaurant">Restaurant</option>
                    </Field>
                  ) : (
                    <input type="hidden" name="category" value="platform_operations" />
                  )}
                </>
              )}
              <Field
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourbusiness.com"
                maxLength={254}
                required
              />
              <div className="password-control">
                <Field
                  label="Password"
                  name="password"
                  type={visible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={register ? "new-password" : "current-password"}
                  placeholder={register ? "At least 10 characters" : "Your password"}
                  minLength={register ? 10 : undefined}
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  className="password-eye"
                  aria-label={visible ? "Hide password" : "Show password"}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </fieldset>
            {error && <p className="error" role="alert">{error}</p>}
            <button className="auth-submit" disabled={busy} type="submit">
              {busy ? "Opening workspace…" : register ? "Create account" : "Sign in"}
              <ArrowUpRight size={18} />
            </button>
          </form>
          <p className="auth-switch">
            {register ? "Already have an account?" : "Need an account?"}{" "}
            <Link href={`${register ? "/login" : "/register"}?role=${persona}`}>
              {register ? "Sign in" : "Create account"} ↗
            </Link>
          </p>
        </section>
      </div>
      <div className="auth-bottom">
        <span>UTLIO HOSPITALITY EXCHANGE</span>
        <span>Verified Venues & Equipment</span>
      </div>
    </main>
  );
}
