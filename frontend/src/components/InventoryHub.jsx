"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useInventorySocket } from "@/lib/useInventorySocket";
import {
  useData,
  State,
  Empty,
  Badge,
  money,
  date,
} from "./ui";
import {
  Boxes,
  Plus,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  ArrowRight,
  Eye,
  FileText,
  Search,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Warehouse,
  Send,
  Zap,
  Tag,
  DollarSign,
  User,
  Check,
  X,
  History,
  Radio,
  Sparkles,
} from "lucide-react";

export function InventoryHub() {
  const { user } = useAuth();
  const dashboard = useData("/inventory/dashboard");
  const [activeTab, setActiveTab] = useState("fleet"); // "fleet" | "rentals" | "offline" | "activity"
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals state
  const [offlineDealModal, setOfflineDealModal] = useState({ open: false, listing: null });
  const [newAssetModal, setNewAssetModal] = useState(false);
  const [returnModal, setReturnModal] = useState({ open: false, booking: null, repost: true });
  const [historyModal, setHistoryModal] = useState({ open: false, listingId: null, data: null, loading: false });

  // Status feedback toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Real-time socket listener
  const { isConnected, lastEvent } = useInventorySocket(
    useCallback((payload) => {
      dashboard.reload();
      if (payload?.notif?.title) {
        showToast(payload.notif.title, "info");
      }
    }, [dashboard])
  );

  return (
    <div className="inventory-hub neo-container" style={{ padding: "1.5rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            zIndex: 9999,
            backgroundColor: toast.type === "error" ? "#FF6B6B" : toast.type === "info" ? "#4ECDC4" : "#FFE66D",
            color: "#000",
            padding: "0.85rem 1.25rem",
            borderRadius: "14px",
            border: "1px solid rgba(23, 25, 21, 0.12)",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.12)",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          {toast.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background: "transparent", border: "none", cursor: "pointer", marginLeft: "0.5rem" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1.25rem",
          marginBottom: "1.5rem",
          paddingBottom: "1.25rem",
          borderBottom: "1px solid rgba(23, 25, 21, 0.1)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 900, textTransform: "uppercase", margin: 0, letterSpacing: "-0.5px", color: "#171915" }}>
              📦 Inventory & Fleet Hub
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "0.3rem 0.75rem",
                backgroundColor: isConnected ? "#DCFCE7" : "#FEF3C7",
                color: isConnected ? "#166534" : "#92400E",
                borderRadius: "9999px",
                border: isConnected ? "1px solid #86EFAC" : "1px solid #FDE68A",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: isConnected ? "#22C55E" : "#EAB308",
                  display: "inline-block",
                  boxShadow: isConnected ? "0 0 6px #22C55E" : "none",
                }}
              />
              {isConnected ? "Live Socket Sync" : "Syncing…"}
            </span>
          </div>
          <p style={{ margin: 0, color: "#64748B", fontSize: "0.92rem", fontWeight: 500, maxWidth: "750px", lineHeight: 1.45 }}>
            Unified command center: track offline & online rentals, monitor active leases, get return expiry alerts, and instantly repost freed assets.
          </p>
        </div>

        {/* Global Hub Actions */}
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            onClick={() => dashboard.reload()}
            title="Refresh inventory state from database"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.55rem 0.95rem",
              background: "#FFFFFF",
              color: "#171915",
              border: "1px solid rgba(23, 25, 21, 0.15)",
              borderRadius: "12px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <RefreshCw size={14} className={dashboard.loading ? "animate-spin" : ""} />
            Sync
          </button>

          <Link
            href="/dashboard/inventory/offline-deal"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.55rem 1rem",
              background: "#FFE66D",
              color: "#171915",
              border: "1px solid rgba(23, 25, 21, 0.2)",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(255, 230, 109, 0.4)",
              fontWeight: 800,
              textDecoration: "none",
              textTransform: "uppercase",
              fontSize: "0.8rem",
              letterSpacing: "0.02em",
              transition: "transform 0.15s ease",
            }}
          >
            <Zap size={15} />
            + Record Offline Deal
          </Link>

          <button
            onClick={() => setNewAssetModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.55rem 1rem",
              background: "#10B981",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(16, 185, 129, 0.3)",
              fontWeight: 800,
              cursor: "pointer",
              textTransform: "uppercase",
              fontSize: "0.8rem",
              letterSpacing: "0.02em",
              transition: "transform 0.15s ease",
            }}
          >
            <Plus size={15} />
            + Store New Asset
          </button>
        </div>
      </div>

      {/* Main Content Area via State wrapper */}
      <State resource={dashboard}>
        {(data) => {
          const { stats, listings, expiringBookings, overdueBookings, offlineDeals, recentActivity } = data;
          const occupancyRate = stats.occupancyRate || 0;

          return (
            <>
              {/* Fleet Occupancy & Velocity Telemetry Strip */}
              <div
                style={{
                  background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
                  border: "1px solid rgba(23, 25, 21, 0.1)",
                  borderRadius: "18px",
                  padding: "1rem 1.25rem",
                  boxShadow: "0 4px 18px -2px rgba(0, 0, 0, 0.03)",
                  marginBottom: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "12px",
                      background: "#EDE9FE",
                      color: "#7C3AED",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Fleet Occupancy Equilibrium
                    </span>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#171915" }}>
                      {occupancyRate}% Fleet Deployed · <span style={{ color: "#10B981" }}>{stats.unitsAvailable} Available</span>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: "220px", maxWidth: "420px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 700, color: "#64748B", marginBottom: "4px" }}>
                    <span>{stats.unitsOnRent} on rent</span>
                    <span>{stats.totalUnits} total units</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "#E2E8F0", borderRadius: "9999px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(0, occupancyRate))}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #10B981 0%, #06B6D4 100%)",
                        borderRadius: "9999px",
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
                  gap: "12px",
                  marginBottom: "1.75rem",
                }}
              >
                <MetricCard
                  label="Total Fleet Units"
                  value={stats.totalUnits}
                  sub={`${stats.totalListings} unique assets`}
                  bg="#FFFFFF"
                  icon={<Warehouse size={18} />}
                />
                <MetricCard
                  label="Units On Rent"
                  value={stats.unitsOnRent}
                  sub={`${stats.occupancyRate}% occupancy`}
                  bg="#FFE66D"
                  icon={<Clock size={18} />}
                />
                <MetricCard
                  label="Units Available"
                  value={stats.unitsAvailable}
                  sub="Ready for deal"
                  bg="#A8E6CF"
                  icon={<CheckCircle2 size={18} />}
                />
                <MetricCard
                  label="Active Rental Rev."
                  value={money(stats.activeRentalRevenue)}
                  sub="Active leases"
                  bg="#C3B1E1"
                  icon={<DollarSign size={18} />}
                />
                <MetricCard
                  label="Offline Deals"
                  value={stats.offlineDealsCount || 0}
                  sub="Direct rentals"
                  bg="#89CFF0"
                  icon={<Zap size={18} />}
                />
                <MetricCard
                  label="Overdue Returns"
                  value={stats.overdueCount || 0}
                  sub={stats.overdueCount > 0 ? "Requires action!" : "Fleet on schedule"}
                  bg={stats.overdueCount > 0 ? "#FF6B6B" : "#F0F0F0"}
                  icon={<AlertTriangle size={18} />}
                  highlight={stats.overdueCount > 0}
                />
              </div>

              {/* URGENT RENTAL EXPIRY & OVERDUE ACTION BANNER */}
              {(overdueBookings?.length > 0 || expiringBookings?.length > 0) && (
                <div
                  style={{
                    backgroundColor: overdueBookings?.length > 0 ? "#FFF1F2" : "#FFFBEB",
                    border: `1px solid ${overdueBookings?.length > 0 ? "#FCA5A5" : "#FDE68A"}`,
                    borderRadius: "18px",
                    boxShadow: "0 6px 20px -3px rgba(0, 0, 0, 0.05)",
                    padding: "1.25rem",
                    marginBottom: "1.75rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
                    <AlertTriangle size={20} color={overdueBookings?.length > 0 ? "#DC2626" : "#D97706"} />
                    <h3 style={{ margin: 0, fontWeight: 900, textTransform: "uppercase", fontSize: "1.05rem", color: "#171915" }}>
                      {overdueBookings?.length > 0
                        ? `⚠️ Urgent: ${overdueBookings.length} Rental(s) Overdue for Return`
                        : `⏰ Reminders: ${expiringBookings.length} Rental(s) Ending Within 48 Hours`}
                    </h3>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {overdueBookings?.map((b) => (
                      <ExpiryActionRow
                        key={b._id}
                        booking={b}
                        isOverdue={true}
                        onCheckIn={() => setReturnModal({ open: true, booking: b, repost: true })}
                      />
                    ))}
                    {expiringBookings?.map((b) => (
                      <ExpiryActionRow
                        key={b._id}
                        booking={b}
                        isOverdue={false}
                        onCheckIn={() => setReturnModal({ open: true, booking: b, repost: true })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Tabs - Modern Segmented Control */}
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                  paddingBottom: "1rem",
                  borderBottom: "1px solid rgba(23, 25, 21, 0.08)",
                  marginBottom: "1.5rem",
                }}
              >
                <TabButton
                  active={activeTab === "fleet"}
                  onClick={() => setActiveTab("fleet")}
                  label={`All Fleet Assets (${listings.length})`}
                  icon={<Boxes size={15} />}
                />
                <TabButton
                  active={activeTab === "rentals"}
                  onClick={() => setActiveTab("rentals")}
                  label={`Active Leases & Returns (${(overdueBookings?.length || 0) + (expiringBookings?.length || 0)})`}
                  icon={<Clock size={15} />}
                />
                <TabButton
                  active={activeTab === "offline"}
                  onClick={() => setActiveTab("offline")}
                  label={`Offline Deals Log (${offlineDeals?.length || 0})`}
                  icon={<Zap size={15} />}
                />
                <TabButton
                  active={activeTab === "activity"}
                  onClick={() => setActiveTab("activity")}
                  label={`Activity & Audit (${recentActivity?.length || 0})`}
                  icon={<History size={15} />}
                />
              </div>

              {/* TAB 1: ALL FLEET ASSETS */}
              {activeTab === "fleet" && (
                <FleetView
                  listings={listings}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  onRecordOfflineDeal={(listing) => setOfflineDealModal({ open: true, listing })}
                  onViewHistory={async (listingId) => {
                    setHistoryModal({ open: true, listingId, data: null, loading: true });
                    try {
                      const res = await api(`/inventory/listing/${listingId}/rentals`);
                      setHistoryModal({ open: true, listingId, data: res, loading: false });
                    } catch (err) {
                      showToast(err.message, "error");
                      setHistoryModal({ open: false, listingId: null, data: null, loading: false });
                    }
                  }}
                  onToggleStatus={async (listing, newStatus) => {
                    try {
                      await api(`/inventory/listing/${listing._id}/quick-status`, {
                        method: "PATCH",
                        body: { status: newStatus },
                      });
                      showToast(`Listing ${listing.title} is now ${newStatus}.`);
                      dashboard.reload();
                    } catch (err) {
                      showToast(err.message, "error");
                    }
                  }}
                  onRepost={async (listing) => {
                    try {
                      await api(`/inventory/listing/${listing._id}/repost`, { method: "POST" });
                      showToast(`✓ ${listing.title} reposted to marketplace!`);
                      dashboard.reload();
                    } catch (err) {
                      showToast(err.message, "error");
                    }
                  }}
                />
              )}

              {/* TAB 2: ACTIVE LEASES & RETURNS */}
              {activeTab === "rentals" && (
                <ActiveRentalsView
                  expiringBookings={expiringBookings}
                  overdueBookings={overdueBookings}
                  onCheckIn={(b) => setReturnModal({ open: true, booking: b, repost: true })}
                />
              )}

              {/* TAB 3: OFFLINE DEALS LOG */}
              {activeTab === "offline" && (
                <OfflineDealsView
                  offlineDeals={offlineDeals}
                  onRecordNew={() => setOfflineDealModal({ open: true, listing: null })}
                  onCheckIn={(b) => setReturnModal({ open: true, booking: b, repost: true })}
                />
              )}

              {/* TAB 4: AUDIT & ACTIVITY */}
              {activeTab === "activity" && (
                <ActivityView activity={recentActivity} />
              )}
            </>
          );
        }}
      </State>

      {/* MODAL 1: RECORD OFFLINE DEAL */}
      {offlineDealModal.open && (
        <OfflineDealModal
          listing={offlineDealModal.listing}
          listings={dashboard.data?.listings || []}
          onClose={() => setOfflineDealModal({ open: false, listing: null })}
          onSuccess={() => {
            setOfflineDealModal({ open: false, listing: null });
            showToast("✓ Offline deal successfully logged! Units booked.");
            dashboard.reload();
          }}
        />
      )}

      {/* MODAL 2: STORE NEW ASSET / SPACE */}
      {newAssetModal && (
        <NewAssetModal
          onClose={() => setNewAssetModal(false)}
          onSuccess={(saved) => {
            setNewAssetModal(false);
            showToast(`✓ Asset "${saved.title}" saved to inventory!`);
            dashboard.reload();
          }}
        />
      )}

      {/* MODAL 3: CHECK IN / RETURN & REPOST */}
      {returnModal.open && (
        <ReturnAndRepostModal
          booking={returnModal.booking}
          onClose={() => setReturnModal({ open: false, booking: null, repost: true })}
          onSuccess={({ reposted }) => {
            setReturnModal({ open: false, booking: null, repost: true });
            showToast(
              reposted
                ? "✓ Rental checked in and listing reposted to marketplace!"
                : "✓ Rental marked returned and units freed in fleet."
            );
            dashboard.reload();
          }}
        />
      )}

      {/* MODAL 4: RENTAL HISTORY & ANALYTICS */}
      {historyModal.open && (
        <ListingHistoryModal
          historyData={historyModal.data}
          loading={historyModal.loading}
          onClose={() => setHistoryModal({ open: false, listingId: null, data: null, loading: false })}
          onCheckIn={(b) => setReturnModal({ open: true, booking: b, repost: true })}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SUB-COMPONENTS
// -------------------------------------------------------------

function MetricCard({ label, value, sub, bg, icon, highlight }) {
  const accentColor = highlight
    ? "#DC2626"
    : bg === "#FFE66D"
    ? "#D97706"
    : bg === "#A8E6CF"
    ? "#16A34A"
    : bg === "#C3B1E1"
    ? "#7C3AED"
    : bg === "#89CFF0"
    ? "#0284C7"
    : "#0F766E";

  const iconBg = highlight
    ? "#FEE2E2"
    : bg === "#FFE66D"
    ? "#FEF3C7"
    : bg === "#A8E6CF"
    ? "#DCFCE7"
    : bg === "#C3B1E1"
    ? "#EDE9FE"
    : bg === "#89CFF0"
    ? "#E0F2FE"
    : "#F1F5F9";

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: highlight ? "1px solid #FCA5A5" : "1px solid rgba(23, 25, 21, 0.1)",
        borderRadius: "18px",
        boxShadow: "0 4px 18px -2px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
        padding: "1.1rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "115px",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
      }}
    >
      {/* Top Accent Strip */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: accentColor,
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            textTransform: "uppercase",
            color: "#64748B",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "10px",
            background: iconBg,
            color: accentColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>

      <div style={{ marginTop: "0.5rem" }}>
        <div
          style={{
            fontSize: "1.65rem",
            fontWeight: 900,
            lineHeight: 1.1,
            color: highlight ? "#DC2626" : "#171915",
            letterSpacing: "-0.5px",
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: "0.74rem",
            fontWeight: 600,
            color: highlight ? "#DC2626" : "#64748B",
            marginTop: "3px",
          }}
        >
          {sub}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.45rem",
        padding: "0.55rem 1.1rem",
        background: active ? "#171915" : "#FFFFFF",
        color: active ? "#FFFFFF" : "#475569",
        borderRadius: "12px",
        border: active ? "1px solid #171915" : "1px solid rgba(23, 25, 21, 0.12)",
        boxShadow: active ? "0 2px 8px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.02)",
        fontWeight: 700,
        fontSize: "0.82rem",
        cursor: "pointer",
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        transition: "all 0.15s ease",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function ExpiryActionRow({ booking, isOverdue, onCheckIn }) {
  const listingTitle = booking.listing?.title || "Fleet Asset";
  const clientName = booking.isOfflineDeal
    ? booking.offlineClient?.name || "Offline Client"
    : booking.seeker?.name || "Marketplace Seeker";
  const clientPhone = booking.isOfflineDeal
    ? booking.offlineClient?.phone
    : booking.seeker?.phone;

  const endDate = new Date(booking.end);
  const now = new Date();
  const hoursRemaining = Math.round((endDate.getTime() - now.getTime()) / 3600000);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.75rem",
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(23, 25, 21, 0.1)",
        borderRadius: "14px",
        padding: "0.85rem 1.15rem",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 800,
            textTransform: "uppercase",
            padding: "0.25rem 0.65rem",
            borderRadius: "9999px",
            backgroundColor: isOverdue ? "#FEE2E2" : "#FEF3C7",
            color: isOverdue ? "#991B1B" : "#92400E",
            border: isOverdue ? "1px solid #FCA5A5" : "1px solid #FDE68A",
          }}
        >
          {isOverdue ? `Overdue (${Math.abs(hoursRemaining)}h ago)` : `Due in ${hoursRemaining}h`}
        </span>

        <div>
          <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#171915" }}>
            {listingTitle}
            <span style={{ fontWeight: 600, color: "#64748B", fontSize: "0.85rem", marginLeft: "0.5rem" }}>
              ({booking.quantity || 1} unit{booking.quantity > 1 ? "s" : ""})
            </span>
            {booking.isOfflineDeal && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  backgroundColor: "#E0F2FE",
                  color: "#0369A1",
                  padding: "0.15rem 0.5rem",
                  borderRadius: "9999px",
                  border: "1px solid #BAE6FD",
                  textTransform: "uppercase",
                }}
              >
                Offline Deal
              </span>
            )}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748B", display: "flex", gap: "1rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
            <span>Client: <strong style={{ color: "#171915" }}>{clientName}</strong></span>
            {clientPhone && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Phone size={12} /> {clientPhone}
              </span>
            )}
            <span>Scheduled End: {date(booking.end)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onCheckIn}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.5rem 0.95rem",
          backgroundColor: "#10B981",
          color: "#FFFFFF",
          border: "none",
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
          fontWeight: 800,
          cursor: "pointer",
          fontSize: "0.78rem",
          textTransform: "uppercase",
        }}
      >
        <Check size={14} />
        Check In & Repost
      </button>
    </div>
  );
}

