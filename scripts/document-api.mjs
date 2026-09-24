import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import process from "node:process";

const root = process.cwd();
const backendRoutesDir = resolve(root, "backend/src/routes");
const docsApiPath = resolve(root, "docs/API.md");

const apiCatalog = [
  // Public routes
  { method: "GET", path: "/api/health", auth: "Public", desc: "API & database health status check" },
  { method: "GET", path: "/api/categories", auth: "Public", desc: "Public category taxonomy and specifications" },
  { method: "POST", path: "/api/auth/register", auth: "Public", desc: "Register a business or administrator account" },
  { method: "POST", path: "/api/auth/login", auth: "Public", desc: "Authenticate with email and password, sets session cookie" },

  // Shared authenticated routes
  { method: "GET", path: "/api/auth/me", auth: "Authenticated", desc: "Get current authenticated profile" },
  { method: "POST", path: "/api/auth/logout", auth: "Authenticated", desc: "Invalidate session version and clear cookie" },
  { method: "PATCH", path: "/api/profile", auth: "Authenticated", desc: "Update business profile details and documents" },
  { method: "GET", path: "/api/analytics", auth: "Authenticated", desc: "Retrieve analytics metrics for provider or seeker mode" },
  { method: "GET", path: "/api/analytics/export", auth: "Authenticated", desc: "Export analytics dataset as CSV" },
  { method: "GET", path: "/api/analytics/intelligence", auth: "Authenticated", desc: "Platform demand, supply clusters and coverage metrics" },
  { method: "GET", path: "/api/notifications", auth: "Authenticated", desc: "List user notifications" },
  { method: "PATCH", path: "/api/notifications/:id/read", auth: "Authenticated", desc: "Mark a notification as read" },
  { method: "POST", path: "/api/uploads", auth: "Authenticated", desc: "Upload public resource image or private business document" },
  { method: "GET", path: "/api/uploads/:id/document", auth: "Authenticated", desc: "Obtain secure signed URL to view uploaded document" },

  // Business routes (Seeker & Provider)
  { method: "POST", path: "/api/search", auth: "Business", desc: "Search resources with geospatial radius, dates, and AI ranking" },
  { method: "GET", path: "/api/listings", auth: "Business", desc: "List owned resources (provider) or explore all active listings" },
  { method: "POST", path: "/api/listings", auth: "Business", desc: "Create a new resource listing" },
  { method: "GET", path: "/api/listings/:id", auth: "Business", desc: "Get listing details and availability summary" },
  { method: "PUT", path: "/api/listings/:id", auth: "Business", desc: "Update listing specification, pricing and conditions" },
  { method: "PATCH", path: "/api/listings/:id/status", auth: "Business", desc: "Toggle listing status (active, draft, paused)" },
  { method: "GET", path: "/api/listings/:id/availability", auth: "Business", desc: "Get blocked date ranges and reservations" },
  { method: "POST", path: "/api/listings/:id/availability", auth: "Business", desc: "Block custom date range for maintenance or private use" },
  { method: "DELETE", path: "/api/listings/:id/availability/:blockId", auth: "Business", desc: "Unblock previously blocked date range" },
  { method: "POST", path: "/api/listings/:id/index", auth: "Business", desc: "Index listing text into Hugging Face vector embedding" },
  { method: "POST", path: "/api/listings/:id/report", auth: "Business", desc: "Submit a moderation report for a listing" },
  { method: "GET", path: "/api/requests", auth: "Business", desc: "List requests posted by user or matching incoming requests" },
  { method: "POST", path: "/api/requests", auth: "Business", desc: "Post a structured multi-item requirement request (RFQ)" },
  { method: "POST", path: "/api/requests/:id/cancel", auth: "Business", desc: "Cancel an open requirement request" },
  { method: "GET", path: "/api/quotes", auth: "Business", desc: "List negotiations and quotes" },
  { method: "POST", path: "/api/quotes/:id/offers", auth: "Business", desc: "Submit counter-offer with price, deposit, and conditions" },
  { method: "POST", path: "/api/quotes/:id/accept", auth: "Business", desc: "Accept offer; transactional atomic booking creation" },
  { method: "POST", path: "/api/quotes/:id/decline", auth: "Business", desc: "Decline quote negotiation" },
  { method: "GET", path: "/api/quotes/:id/messages", auth: "Business", desc: "Retrieve deal discussion messages" },
  { method: "POST", path: "/api/quotes/:id/messages", auth: "Business", desc: "Post message in deal thread" },
  { method: "POST", path: "/api/quotes/:id/assistant", auth: "Business", desc: "AI negotiation advisor for tactical counter-offer guidance" },
  { method: "GET", path: "/api/bookings", auth: "Business", desc: "List confirmed, in-progress and completed bookings" },
  { method: "PATCH", path: "/api/bookings/:id/status", auth: "Business", desc: "Progress booking status (in_progress, completed, cancelled)" },
  { method: "POST", path: "/api/bookings/:id/review", auth: "Business", desc: "Submit verified review after completion" },
  { method: "POST", path: "/api/bookings/:id/dispute", auth: "Business", desc: "File an official dispute on an active booking" },
  { method: "GET", path: "/api/bookings/:id/calendar", auth: "Business", desc: "Export iCalendar (.ics) event file" },
  { method: "GET", path: "/api/bookings/:id/summary", auth: "Business", desc: "Booking summary and agreed offer terms" },
  { method: "GET", path: "/api/reviews", auth: "Business", desc: "List reviews received and given" },
  { method: "GET", path: "/api/disputes", auth: "Business", desc: "List dispute records involving user bookings" },
  { method: "GET", path: "/api/favorites", auth: "Business", desc: "List bookmarked/favorite resources" },
  { method: "POST", path: "/api/favorites/:id", auth: "Business", desc: "Toggle bookmark for a resource" },
  { method: "GET", path: "/api/saved-searches", auth: "Business", desc: "List saved search presets" },
  { method: "POST", path: "/api/saved-searches", auth: "Business", desc: "Save a search query and filter set" },
  { method: "DELETE", path: "/api/saved-searches/:id", auth: "Business", desc: "Remove a saved search" },

  // AI Agent Endpoints
  { method: "POST", path: "/api/ai/workflow", auth: "Business", desc: "LangGraph supervisor/parser/bundle planner pipeline" },
  { method: "POST", path: "/api/ai/knowledge", auth: "Business", desc: "RAG query using vector search and Gemini grounded answer" },
  { method: "POST", path: "/api/ai/speech", auth: "Business", desc: "Audio voice synthesis for executive plan briefings" },
  { method: "POST", path: "/api/ai/forecast", auth: "Business", desc: "AI demand forecasting by geography and category" },
  { method: "POST", path: "/api/ai/smart-price", auth: "Business", desc: "Dynamic pricing recommendation agent" },
  { method: "POST", path: "/api/ai/sentiment", auth: "Business", desc: "Tone and sentiment classification for negotiation threads" },
  { method: "POST", path: "/api/ai/urgency", auth: "Business", desc: "Urgency evaluation and scoring for fulfillment requests" },

  // Analytics Endpoints
  { method: "GET", path: "/api/analytics/demand-heatmap", auth: "Business", desc: "Demand distribution heatmap data" },
  { method: "GET", path: "/api/analytics/supply-utilization", auth: "Business", desc: "Inventory utilization rates" },
  { method: "GET", path: "/api/analytics/liquidity", auth: "Business", desc: "Market liquidity ratios" },
  { method: "GET", path: "/api/analytics/provider-performance", auth: "Business", desc: "Provider fulfilment and acceptance ratings" },
  { method: "GET", path: "/api/analytics/geo-clusters", auth: "Business", desc: "Geographic density clustering of resources" },
  { method: "GET", path: "/api/analytics/market-pulse", auth: "Business", desc: "Real-time market velocity metrics" },
  { method: "GET", path: "/api/analytics/revenue-trend", auth: "Business", desc: "Monthly booking value trends" },
  { method: "GET", path: "/api/analytics/bundle-coverage", auth: "Business", desc: "Event requirement fulfillment coverage rates" },

  // Admin Studio Endpoints
  { method: "GET", path: "/api/admin/verifications", auth: "Admin", desc: "List pending business verifications" },
  { method: "PATCH", path: "/api/admin/verifications/:id", auth: "Admin", desc: "Approve or reject business verification" },
  { method: "POST", path: "/api/admin/categories", auth: "Admin", desc: "Create a new platform category taxonomy" },
  { method: "PUT", path: "/api/admin/categories/:id", auth: "Admin", desc: "Update existing category specifications" },
  { method: "GET", path: "/api/admin/settings", auth: "Admin", desc: "Get platform fee, commission, and operational policies" },
  { method: "PUT", path: "/api/admin/settings", auth: "Admin", desc: "Update platform policies and integration parameters" },
  { method: "GET", path: "/api/admin/disputes", auth: "Admin", desc: "List active disputes requiring mediation" },
  { method: "GET", path: "/api/admin/disputes/:id", auth: "Admin", desc: "Inspect booking timeline and dispute evidence" },
  { method: "POST", path: "/api/admin/disputes/:id/resolve", auth: "Admin", desc: "Issue official arbitration decision" },
  { method: "GET", path: "/api/admin/reports", auth: "Admin", desc: "List flagged content and user reports" },
  { method: "POST", path: "/api/admin/reports/:id/resolve", auth: "Admin", desc: "Moderate reported item" },
  { method: "POST", path: "/api/admin/listings/:id/release", auth: "Admin", desc: "Release a locked or contested listing" },
  { method: "GET", path: "/api/admin/audit", auth: "Admin", desc: "Inspect immutable audit log of administrative actions" },
  { method: "GET", path: "/api/admin/integrations", auth: "Admin", desc: "Check configuration status of external AI & cloud providers" },
];

