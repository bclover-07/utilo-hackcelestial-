"use client";
import { Children, useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";

export const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

export const date = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not set";

export const colors = [
  "#FFE66D",
  "#4ECDC4",
  "#C3B1E1",
  "#FFB347",
  "#A8E6CF",
  "#FF85A1",
  "#89CFF0",
  "#FF6B6B",
  "#B6E880",
  "#C8BEFF",
  "#FFCBA4",
  "#818CF8",
  "#FBBF24",
  "#9CA88B",
];

export function useData(path) {
  const [snapshot, setSnapshot] = useState({ path, data: null, error: "", loading: true });
  const version = useRef(0), controller = useRef(null);
  const load = useCallback(async () => {
    const request = ++version.current;
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    try {
      const data = await api(path, { signal: current.signal });
      if (request === version.current && !current.signal.aborted) setSnapshot({ path, data, error: "", loading: false });
    } catch (error) {
      if (request === version.current && !current.signal.aborted) setSnapshot({ path, data: null, error: error.message, loading: false });
    }
  }, [path]);
  useEffect(() => {
    const request = ++version.current;
    const pending = new AbortController();
    controller.current?.abort();
    controller.current = pending;
    api(path, { signal: pending.signal }).then(data => {
      if (request === version.current && !pending.signal.aborted) setSnapshot({ path, data, error: "", loading: false });
    }).catch(error => {
      if (request === version.current && !pending.signal.aborted) setSnapshot({ path, data: null, error: error.message, loading: false });
    });
    return () => pending.abort();
  }, [path]);
  const reload = useCallback(() => {
    setSnapshot(previous => ({ path, data: previous.path === path ? previous.data : null, error: "", loading: true }));
    return load();
  }, [load, path]);
  const current = snapshot.path === path ? snapshot : { data: null, error: "", loading: true };
  return { ...current, reload };
}

export function State({ resource, children }) {
  if (resource.loading && !resource.data)
    return (
      <div
        className="skeleton-container"
        role="status"
        aria-label="Loading workspace data"
      >
        <div className="skeleton-grid">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
        <div className="skeleton-status">
          <span className="live-dot" /> Loading live marketplace records…
        </div>
      </div>
    );

  if (resource.error)
    return (
      <div className="panel state error-panel" role="alert">
        <div
          className="empty-symbol"
          style={{ background: "#FF6B6B", color: "#20201e" }}
        >
          !
        </div>
        <h3>Unable to load records</h3>
        <p>{resource.error}</p>
        <button onClick={resource.reload}>Retry connection ↺</button>
      </div>
    );

  return children(resource.data);
}

export function Empty({
  title = "Nothing here yet",
  text = "Your activity will appear here as you use Utlio.",
  href,
  label,
}) {
  return (
    <div className="panel empty">
      <span className="empty-symbol">↗</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {href && (
        <Link className="button" href={href}>
          {label || "Get started"}
        </Link>
      )}
    </div>
  );
}

export function Heading({
  eyebrow = "YOUR EXCHANGE",
  title,
  description,
  children,
}) {
  return (
    <header className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="actions">{children}</div>
    </header>
  );
}

export function Badge({ children, variant = "" }) {
  const label = Children.toArray(children).join("");
  const text = label.toLowerCase();
  let badgeStyle = {};

  if (
    ["active", "verified", "confirmed", "completed", "supply found"].includes(
      text,
    )
  ) {
    badgeStyle = { background: "#A8E6CF", borderColor: "#20201e" };
  } else if (
    text.includes("urgent") ||
    text.includes("emergency") ||
    text.includes("rejected")
  ) {
    badgeStyle = { background: "#FF85A1", borderColor: "#20201e" };
  } else if (
    text.includes("pending") ||
    text.includes("invited") ||
    text.includes("offered")
  ) {
    badgeStyle = { background: "#FFE66D", borderColor: "#20201e" };
  } else if (text.includes("in_progress") || text.includes("hold")) {
    badgeStyle = { background: "#FFB347", borderColor: "#20201e" };
  }

  return (
    <span className={`badge ${variant}`} style={badgeStyle}>
      {label.replaceAll("_", " ")}
    </span>
  );
}

export function Field({ label, as = "input", children, ...props }) {
  const Tag = as;
  return (
    <label className="field interactive-field">
      <span>{label}</span>
      <Tag {...props}>{children}</Tag>
    </label>
  );
}

export function ActionForm({
  onSubmit,
  children,
  label = "Save",
  className = "",
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const submitting = useRef(false);
  const reduced = useReducedMotion();

  return (
    <form
      className={`form-stack ${className}`}
      aria-busy={busy}
      onSubmit={async (e) => {
        e.preventDefault();
        if (submitting.current) return;
        submitting.current = true;
        setBusy(true);
        setError("");
        setSuccess("");
        try {
          const result = await onSubmit(new FormData(e.currentTarget));
          setSuccess(
            typeof result === "string" ? result : "Saved successfully.",
          );
        } catch (e) {
          setError(e.message);
        } finally {
          submitting.current = false;
          setBusy(false);
        }
      }}
    >
      {children}
      <AnimatePresence initial={false}>
        {(error || success) && <motion.p key={error ? "error" : "success"} className={`${error ? "error" : "success"} form-feedback`} role={error ? "alert" : "status"} initial={{ opacity: 0, y: reduced ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .18 }}>{error ? <CircleAlert size={18} /> : <CheckCircle2 size={18} />}{error || success}</motion.p>}
      </AnimatePresence>
      <motion.button disabled={busy} type="submit" whileTap={reduced ? undefined : { scale: .98 }}>
        {busy ? <><LoaderCircle className="busy-spinner" size={18} aria-hidden="true" /> Working…</> : label}
      </motion.button>
    </form>
  );
}

export function Action({ run, children, className = "", disabled = false }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");

  return (
    <span className="action-wrap">
      <button
        className={className}
        disabled={busy || disabled}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await run();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Working…" : children}
      </button>
      {error && (
        <small role="alert" className="error">
          {error}
        </small>
      )}
    </span>
  );
}

export function Flow({
  steps = ["Describe", "Match", "Negotiate", "Reserve", "Fulfil"],
  active = 0,
}) {
  return (
    <ol className="flow" aria-label="Workflow progress">
      {steps.map((s, i) => (
        <li
          key={s}
          className={i <= active ? "current" : ""}
          aria-current={i === active ? "step" : undefined}
        >
          <span>{String(i + 1).padStart(2, "0")}</span>
          {s}
        </li>
      ))}
    </ol>
  );
}

export function UploadField({ kind = "image", onUpload }) {
  return (
    <ActionForm
      label="Upload file"
      onSubmit={async (form) => {
        form.set("kind", kind);
        const uploaded = await api("/uploads", { method: "POST", body: form });
        onUpload(uploaded);
        return "File stored securely.";
      }}
    >
      <Field
        label={
          kind === "image"
            ? "Resource photo (up to 8 MB)"
            : "Business document (up to 8 MB)"
        }
        name="file"
        type="file"
        accept={
          kind === "image"
            ? "image/jpeg,image/png,image/webp"
            : "image/jpeg,image/png,application/pdf"
        }
        required
      />
    </ActionForm>
  );
}
