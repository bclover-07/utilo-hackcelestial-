"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useData, State, money, date } from "./ui";
import {
  Zap,
  ArrowLeft,
  Warehouse,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Shield,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Boxes,
  Package,
} from "lucide-react";

export function OfflineDealPage() {
  return (
    <Suspense fallback={<div className="neo-container" style={{ padding: "2rem" }}>Loading offline deal creator...</div>}>
      <OfflineDealForm />
    </Suspense>
  );
}

function OfflineDealForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedListingId = searchParams.get("listingId") || "";

  const listingsData = useData("/listings");
  const { user } = useAuth();

  const [selectedListingId, setSelectedListingId] = useState(preselectedListingId);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [idProof, setIdProof] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [deposit, setDeposit] = useState("");

  const getDefaultStart = () => new Date().toISOString().slice(0, 16);
  const getDefaultEnd = (days = 1) =>
    new Date(Date.now() + days * 24 * 3600 * 1000).toISOString().slice(0, 16);

  const [startDate, setStartDate] = useState(getDefaultStart());
  const [endDate, setEndDate] = useState(getDefaultEnd(1));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successDeal, setSuccessDeal] = useState(null);

  const availableListings = useMemo(() => {
    return (listingsData.data || []).filter((l) => l.status !== "archived");
  }, [listingsData.data]);

  useEffect(() => {
    if (!selectedListingId && availableListings.length > 0) {
      const initialId =
        preselectedListingId && availableListings.some((l) => l._id === preselectedListingId)
          ? preselectedListingId
          : availableListings[0]._id;
      const target = availableListings.find((l) => l._id === initialId);
      setTimeout(() => {
        setSelectedListingId(initialId);
        if (target) {
          setPrice(String(target.price || ""));
          setDeposit(String(target.deposit || ""));
        }
      }, 0);
    }
  }, [availableListings, preselectedListingId, selectedListingId]);

  const currentListing = useMemo(() => {
    return availableListings.find((l) => l._id === selectedListingId);
  }, [availableListings, selectedListingId]);

  const handleSelectListing = (id) => {
    setSelectedListingId(id);
    const target = availableListings.find((l) => l._id === id);
    if (target) {
      setPrice(String(target.price || ""));
      setDeposit(String(target.deposit || ""));
    }
  };

  // Duration in hours / days
  const durationInfo = useMemo(() => {
    try {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      if (isNaN(s) || isNaN(e) || e <= s) return null;
      const diffMs = e - s;
      const totalHours = Math.round(diffMs / (3600 * 1000));
      const totalDays = Math.ceil(diffMs / (24 * 3600 * 1000));
      return { totalHours, totalDays };
    } catch {
      return null;
    }
  }, [startDate, endDate]);

  const maxUnitsAvailable = currentListing
    ? (currentListing.unitsAvailable ?? currentListing.quantity ?? 1)
    : 100;

  const setPresetDuration = (days) => {
    const s = startDate ? new Date(startDate) : new Date();
    const e = new Date(s.getTime() + days * 24 * 3600 * 1000);
    setEndDate(e.toISOString().slice(0, 16));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedListingId) {
      setError("Please select a resource / asset from your inventory.");
      return;
    }
    if (!clientName.trim()) {
      setError("Client name is required.");
      return;
    }
    if (!clientPhone.trim()) {
      setError("Client phone number is required.");
      return;
    }

    const s = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(end.getTime()) || end <= s) {
      setError("Return end time must be after start time.");
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty < 1) {
      setError("Quantity must be at least 1 unit.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api("/inventory/offline-deals", {
        method: "POST",
        body: {
          listingId: selectedListingId,
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          clientEmail: clientEmail.trim(),
          notes: [
            notes ? `Notes: ${notes}` : "",
            paymentMode ? `Payment: ${paymentMode.toUpperCase()} (${paymentStatus})` : "",
            idProof ? `ID Proof: ${idProof}` : "",
          ]
            .filter(Boolean)
            .join(" | "),
          start: s,
          end: end,
          quantity: qty,
          price: Number(price) || 0,
          deposit: Number(deposit) || 0,
        },
      });

      setSuccessDeal({
        listingTitle: currentListing?.title || "Asset",
        clientName,
        clientPhone,
        quantity: qty,
        price: Number(price) || 0,
        deposit: Number(deposit) || 0,
        start: s,
        end: end,
        booking: res?.booking,
      });
    } catch (err) {
      setError(err.message || "Failed to record offline deal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSuccessDeal(null);
    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setNotes("");
    setIdProof("");
    setQuantity(1);
    setStartDate(getDefaultStart());
    setEndDate(getDefaultEnd(1));
  };

  return (
    <div
      className="offline-deal-page neo-container"
      style={{
        padding: "1.5rem",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* Navigation Breadcrumbs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.85rem",
          fontWeight: 700,
          marginBottom: "1.25rem",
        }}
      >
        <Link
          href="/dashboard/inventory"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            color: "#171915",
            textDecoration: "none",
            border: "1px solid rgba(23, 25, 21, 0.15)",
            borderRadius: "10px",
            padding: "0.35rem 0.75rem",
            background: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
            fontWeight: 700,
          }}
        >
          <ArrowLeft size={14} /> Back to Fleet Hub
        </Link>
        <ChevronRight size={14} />
        <Link href="/dashboard/listings" style={{ color: "#555", textDecoration: "none" }}>
          My Listings
        </Link>
        <ChevronRight size={14} />
        <span style={{ color: "#000", fontWeight: 800 }}>⚡ Record Offline Deal</span>
      </div>

      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #FFF9D2 0%, #FFE66D 100%)",
          border: "1px solid rgba(23, 25, 21, 0.12)",
          borderRadius: "20px",
          boxShadow: "0 8px 24px -4px rgba(255, 230, 109, 0.35)",
          padding: "1.75rem",
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.25rem",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "#171915",
              color: "#FFE66D",
              padding: "0.25rem 0.65rem",
              borderRadius: "8px",
              fontWeight: 900,
              fontSize: "0.72rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "0.6rem",
            }}
          >
            <Zap size={14} /> Direct Offline Booking & Fleet Lock
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "1.85rem",
              fontWeight: 900,
              letterSpacing: "-0.5px",
              color: "#171915",
            }}
          >
            Record Offline Rental Deal
          </h1>
          <p
            style={{
              margin: "0.4rem 0 0 0",
              fontSize: "0.95rem",
              color: "#374151",
              maxWidth: "650px",
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            Renting out items to direct walk-in clients, phone inquiries, or event partners? Lock
            fleet units here so Utlio tracks availability in real time and automatically triggers
            return reminder notifications when the rental period expires.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link
            href="/dashboard/inventory"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.65rem 1.15rem",
              background: "#FFF",
              color: "#171915",
              border: "1px solid rgba(23, 25, 21, 0.15)",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              fontWeight: 800,
              textDecoration: "none",
              textTransform: "uppercase",
              fontSize: "0.82rem",
            }}
          >
            <Boxes size={16} /> Fleet Hub
          </Link>
          <Link
            href="/dashboard/listings/create"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.65rem 1.15rem",
              background: "#4ECDC4",
              color: "#171915",
              border: "1px solid rgba(23, 25, 21, 0.2)",
              borderRadius: "12px",
              boxShadow: "0 4px 14px rgba(78, 205, 196, 0.4)",
              fontWeight: 800,
              textDecoration: "none",
              textTransform: "uppercase",
              fontSize: "0.82rem",
            }}
          >
            <Package size={16} /> + New Resource
          </Link>
        </div>
      </div>

      {/* Success View */}
      {successDeal ? (
        <div
          style={{
            background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "20px",
            boxShadow: "0 10px 30px -6px rgba(16, 185, 129, 0.15)",
            padding: "2.25rem",
            textAlign: "center",
            maxWidth: "750px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "#10B981",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              boxShadow: "0 6px 20px rgba(16, 185, 129, 0.35)",
            }}
          >
            <CheckCircle2 size={36} />
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 900, margin: "0 0 0.5rem", color: "#065F46" }}>
            ✓ Offline Deal Successfully Recorded!
          </h2>
          <p style={{ fontSize: "1rem", color: "#047857", fontWeight: 600, marginBottom: "1.5rem" }}>
            <strong>{successDeal.quantity} unit(s)</strong> of{" "}
            <strong>&quot;{successDeal.listingTitle}&quot;</strong> have been marked rented and deducted from
            your available fleet capacity.
          </p>

          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(23, 25, 21, 0.1)",
              borderRadius: "16px",
              boxShadow: "0 4px 14px -2px rgba(0,0,0,0.04)",
              padding: "1.35rem",
              textAlign: "left",
              marginBottom: "1.75rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              fontSize: "0.9rem",
            }}
          >
            <div>
              <span style={{ color: "#666", fontSize: "0.78rem", textTransform: "uppercase", fontWeight: 700 }}>
                Client
              </span>
              <div style={{ fontWeight: 800, marginTop: "2px" }}>{successDeal.clientName}</div>
              <div style={{ color: "#444" }}>{successDeal.clientPhone}</div>
            </div>
            <div>
              <span style={{ color: "#666", fontSize: "0.78rem", textTransform: "uppercase", fontWeight: 700 }}>
                Commercials
              </span>
              <div style={{ fontWeight: 800, marginTop: "2px" }}>Rent: {money(successDeal.price)}</div>
              <div style={{ color: "#444" }}>Deposit: {money(successDeal.deposit)}</div>
            </div>
            <div>
              <span style={{ color: "#666", fontSize: "0.78rem", textTransform: "uppercase", fontWeight: 700 }}>
                Return Due Date
              </span>
              <div style={{ fontWeight: 800, color: "#d9534f", marginTop: "2px" }}>
                {new Date(successDeal.end).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
              <div style={{ color: "#666", fontSize: "0.8rem" }}>Automated reminder scheduled</div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={resetForm}
              style={{
                padding: "0.75rem 1.35rem",
                background: "#FFE66D",
                color: "#171915",
                border: "1px solid rgba(23, 25, 21, 0.2)",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(255, 230, 109, 0.4)",
                fontWeight: 800,
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              + Record Another Deal
            </button>
            <Link
              href="/dashboard/inventory"
              style={{
                padding: "0.75rem 1.35rem",
                background: "#4ECDC4",
                color: "#171915",
                border: "1px solid rgba(23, 25, 21, 0.2)",
                borderRadius: "12px",
                boxShadow: "0 4px 14px rgba(78, 205, 196, 0.4)",
                fontWeight: 800,
                textDecoration: "none",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Boxes size={18} /> View Fleet Hub & Returns
            </Link>
            <Link
              href="/dashboard/listings"
              style={{
                padding: "0.75rem 1.35rem",
                background: "#FFF",
                color: "#171915",
                border: "1px solid rgba(23, 25, 21, 0.15)",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                fontWeight: 800,
                textDecoration: "none",
                textTransform: "uppercase",
              }}
            >
              My Listings
            </Link>
          </div>
        </div>
      ) : (
        /* Form + Summary Grid */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 360px",
            gap: "2rem",
            alignItems: "start",
          }}
        >
          {/* Main Form */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(23, 25, 21, 0.1)",
              borderRadius: "20px",
              boxShadow: "0 8px 28px -4px rgba(0,0,0,0.05)",
              padding: "2rem",
            }}
          >
            {error && (
              <div
                style={{
                  background: "#FEE2E2",
                  color: "#991B1B",
                  border: "1px solid #FCA5A5",
                  borderRadius: "12px",
                  padding: "0.85rem 1rem",
                  marginBottom: "1.5rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* STEP 1: ASSET SELECTION */}
              <div
                style={{
                  border: "1px solid rgba(23, 25, 21, 0.08)",
                  borderRadius: "16px",
                  padding: "1.35rem",
                  background: "#FAF9F5",
                  boxShadow: "0 2px 8px -2px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    fontSize: "0.95rem",
                  }}
                >
                  <Warehouse size={18} />
                  <span>1. Select Asset or Space From Your Fleet *</span>
                </div>

                <State resource={listingsData}>
                  {(data) => {
                    if (!data || data.length === 0) {
                      return (
                        <div style={{ textAlign: "center", padding: "1rem" }}>
                          <p style={{ fontWeight: 600 }}>No resources found in your account.</p>
                          <Link
                            href="/dashboard/listings/create"
                            style={{
                              display: "inline-block",
                              marginTop: "0.5rem",
                              padding: "0.55rem 1.15rem",
                              background: "#4ECDC4",
                              border: "1px solid rgba(23, 25, 21, 0.2)",
                              borderRadius: "10px",
                              boxShadow: "0 2px 8px rgba(78, 205, 196, 0.3)",
                              fontWeight: 800,
                              textDecoration: "none",
                              color: "#171915",
                            }}
                          >
                            + Add Your First Resource
                          </Link>
                        </div>
                      );
                    }

                    return (
                      <div>
                        <select
                          value={selectedListingId}
                          onChange={(e) => handleSelectListing(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: "1.5px solid rgba(23, 25, 21, 0.15)",
                            borderRadius: "12px",
                            fontWeight: 700,
                            fontSize: "0.92rem",
                            background: "#fff",
                            cursor: "pointer",
                            marginBottom: "0.85rem",
                            outline: "none",
                          }}
                          required
                        >
                          <option value="" disabled>
                            -- Choose asset from fleet --
                          </option>
                          {availableListings.map((l) => (
                            <option key={l._id} value={l._id}>
                              {l.title} ({l.unitsAvailable ?? l.quantity} units available / {l.quantity} total) — ₹
                              {l.price}/day
                            </option>
                          ))}
                        </select>

                        {currentListing && (
                          <div
                            style={{
                              background: "#fff",
                              border: "1px solid rgba(23, 25, 21, 0.1)",
                              borderRadius: "12px",
                              padding: "0.85rem 1rem",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: "0.75rem",
                              fontSize: "0.85rem",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 800, fontSize: "1rem", display: "block" }}>
                                {currentListing.title}
                              </span>
                              <span style={{ color: "#666", textTransform: "capitalize" }}>
                                Category: {currentListing.category?.replaceAll("_", " ")}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <span
                                style={{
                                  background: "#FFE66D",
                                  border: "1px solid rgba(23, 25, 21, 0.15)",
                                  borderRadius: "8px",
                                  padding: "0.25rem 0.6rem",
                                  fontWeight: 800,
                                }}
                              >
                                Rate: {money(currentListing.price)}
                              </span>
                              <span
                                style={{
                                  background: "#A8E6CF",
                                  border: "1px solid rgba(23, 25, 21, 0.15)",
                                  borderRadius: "8px",
                                  padding: "0.25rem 0.6rem",
                                  fontWeight: 800,
                                }}
                              >
                                {currentListing.unitsAvailable ?? currentListing.quantity} Units Ready
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }}
                </State>
              </div>

              {/* STEP 2: CLIENT INFORMATION */}
              <div
                style={{
                  border: "1px solid rgba(23, 25, 21, 0.08)",
                  borderRadius: "16px",
                  padding: "1.35rem",
                  background: "#FAF9F5",
                  boxShadow: "0 2px 8px -2px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    fontSize: "0.95rem",
                  }}
                >
                  <User size={18} />
                  <span>2. Client / Seeker Contact Details *</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={labelStyle}>Client / Organization Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Patel / Nexus Events"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Primary Contact / Mobile Phone *</label>
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={labelStyle}>Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. ramesh@gmail.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>ID Proof / Verification (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Aadhaar / DL No. / GSTIN"
                      value={idProof}
                      onChange={(e) => setIdProof(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* STEP 3: RENTAL SCHEDULE & TIMELINE */}
              <div
                style={{
                  border: "1px solid rgba(23, 25, 21, 0.08)",
                  borderRadius: "16px",
                  padding: "1.35rem",
                  background: "#FAF9F5",
                  boxShadow: "0 2px 8px -2px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      fontSize: "0.95rem",
                    }}
                  >
                    <Clock size={18} />
                    <span>3. Rental Duration & Return Date *</span>
                  </div>

                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                    {[
                      { label: "+1 Day", days: 1 },
                      { label: "+3 Days", days: 3 },
                      { label: "+1 Wk", days: 7 },
                      { label: "+2 Wks", days: 14 },
                      { label: "+1 Mo", days: 30 },
                    ].map((p) => (
                      <button
                        type="button"
                        key={p.label}
                        onClick={() => setPresetDuration(p.days)}
                        style={{
                          background: "#fff",
                          border: "1px solid rgba(23, 25, 21, 0.15)",
                          borderRadius: "8px",
                          padding: "0.25rem 0.6rem",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          cursor: "pointer",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={labelStyle}>Handover Start Time *</label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Expected Return Time *</label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </div>
                </div>

                {durationInfo && (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      fontSize: "0.85rem",
                      color: "#155724",
                      background: "#D4EDDA",
                      padding: "0.4rem 0.75rem",
                      border: "1px solid #C3E6CB",
                      fontWeight: 700,
                      display: "inline-block",
                    }}
                  >
                    ⏱ Rental Duration: ~{durationInfo.totalDays} day(s) ({durationInfo.totalHours} hours)
                  </div>
                )}
              </div>

              {/* STEP 4: COMMERCIAL TERMS & PAYMENT */}
              <div
                style={{
                  border: "1px solid rgba(23, 25, 21, 0.08)",
                  borderRadius: "16px",
                  padding: "1.35rem",
                  background: "#FAF9F5",
                  boxShadow: "0 2px 8px -2px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    fontSize: "0.95rem",
                  }}
                >
                  <DollarSign size={18} />
                  <span>4. Units Count & Commercial Agreement *</span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div>
                    <label style={labelStyle}>
                      Quantity (Units) *{" "}
                      <span style={{ fontSize: "0.75rem", color: "#666" }}>
                        (Max {maxUnitsAvailable})
                      </span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={maxUnitsAvailable}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Agreed Total Rent (₹) *</label>
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={labelStyle}>Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="cash">Cash in hand</option>
                      <option value="upi">UPI / GPay / PhonePe</option>
                      <option value="bank_transfer">NEFT / Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="card">POS / Card</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="paid">Full Payment Received upfront</option>
                      <option value="deposit_only">Advance / Deposit Received</option>
                      <option value="pending">Pay upon Return Handover</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* STEP 5: NOTES & SPECIAL CONDITIONS */}
              <div>
                <label style={labelStyle}>Deal Notes & Handover Conditions (Optional)</label>
                <textarea
                  placeholder="e.g. Client picked up from warehouse; inspected in working order; fuel extra; driver delivery arranged..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* Submit Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "flex-end",
                  borderTop: "1px solid rgba(23, 25, 21, 0.1)",
                  paddingTop: "1.25rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/inventory")}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "#fff",
                    color: "#171915",
                    border: "1px solid rgba(23, 25, 21, 0.15)",
                    borderRadius: "12px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                    fontWeight: 800,
                    cursor: "pointer",
                    textTransform: "uppercase",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "0.75rem 1.75rem",
                    background: "#FFE66D",
                    color: "#171915",
                    border: "1px solid rgba(23, 25, 21, 0.2)",
                    borderRadius: "12px",
                    boxShadow: "0 4px 14px rgba(255, 230, 109, 0.45)",
                    fontWeight: 900,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.95rem",
                  }}
                >
                  <Zap size={18} />
                  {submitting ? "Booking & Locking Fleet..." : "✓ Confirm & Lock Fleet Units"}
                </button>
              </div>
            </form>
          </div>

          {/* Sticky Summary Card */}
          <div
            style={{
              background: "#FFFDF8",
              border: "1px solid rgba(23, 25, 21, 0.1)",
              borderRadius: "20px",
              boxShadow: "0 8px 24px -4px rgba(0,0,0,0.06)",
              padding: "1.75rem",
              position: "sticky",
              top: "1.5rem",
            }}
          >
            <h3
              style={{
                margin: "0 0 1rem",
                fontSize: "1.1rem",
                fontWeight: 900,
                textTransform: "uppercase",
                borderBottom: "1px solid rgba(23, 25, 21, 0.1)",
                paddingBottom: "0.6rem",
              }}
            >
              Deal Summary & Telemetry
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.9rem" }}>
              <div>
                <span style={{ color: "#666", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>
                  Selected Asset
                </span>
                <div style={{ fontWeight: 800, fontSize: "1rem" }}>
                  {currentListing ? currentListing.title : "No asset selected"}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.5rem 0",
                  borderBottom: "1px dashed rgba(23, 25, 21, 0.12)",
                }}
              >
                <span>Units to Lock:</span>
                <strong>{quantity} unit(s)</strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.5rem 0",
                  borderBottom: "1px dashed rgba(23, 25, 21, 0.12)",
                }}
              >
                <span>Client Name:</span>
                <strong>{clientName || "—"}</strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.5rem 0",
                  borderBottom: "1px dashed rgba(23, 25, 21, 0.12)",
                }}
              >
                <span>Rental Duration:</span>
                <strong>{durationInfo ? `~${durationInfo.totalDays} day(s)` : "1 day"}</strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.5rem 0",
                  borderBottom: "1px dashed rgba(23, 25, 21, 0.12)",
                }}
              >
                <span>Agreed Rent:</span>
                <strong style={{ color: "#155724", fontSize: "1.05rem" }}>
                  {money(Number(price) || 0)}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.5rem 0",
                  borderBottom: "1px solid rgba(23, 25, 21, 0.15)",
                }}
              >
                <span>Security Deposit:</span>
                <strong>{money(Number(deposit) || 0)}</strong>
              </div>

              <div
                style={{
                  background: "#FFE66D",
                  border: "1px solid rgba(23, 25, 21, 0.15)",
                  borderRadius: "14px",
                  boxShadow: "0 4px 12px rgba(255, 230, 109, 0.35)",
                  padding: "0.85rem 1rem",
                  fontWeight: 800,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Total Collection:</span>
                <span style={{ fontSize: "1.15rem" }}>
                  {money((Number(price) || 0) + (Number(deposit) || 0))}
                </span>
              </div>

              {/* Notification Guarantee Card */}
              <div
                style={{
                  marginTop: "0.5rem",
                  background: "#ECFDF5",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: "14px",
                  padding: "0.85rem 1rem",
                  fontSize: "0.8rem",
                  lineHeight: "1.4",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)",
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.35rem", color: "#065F46" }}>
                  <Shield size={14} /> Automated Return Alert
                </div>
                <span style={{ color: "#047857" }}>
                  Utlio&apos;s background scheduler will monitor this booking and send you a notification when the rental expires so you can inspect the returned asset and immediately repost it.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "0.78rem",
  fontWeight: 800,
  textTransform: "uppercase",
  marginBottom: "0.35rem",
  letterSpacing: "0.3px",
  color: "#374151",
};

const inputStyle = {
  width: "100%",
  padding: "0.65rem 0.85rem",
  border: "1.5px solid rgba(23, 25, 21, 0.15)",
  borderRadius: "12px",
  fontWeight: 600,
  fontSize: "0.9rem",
  background: "#fff",
  boxSizing: "border-box",
  outline: "none",
  transition: "all 0.15s ease",
};
