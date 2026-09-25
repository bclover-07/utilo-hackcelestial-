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
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="panel empty"
      initial={{ opacity: 0, scale: reduced ? 1 : 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.span
        className="empty-symbol"
        animate={reduced ? undefined : { y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
      >
        ↗
      </motion.span>
      <h3>{title}</h3>
      <p>{text}</p>
      {href && (
        <motion.div whileHover={reduced ? undefined : { scale: 1.03 }} whileTap={reduced ? undefined : { scale: 0.97 }}>
          <Link className="button" href={href}>
            {label || "Get started"}
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}

export function Heading({
  eyebrow = "YOUR EXCHANGE",
  title,
  description,
  children,
}) {
  const reduced = useReducedMotion();
  return (
    <header className="page-heading">
      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="eyebrow">{eyebrow}</span>
        <motion.h1
          initial={{ opacity: 0, x: reduced ? 0 : -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            {description}
          </motion.p>
        )}
      </motion.div>
      <div className="actions">{children}</div>
    </header>
  );
}

export function Badge({ children, variant = "" }) {
  const reduced = useReducedMotion();
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
    <motion.span
      className={`badge ${variant}`}
      style={badgeStyle}
      whileHover={reduced ? undefined : { scale: 1.06, y: -1 }}
      transition={{ type: "spring", stiffness: 450, damping: 20 }}
    >
      {label.replaceAll("_", " ")}
    </motion.span>
  );
}

export function Field({ label, as = "input", children, ...props }) {
  const Tag = as;
  return (
    <motion.label
      className="field interactive-field"
      whileFocus={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
    >
      <span>{label}</span>
      <Tag {...props}>{children}</Tag>
    </motion.label>
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
        {(error || success) && (
          <motion.p
            key={error ? "error" : "success"}
            className={`${error ? "error" : "success"} form-feedback`}
            role={error ? "alert" : "status"}
            initial={{ opacity: 0, y: reduced ? 0 : 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.18 }}
          >
            {error ? <CircleAlert size={18} /> : <CheckCircle2 size={18} />}
            {error || success}
          </motion.p>
        )}
      </AnimatePresence>
      <motion.button
        disabled={busy}
        type="submit"
        whileHover={reduced || busy ? undefined : { y: -2, boxShadow: "5px 6px 0px #20201e" }}
        whileTap={reduced || busy ? undefined : { scale: 0.97, y: 1, boxShadow: "1px 1px 0px #20201e" }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
      >
        {busy ? (
          <>
            <LoaderCircle className="busy-spinner" size={18} aria-hidden="true" /> Working…
          </>
        ) : (
          label
        )}
      </motion.button>
    </form>
  );
}

export function Action({ run, children, className = "", disabled = false }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const running = useRef(false);
  const reduced = useReducedMotion();

  return (
    <span className="action-wrap">
      <motion.button
        type="button"
        className={className}
        disabled={busy || disabled}
        whileHover={reduced || disabled || busy ? undefined : { y: -2, boxShadow: "5px 6px 0px #20201e" }}
        whileTap={reduced || disabled || busy ? undefined : { scale: 0.97, y: 1, boxShadow: "1px 1px 0px #20201e" }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
        onClick={async () => {
          if (running.current || disabled) return;
          running.current = true;
          setBusy(true);
          setError("");
          setSuccess("");
          try {
            const result = await run();
            setSuccess(typeof result === "string" ? result : "Completed.");
          } catch (e) {
            setError(e.message);
          } finally {
            running.current = false;
            setBusy(false);
          }
        }}
      >
        {busy ? (
          <>
            <LoaderCircle className="busy-spinner" size={16} aria-hidden="true" /> Working…
          </>
        ) : (
          children
        )}
      </motion.button>
      <AnimatePresence>
        {error && (
          <motion.small
            role="alert"
            className="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.small>
        )}
        {success && (
          <motion.small
            className="action-success"
            role="status"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <CheckCircle2 size={13} aria-hidden="true" /> {success}
          </motion.small>
        )}
      </AnimatePresence>
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
