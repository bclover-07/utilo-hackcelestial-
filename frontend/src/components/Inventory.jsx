"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
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
export function ListingCard({ listing, children, index = 0 }) {
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
        <Badge>{listing.category}</Badge>
      </div>
      <div className="listing-body">
        <h3>{listing.title}</h3>
        <p>
          {listing.city} · {listing.capacity} capacity · {listing.quantity}{" "}
          units
        </p>
        <p className="price">
          {money(listing.price)} <small>/ {listing.unit} / unit</small>
        </p>
        {listing.estimatedTotal !== undefined && (
          <p>
            Estimated rental: <strong>{money(listing.estimatedTotal)}</strong>
          </p>
        )}
        {listing.score !== undefined && (
          <>
            <Badge>{listing.score} / 100 match</Badge>
            <ul className="reasons">
              {listing.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </>
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
function ListingForm({ initial }) {
  const cats = useData("/categories"),
    { user } = useAuth(),
    router = useRouter();
  const [category, setCategory] = useState(initial?.category || ""),
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
            {(categories) => (
              <ActionForm
                label={initial ? "Save changes" : "Publish resource →"}
                onSubmit={async (form) => {
                  const data = Object.fromEntries(form);
                  const attributes = {};
                  for (const f of categories.find(
                    (c) => c.slug === data.category,
                  )?.requiredFields || [])
                    attributes[f.key] =
                      f.type === "number"
                        ? Number(data[`attr_${f.key}`])
                        : f.type === "boolean"
                          ? data[`attr_${f.key}`] === "true"
                          : data[`attr_${f.key}`];
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
                <Field
                  label="Resource title"
                  name="title"
                  defaultValue={initial?.title}
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
                  defaultValue={initial?.description}
                  minLength={10}
                  required
                />
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
                <label className="check">
                  <input
                    type="checkbox"
                    name="delivery"
                    defaultChecked={initial?.delivery}
                  />{" "}
                  Delivery is available
                </label>
                <div className="form-grid">
                  <Field
                    label="City"
                    name="city"
                    defaultValue={initial?.city || user.city}
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
                    defaultValue={initial?.location.coordinates[1]}
                    required
                  />
                  <Field
                    label="Longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    defaultValue={initial?.location.coordinates[0]}
                    required
                  />
                </div>
                <p className="hint">
                  Use the resource location, not your current location, for
                  accurate distance matching.
                </p>
                {(
                  categories.find((c) => c.slug === category)?.requiredFields ||
                  []
                ).map((f) => (
                  <Field
                    key={f.key}
                    label={f.label}
                    name={`attr_${f.key}`}
                    as={f.type === "boolean" ? "select" : "input"}
                    type={f.type === "number" ? "number" : "text"}
                    defaultValue={initial?.attributes?.[f.key]}
                    required
                  >
                    {f.type === "boolean" ? (
                      <>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </>
                    ) : undefined}
                  </Field>
                ))}
                <Field
                  label="Rental conditions & pickup instructions"
                  as="textarea"
                  name="conditions"
                  rows={3}
                  defaultValue={initial?.conditions}
                />
              </ActionForm>
            )}
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
              data.map((b) => (
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
              ))
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
