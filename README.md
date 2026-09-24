# Utlio

Hospitality resource marketplace using Next.js, Express, MongoDB, LangChain and LangGraph.js. Business accounts switch between provider and seeker dashboards. Administrators manage verification, disputes, categories, moderation and policy.

## Run locally

Use Node.js 22+ and a MongoDB replica set (Atlas works). Transactions are required for reservations. On a fresh installation, copy backend/.env.example to backend/.env and supply credentials. Preserve the existing ignored local .env; never copy secrets into frontend files.

```sh
npm install
npm run dev
```

Open http://localhost:3000. API port: 4000. Next proxies /api to the backend for same-origin HttpOnly cookie authentication. API_ORIGIN overrides the backend proxy; FRONTEND_ORIGIN must match the browser origin for mutations.

```sh
npm test       # isolated MongoDB replica-set integration tests
npm run lint
npm run build
npm start      # frontend production server + API after building
```

Set API NODE_ENV=production and use HTTPS in production (Secure cookies). Run one scheduler process until distributed job locking is added. Tests download a MongoDB binary on first use and never write fixtures to Atlas.

## Accounts and integrations

Business signup: /register. Administrator signup requires an invitation. `npm run admin -w backend` creates a fresh invitation in ignored backend/.env; restart the API and use it in Administrator signup. It is not printed. Existing accounts remain valid if the invitation changes.

- Gemini: request parsing, matching explanations, pricing, demand outlook, negotiation advice, tone analysis, urgency explanations and nightly insights.
- Hugging Face: actual sentence-transformer embeddings for listing indexing and retrieval.
- Cloudinary: public listing images and authenticated private verification documents.
- ElevenLabs: voice playback. SMTP: notification emails. In-app notifications work independently.

Missing credentials and upstream failures produce explicit errors. Startup creates editable category definitions and platform policy only; never fabricated business activity. Live implementation checks confirmed Atlas, Gemini structured parsing, Hugging Face embeddings and Cloudinary authentication. ElevenLabs did not complete a live speech request; SMTP was not configured. A configured-key indicator is not a provider health check.

## Structure and behavior

backend/src/routes/ mounts modular feature routers (authRoutes, listingRoutes, requestRoutes, quoteRoutes, bookingRoutes, searchRoutes, analyticsRoutes, aiRoutes, uploadRoutes, notificationRoutes, adminRoutes). backend/src/controllers/ provides dedicated controllers per domain. models/index.js defines persistent schemas and indexes. services/validation.js holds request contracts. Middleware handles sessions, roles, dynamic CORS, CSRF and safe errors. See docs/API.md for the complete route inventory.

Listings support quantity, capacity, rental units, delivery, terms, coordinates, images and category-specific specifications. Search uses geospatial queries, date availability, deterministic ranking and real reviews, with a disclosed maximum of 200 candidates.

RFQs contain independent resource items. Offers are append-only and versioned. Acceptance checks the current version, opposing party, dates, listing requirements and simultaneous inventory. A MongoDB transaction writes the listing revision, booking, reservation, quote, request and notifications. Competing confirmations cannot exceed quantity. Transitions, cancellation windows, reviews, private chat, reports and disputes enforce participant permissions. Admin changes retain audit records.

backend/src/agents/workflows.js implements LangGraph/LangChain workflows. Request planning follows supervisor → parser → availability planner → explainer. Negotiation has MongoDB checkpoints private to user and quote. RAG follows embedding → retrieval → grounded answer. AI never accepts offers or creates bookings automatically.

Vector retrieval is exact cosine search inside a MongoDB aggregation over all active compatible indexed listings. It is not an Atlas approximate-nearest-neighbor index. Providers explicitly index listings; content edits invalidate embeddings. Exact retrieval needs no Atlas Search setup but requires an indexed replacement at large scale.

Analytics aggregate persisted requests, listings, searches, reservations, bookings and ratings. They cover demand, quantity-weighted utilization, liquidity, monthly booking value, geography, performance and bundle coverage. Missing baselines remain unavailable; agreed booking value is not collected payment.

## Verification and operational limits

Integration tests cover authentication, CSRF, roles, ownership, conflicting reservations, quote versions, bundle isolation, cancellation, private threads, aggregation math and vector ranking. Production builds typecheck frontend routes. UI fixtures run only in a separate local replica set.

The app coordinates rental agreements and fulfillment. It does not collect money, process refunds or issue tax invoices. Chat polls periodically. Deployment, load testing and production email delivery remain operational steps.

# utilo-hackcelestial-
