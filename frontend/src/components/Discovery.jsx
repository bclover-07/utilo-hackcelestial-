"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
export function SearchPage() {
  const categories = useData("/categories"),
    [result, setResult] = useState(null),
    [filters, setFilters] = useState(null);
  return (
    <>
      <Heading
        title="Good things. Closer than you think."
        description="Find resources that fit your dates, quantity and budget."
      >
        <Link className="button lavender" href="/dashboard/requests/create">
          Post a request ↗
        </Link>
      </Heading>
      <section className="panel">
        <State resource={categories}>
          {(data) => (
            <ActionForm
              label="Find my resources →"
              onSubmit={async (form) => {
                const body = Object.fromEntries(
                  [...form].filter(([, v]) => v !== ""),
                );
                if (
                  body.latitude !== undefined ||
                  body.longitude !== undefined
                ) {
                  if (
                    body.latitude === undefined ||
                    body.longitude === undefined
                  )
                    throw new Error("Enter both latitude and longitude.");
                  body.coordinates = [
                    Number(body.longitude),
                    Number(body.latitude),
                  ];
                }
                if (body.start) body.start = new Date(body.start).toISOString();
                if (body.end) body.end = new Date(body.end).toISOString();
                body.delivery = body.delivery === "on";
                setResult(null);
                const response = await api("/search", { method: "POST", body });
                setFilters(body);
                setResult(response);
                return `${response.total} resources matched your filters.`;
              }}
            >
              <div className="search-grid">
                <Field
                  label="What are you looking for?"
                  name="query"
                  placeholder="Resource name"
                />
                <Field as="select" label="Category" name="category">
                  <option value="">All categories</option>
                  {data.map((c) => (
                    <option key={c._id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </Field>
                <Field label="City" name="city" />
                <Field
                  label="Budget (INR)"
                  name="budget"
                  type="number"
                  min="1"
                />
                <Field label="Start" name="start" type="datetime-local" />
                <Field label="End" name="end" type="datetime-local" />
                <Field
                  label="Quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  defaultValue="1"
                />
                <Field
                  label="Capacity per unit"
                  name="capacity"
                  type="number"
                  min="1"
                  defaultValue="1"
                />
              </div>
              <details>
                <summary>Distance & delivery filters</summary>
                <div className="form-grid">
                  <Field
                    label="Latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                  />
                  <Field
                    label="Longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                  />
                  <Field
                    label="Search radius (km)"
                    name="radiusKm"
                    type="number"
                    min="1"
                    max="300"
                    defaultValue="25"
                  />
                </div>
                <label className="check">
                  <input type="checkbox" name="delivery" /> Provider delivery
                  required
                </label>
              </details>
            </ActionForm>
          )}
        </State>
      </section>
      {result && (
        <>
          <div className="section-heading">
            <h2>
              {result.total} matches <small>· ranked by fit</small>
            </h2>
            <Action
              className="quiet"
              run={async () => {
                await api("/saved-searches", {
                  method: "POST",
                  body: {
                    name: `${filters.category || "Resources"} in ${filters.city || "all cities"}`,
                    filters,
                  },
                });
              }}
            >
              Save search & alerts
            </Action>
          </div>
          {result.items.length ? (
            <div className="card-grid">
              {result.items.map((l, i) => (
                <ListingCard key={l._id} listing={l} index={i}>
                  <Link
                    className="button"
                    href={`/dashboard/resources/${l._id}`}
                  >
                    View resource
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
              title="No fit yet."
              text="Try a wider radius or post a request so providers can respond."
              href="/dashboard/requests/create"
              label="Post your requirement"
            />
          )}
          {result.total > 24 && (
            <p>
              Showing the first 24 ranked matches. Narrow your filters for more
              precise results.
            </p>
          )}
        </>
      )}
    </>
  );
}
export function ResourceDetail({ id }) {
  const resource = useData(`/listings/${id}`);
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
            <section className="panel" style={{ background: "#FFE66D" }}>
              <h2>
                {money(l.price)} / {l.unit}
              </h2>
              <p>
                {l.quantity} units · capacity {l.capacity} each
              </p>
              <p>
                Minimum {l.minHours} hours · deposit {money(l.deposit)}
              </p>
              <p>
                {l.delivery
                  ? `Delivery available: ${money(l.deliveryFee)}`
                  : "Arrange your own pickup / on-site access"}
              </p>
              <p>
                Free cancellation at least {l.cancellationHours} hours before
                start.
              </p>
              <h3>Provider conditions</h3>
              <p>{l.conditions || "No additional conditions supplied."}</p>
              <Action run={() => api(`/favorites/${id}`, { method: "POST" })}>
                Save / unsave resource
              </Action>
            </section>
          </div>
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
                <section className="panel" key={l._id}>
                  <Badge>{l.category}</Badge>
                  <h2>{l.title}</h2>
                  <dl className="spec-list">
                    {[
                      ["Location", l.city],
                      ["Price", `${money(l.price)} / ${l.unit}`],
                      ["Available units", l.quantity],
                      ["Capacity", l.capacity],
                      ["Minimum rental", `${l.minHours} hours`],
                      ["Deposit", money(l.deposit)],
                      [
                        "Delivery",
                        l.delivery ? money(l.deliveryFee) : "Not offered",
                      ],
                      ["Cancellation", `${l.cancellationHours}h notice`],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p>Check dates in Discover before booking.</p>
                  <Link href={`/dashboard/resources/${l._id}`}>
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
    </>
  );
}
