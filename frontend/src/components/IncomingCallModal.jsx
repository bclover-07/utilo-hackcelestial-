"use client";

import { useEffect, useState } from "react";
import { playRingTone, stopRingTone } from "@/lib/callSound";
import { PhoneCall, PhoneOff, Volume2, VolumeX, Video } from "lucide-react";

export function IncomingCallModal({ incomingCall, onAccept, onDecline }) {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (incomingCall) {
      if (!isMuted) {
        playRingTone();
      }
    } else {
      stopRingTone();
    }
    return () => {
      stopRingTone();
    };
  }, [incomingCall, isMuted]);

  if (!incomingCall) return null;

  const { caller, listingTitle } = incomingCall;

  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        right: "24px",
        zIndex: 999999,
        maxWidth: "420px",
        width: "calc(100vw - 48px)",
        animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div
        style={{
          background: "#FAF8F5",
          border: "3px solid #20201e",
          borderRadius: "18px",
          boxShadow: "6px 6px 0 #20201e",
          padding: "20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Animated Accent Banner */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg, #4ECDC4, #FFE66D, #FF85A1)",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                background: "#FFE66D",
                border: "1.5px solid #20201e",
                borderRadius: "8px",
                padding: "3px 8px",
                fontSize: "0.72rem",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Video size={13} /> INCOMING CALL
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isMuted) {
                setIsMuted(false);
                playRingTone();
              } else {
                setIsMuted(true);
                stopRingTone();
              }
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
            title={isMuted ? "Unmute Ringtone" : "Mute Ringtone"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "14px 0" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "#4ECDC4",
              color: "#20201e",
              border: "2.5px solid #20201e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "1.4rem",
              boxShadow: "2px 2px 0 #20201e",
              flexShrink: 0,
            }}
          >
            {caller?.name ? caller.name.charAt(0).toUpperCase() : "S"}
          </div>

          <div>
            <h4 style={{ margin: "0 0 2px", fontSize: "1.05rem", fontWeight: 800, color: "#20201e" }}>
              {caller?.name || "Booking Partner"}
            </h4>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#555", lineHeight: 1.3 }}>
              Requesting live video negotiation for:
            </p>
            <strong style={{ fontSize: "0.85rem", color: "#20201e" }}>
              {listingTitle || "Marketplace Asset"}
            </strong>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px" }}>
          <button
            type="button"
            onClick={() => {
              stopRingTone();
              onDecline(incomingCall);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "#FAF8F5",
              color: "#ef4444",
              border: "2px solid #20201e",
              borderRadius: "12px",
              padding: "10px 14px",
              fontWeight: 800,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "2px 2px 0 #20201e",
            }}
          >
            <PhoneOff size={16} />
            <span>Decline</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopRingTone();
              onAccept(incomingCall);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "#10b981",
              color: "#fff",
              border: "2px solid #20201e",
              borderRadius: "12px",
              padding: "10px 14px",
              fontWeight: 800,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "2px 2px 0 #20201e",
            }}
          >
            <PhoneCall size={16} />
            <span>Accept Call</span>
          </button>
        </div>
      </div>
    </div>
  );
}