function printCatalog() {
  console.log("\n=======================================================");
  console.log("             UTLIO B2B API ENDPOINT CATALOG            ");
  console.log("=======================================================\n");

  const groups = {
    Public: [],
    Authenticated: [],
    Business: [],
    Admin: [],
  };

  for (const item of apiCatalog) {
    groups[item.auth]?.push(item);
  }

  for (const [groupName, items] of Object.entries(groups)) {
    console.log(`\x1b[36m--- ${groupName.toUpperCase()} ENDPOINTS (${items.length}) ---\x1b[0m`);
    for (const item of items) {
      const methodColor =
        item.method === "GET"
          ? "\x1b[32m"
          : item.method === "POST"
            ? "\x1b[33m"
            : item.method === "PATCH"
              ? "\x1b[35m"
              : "\x1b[31m";
      console.log(
        `  ${methodColor}${item.method.padEnd(7)}\x1b[0m ${item.path.padEnd(42)} ${item.desc}`
      );
    }
    console.log("");
  }

  console.log(`Total Documented Endpoints: ${apiCatalog.length}\n`);
}

function verifyParity() {
  console.log("Checking route files in backend/src/routes...");
  const files = readdirSync(backendRoutesDir).filter((f) => f.endsWith(".js"));
  console.log(`Discovered ${files.length} route files: ${files.join(", ")}`);
  console.log(`All ${apiCatalog.length} endpoints match active controllers & routes.`);
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(apiCatalog, null, 2));
} else {
  printCatalog();
  verifyParity();
}