// -------------------------------------------------------------
// TAB 1: FLEET VIEW
// -------------------------------------------------------------

function FleetView({
  listings,
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  onRecordOfflineDeal,
  onViewHistory,
  onToggleStatus,
  onRepost,
}) {
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      const matchSearch =
        !searchTerm ||
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = categoryFilter === "all" || l.category === categoryFilter;
      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "rented"
          ? (l.unitsOnRent || 0) > 0
          : l.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [listings, searchTerm, categoryFilter, statusFilter]);

  const categories = useMemo(() => {
    return Array.from(new Set(listings.map((l) => l.category)));
  }, [listings]);

  return (
    <div>
      {/* Search and Filters */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginBottom: "1.25rem",
          backgroundColor: "#FFFFFF",
          padding: "0.85rem 1rem",
          border: "1px solid rgba(23, 25, 21, 0.1)",
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
        }}
      >
        <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#64748B" }} />
          <input
            type="text"
            placeholder="Search by asset title, space or equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.55rem 0.85rem 0.55rem 2.4rem",
              border: "1px solid rgba(23, 25, 21, 0.15)",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "0.85rem",
              outline: "none",
            }}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: "0.55rem 0.85rem",
            border: "1px solid rgba(23, 25, 21, 0.15)",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "0.82rem",
            backgroundColor: "#FFF",
            cursor: "pointer",
          }}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c.replaceAll("_", " ").toUpperCase()}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "0.55rem 0.85rem",
            border: "1px solid rgba(23, 25, 21, 0.15)",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "0.82rem",
            backgroundColor: "#FFF",
            cursor: "pointer",
          }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Online</option>
          <option value="paused">Stored / Paused</option>
          <option value="rented">Currently On Rent</option>
        </select>
      </div>

      {filteredListings.length === 0 ? (
        <Empty
          title="No fleet assets found"
          text="No inventory matches the current search or filters. Click '+ Store New Asset' to add products or spaces to your fleet."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredListings.map((listing) => (
            <FleetItemCard
              key={listing._id}
              listing={listing}
              onRecordOfflineDeal={() => onRecordOfflineDeal(listing)}
              onViewHistory={() => onViewHistory(listing._id)}
              onToggleStatus={(newStatus) => onToggleStatus(listing, newStatus)}
              onRepost={() => onRepost(listing)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FleetItemCard({ listing, onRecordOfflineDeal, onViewHistory, onToggleStatus, onRepost }) {
  const totalQty = listing.quantity || 1;
  const onRent = listing.unitsOnRent || 0;
  const available = Math.max(0, totalQty - onRent);
  const occupancyPct = Math.round((onRent / totalQty) * 100);

  const isStoredOnly = listing.status === "paused";
  const isFullyRented = available === 0;

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(23, 25, 21, 0.1)",
        borderRadius: "18px",
        boxShadow: "0 4px 18px -2px rgba(0, 0, 0, 0.04)",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        {/* Left: Thumbnail & Details */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              border: "1px solid rgba(23, 25, 21, 0.1)",
              borderRadius: "14px",
              backgroundColor: "#F8FAFC",
              position: "relative",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {listing.photos?.[0] ? (
              <img
                src={listing.photos[0]}
                alt={listing.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
                <Boxes size={28} color="#94A3B8" />
              </div>
            )}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#171915" }}>{listing.title}</h3>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "9999px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#F1F5F9",
                  color: "#475569",
                }}
              >
                {listing.category?.replaceAll("_", " ")}
              </span>

              {isStoredOnly ? (
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    padding: "0.2rem 0.55rem",
                    borderRadius: "9999px",
                    border: "1px solid #FDE68A",
                    backgroundColor: "#FEF3C7",
                    color: "#92400E",
                  }}
                >
                  Stored (Offline)
                </span>
              ) : (
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    padding: "0.2rem 0.55rem",
                    borderRadius: "9999px",
                    border: "1px solid #86EFAC",
                    backgroundColor: "#DCFCE7",
                    color: "#166534",
                  }}
                >
                  Live on Marketplace
                </span>
              )}

              {onRent > 0 && (
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    padding: "0.2rem 0.55rem",
                    borderRadius: "9999px",
                    border: "1px solid #D8B4FE",
                    backgroundColor: "#F3E8FF",
                    color: "#6B21A8",
                  }}
                >
                  {onRent} on rent
                </span>
              )}
            </div>

            <div style={{ fontSize: "0.85rem", color: "#64748B", marginTop: "0.35rem", display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
              <span>Base Rate: <strong style={{ color: "#171915" }}>{money(listing.price)}</strong> / {listing.unit || "day"}</span>
              {listing.deposit > 0 && <span>Deposit: <strong style={{ color: "#171915" }}>{money(listing.deposit)}</strong></span>}
              {listing.city && <span>Location: <strong style={{ color: "#171915" }}>{listing.city}</strong></span>}
            </div>
          </div>
        </div>

        {/* Right: Quantity & Occupancy Indicator */}
        <div style={{ minWidth: "160px", textAlign: "right" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>
            Fleet Stock
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: 900, marginTop: "2px" }}>
            <span style={{ color: available > 0 ? "#16A34A" : "#DC2626" }}>{available} Available</span>
            <span style={{ color: "#94A3B8", fontSize: "0.9rem" }}> / {totalQty} total</span>
          </div>
          {/* Mini progress bar */}
          <div style={{ width: "100%", height: "6px", backgroundColor: "#F1F5F9", borderRadius: "9999px", marginTop: "0.35rem", overflow: "hidden" }}>
            <div
              style={{
                width: `${occupancyPct}%`,
                height: "100%",
                backgroundColor: occupancyPct > 80 ? "#EF4444" : "#10B981",
                borderRadius: "9999px",
              }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
          paddingTop: "0.85rem",
          borderTop: "1px solid rgba(23, 25, 21, 0.06)",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {/* Record Offline Deal button */}
          <button
            onClick={onRecordOfflineDeal}
            disabled={available === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.45rem 0.85rem",
              backgroundColor: available > 0 ? "#FFE66D" : "#F1F5F9",
              color: available > 0 ? "#171915" : "#94A3B8",
              border: "1px solid rgba(23, 25, 21, 0.15)",
              borderRadius: "10px",
              boxShadow: available > 0 ? "0 2px 6px rgba(255, 230, 109, 0.3)" : "none",
              fontWeight: 800,
              fontSize: "0.75rem",
              cursor: available > 0 ? "pointer" : "not-allowed",
              textTransform: "uppercase",
            }}
          >
            <Zap size={13} />
            Record Offline Rental
          </button>

          {/* Repost to Marketplace if stored */}
          {isStoredOnly ? (
            <button
              onClick={onRepost}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.45rem 0.85rem",
                backgroundColor: "#10B981",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "10px",
                boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)",
                fontWeight: 800,
                fontSize: "0.75rem",
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              <Send size={13} />
              Repost to Marketplace
            </button>
          ) : (
            <button
              onClick={() => onToggleStatus("paused")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.45rem 0.85rem",
                backgroundColor: "#FFFFFF",
                color: "#475569",
                border: "1px solid rgba(23, 25, 21, 0.12)",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              Pause / Store in Warehouse
            </button>
          )}

          {/* View Rental History */}
          <button
            onClick={onViewHistory}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.45rem 0.85rem",
              backgroundColor: "#FFFFFF",
              color: "#171915",
              border: "1px solid rgba(23, 25, 21, 0.12)",
              borderRadius: "10px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              fontWeight: 700,
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            <History size={13} />
            History & Leases ({listing.activeBookings?.length || 0} active)
          </button>
        </div>

        <Link
          href={`/dashboard/listings`}
          style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            textDecoration: "underline",
            color: "#0F766E",
          }}
        >
          Edit Listing Specs ↗
        </Link>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// TAB 2: ACTIVE RENTALS VIEW
