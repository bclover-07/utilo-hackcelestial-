# API contract

Mutation requests require `X-Utlio-Request: 1`. JSON bodies use `Content-Type: application/json`; uploads use multipart form data with a `file` part and `kind` field. Authentication uses the HttpOnly `utlio_session` cookie. Browser mutation requests must use the configured origin. Errors return `{ "error": "message" }` with an HTTP status. Route IDs must be MongoDB ObjectIds.

The source of truth for body fields and constraints is `backend/src/services/validation.js`, controller validation and the relevant service. Unknown fields cannot grant privileges.

## Public and shared authenticated routes

Only health, register and login are public. The remaining shared routes require a valid session.

- `GET /api/health` → `health`
- `POST /api/auth/register` → `register`
- `POST /api/auth/login` → `login`
- `GET /api/auth/me` → `me`
- `POST /api/auth/logout` → `logout`
- `PATCH /api/profile` → `profile`
- `GET /api/categories` → `categories`
- `GET /api/analytics` → `analytics`
- `GET /api/analytics/export` → `csv`
- `GET /api/analytics/intelligence` → `intelligence`
- `GET /api/notifications` → `notifications`
- `PATCH /api/notifications/:id/read` → `readNotification`
- `POST /api/uploads` → `upload`
- `GET /api/uploads/:id/document` → `document`

## Business routes

- `POST /api/search` → `search`
- `GET /api/listings` → `listings`
- `POST /api/listings` → `createListing`
- `GET /api/listings/:id` → `listing`
- `PUT /api/listings/:id` → `updateListing`
- `PATCH /api/listings/:id/status` → `listingStatus`
- `GET /api/listings/:id/availability` → `availability`
- `POST /api/listings/:id/availability` → `block`
- `DELETE /api/listings/:id/availability/:blockId` → `unblock`
- `POST /api/listings/:id/index` → `indexListing`
- `POST /api/listings/:id/report` → `report`
- `GET /api/requests` → `requests`
- `POST /api/requests` → `createRequest`
- `POST /api/requests/:id/cancel` → `cancelRequest`
- `GET /api/quotes` → `quotes`
- `POST /api/quotes/:id/offers` → `offer`
- `POST /api/quotes/:id/accept` → `accept`
- `POST /api/quotes/:id/decline` → `decline`
- `GET /api/quotes/:id/messages` → `messages`
- `POST /api/quotes/:id/messages` → `message`
- `POST /api/quotes/:id/assistant` → `negotiation`
- `GET /api/bookings` → `bookings`
- `PATCH /api/bookings/:id/status` → `bookingStatus`
- `POST /api/bookings/:id/review` → `review`
- `POST /api/bookings/:id/dispute` → `dispute`
- `GET /api/bookings/:id/calendar` → `calendar`
- `GET /api/bookings/:id/summary` → `receipt`
- `GET /api/reviews` → `reviews`
- `GET /api/disputes` → `disputes`
- `GET /api/favorites` → `favorites`
- `POST /api/favorites/:id` → `favorite`
- `GET /api/saved-searches` → `savedSearches`
- `POST /api/saved-searches` → `saveSearch`
- `DELETE /api/saved-searches/:id` → `deleteSearch`
- `POST /api/ai/workflow` → `workflow`
- `POST /api/ai/knowledge` → `rag`
- `POST /api/ai/speech` → `speech`
- `POST /api/ai/forecast` → `demandForecast`
- `POST /api/ai/smart-price` → `smartPrice`
- `POST /api/ai/sentiment` → `sentiment`
- `POST /api/ai/urgency` → `urgencyScore`
- `GET /api/analytics/demand-heatmap` → `demandHeatmap`
- `GET /api/analytics/supply-utilization` → `supplyUtilization`
- `GET /api/analytics/liquidity` → `liquidityRatios`
- `GET /api/analytics/provider-performance` → `providerPerformance`
- `GET /api/analytics/geo-clusters` → `geoClusters`
- `GET /api/analytics/market-pulse` → `marketPulse`
- `GET /api/analytics/revenue-trend` → `revenueTrend`
- `GET /api/analytics/bundle-coverage` → `bundleCoverage`

## Administrator routes

- `GET /api/admin/verifications` → `verifications`
- `PATCH /api/admin/verifications/:id` → `verify`
- `POST /api/admin/categories` → `createCategory`
- `PUT /api/admin/categories/:id` → `updateCategory`
- `GET /api/admin/settings` → `settings`
- `PUT /api/admin/settings` → `saveSettings`
- `GET /api/admin/disputes` → `adminDisputes`
- `GET /api/admin/disputes/:id` → `evidence`
- `POST /api/admin/disputes/:id/resolve` → `resolve`
- `GET /api/admin/reports` → `reports`
- `POST /api/admin/reports/:id/resolve` → `moderate`
- `POST /api/admin/listings/:id/release` → `releaseListing`
- `GET /api/admin/audit` → `audit`
- `GET /api/admin/integrations` → `integrations`

## Request contracts

- Coordinates: longitude first, latitude second. Dates: ISO timestamps. RFQs require future dates and an end after the start. Prices: INR.
- Search: category, city, coordinates, radiusKm, start, end, quantity, capacity, budget, delivery, query and page. Both date fields are required together.
- Request: title, items (category, quantity, capacity, specs), city, coordinates, radiusKm, start, end, budget, urgency and delivery. Each item can be fulfilled independently.
- Offer: price, conditions and current version. Accept: version. A 409 requires reloading the record before retrying.
- AI workflow: kind (parse or bundle), text and search filters for bundle planning. Knowledge query: text; returns answer, source listings, similarity scores and trace.
- Upload: kind image or document. Images return a URL usable only by their owner in listings; documents return a private ID for profile verification.

AI failures return errors, never substitute generated business data. Admin integration indicators report configuration presence, not upstream health.
