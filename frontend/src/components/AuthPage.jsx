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

const personas = {
  seeker: {
    icon: Search,
    title: "Seeker",
    detail: "Find your next great setup.",
  },
  provider: {
    icon: Package,
    title: "Provider",
    detail: "Put your spare capacity to work.",
  },
  admin: {
    icon: ShieldCheck,
    title: "Admin",
    detail: "Keep the exchange in good hands.",
  },
};
export default function AuthPage({ register = false }) {
  return (
    <Suspense
      fallback={<main className="state">Preparing your workspace…</main>}
    >
      <AuthQuery register={register} />
    </Suspense>
  );
}
function AuthQuery({ register }) {
  const query = useSearchParams();
  const requested = query.get("role");
  const initialPersona = Object.hasOwn(personas, requested)
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
      next &&
        (next === home || next.startsWith(`${home}/`)) &&
        !/[\\\r\n]/.test(next)
        ? next
        : home,
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
        <Link className="back-link" href="/">
          <ArrowLeft size={16} /> Back to the exchange
        </Link>
      </header>
      <div className="auth-layout">
        <section className="auth-editorial">
          <span className="eyebrow">
            <span className="tiny-spark">✳</span> GOOD THINGS ARE BETTER SHARED
          </span>
          <h1>
            Less idle.
            <br />
            More <span className="marker-text">possible.</span>
          </h1>
          <p>
            The right resources. The right neighbours. A little help from AI.
            Let’s make your next event happen.
          </p>
          <div className="auth-illustration" aria-hidden="true">
            <div className="orbit-label orbit-one">
              <Package size={26} />
              <span>
                Space to share<strong>Endless possibilities</strong>
              </span>
            </div>
            <div className="orbit-hub">
              u<span>✳</span>
            </div>
            <div className="orbit-label orbit-two">
              <Sparkles size={26} />
              <span>
                A smarter match<strong>Your next big idea</strong>
              </span>
            </div>
            <span className="orbit-star">✳</span>
          </div>
          <div className="auth-note">
            <ShieldCheck size={25} />
            <div>
              <strong>One business. Both sides of the exchange.</strong>
              <p>
                Find resources as a seeker. Share them as a provider. Switch
                anytime in your business workspace.
              </p>
            </div>
          </div>
        </section>
        <section className="panel auth-card">
          <div className="auth-card-heading">
            <span className="eyebrow">
              {register
                ? "YOUR NEXT CHAPTER"
                : "YOUR PEOPLE. YOUR POSSIBILITIES."}
            </span>
            <span className="stamp">HELLO ✳</span>
          </div>
          <h2>{register ? "Make room for more." : "Welcome back."}</h2>
          <p>
            {register
              ? "Create your account and start something good."
              : "Choose how you’d like to get things moving."}
          </p>
          <fieldset disabled={busy} className="persona-fieldset">
            <legend>Account type</legend>
            <div className="persona-toggle account-type-toggle" aria-label="Account type">
              <button type="button" aria-pressed={role === "business"} className={role === "business" ? "selected" : ""} onClick={() => selectPersona("seeker")}><Package size={19} /> Business</button>
              <button type="button" aria-pressed={role === "admin"} className={role === "admin" ? "selected" : ""} onClick={() => selectPersona("admin")}><ShieldCheck size={19} /> Admin</button>
            </div>
            {role === "business" && <><p className="business-mode-label">{register ? "Choose your starting mode" : "Open your business workspace in"}</p><div className="persona-toggle business-mode-toggle" aria-label="Business mode">
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
                    <Icon size={19} />
                    {item.title}
                  </button>
                );
              })}
            </div></>}
            <p className="persona-caption">
              {personas[persona].detail}
            </p>
            {role === "business" && <p className="business-approval-note">One account and one business approval cover both modes. Switch between seeking and providing in your dashboard. {register ? "Explore and plan after signup; complete your business profile for admin approval before publishing resources or creating requests." : "Your selected mode changes the workspace tools, not your account permissions."}</p>}
          </fieldset>
          <form
            className="form-stack"
            aria-busy={busy}
            onSubmit={async (event) => {
              event.preventDefault();
              if (busy) return;
              const data = Object.fromEntries(
                new FormData(event.currentTarget),
              );
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
                    placeholder={
                      role === "admin"
                        ? "Your full name"
                        : "Your hotel, venue or business"
                    }
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
                    <Field
                      label="Business category"
                      as="select"
                      name="category"
                    >
                      <option value="hotel">Hotel / Resort</option>
                      <option value="venue">Banquet / Venue</option>
                      <option value="caterer">Caterer</option>
                      <option value="event_organizer">Event organizer</option>
                      <option value="vendor">Equipment vendor</option>
                      <option value="restaurant">Restaurant</option>
                    </Field>
                  ) : (
                    <input
                      type="hidden"
                      name="category"
                      value="platform_operations"
                    />
                  )}
                </>
              )}
              <Field
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                  autoComplete={register ? "new-password" : "current-password"}
                  placeholder={
                    register ? "At least 10 characters" : "Your password"
                  }
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
              {register && (
                <small>
                  Use 10+ characters, up to 72 UTF-8 bytes. Business
                  verification follows signup.
                </small>
              )}
            </fieldset>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="auth-submit" disabled={busy} type="submit">
              {busy
                ? "Opening your workspace…"
                : register
                  ? "Create my account"
                  : "Let’s go"}
              <ArrowUpRight size={20} />
            </button>
          </form>
          <p className="auth-switch">
            {register
              ? "Already part of the neighbourhood?"
              : "New around here?"}{" "}
            <Link href={`${register ? "/login" : "/register"}?role=${persona}`}>
              {register ? "Log in" : "Create an account"} ↗
            </Link>
          </p>
        </section>
      </div>
      <div className="auth-bottom">
        <span>MADE FOR HOSPITALITY. BUILT FOR POSSIBILITY.</span>
        <span>Discover · Connect · Share</span>
      </div>
    </main>
  );
}