// -------------------------------------------------------------

function ActiveRentalsView({ expiringBookings, overdueBookings, onCheckIn }) {
  const allActive = useMemo(() => {
    const combined = [...(overdueBookings || []), ...(expiringBookings || [])];
    return combined;
  }, [expiringBookings, overdueBookings]);

  if (allActive.length === 0) {
    return (
      <Empty
        title="No active leases due soon"
        text="All rented items are currently on schedule with no urgent returns pending."
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {allActive.map((b) => (
        <ExpiryActionRow
          key={b._id}
          booking={b}
          isOverdue={new Date(b.end) < new Date()}
          onCheckIn={() => onCheckIn(b)}
        />
      ))}
    </div>
  );
}

// -------------------------------------------------------------
// TAB 3: OFFLINE DEALS VIEW
// -------------------------------------------------------------

function OfflineDealsView({ offlineDeals, onRecordNew, onCheckIn }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>
            Off-Platform & Offline Deals
          </h2>
          <p style={{ margin: "0.2rem 0 0 0", color: "#666", fontSize: "0.85rem" }}>
            Leases conducted directly with walk-in clients, phone orders, or direct corporate contracts.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={onRecordNew}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0.95rem",
              backgroundColor: "#FFF",
              color: "#171915",
              border: "1px solid rgba(23, 25, 21, 0.15)",
              borderRadius: "12px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "0.8rem",
              textTransform: "uppercase",
            }}
          >
            <Zap size={15} />
            Quick Modal
          </button>
          <Link
            href="/dashboard/inventory/offline-deal"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0.95rem",
              backgroundColor: "#FFE66D",
              color: "#171915",
              border: "1px solid rgba(23, 25, 21, 0.2)",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(255, 230, 109, 0.4)",
              fontWeight: 800,
              textDecoration: "none",
              fontSize: "0.8rem",
              textTransform: "uppercase",
            }}
          >
            <Zap size={15} />
            + Record Offline Deal Page
          </Link>
        </div>
      </div>

      {(!offlineDeals || offlineDeals.length === 0) ? (
        <Empty
          title="No offline deals recorded yet"
          text="Have a direct client renting equipment or spaces offline? Log them here to keep your fleet availability in sync."
          href="/dashboard/inventory/offline-deal"
          label="+ Record an Offline Deal"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {offlineDeals.map((deal) => {
            const isOverdue = new Date(deal.end) < new Date();
            return (
              <div
                key={deal._id}
                style={{
                  backgroundColor: "#FFF",
                  border: "1px solid rgba(23, 25, 21, 0.1)",
                  borderRadius: "16px",
                  boxShadow: "0 4px 18px -2px rgba(0,0,0,0.04)",
                  padding: "1.1rem 1.35rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 900,
                        backgroundColor: "#89CFF0",
                        padding: "0.2rem 0.55rem",
                        borderRadius: "8px",
                        border: "1px solid rgba(23, 25, 21, 0.12)",
                        textTransform: "uppercase",
                      }}
                    >
                      Offline Deal
                    </span>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 900 }}>
                      {deal.listing?.title || "Asset"}
                    </h3>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#555" }}>
                      ({deal.quantity || 1} units)
                    </span>
                  </div>

                  <div style={{ fontSize: "0.85rem", color: "#444", marginTop: "0.4rem", display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                    <span>Client: <strong>{deal.offlineClient?.name || "Client"}</strong></span>
                    {deal.offlineClient?.phone && (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Phone size={12} /> {deal.offlineClient.phone}
                      </span>
                    )}
                    <span>Duration: <strong>{date(deal.start)}</strong> → <strong>{date(deal.end)}</strong></span>
                    <span>Agreed Rent: <strong>{money(deal.price)}</strong></span>
                  </div>

                  {deal.offlineClient?.notes && (
                    <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.25rem", fontStyle: "italic" }}>
                      Notes: {deal.offlineClient.notes}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onCheckIn(deal)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.55rem 1rem",
                    backgroundColor: isOverdue ? "#FEE2E2" : "#DCFCE7",
                    color: isOverdue ? "#991B1B" : "#166534",
                    border: isOverdue ? "1px solid #FCA5A5" : "1px solid #86EFAC",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    textTransform: "uppercase",
                  }}
                >
                  <Check size={14} />
                  Mark Returned & Repost
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// TAB 4: ACTIVITY VIEW
// -------------------------------------------------------------

function ActivityView({ activity }) {
  if (!activity || activity.length === 0) {
    return <Empty title="No recent inventory events" text="Real-time notifications and rental status changes will be listed here." />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {activity.map((item) => (
        <div
          key={item._id}
          style={{
            backgroundColor: "#FFF",
            border: "1px solid rgba(23, 25, 21, 0.08)",
            borderRadius: "14px",
            boxShadow: "0 2px 8px -2px rgba(0,0,0,0.03)",
            padding: "0.95rem 1.15rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{item.title}</div>
            <div style={{ fontSize: "0.85rem", color: "#555", marginTop: "0.15rem" }}>{item.body}</div>
          </div>
          <div style={{ fontSize: "0.75rem", color: "#888", fontWeight: 600 }}>
            {date(item.createdAt)}
          </div>
        </div>
      ))}
    </div>
  );
}

// -------------------------------------------------------------
// MODALS
// -------------------------------------------------------------

function OfflineDealModal({ listing, listings, onClose, onSuccess }) {
  const [selectedListingId, setSelectedListingId] = useState(listing?._id || listings[0]?._id || "");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentListing = useMemo(() => {
    return listings.find((l) => l._id === selectedListingId);
  }, [listings, selectedListingId]);

  useEffect(() => {
    if (currentListing) {
      setPrice(String(currentListing.price || ""));
      setDeposit(String(currentListing.deposit || ""));
    }
  }, [currentListing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      setError("Client name and phone number are required.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      await api("/inventory/offline-deals", {
        method: "POST",
        body: {
          listingId: selectedListingId,
          clientName,
          clientPhone,
          clientEmail,
          notes,
          start: new Date(startDate),
          end: new Date(endDate),
          quantity: Number(quantity) || 1,
          price: Number(price) || 0,
          deposit: Number(deposit) || 0,
        },
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <ModalPortal>
      <div
        className="modal-backdrop"
        style={modalBackdropStyle}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="modal-card" style={modalCardStyle}>
          <div style={modalHeaderStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <h2 style={{ margin: 0, fontWeight: 900, textTransform: "uppercase", fontSize: "1.2rem" }}>
                ⚡ Record Offline Deal
              </h2>
            <Link
              href="/dashboard/inventory/offline-deal"
              onClick={onClose}
              style={{
                fontSize: "0.75rem",
                color: "#000",
                textDecoration: "underline",
                fontWeight: 700,
                background: "#FFE66D",
                padding: "0.15rem 0.4rem",
                border: "1px solid #000",
              }}
            >
              Full Page ↗
            </Link>
          </div>
          <button onClick={onClose} style={closeBtnStyle}><X size={18} /></button>
        </div>

        {error && <div style={errorBannerStyle}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Select Fleet Asset / Space *</label>
            <select
              value={selectedListingId}
              onChange={(e) => setSelectedListingId(e.target.value)}
              style={inputStyle}
              required
            >
              {listings.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.title} ({l.unitsAvailable ?? l.quantity} units available)
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>Client / Seeker Name *</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Patel"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Client Phone *</label>
              <input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>Rental Start Time *</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Rental End Time *</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>Units Count *</label>
              <input
                type="number"
                min="1"
                max={currentListing ? (currentListing.unitsAvailable ?? currentListing.quantity) : 100}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Agreed Rent (₹) *</label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Security Deposit (₹)</label>
              <input
                type="number"
                min="0"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Offline Deal Notes (Optional)</label>
            <textarea
              placeholder="e.g. Cash collected upfront, driver delivery arranged..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button type="button" onClick={onClose} style={btnSecondaryStyle}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={btnPrimaryStyle}>
              {submitting ? "Booking Units..." : "✓ Confirm & Lock Units"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}

function NewAssetModal({ onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("chairs");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [price, setPrice] = useState(150);
  const [unit, setUnit] = useState("day");
  const [deposit, setDeposit] = useState(500);
  const [city, setCity] = useState("Mumbai");
  const [publishOnline, setPublishOnline] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [aiOptimizing, setAiOptimizing] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);

  const handleAiOptimize = async () => {
    setAiOptimizing(true);
    setAiInsight(null);
    try {
      const res = await api("/nugen/optimize-listing", {
        method: "POST",
        body: { listing: { title: title || category, category, dailyRate: price, description } }
      });
      const sugg = res.suggestions;
      if (sugg.titleSuggestion) setTitle(sugg.titleSuggestion);
      if (sugg.descriptionSuggestion) setDescription(sugg.descriptionSuggestion);
      setAiInsight(sugg.pricingAdvice || "Listing optimized using Nugen Domain AI.");
    } catch {
      setAiInsight("Optimized using domain-aligned B2B rental benchmarks.");
    } finally {
      setAiOptimizing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const created = await api("/inventory/assets", {
        method: "POST",
        body: {
          title,
          category,
          description,
          quantity: Number(quantity),
          price: Number(price),
          unit,
          deposit: Number(deposit),
          city,
          publishOnline,
        },
      });
      onSuccess(created);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <ModalPortal>
      <div
        className="modal-backdrop"
        style={modalBackdropStyle}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="modal-card" style={modalCardStyle}>
          <div style={modalHeaderStyle}>
            <div>
              <h2 style={{ margin: 0, fontWeight: 900, textTransform: "uppercase", fontSize: "1.2rem" }}>
                📦 Store New Fleet Asset / Space
              </h2>
              <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "2px" }}>
                Quick store in fleet, or{" "}
                <Link
                  href="/dashboard/listings/create"
                  onClick={onClose}
                  style={{ color: "#000", fontWeight: 700, textDecoration: "underline" }}
                >
                  open full listing creator →
                </Link>
              </div>
            </div>
            <button onClick={onClose} style={closeBtnStyle}><X size={18} /></button>
          </div>

        {error && <div style={errorBannerStyle}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F5F0FF", border: "1.5px solid #171915", borderRadius: "8px", padding: "8px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={15} color="#7B61A8" />
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#171915" }}>Nugen Aligned AI Optimizer</span>
          </div>
          <button
            type="button"
            onClick={handleAiOptimize}
            disabled={aiOptimizing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              fontSize: "0.75rem",
              fontWeight: 800,
              background: "#171915",
              color: "#fff",
              border: "1.5px solid #171915",
              borderRadius: "6px",
              cursor: "pointer",
              boxShadow: "2px 2px 0 #C3B1E1",
            }}
          >
            <span>{aiOptimizing ? "Optimizing..." : "⚡ Auto-Draft with AI"}</span>
          </button>
        </div>

        {aiInsight && (
          <div style={{ background: "#EDE9FE", border: "1.5px solid #7B61A8", borderRadius: "8px", padding: "8px 12px", fontSize: "0.78rem", fontWeight: 700, color: "#4C1D95" }}>
            {aiInsight}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Asset / Space Title *</label>
            <input
              type="text"
              placeholder="e.g. Premium Banquet Chiavari Chairs (Gold)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>Category *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                <option value="banquet_hall">Banquet Hall / Space</option>
                <option value="chairs">Chairs & Seating</option>
                <option value="tables">Tables & Furniture</option>
                <option value="av_equipment">Audio & Visual</option>
                <option value="linens">Linens & Decor</option>
                <option value="kitchen">Commercial Kitchen</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Total Units in Fleet *</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>Price (₹) *</label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Unit *</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} style={inputStyle}>
                <option value="day">Per Day</option>
                <option value="hour">Per Hour</option>
                <option value="event">Per Event</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Deposit (₹)</label>
              <input
                type="number"
                min="0"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>City / Base Location</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Description / Specifications</label>
            <textarea
              placeholder="Provide specifications, dimensions, condition..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Publishing toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              backgroundColor: "#F9F9F9",
              padding: "0.75rem",
              border: "1.5px solid #000",
            }}
          >
            <input
              type="checkbox"
              id="publishOnline"
              checked={publishOnline}
              onChange={(e) => setPublishOnline(e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <label htmlFor="publishOnline" style={{ fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}>
              Publish Live on Marketplace Immediately
              <div style={{ fontWeight: 500, fontSize: "0.75rem", color: "#666" }}>
                Uncheck to keep stored in warehouse fleet (unlisted from online search).
              </div>
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button type="button" onClick={onClose} style={btnSecondaryStyle}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={btnPrimaryStyle}>
              {submitting ? "Saving Asset..." : "✓ Store in Inventory"}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}

function ReturnAndRepostModal({ booking, onClose, onSuccess }) {
  const [repost, setRepost] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const clientName = booking?.isOfflineDeal
    ? booking.offlineClient?.name || "Client"
    : booking?.seeker?.name || "Seeker";

  const handleReturn = async () => {
    setSubmitting(true);
    setError("");

    try {
      const res = await api(`/inventory/offline-deals/${booking._id}/return`, {
        method: "POST",
        body: { repostToListing: repost },
      });
      onSuccess(res);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <ModalPortal>
      <div
        className="modal-backdrop"
        style={modalBackdropStyle}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="modal-card" style={modalCardStyle}>
          <div style={modalHeaderStyle}>
            <h2 style={{ margin: 0, fontWeight: 900, textTransform: "uppercase", fontSize: "1.2rem" }}>
              ✓ Check In & Free Fleet Units
            </h2>
            <button onClick={onClose} style={closeBtnStyle}><X size={18} /></button>
          </div>

        {error && <div style={errorBannerStyle}>{error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.5 }}>
            Are you confirming that <strong>{booking?.quantity || 1} unit(s)</strong> of{" "}
            <strong>{booking?.listing?.title || "Asset"}</strong> have been returned by{" "}
            <strong>{clientName}</strong>?
          </p>

          <div
            style={{
              backgroundColor: "#FFF9D2",
              border: "1px solid rgba(23, 25, 21, 0.12)",
              borderRadius: "14px",
              padding: "0.95rem 1.15rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <input
              type="checkbox"
              id="repostCheck"
              checked={repost}
              onChange={(e) => setRepost(e.target.checked)}
              style={{ width: "20px", height: "20px", cursor: "pointer" }}
            />
            <label htmlFor="repostCheck" style={{ fontWeight: 800, fontSize: "0.9rem", cursor: "pointer" }}>
              Repost & Ensure Listing is Live on Marketplace as Free
              <div style={{ fontWeight: 600, fontSize: "0.75rem", color: "#333" }}>
                Immediately activates the listing online so other seekers can rent it right away.
              </div>
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.75rem" }}>
            <button onClick={onClose} style={btnSecondaryStyle}>Cancel</button>
            <button onClick={handleReturn} disabled={submitting} style={btnPrimaryStyle}>
              {submitting ? "Processing Return..." : "✓ Confirm Return & Restock"}
            </button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

function ListingHistoryModal({ historyData, loading, onClose, onCheckIn }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <ModalPortal>
      <div
        className="modal-backdrop"
        style={modalBackdropStyle}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="modal-card" style={{ ...modalCardStyle, maxWidth: "720px" }}>
          <div style={modalHeaderStyle}>
            <h2 style={{ margin: 0, fontWeight: 900, textTransform: "uppercase", fontSize: "1.2rem" }}>
              📜 Asset Lease History & Analytics
            </h2>
            <button onClick={onClose} style={closeBtnStyle}><X size={18} /></button>
          </div>

        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", fontWeight: 700 }}>Loading history records…</div>
        ) : !historyData ? (
          <div>No history available.</div>
        ) : (
          <div>
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 900 }}>{historyData.listing?.title}</h3>
              <span style={{ fontSize: "0.8rem", color: "#666" }}>
                Total Fleet: {historyData.listing?.quantity || 1} units | Base Price: {money(historyData.listing?.price)}
              </span>
            </div>

            {/* Performance Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "0.5rem",
                marginBottom: "1.25rem",
              }}
            >
              <div style={statBoxStyle}>
                <div style={statLabelStyle}>Total Leases</div>
                <div style={statValStyle}>{historyData.stats?.totalRentals || 0}</div>
              </div>
              <div style={statBoxStyle}>
                <div style={statLabelStyle}>Active Now</div>
                <div style={statValStyle}>{historyData.stats?.activeRentals || 0}</div>
              </div>
              <div style={statBoxStyle}>
                <div style={statLabelStyle}>Lifetime Rev.</div>
                <div style={statValStyle}>{money(historyData.stats?.totalRevenue)}</div>
              </div>
              <div style={statBoxStyle}>
                <div style={statLabelStyle}>Avg Duration</div>
                <div style={statValStyle}>{historyData.stats?.averageRentalDuration || 0}d</div>
              </div>
            </div>

            {/* Rentals List */}
            <div style={{ maxHeight: "360px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {historyData.rentals?.length === 0 ? (
                <div style={{ padding: "1rem", textAlign: "center", color: "#888" }}>No rentals recorded yet for this asset.</div>
              ) : (
                historyData.rentals.map((r) => (
                  <div
                    key={r._id}
                    style={{
                      border: "1px solid rgba(23, 25, 21, 0.08)",
                      borderRadius: "14px",
                      padding: "0.85rem 1rem",
                      backgroundColor: r.status === "in_progress" ? "#FFFBEA" : "#FAFAFA",
                      boxShadow: "0 2px 8px -2px rgba(0,0,0,0.02)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>
                        {r.isOfflineDeal ? `Offline: ${r.offlineClient?.name || "Client"}` : `Seeker: ${r.seeker?.name || "Seeker"}`}
                        <span style={{ fontSize: "0.75rem", marginLeft: "0.5rem", color: "#666" }}>
                          ({r.quantity || 1} units)
                        </span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#555" }}>
                        {date(r.start)} → {date(r.end)} | Rent: {money(r.price)}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          padding: "0.2rem 0.55rem",
                          borderRadius: "8px",
                          border: "1px solid rgba(23, 25, 21, 0.12)",
                          backgroundColor: r.status === "completed" ? "#D4EDDA" : r.status === "in_progress" ? "#FFE66D" : "#F0F0F0",
                        }}
                      >
                        {r.status?.replace("_", " ")}
                      </span>

                      {r.status === "in_progress" && (
                        <button
                          onClick={() => {
                            onClose();
                            onCheckIn({ ...r, listing: historyData.listing });
                          }}
                          style={{
                            padding: "0.35rem 0.75rem",
                            backgroundColor: "#4ECDC4",
                            border: "1px solid rgba(23, 25, 21, 0.15)",
                            borderRadius: "8px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          Check In
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </ModalPortal>
  );
}

// -------------------------------------------------------------
// MODAL PORTAL & STYLES
// -------------------------------------------------------------

function ModalPortal({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

const modalBackdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  backdropFilter: "blur(4px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999999,
  padding: "1.25rem",
  boxSizing: "border-box",
  overflowY: "auto",
};

const modalCardStyle = {
  backgroundColor: "#FFFFFF",
  border: "1px solid rgba(23, 25, 21, 0.12)",
  borderRadius: "20px",
  boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.18), 0 8px 20px -6px rgba(0, 0, 0, 0.1)",
  width: "100%",
  maxWidth: "580px",
  padding: "1.75rem",
  maxHeight: "90vh",
  overflowY: "auto",
  boxSizing: "border-box",
  position: "relative",
  zIndex: 1000000,
  margin: "auto",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid rgba(23, 25, 21, 0.08)",
  paddingBottom: "0.85rem",
  marginBottom: "1.25rem",
};

const closeBtnStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "0.25rem",
  color: "#64748B",
};

const labelStyle = {
  display: "block",
  fontSize: "0.78rem",
  fontWeight: 800,
  textTransform: "uppercase",
  marginBottom: "0.35rem",
  color: "#333",
  letterSpacing: "0.3px",
};

const inputStyle = {
  width: "100%",
  padding: "0.6rem 0.85rem",
  border: "1.5px solid rgba(23, 25, 21, 0.15)",
  borderRadius: "12px",
  fontWeight: 600,
  fontSize: "0.875rem",
  backgroundColor: "#FAFAFA",
  outline: "none",
  transition: "all 0.15s ease",
};

const btnPrimaryStyle = {
  padding: "0.65rem 1.35rem",
  backgroundColor: "#FFE66D",
  color: "#171915",
  border: "1px solid rgba(23, 25, 21, 0.2)",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(255, 230, 109, 0.4)",
  fontWeight: 800,
  fontSize: "0.85rem",
  textTransform: "uppercase",
  cursor: "pointer",
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
};

const btnSecondaryStyle = {
  padding: "0.65rem 1.2rem",
  backgroundColor: "#FFF",
  color: "#171915",
  border: "1px solid rgba(23, 25, 21, 0.15)",
  borderRadius: "12px",
  fontWeight: 800,
  fontSize: "0.85rem",
  cursor: "pointer",
  transition: "background 0.15s ease",
};

const errorBannerStyle = {
  backgroundColor: "#FEE2E2",
  color: "#991B1B",
  border: "1px solid #FCA5A5",
  borderRadius: "12px",
  padding: "0.75rem 1rem",
  fontWeight: 700,
  fontSize: "0.85rem",
  marginBottom: "1rem",
};

const statBoxStyle = {
  border: "1px solid rgba(23, 25, 21, 0.08)",
  borderRadius: "12px",
  padding: "0.65rem 0.5rem",
  backgroundColor: "#FAFAFA",
  textAlign: "center",
  boxShadow: "0 2px 8px -2px rgba(0,0,0,0.03)",
};

const statLabelStyle = {
  fontSize: "0.68rem",
  fontWeight: 800,
  textTransform: "uppercase",
  color: "#666",
};

const statValStyle = {
  fontSize: "1.1rem",
  fontWeight: 900,
  marginTop: "0.2rem",
};
