"use client";
import { useState } from "react";
import LocalAi from "./LocalAi";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  useData,
  State,
  Empty,
  Heading,
  Badge,
  Field,
  ActionForm,
  Action,
  UploadField,
  money,
  date,
  colors,
} from "./ui";

const FLEET_COLORS = ["#4ECDC4", "#FFE66D", "#FF6B6B", "#C3B1E1", "#78E08F", "#60C5F1", "#FFA502"];

function FleetInventoryAnalytics({ listings }) {
  if (!listings || listings.length === 0) return null;

  const totalUnits = listings.reduce((acc, l) => acc + (l.quantity || 1), 0);
  const activeCount = listings.filter((l) => l.status === "active").length;
  const pausedCount = listings.filter((l) => l.status === "paused").length;
  const totalValue = listings.reduce((acc, l) => acc + (l.price * (l.quantity || 1)), 0);

  // Group by category
  const catMap = {};
  listings.forEach((l) => {
    const cat = (l.category || "other").replaceAll("_", " ");
    catMap[cat] = (catMap[cat] || 0) + (l.quantity || 1);
  });

  const catData = Object.entries(catMap).map(([name, units]) => ({ name, units }));
  const statusPieData = [
    { name: "Active Ready", value: activeCount },
    { name: "Paused / Draft", value: pausedCount },
  ].filter((d) => d.value > 0);

  return (
    <div className="feature-chart-panel" style={{ background: "#FFFDF8", marginBottom: "2rem" }}>
      <div className="feature-chart-header">
        <div>
          <span className="eyebrow" style={{ color: "#0F766E", marginBottom: 2 }}>FLEET COMPOSITION & YIELD</span>
          <h3 className="feature-chart-title">Resource Inventory Fleet Telemetry</h3>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span className="badge" style={{ background: "#4ECDC440", border: "1px solid #171915" }}>
            {listings.length} Listed Assets ({totalUnits} Units)
          </span>
          <span className="badge" style={{ background: "#FFE66D", border: "1px solid #171915" }}>
            Fleet Capital Value: {money(totalValue)}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", alignItems: "center" }}>
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={catData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E0CF" />
              <XAxis dataKey="name" stroke="#171915" tick={{ fontSize: 10, fontWeight: 700 }} />
              <YAxis stroke="#171915" tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val) => [`${val} Units`, "Stock Capacity"]}
                contentStyle={{ background: "#fffef8", border: "1px solid #171915", borderRadius: 10, fontWeight: 700 }}
              />
              <Bar dataKey="units" name="Fleet Units" fill="#4ECDC4" stroke="#171915" strokeWidth={1} radius={[4, 4, 0, 0]}>
                {catData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={FLEET_COLORS[index % FLEET_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="feature-metrics-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="feature-metric-card" style={{ borderLeft: "3px solid #2ed573" }}>
            <span>Active Listings</span>
            <strong>{activeCount} live</strong>
            <small>Open for RFQ match</small>
          </div>
          <div className="feature-metric-card" style={{ borderLeft: "3px solid #ffd13b" }}>
            <span>Paused Assets</span>
            <strong>{pausedCount} paused</strong>
            <small>Temporarily withheld</small>
          </div>
          <div className="feature-metric-card" style={{ borderLeft: "3px solid #60c5f1" }}>
            <span>Total Units</span>
            <strong>{totalUnits} units</strong>
            <small>Across {Object.keys(catMap).length} categories</small>
          </div>
          <div className="feature-metric-card" style={{ borderLeft: "3px solid #ff6b6b" }}>
            <span>Avg Asset Yield</span>
            <strong>{money(Math.round(totalValue / (listings.length || 1)))}</strong>
            <small>Per active listing</small>
          </div>
        </div>
      </div>
    </div>
  );
}
function MatchScoreGauge({ score }) {
  const radius = 20;
  const stroke = 3.5;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const strokeColor = score >= 85 ? "#10b981" : score >= 65 ? "#f59e0b" : "#6366f1";

  return (
    <div className="match-score-gauge" title={`${score}% AI Compatibility Score`}>
      <svg height={radius * 2} width={radius * 2} className="gauge-svg">
        <circle
          stroke="rgba(23, 25, 21, 0.15)"
          fill="#FFFDF4"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={strokeColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 0.8s ease" }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          transform={`rotate(-90 ${radius} ${radius})`}
        />
      </svg>
      <div className="gauge-text">
        <strong>{score}</strong>
        <small>%</small>
      </div>
    </div>
  );
}

export function ListingCard({ listing, children, index = 0 }) {
  const stockRatio = Math.min(100, Math.max(20, (listing.quantity || 1) * 12));

  return (
    <article className="panel listing-card">
      <div
        className="listing-cover"
        style={{ background: colors[index % colors.length] }}
      >
        {listing.photos?.[0] ? (
          <Image
            width={800}
            height={600}
            unoptimized
            src={listing.photos[0]}
            alt={listing.title}
          />
        ) : (
          <span aria-hidden="true">
            {listing.category === "banquet_hall" ? "⌂" : "▦"}
          </span>
        )}
        <div className="listing-cover-badges">
          <Badge>{listing.category?.replaceAll("_", " ")}</Badge>
        </div>
        {listing.score !== undefined && (
          <div className="listing-score-badge-wrapper">
            <MatchScoreGauge score={listing.score} />
          </div>
        )}
      </div>
      <div className="listing-body">
        <div className="listing-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <h3 style={{ margin: 0 }}>{listing.title}</h3>
          {listing.isOwnListing && (
            <span className="badge" style={{ background: "#FFE66D", border: "2px solid #20201e", fontSize: "0.75rem", fontWeight: 800, whiteSpace: "nowrap" }}>
              👑 Your Listing
            </span>
          )}
        </div>

        {listing.ownerName && (
          <div className="listing-provider-line" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "#555", margin: "4px 0 8px" }}>
            <span>🏢 {listing.ownerName}</span>
            {listing.ownerVerification === "verified" && (
              <span style={{ color: "#059669", fontWeight: 800 }}>✓ Verified</span>
            )}
          </div>
        )}

        <div className="spec-chip-strip">
          <span className="spec-chip">📍 {listing.city}</span>
          <span className="spec-chip">👥 {listing.capacity} cap</span>
          <span className="spec-chip">📦 {listing.quantity} {listing.unit || "units"}</span>
        </div>

        <div className="listing-price-row">
          <div className="price">
            {money(listing.price)} <small>/ {listing.unit}</small>
          </div>
          {listing.estimatedTotal !== undefined && (
            <div className="estimated-pill" title="Estimated cost for selected event timeframe">
              <span>Total:</span> <strong>{money(listing.estimatedTotal)}</strong>
            </div>
          )}
        </div>

        <div className="stock-meter-container">
          <div className="stock-meter-labels">
            <span>Inventory Capacity</span>
            <strong>{listing.quantity} ready</strong>
          </div>
          <div className="stock-meter-track">
            <div className="stock-meter-fill" style={{ width: `${stockRatio}%` }} />
          </div>
        </div>

        {listing.reasons?.length > 0 && (
          <div className="reason-pills-wrap">
            {listing.reasons.map((r) => (
              <span key={r} className="reason-chip">
                <span className="chip-check">✓</span> {r}
              </span>
            ))}
          </div>
        )}

        <div className="actions">{children}</div>
      </div>
    </article>
  );
}
export function Listings() {
  const resource = useData("/listings");
  return (
    <>
      <Heading
        title="Make idle, useful."
        description="Your resources, ready for their next booking."
      >
        <Link className="button" href="/dashboard/listings/create">
          + List a resource
        </Link>
      </Heading>
      <State resource={resource}>
        {(data) =>
          data?.length ? (
            <>
              <FleetInventoryAnalytics listings={data} />
              <div className="card-grid">
                {data.map((l, i) => (
                <ListingCard key={l._id} listing={l} index={i}>
                  <Badge>{l.status}</Badge>
                  {l.moderationHold && (
                    <p className="notice">
                      Publication is on hold while an administrator reviews this
                      resource.
                    </p>
                  )}
                  <Link
                    className="button quiet"
                    href={`/dashboard/listings/${l._id}/edit`}
                  >
                    Edit
                  </Link>
                  {!l.moderationHold && (
                    <Action
                      className="quiet"
                      run={async () => {
                        await api(`/listings/${l._id}/status`, {
                          method: "PATCH",
                          body: {
                            status: l.status === "active" ? "paused" : "active",
                          },
                        });
                        await resource.reload();
                      }}
                    >
                      {l.status === "active" ? "Pause" : "Publish"}
                    </Action>
                  )}
                  <Action
                    className="quiet"
                    run={async () => {
                      await api(`/listings/${l._id}/status`, {
                        method: "PATCH",
                        body: { status: "archived" },
                      });
                      await resource.reload();
                    }}
                  >
                    Archive
                  </Action>
                  <Action
                    className="lavender"
                    run={async () => {
                      await api(`/listings/${l._id}/index`, { method: "POST" });
                      await resource.reload();
                    }}
                  >
                    {l.indexedAt ? "Refresh AI index" : "Index for AI search"}
                  </Action>
                  {l.indexedAt && <small>Indexed {date(l.indexedAt)}</small>}
                </ListingCard>
              ))}
            </div>
            </>
          ) : (
            <Empty
              title="Your next revenue stream starts here."
              text="Add a hall, furniture, or equipment. Set your price, quantity, and rental conditions."
              href="/dashboard/listings/create"
              label="Create your first listing"
            />
          )
        }
      </State>
    </>
  );
}
export function ListingEditor({ id = "" }) {
  const resource = useData(id ? `/listings/${id}` : "/categories");
  return (
    <State resource={resource}>
      {(data) => <ListingForm initial={id ? data : null} />}
    </State>
  );
}
const DEFAULT_CATEGORY_FIELDS = {
  banquet_hall: [
    { key: "air_conditioning", label: "Air Conditioning (AC)", type: "boolean" },
    { key: "parking_capacity", label: "Parking Capacity (vehicles)", type: "number" },
    { key: "stage_available", label: "Stage & Performance Area", type: "boolean" },
    { key: "catering_allowed", label: "Outside Catering Allowed", type: "boolean" },
    { key: "sound_system", label: "Built-in Sound / PA System", type: "boolean" },
    { key: "power_backup", label: "Generator / Power Backup", type: "boolean" },
  ],
  chairs: [
    { key: "chair_type", label: "Chair Style (Banquet, Folding, Cushion)", type: "text" },
    { key: "material", label: "Frame Material (Steel, Wood, Plastic)", type: "text" },
    { key: "stackable", label: "Stackable / Easy Storage", type: "boolean" },
    { key: "cushion_included", label: "Padded Cushion Included", type: "boolean" },
    { key: "weight_capacity_kg", label: "Max Load Capacity (kg)", type: "number" },
  ],
  tables: [
    { key: "shape", label: "Table Shape (Round, Rectangular, High-boy)", type: "text" },
    { key: "seating_per_table", label: "Seats per Table", type: "number" },
    { key: "material", label: "Surface Material", type: "text" },
    { key: "folding", label: "Foldable Legs", type: "boolean" },
  ],
  av_equipment: [
    { key: "equipment_type", label: "Equipment Type (Speaker, Mic, Screen, Projector)", type: "text" },
    { key: "power_output_watts", label: "Power Output / Brightness (Watts/Lumens)", type: "number" },
    { key: "wireless", label: "Wireless / Bluetooth Enabled", type: "boolean" },
    { key: "setup_assistance", label: "On-site Technician Included", type: "boolean" },
  ],
  linens: [
    { key: "fabric_material", label: "Fabric Material (Satin, Polyester, Velvet)", type: "text" },
    { key: "color_options", label: "Color / Theme Options", type: "text" },
    { key: "waterproof", label: "Waterproof / Outdoor Rated", type: "boolean" },
  ],
  kitchen: [
    { key: "appliances", label: "Included Appliances (Oven, Freezer, Fryer)", type: "text" },
    { key: "gas_piped", label: "Piped Commercial Gas Line", type: "boolean" },
    { key: "fssai_certified", label: "Food Grade / FSSAI Certified", type: "boolean" },
  ],
};

function ListingForm({ initial }) {
  const cats = useData("/categories"),
    { user } = useAuth(),
    router = useRouter();
  const [category, setCategory] = useState(initial?.category || ""),
    [description, setDescription] = useState(initial?.description || ""),
    [photos, setPhotos] = useState(initial?.photos || []);

  return (
    <>
      <Heading
        title={
          initial
            ? "Fine-tune your listing."
            : "A little space. A lot of potential."
        }
        description="Be specific: good details lead to better matches."
      />
      <div className="split-layout">
        <section className="panel">
          <State resource={cats}>
            {(categories) => {
              const selectedCatObj = categories.find((c) => c.slug === category);
              const categoryFields =
                selectedCatObj?.requiredFields && selectedCatObj.requiredFields.length > 0
                  ? selectedCatObj.requiredFields
                  : DEFAULT_CATEGORY_FIELDS[category] || [];

              return (
                <ActionForm
                  label={initial ? "Save changes" : "Publish resource →"}
                  onSubmit={async (form) => {
                    const data = Object.fromEntries(form);
                    const attributes = {};
                    for (const f of categoryFields) {
                      attributes[f.key] =
                        f.type === "number"
                          ? Number(data[`attr_${f.key}`])
                          : f.type === "boolean"
                            ? data[`attr_${f.key}`] === "true"
                            : data[`attr_${f.key}`];
                    }
                    const body = {
                      ...data,
                      coordinates: [
                        Number(data.longitude),
                        Number(data.latitude),
                      ],
                      delivery: data.delivery === "on",
                      attributes,
                      photos,
                    };
                    await api(
                      initial ? `/listings/${initial._id}` : "/listings",
                      { method: initial ? "PUT" : "POST", body },
                    );
                    router.push("/dashboard/listings");
                  }}
                >
                  {/* Basic Details Section */}
                  <div className="form-section-card">
                    <h3 className="section-title">📌 Resource Details</h3>
                    <Field
                      label="Resource title"
                      name="title"
                      defaultValue={initial?.title}
                      placeholder="e.g. Grand AC Banquet Hall with Stage & Sound"
                      required
                      maxLength={160}
                    />
                    <Field
                      label="Category"
                      as="select"
                      name="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    >
                      <option value="">Choose a category</option>
                      {categories.map((c) => (
                        <option value={c.slug} key={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </Field>
                    <Field
                      label="Description"
                      as="textarea"
                      name="description"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe amenities, ideal events, setup details, or rules..."
                      minLength={10}
                      required
                    />
                    <LocalAi task="polish" text={description} onApply={setDescription} />
                  </div>

                  {/* Pricing & Units Section */}
                  <div className="form-section-card">
                    <h3 className="section-title">💰 Pricing & Inventory</h3>
                    <div className="form-grid">
                      {[
                        ["quantity", "Units available", 1],
                        ["capacity", "Capacity per unit", 1],
                        ["price", "Price per unit (INR)", 1],
                        ["minHours", "Minimum rental (hours)", 1],
                        ["deposit", "Security deposit (INR)", 0],
                        ["deliveryFee", "Delivery charge (INR)", 0],
                        [
                          "cancellationHours",
                          "Free cancellation lead time (hours)",
                          0,
                        ],
                      ].map(([key, label, min]) => (
                        <Field
                          key={key}
                          label={label}
                          name={key}
                          type="number"
                          min={min}
                          step={key === "price" ? "0.01" : "1"}
                          defaultValue={initial?.[key] ?? (min === 0 ? 0 : "")}
                          required
                        />
                      ))}
                      <Field
                        label="Billing unit"
                        as="select"
                        name="unit"
                        defaultValue={initial?.unit || "day"}
                      >
                        <option value="hour">Hour</option>
                        <option value="day">Day</option>
                        <option value="event">Event</option>
                      </Field>
                    </div>
                    <label className="check" style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="checkbox"
                        name="delivery"
                        defaultChecked={initial?.delivery}
                      />{" "}
                      <strong>Delivery / Setup Service is available</strong>
                    </label>
                  </div>

                  {/* Dynamic Category Specific Features Section */}
                  {category ? (
                    <div
                      className="category-features-section"
                      style={{
                        background: selectedCatObj?.color ? `${selectedCatObj.color}22` : "rgba(255, 230, 109, 0.15)",
                        border: "1px solid #171915",
                        borderRadius: "16px",
                        padding: "20px",
                        margin: "20px 0",
                        boxShadow: "4px 4px 0 #171915",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                        <span style={{ fontSize: "1.4rem" }}>✨</span>
                        <div>
                          <h3 style={{ margin: 0, fontWeight: 800, fontSize: "1.1rem", textTransform: "capitalize" }}>
                            {selectedCatObj?.name || category.replaceAll("_", " ")} Features & Specs
                          </h3>
                          <small style={{ color: "#444" }}>
                            Specify category attributes so AI can match your resource to exact seeker RFQ requirements.
                          </small>
                        </div>
                      </div>

                      {categoryFields.length > 0 ? (
                        <div className="form-grid">
                          {categoryFields.map((f) => (
                            <Field
                              key={f.key}
                              label={f.label}
                              name={`attr_${f.key}`}
                              as={f.type === "boolean" ? "select" : "input"}
                              type={f.type === "number" ? "number" : "text"}
                              defaultValue={
                                initial?.attributes?.[f.key] !== undefined
                                  ? String(initial.attributes[f.key])
                                  : f.type === "boolean"
                                    ? "true"
                                    : ""
                              }
                              required
                            >
                              {f.type === "boolean" ? (
                                <>
                                  <option value="true">✓ Available / Yes</option>
                                  <option value="false">✗ Not Available / No</option>
                                </>
                              ) : undefined}
                            </Field>
                          ))}
                        </div>
                      ) : (
                        <p className="hint">Standard resource details apply for this category.</p>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "16px",
                        background: "#fffdf4",
                        border: "1px dashed #171915",
                        borderRadius: "12px",
                        textAlign: "center",
                        margin: "16px 0",
                        color: "#666",
                      }}
                    >
                      💡 <em>Select a category above to customize category-specific features (e.g. AC, Parking, Sound System, Chair Style).</em>
                    </div>
                  )}

                  {/* Location & Address Section */}
                  <div className="form-section-card">
                    <h3 className="section-title">📍 Location & Address</h3>
                    <div className="form-grid">
                      <Field
                        label="City"
                        name="city"
                        defaultValue={initial?.city || user?.city || ""}
                        required
                      />
                      <Field
                        label="Street address"
                        name="address"
                        defaultValue={initial?.address}
                        required
                      />
                      <Field
                        label="Latitude"
                        name="latitude"
                        type="number"
                        step="any"
                        min="-90"
                        max="90"
                        defaultValue={initial?.location?.coordinates?.[1] || 19.076}
                        required
                      />
                      <Field
                        label="Longitude"
                        name="longitude"
                        type="number"
                        step="any"
                        min="-180"
                        max="180"
                        defaultValue={initial?.location?.coordinates?.[0] || 72.8777}
                        required
                      />
                    </div>
                    <p className="hint">
                      Use exact resource coordinates for precise distance & map matching.
                    </p>
                  </div>

                  {/* Rental Conditions Section */}
                  <div className="form-section-card">
                    <h3 className="section-title">📋 Rental Conditions</h3>
                    <Field
                      label="Rental conditions & pickup instructions"
                      as="textarea"
                      name="conditions"
                      rows={3}
                      placeholder="e.g. Id proof required upon delivery; security deposit refundable within 24h post-event."
                      defaultValue={initial?.conditions}
                    />
                  </div>
                </ActionForm>
              );
            }}
          </State>
        </section>
        <aside className="stack">
          <section className="panel" style={{ background: "#FFE66D" }}>
            <h3>Show the real thing.</h3>
            <p>
              Upload clear photos of the resource. Your photos are stored
              through Cloudinary.
            </p>
            <UploadField
              onUpload={(file) => setPhotos((p) => [...p, file.url])}
            />
            <div className="photo-grid">
              {photos.map((url) => (
                <div key={url}>
                  <Image
                    width={800}
                    height={600}
                    unoptimized
                    src={url}
                    alt="Uploaded resource"
                  />
                  <button
                    className="quiet"
                    onClick={() => setPhotos((p) => p.filter((v) => v !== url))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
          <div className="panel" style={{ background: "#A8E6CF" }}>
            <h3>Availability that adds up.</h3>
            <p>
              Inventory is available unless blocked. Reserve your own dates in
              Availability; confirmed bookings consume only the booked quantity.
            </p>
            <Link href="/dashboard/calendar">Manage availability →</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
export function AvailabilityPage() {
  const listings = useData("/listings"),
    [selected, setSelected] = useState("");
  return (
    <>
      <Heading
        title="Room for the next booking."
        description="Block off direct bookings, maintenance, and dates you need for yourself."
      />
      <State resource={listings}>
        {(data) =>
          data.length ? (
            <>
              <Field
                label="Resource"
                as="select"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Choose a resource</option>
                {data.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.title} · {l.quantity} units
                  </option>
                ))}
              </Field>
              {selected && <AvailabilityDetail key={selected} id={selected} />}
            </>
          ) : (
            <Empty
              title="List a resource first."
              href="/dashboard/listings/create"
            />
          )
        }
      </State>
    </>
  );
}
function AvailabilityOccupancyTimeline({ blocks }) {
  if (!blocks || blocks.length === 0) return null;

  const chartData = blocks.slice(0, 8).map((b, idx) => ({
    name: b.reason?.length > 14 ? `${b.reason.slice(0, 14)}…` : b.reason || `Block ${idx + 1}`,
    quantity: b.quantity || 1,
    type: b.booking ? "Confirmed Booking" : "Owner Blackout",
  }));

  return (
    <div className="feature-chart-panel" style={{ background: "#FAF8F5", margin: "14px 0" }}>
      <div className="feature-chart-header">
        <div>
          <span className="eyebrow" style={{ color: "#7B61A8", marginBottom: 2 }}>OCCUPANCY DENSITY</span>
          <h4 className="feature-chart-title">Reserved Units by Block Event</h4>
        </div>
        <span className="badge" style={{ background: "#FFE66D", border: "1px solid #171915" }}>
          {blocks.length} Active Blocks
        </span>
      </div>
      <div style={{ width: "100%", height: 160 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E0CF" />
            <XAxis dataKey="name" stroke="#171915" tick={{ fontSize: 10, fontWeight: 700 }} />
            <YAxis stroke="#171915" tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(val, name, item) => [`${val} Units (${item.payload.type})`, "Reserved Volume"]}
              contentStyle={{ background: "#fffef8", border: "1px solid #171915", borderRadius: 8, fontWeight: 700 }}
            />
            <Bar dataKey="quantity" fill="#FF6B6B" stroke="#171915" strokeWidth={1} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AvailabilityDetail({ id }) {
  const blocks = useData(`/listings/${id}/availability`);
  return (
    <div className="split-layout">
      <section className="panel">
        <h2>Block a date range</h2>
        <ActionForm
          label="Reserve these units"
          onSubmit={async (form) => {
            const body = Object.fromEntries(form);
            body.start = new Date(body.start).toISOString();
            body.end = new Date(body.end).toISOString();
            await api(`/listings/${id}/availability`, { method: "POST", body });
            await blocks.reload();
          }}
        >
          <Field label="Starts" name="start" type="datetime-local" required />
          <Field label="Ends" name="end" type="datetime-local" required />
          <Field
            label="Units to block"
            name="quantity"
            type="number"
            min="1"
            required
          />
          <Field label="Reason" name="reason" required />
        </ActionForm>
      </section>
      <section className="stack">
        <h2>Reserved time</h2>
        <State resource={blocks}>
          {(data) =>
            data.length ? (
              <>
                <AvailabilityOccupancyTimeline blocks={data} />
                {data.map((b) => (
                  <article className="panel" key={b._id}>
                    <Badge>
                      {b.booking ? "Confirmed booking" : "Owner block"}
                    </Badge>
                    <h3>{b.reason}</h3>
                    <p>
                      {date(b.start)} → {date(b.end)}
                    </p>
                    <p>{b.quantity} units reserved</p>
                    {!b.booking && (
                      <Action
                        className="quiet"
                        run={async () => {
                          await api(`/listings/${id}/availability/${b._id}`, {
                            method: "DELETE",
                          });
                          await blocks.reload();
                        }}
                      >
                        Remove block
                      </Action>
                    )}
                  </article>
                ))}
              </>
            ) : (
              <Empty
                title="A clear calendar."
                text="No upcoming reservations or blocks for this resource."
              />
            )
          }
        </State>
      </section>
    </div>
  );
}
