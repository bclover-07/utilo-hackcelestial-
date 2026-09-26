"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  useData,
  State,
  Empty,
  Heading,
  Field,
  ActionForm,
  Action,
  Badge,
  money,
} from "./ui";
import { ListingCard } from "./Inventory";
import WorkProcessWidget from "./WorkProcessWidget";

export function RapidoNegotiateModal({ listing, onClose }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [days] = useState(1);
  const unitPrice = listing.price || 1000;
  const baseRate = unitPrice * quantity * days;
  const [offerPrice, setOfferPrice] = useState(baseRate);
  const [conditions, setConditions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleQuantityChange = (delta) => {
    const next = Math.max(1, Math.min(listing.quantity || 100, quantity + delta));
    setQuantity(next);
    const newBase = unitPrice * next * days;
    setOfferPrice(newBase);
  };

  const discountRatio = baseRate > 0 ? (offerPrice - baseRate) / baseRate : 0;
  const discountPct = Math.round(Math.abs(discountRatio) * 100);

  const applyPreset = (factor) => {
    setOfferPrice(Math.round(baseRate * factor));
  };

  const nudgePrice = (delta) => {
    setOfferPrice((prev) => Math.max(50, prev + delta));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api("/quotes/direct-offer", {
        method: "POST",
        body: {
          listingId: listing._id,
          price: Number(offerPrice),
          quantity: Number(quantity),
          conditions: conditions.trim() || undefined,
        },
      });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/negotiations?selected=${res.quoteId}`);
      }, 1100);
    } catch (err) {
      setError(err.message || "Failed to submit offer.");
      setLoading(false);
    }
  }

  return (
    <div className="rapido-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rapido-modal-card">
        <div className="rapido-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span className="rapido-badge-tag">⚡ RAPIDO FARE COUNTER</span>
              <span className="spec-chip">📍 {listing.city}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: "1.35rem" }}>{listing.title}</h2>
            {listing.ownerName && (
              <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#555" }}>
                Offered by <strong>{listing.ownerName}</strong> {listing.ownerVerification === "verified" && "✓ Verified"}
              </p>
            )}
          </div>
          <button
            type="button"
            className="quiet"
            style={{ fontSize: "1.4rem", padding: "2px 8px", cursor: "pointer", border: "none", background: "none" }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="success" style={{ textAlign: "center", padding: "2rem" }}>
            <h3 style={{ margin: "0 0 8px" }}>🎉 Counter-Offer Dispatched!</h3>
            <p style={{ margin: "0 0 12px" }}>
              Your proposed price of <strong>{money(offerPrice)}</strong> was sent to {listing.ownerName || "the provider"}.
            </p>
            <p className="hint">Connecting to live negotiation chat room…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Units & Base Price Overview */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "#FAF8F5", padding: "10px 14px", border: "2px solid #20201e", borderRadius: 12 }}>
                <span className="eyebrow" style={{ color: "#7B61A8" }}>QUANTITY NEEDED</span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                  <button type="button" className="rapido-stepper-btn" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>−</button>
                  <strong style={{ fontSize: "1.2rem" }}>{quantity} {listing.unit || "unit"}</strong>
                  <button type="button" className="rapido-stepper-btn" onClick={() => handleQuantityChange(1)} disabled={quantity >= (listing.quantity || 100)}>+</button>
                </div>
                <small style={{ color: "#666", display: "block", marginTop: 4 }}>Pool: {listing.quantity} available</small>
              </div>

              <div style={{ background: "#FAF8F5", padding: "10px 14px", border: "2px solid #20201e", borderRadius: 12 }}>
                <span className="eyebrow" style={{ color: "#7B61A8" }}>LISTED BASE RATE</span>
                <div style={{ marginTop: 4 }}>
                  <strong style={{ fontSize: "1.3rem", display: "block" }}>{money(baseRate)}</strong>
                  <small style={{ color: "#666" }}>{money(listing.price)} / {listing.unit || "unit"}</small>
                </div>
              </div>
            </div>

            {/* Rapido Fare Box */}
            <div className="rapido-bid-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="eyebrow" style={{ color: "#20201e" }}>YOUR COUNTER-OFFER (INR)</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>Rapido Dynamic Bidding</span>
              </div>

              {/* Preset Chips */}
              <div className="rapido-preset-strip">
                <button type="button" className={`rapido-chip ${discountRatio === -0.15 ? "active" : ""}`} onClick={() => applyPreset(0.85)}>
                  −15% Saver ({money(Math.round(baseRate * 0.85))})
                </button>
                <button type="button" className={`rapido-chip ${discountRatio === -0.1 ? "active" : ""}`} onClick={() => applyPreset(0.9)}>
                  −10% Value ({money(Math.round(baseRate * 0.9))})
                </button>
                <button type="button" className={`rapido-chip ${offerPrice === baseRate ? "active" : ""}`} onClick={() => applyPreset(1)}>
                  Listed Rate ({money(baseRate)})
                </button>
                <button type="button" className={`rapido-chip ${discountRatio === 0.05 ? "active" : ""}`} onClick={() => applyPreset(1.05)}>
                  +5% Priority ({money(Math.round(baseRate * 1.05))})
                </button>
                <button type="button" className={`rapido-chip ${discountRatio === 0.1 ? "active" : ""}`} onClick={() => applyPreset(1.1)}>
                  +10% Rush ({money(Math.round(baseRate * 1.1))})
                </button>
              </div>

              {/* Stepper & Custom Price Input */}
              <div className="rapido-stepper-row">
                <button type="button" className="rapido-stepper-btn" onClick={() => nudgePrice(-250)}>−₹250</button>
                <button type="button" className="rapido-stepper-btn" onClick={() => nudgePrice(-100)}>−₹100</button>
                <input
                  type="number"
                  className="rapido-price-input"
                  min="50"
                  step="50"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(Number(e.target.value) || 0)}
                  required
                />
                <button type="button" className="rapido-stepper-btn" onClick={() => nudgePrice(100)}>+₹100</button>
                <button type="button" className="rapido-stepper-btn" onClick={() => nudgePrice(250)}>+₹250</button>
              </div>

              {/* Dynamic Bargain Indicator */}
              <div style={{ marginTop: 12 }}>
                {discountRatio < -0.2 ? (
                  <div className="bargain-gauge-pill" style={{ background: "#FFE2DB", borderColor: "#76271D" }}>
                    <span>⚠️ Aggressive Discount (−{discountPct}%)</span>
                    <small>Provider may decline or counter-offer higher.</small>
                  </div>
                ) : discountRatio < 0 ? (
                  <div className="bargain-gauge-pill" style={{ background: "#DDF4D1", borderColor: "#244C24" }}>
                    <span>🟢 Competitive Fair Offer (−{discountPct}%)</span>
                    <small>High acceptance probability by provider.</small>
                  </div>
                ) : discountRatio === 0 ? (
                  <div className="bargain-gauge-pill" style={{ background: "#E0F2FE", borderColor: "#0369A1" }}>
                    <span>⭐ Full Listed Rate</span>
                    <small>Standard terms, instant provider priority.</small>
                  </div>
                ) : (
                  <div className="bargain-gauge-pill" style={{ background: "#EDE9FE", borderColor: "#6D28D9" }}>
                    <span>⚡ Priority Surge Offer (+{discountPct}%)</span>
                    <small>Maximum priority for peak or urgent events.</small>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Special Conditions Note */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: 4 }}>
                Special Conditions / Notes to Provider (Optional)
              </label>
              <textarea
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "2px solid #20201e", fontSize: "0.9rem", minHeight: 60, background: "#fff" }}
                placeholder="e.g. Need 8 AM load-in setup, own transportation arranged, etc."
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                maxLength={500}
              />
            </div>

            {error && <div className="error" role="alert">{error}</div>}

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                type="submit"
                className="button"
                style={{ flex: 1, background: "#FFE66D", border: "2px solid #20201e", fontWeight: 800, fontSize: "1rem", padding: "12px", cursor: "pointer" }}
                disabled={loading || offerPrice <= 0}
              >
                {loading ? "Dispatching Offer…" : `🚀 Send Offer of ${money(offerPrice)} & Open Chat`}
              </button>
              <button
                type="button"
                className="button quiet"
                style={{ padding: "12px 18px", cursor: "pointer" }}
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function SearchPage() {
  const categories = useData("/categories"),
    [result, setResult] = useState(null),
    [filters, setFilters] = useState({}),
    [selectedCategory, setSelectedCategory] = useState(""),
    [searchKeyword, setSearchKeyword] = useState(""),
    [rapidoListing, setRapidoListing] = useState(null);
  const [paging, setPaging] = useState(false), [pageError, setPageError] = useState("");

  // Automatically load all vetted resources on mount like an e-commerce catalog
  useEffect(() => {
    let active = true;
    api("/search", { method: "POST", body: {} })
      .then((res) => {
        if (active) {
          setResult(res);
          setFilters({});
        }
      })
      .catch((err) => console.error("Auto-load search error:", err));
    return () => { active = false; };
  }, []);

  async function filterByCategory(slug) {
    setSelectedCategory(slug);
    setPageError("");
    const newFilters = { ...filters, category: slug || undefined, page: 1 };
    setFilters(newFilters);
    try {
      const res = await api("/search", { method: "POST", body: newFilters });
      setResult(res);
    } catch (err) {
      setPageError(err.message);
    }
  }

  async function handleKeywordSearch(keyword) {
    setSearchKeyword(keyword);
    setPageError("");
    const newFilters = { ...filters, query: keyword.trim() || undefined, page: 1 };
    setFilters(newFilters);
    try {
      const res = await api("/search", { method: "POST", body: newFilters });
      setResult(res);
    } catch (err) {
      setPageError(err.message);
    }
  }

  async function changePage(page) {
    if (paging) return;
    setPaging(true); setPageError("");
    try { setResult(await api("/search", { method: "POST", body: { ...filters, page } })); }
    catch (error) { setPageError(error.message); }
    finally { setPaging(false); }
  }

  const categoryIcons = {
    banquet_hall: "🏛️",
    chairs: "🪑",
    tables: "🍽️",
    av_equipment: "🔊",
    linens: "✨",
    kitchen: "👨‍🍳",
  };

  return (
    <>
      <Heading
        title="Good things. Closer than you think."
        description="Browse available hospitality resources, filter by category, or propose a custom counter-offer directly."
      >
        <Link className="button lavender" href="/dashboard/requests/create">
          Post an RFQ ↗
        </Link>
      </Heading>

      {/* Category Quick-Filter Strip */}
      <div className="category-filter-bar">
        <button
          type="button"
          className={`category-pill-btn ${!selectedCategory ? "active" : ""}`}
          onClick={() => filterByCategory("")}
        >
          <span>✨</span>
          <span>All Resources ({result ? result.total : "…"})</span>
        </button>
        {categories.data?.map((c) => (
          <button
            key={c._id}
            type="button"
            className={`category-pill-btn ${selectedCategory === c.slug ? "active" : ""}`}
            onClick={() => filterByCategory(c.slug)}
          >
            <span>{categoryIcons[c.slug] || "📦"}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      <div className="discovery-marketplace-container">
        {/* LEFT / MAIN COLUMN: DIRECT LISTINGS */}
        <div className="discovery-main-content">
          {/* Quick Search & Sort Bar */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center", background: "#FAF8F5", padding: "12px 16px", borderRadius: "14px", border: "2px solid #20201e", boxShadow: "3px 3px 0 #20201e" }}>
            <span style={{ fontSize: "1.2rem" }}>🔍</span>
            <input
              type="text"
              placeholder="Search resource name, model or keyword..."
              value={searchKeyword}
              onChange={(e) => handleKeywordSearch(e.target.value)}
              style={{ flex: 1, border: "none", background: "transparent", fontSize: "0.95rem", fontWeight: 600, outline: "none" }}
            />
            {searchKeyword && (
              <button
                type="button"
                className="quiet"
                style={{ cursor: "pointer", border: "none", background: "none", fontWeight: 700 }}
                onClick={() => handleKeywordSearch("")}
              >
                ✕
              </button>
            )}
            <span style={{ fontSize: "0.85rem", color: "#666", fontWeight: 700 }}>
              {result ? `${result.total} available` : "Loading..."}
            </span>
          </div>

          {result ? (
            <>
              {result.items.length ? (
                <div className="card-grid">
                  {result.items.map((l, i) => (
                    <ListingCard key={l._id} listing={l} index={i}>
                      {l.isOwnListing ? (
                        <Link
                          className="button quiet"
                          href="/dashboard/listings"
                        >
                          Manage in Listings ↗
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="button"
                          style={{ background: "#FFE66D", border: "2px solid #20201e", fontWeight: 800, cursor: "pointer" }}
                          onClick={() => setRapidoListing(l)}
                        >
                          🤝 Counter Offer / Negotiate ₹
                        </button>
                      )}
                      <Link
                        className="button quiet"
                        href={`/dashboard/resources/${l._id}`}
                      >
                        View details ↗
                      </Link>
                      <Action
                        className="quiet"
                        run={() => api(`/favorites/${l._id}`, { method: "POST" })}
                      >
                        Save / unsave ♡
                      </Action>
                    </ListingCard>
                  ))}
                </div>
              ) : (
                <Empty
                  title="No listings matched."
                  text="Try clearing your filters or post a requirement on the right."
                  href="/dashboard/requests/create"
                  label="Post your requirement"
                />
              )}

              {result.total > 24 && (
                <nav className="search-pagination" aria-label="Resource results pages">
                  <button className="quiet" disabled={paging || result.page <= 1} onClick={() => changePage(result.page - 1)}>← Previous</button>
                  <span role="status">{paging ? "Loading results…" : `Page ${result.page} of ${Math.ceil(result.total / 24)}`}</span>
                  <button className="quiet" disabled={paging || result.page >= Math.ceil(result.total / 24)} onClick={() => changePage(result.page + 1)}>Next →</button>
                </nav>
              )}
              {pageError && <p className="error" role="alert">{pageError}</p>}
              <div className="discovery-status-strip">
                <span className="live-dot" />
                <span>Marketplace Liquidity Active · {result.total} vetted options available across Mumbai</span>
              </div>
            </>
          ) : (
            <p>Loading marketplace catalog…</p>
          )}
        </div>

        {/* RIGHT COLUMN: POST OPTIONS & WORK PROCESSES */}
        <aside className="discovery-sidebar">
          {/* Post Option 1: Provider Listing */}
          <div className="discovery-post-card" style={{ background: "#FFF9DB" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="eyebrow" style={{ color: "#B8860B" }}>PROVIDER REVENUE</span>
              <span className="badge" style={{ background: "#FFE66D", border: "1.5px solid #20201e", fontSize: "0.75rem", fontWeight: 700 }}>Earn Rental ₹</span>
            </div>
            <h3>🏢 List Your Resources</h3>
            <p>Have venue space, audio equipment, chairs, or setups idle between dates? Monetize them in minutes.</p>
            <Link
              href="/dashboard/listings/create"
              className="button"
              style={{ background: "#20201e", color: "#fff", textAlign: "center", textDecoration: "none", fontWeight: 800, padding: "10px 14px", borderRadius: "10px" }}
            >
              + Post a Resource Listing ↗
            </Link>
          </div>

          {/* Post Option 2: Seeker Custom RFQ */}
          <div className="discovery-post-card" style={{ background: "#E8F5E9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="eyebrow" style={{ color: "#2E7D32" }}>SEEKER RFQ</span>
              <span className="badge" style={{ background: "#A8E6CF", border: "1.5px solid #20201e", fontSize: "0.75rem", fontWeight: 700 }}>Custom Deal</span>
            </div>
            <h3>📢 Post a Requirement</h3>
            <p>Need a custom multi-category package or specific dates? Broadcast an RFQ to verified suppliers.</p>
            <Link
              href="/dashboard/requests/create"
              className="button"
              style={{ background: "#4ECDC4", color: "#171915", textAlign: "center", textDecoration: "none", fontWeight: 800, padding: "10px 14px", borderRadius: "10px", border: "2px solid #20201e" }}
            >
              Post Custom RFQ ↗
            </Link>
          </div>

          {/* Quick Filters Accordion */}
          <details className="panel" style={{ background: "#fff", padding: "12px 14px", border: "2px solid #20201e", borderRadius: "14px", boxShadow: "3px 3px 0 #20201e" }}>
            <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: "0.9rem" }}>
              ⚡ Advanced Filter & Budget
            </summary>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                Filter City
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  defaultValue={filters?.city || ""}
                  onBlur={(e) => {
                    const newFilters = { ...filters, city: e.target.value.trim() || undefined, page: 1 };
                    setFilters(newFilters);
                    api("/search", { method: "POST", body: newFilters }).then(setResult);
                  }}
                  style={{ width: "100%", padding: "6px 8px", border: "1.5px solid #20201e", borderRadius: "8px", marginTop: "4px" }}
                />
              </label>
              <label style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                Max Budget (INR)
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  defaultValue={filters?.budget || ""}
                  onBlur={(e) => {
                    const newFilters = { ...filters, budget: e.target.value ? Number(e.target.value) : undefined, page: 1 };
                    setFilters(newFilters);
                    api("/search", { method: "POST", body: newFilters }).then(setResult);
                  }}
                  style={{ width: "100%", padding: "6px 8px", border: "1.5px solid #20201e", borderRadius: "8px", marginTop: "4px" }}
                />
              </label>
            </div>
          </details>

          {/* User's Work Process History from DB */}
          <WorkProcessWidget title="Your Work Processes" maxItems={4} />
        </aside>
      </div>

      {/* Rapido Interactive Bidding Modal */}
      {rapidoListing && (
        <RapidoNegotiateModal
          listing={rapidoListing}
          onClose={() => setRapidoListing(null)}
        />
      )}
    </>
  );
}

export function ResourceDetail({ id }) {
  const resource = useData(`/listings/${id}`);
  const [rapidoListing, setRapidoListing] = useState(null);
  return (
    <State resource={resource}>
      {(l) => (
        <>
          <Heading title={l.title} description={`${l.city} · ${l.address}`}>
            <Link className="button" href="/dashboard/requests/create">
              Request this category ↗
            </Link>
          </Heading>
          <div className="split-layout">
            <section className="panel">
              <div className="photo-grid">
                {l.photos.map((url) => (
                  <Image
                    width={800}
                    height={600}
                    unoptimized
                    key={url}
                    src={url}
                    alt={l.title}
                  />
                ))}
              </div>
              <h2>About this resource</h2>
              <p>{l.description}</p>
              <p>
                <strong>{l.owner.name}</strong>{" "}
                <Badge>{l.owner.verification}</Badge>
              </p>
              <dl className="spec-list">
                {Object.entries(l.attributes || {}).map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{String(v)}</dd>
                  </div>
                ))}
              </dl>
              <a
                target="_blank"
                rel="noreferrer"
                href={`https://www.openstreetmap.org/?mlat=${l.location.coordinates[1]}&mlon=${l.location.coordinates[0]}#map=15/${l.location.coordinates[1]}/${l.location.coordinates[0]}`}
              >
                View resource location on OpenStreetMap ↗
              </a>
            </section>
            <section className="panel resource-pricing-panel" style={{ background: "#FFE66D" }}>
              <div className="resource-pricing-header">
                <span className="eyebrow">VERIFIED RATE</span>
                <h2 style={{ fontSize: "2.2rem", marginTop: "4px" }}>
                  {money(l.price)} <small style={{ fontSize: "1rem" }}>/ {l.unit}</small>
                </h2>
              </div>

              <div className="resource-spec-grid">
                <div className="resource-spec-pill">
                  <span className="pill-icon">📦</span>
                  <div>
                    <strong>{l.quantity} units</strong>
                    <small>Available Pool</small>
                  </div>
                </div>
                <div className="resource-spec-pill">
                  <span className="pill-icon">👥</span>
                  <div>
                    <strong>{l.capacity} guest cap</strong>
                    <small>Per Unit</small>
                  </div>
                </div>
                <div className="resource-spec-pill">
                  <span className="pill-icon">⏱</span>
                  <div>
                    <strong>{l.minHours}h minimum</strong>
                    <small>Rental Duration</small>
                  </div>
                </div>
                <div className="resource-spec-pill">
                  <span className="pill-icon">🔒</span>
                  <div>
                    <strong>{money(l.deposit)}</strong>
                    <small>Security Deposit</small>
                  </div>
                </div>
              </div>

              <div className="resource-policy-card">
                <div className="policy-row">
                  <span>🚚 Delivery Logistics</span>
                  <strong>{l.delivery ? `Available · ${money(l.deliveryFee)}` : "Self pickup / on-site"}</strong>
                </div>
                <div className="policy-row">
                  <span>🛡 Cancellation Shield</span>
                  <strong>Free cancellation up to {l.cancellationHours}h before start</strong>
                </div>
              </div>

              {l.conditions && (
                <div className="resource-conditions-box">
                  <h4>Provider Terms & Condition</h4>
                  <p>{l.conditions}</p>
                </div>
              )}

              <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: 10 }}>
                {l.isOwnListing ? (
                  <Link className="button quiet" href="/dashboard/listings">
                    Manage this Resource in Listings ↗
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="button"
                    style={{ background: "#20201e", color: "#fff", border: "2px solid #20201e", fontWeight: 800, padding: "12px", cursor: "pointer" }}
                    onClick={() => setRapidoListing(l)}
                  >
                    ⚡ Propose Counter-Offer (Rapido)
                  </button>
                )}
                <Action className="button lavender" run={() => api(`/favorites/${id}`, { method: "POST" })}>
                  Save to Shortlist ♡
                </Action>
              </div>
            </section>
          </div>

          {rapidoListing && (
            <RapidoNegotiateModal
              listing={rapidoListing}
              onClose={() => setRapidoListing(null)}
            />
          )}
          <details className="panel">
            <summary>Report this listing</summary>
            <ActionForm
              label="Submit report"
              onSubmit={async (form) => {
                await api(`/listings/${id}/report`, {
                  method: "POST",
                  body: Object.fromEntries(form),
                });
                return "Report sent to the moderation queue.";
              }}
            >
              <Field
                label="Describe the issue"
                name="reason"
                as="textarea"
                minLength={10}
                required
              />
            </ActionForm>
          </details>
        </>
      )}
    </State>
  );
}
export function ComparePage() {
  const [rerun, setRerun] = useState(null);
  const favorites = useData("/favorites"),
    saved = useData("/saved-searches");
  return (
    <>
      <Heading
        title="A shortlist worth keeping."
        description="Compare your saved resources before posting a request."
      />
      <State resource={favorites}>
        {(data) =>
          data.length ? (
            <div className="compare-grid">
              {data.map((l) => (
                <section className="panel compare-card-neo" key={l._id}>
                  <div className="compare-card-top">
                    <Badge>{l.category?.replaceAll("_", " ")}</Badge>
                    <span className="spec-chip">📍 {l.city}</span>
                  </div>
                  <h2 style={{ margin: "0.5rem 0" }}>{l.title}</h2>

                  <div className="compare-metrics-grid">
                    <div className="compare-metric-card">
                      <span>Rate</span>
                      <strong>{money(l.price)} <small>/{l.unit}</small></strong>
                    </div>
                    <div className="compare-metric-card">
                      <span>Capacity</span>
                      <strong>{l.capacity} guests</strong>
                    </div>
                    <div className="compare-metric-card">
                      <span>Available</span>
                      <strong>{l.quantity} units</strong>
                    </div>
                    <div className="compare-metric-card">
                      <span>Deposit</span>
                      <strong>{money(l.deposit)}</strong>
                    </div>
                  </div>

                  <div className="compare-chips-strip">
                    <span className="spec-chip">🚚 {l.delivery ? `Delivery ${money(l.deliveryFee)}` : "Pickup"}</span>
                    <span className="spec-chip">⏱ Min {l.minHours}h</span>
                    <span className="spec-chip">🛡 {l.cancellationHours}h cancel</span>
                  </div>

                  <div className="compare-actions-row">
                    <Link className="button" href={`/dashboard/resources/${l._id}`}>
                      Full details →
                    </Link>
                    <Action
                      className="quiet"
                      run={async () => {
                        await api(`/favorites/${l._id}`, { method: "POST" });
                        await favorites.reload();
                      }}
                    >
                      Remove
                    </Action>
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <Empty
              title="Keep your favourites close."
              text="Save resources from Discover to compare their terms here."
              href="/dashboard/search"
              label="Discover resources"
            />
          )
        }
      </State>
      <h2>Saved searches & alerts</h2>
      <State resource={saved}>
        {(data) =>
          data.length ? (
            <div className="card-grid">
              {data.map((s) => (
                <article className="panel" key={s._id}>
                  <h3>{s.name}</h3>
                  <p>Matching new listings trigger in-app notifications.</p>
                  <p className="hint">{s.filters.city || "All cities"} · {s.filters.category?.replaceAll("_", " ") || "All categories"} · {s.filters.quantity || 1} units</p>
                  <Action className="quiet" run={async () => { setRerun(null); const response = await api("/search", { method: "POST", body: { ...s.filters, page: 1 } }); setRerun({ ...response, name: s.name }); }}>Run saved search</Action>
                  <Action
                    className="quiet"
                    run={async () => {
                      await api(`/saved-searches/${s._id}`, {
                        method: "DELETE",
                      });
                      await saved.reload();
                    }}
                  >
                    Delete alert
                  </Action>
                </article>
              ))}
            </div>
          ) : (
            <p>No saved searches yet.</p>
          )
        }
      </State>
      {rerun && <section className="panel"><h2>{rerun.name}: {rerun.total} current matches</h2><p>Saved filters were checked again against current records. Edit dates in Discover if the saved event has passed.</p>{rerun.items.length ? <div className="card-grid">{rerun.items.map((listing, index) => <ListingCard listing={listing} index={index} key={listing._id}><Link href={`/dashboard/resources/${listing._id}`}>View resource →</Link></ListingCard>)}</div> : <p>No resources currently match these saved filters.</p>}{rerun.total > rerun.items.length && <p>Showing {rerun.items.length} of {rerun.total}. <Link href="/dashboard/search">Use Discover to refine and paginate results.</Link></p>}</section>}
    </>
  );
}
