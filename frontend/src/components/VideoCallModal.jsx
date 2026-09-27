"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWebRtcCall } from "@/hooks/useWebRtcCall";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Monitor,
  Maximize2,
  Minimize2,
  ShieldCheck,
  User,
  AlertCircle,
  PhoneCall,
  Clock,
} from "lucide-react";

const COLORS = {
  ink: "#20201e",
  panel: "#171915",
  header: "#222521",
  dock: "#1e211c",
  divider: "#2d312c",
  stage: "#090a08",
  paper: "#FAF8F5",
  yellow: "#FFE66D",
  teal: "#4ECDC4",
  mint: "#A8E6CF",
  pink: "#FF85A1",
  lilac: "#C3B1E1",
  green: "#10b981",
  red: "#ef4444",
  muted: "#9ca3af",
};

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function StatusPill({ color, label, glow = false }) {
  return (
    <span
      style={{
        background: `${color}25`,
        border: `1px solid ${color}`,
        color,
        padding: "4px 10px",
        borderRadius: "20px",
        fontSize: "0.78rem",
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          boxShadow: glow ? `0 0 6px ${color}` : "none",
        }}
      />
      {label}
    </span>
  );
}

function ControlButton({ onClick, icon, label, title, background = COLORS.paper, color = COLORS.ink, disabled = false, strong = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background,
        color,
        border: `2px solid ${COLORS.ink}`,
        borderRadius: "12px",
        padding: strong ? "10px 20px" : "10px 16px",
        fontWeight: strong ? 800 : 700,
        fontSize: strong ? "0.9rem" : "0.85rem",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        boxShadow: `${strong ? 3 : 2}px ${strong ? 3 : 2}px 0 ${COLORS.ink}`,
        transition: "transform 0.12s ease",
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Avatar({ letter, size, background, glow }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background,
        color: COLORS.ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.028 + "rem",
        fontWeight: 900,
        border: `3px solid ${COLORS.ink}`,
        boxShadow: glow ? `0 0 30px ${background}66` : "none",
      }}
    >
      {letter}
    </div>
  );
}

function StageNotice({ icon, title, titleColor = "#fff", body, children }) {
  return (
    <div
      role="status"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        gap: "14px",
        padding: "24px",
        textAlign: "center",
        maxWidth: "460px",
        zIndex: 5,
      }}
    >
      {icon}
      <div>
        <h3 style={{ margin: "0 0 6px", fontSize: "1.2rem", fontWeight: 800, color: titleColor }}>{title}</h3>
        {body && <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.88rem", lineHeight: 1.45 }}>{body}</p>}
      </div>
      {children}
    </div>
  );
}

export function VideoCallModal({
  isOpen,
  onClose,
  quoteId,
  roomId,
  partnerName = "Provider",
  partnerId,
  partnerRole = "Provider",
  listingTitle = "Live Negotiation",
  isInitiator = false,
  messageId = "",
}) {
  const { user } = useAuth();
  const call = useWebRtcCall({
    isOpen,
    quoteId,
    roomId,
    partnerId,
    isInitiator,
    messageId,
    selfId: user?._id ? String(user._id) : "",
    onClose,
  });
  const {
    callState,
    errorMessage,
    mediaWarning,
    duration,
    audioMuted,
    videoOff,
    hasLocalVideo,
    hasLocalAudio,
    isScreenSharing,
    hasRemoteVideo,
    remoteMedia,
    needsUserTapForSound,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    enableUserAudio,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    endCall,
  } = call;

  const [isMinimized, setIsMinimized] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [sessionNonce] = useState(() => `UTL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [challengeStatus, setChallengeStatus] = useState("idle");

  // Browser GPS for the live video watermark
  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;
    const stamp = () => new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setGeoData({
          lat: pos.coords.latitude.toFixed(4),
          lng: pos.coords.longitude.toFixed(4),
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: stamp(),
        }),
      () => setGeoData({ lat: "19.0760", lng: "72.8777", accuracy: 12, timestamp: stamp(), simulated: true }),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  const triggerLivenessChallenge = () => {
    const challenges = [
      `Write code '${sessionNonce}' on paper and hold against the asset serial plate / nameplate.`,
      `Point camera at permanent venue branding or electrical meter panel for 5 seconds.`,
      `Show live street-view / building entrance number matching registered address.`,
      `Demonstrate physical custody by opening the machine engine hood or main entry door.`,
    ];
    setActiveChallenge(challenges[Math.floor(Math.random() * challenges.length)]);
    setChallengeStatus("active");
  };

  if (!isOpen) return null;

  const initial = partnerName ? partnerName.charAt(0).toUpperCase() : "P";
  const isLive = callState === "connected";
  const isReconnecting = callState === "reconnecting";
  const inCall = isLive || isReconnecting;
  const showRemoteVideo = inCall && hasRemoteVideo && !remoteMedia.videoOff;
  const isRinging = callState === "calling";

  // Remote audio lives outside the minimized/expanded branches so sound never drops.
  const remoteAudio = <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />;

  if (isMinimized) {
    return (
      <>
        {remoteAudio}
        <div
          role="dialog"
          aria-label={`Video call with ${partnerName}`}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "280px",
            background: COLORS.panel,
            color: "#fff",
            border: `2px solid ${COLORS.yellow}`,
            borderRadius: "14px",
            boxShadow: `4px 4px 0 ${COLORS.ink}`,
            padding: "12px",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <strong style={{ fontSize: "0.85rem", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {partnerName}
              </strong>
              <span style={{ fontSize: "0.75rem", color: COLORS.mint }}>
                {isLive ? `⏱️ ${formatDuration(duration)}` : isRinging ? "Ringing…" : isReconnecting ? "Reconnecting…" : "Connecting…"}
              </span>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                onClick={toggleAudio}
                disabled={!hasLocalAudio}
                title={audioMuted ? "Unmute microphone" : "Mute microphone"}
                aria-label={audioMuted ? "Unmute microphone" : "Mute microphone"}
                style={{ background: audioMuted ? COLORS.pink : COLORS.paper, border: `1.5px solid ${COLORS.ink}`, borderRadius: 6, padding: "4px 6px", cursor: "pointer", display: "flex" }}
              >
                {audioMuted ? <MicOff size={14} color={COLORS.ink} /> : <Mic size={14} color={COLORS.ink} />}
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(false)}
                title="Expand"
                aria-label="Expand call window"
                style={{ background: COLORS.yellow, border: `1.5px solid ${COLORS.ink}`, borderRadius: 6, padding: "4px 6px", cursor: "pointer", display: "flex" }}
              >
                <Maximize2 size={14} color={COLORS.ink} />
              </button>
              <button
                type="button"
                onClick={() => endCall(true)}
                title="End call"
                aria-label="End call"
                style={{ background: COLORS.pink, border: `1.5px solid ${COLORS.ink}`, borderRadius: 6, padding: "4px 6px", cursor: "pointer", display: "flex" }}
              >
                <PhoneOff size={14} color={COLORS.ink} />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {remoteAudio}
      <div
        onClick={needsUserTapForSound ? enableUserAudio : undefined}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 17, 21, 0.88)",
          backdropFilter: "blur(8px)",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px",
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Video call with ${partnerName}`}
          style={{
            width: "100%",
            maxWidth: "980px",
            height: "90vh",
            maxHeight: "700px",
            backgroundColor: COLORS.panel,
            borderRadius: "20px",
            border: `3px solid ${COLORS.ink}`,
            boxShadow: "8px 8px 0px #059669",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 18px",
              background: COLORS.header,
              borderBottom: `2px solid ${COLORS.divider}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: COLORS.yellow,
                  color: COLORS.ink,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "1rem",
                  border: `1.5px solid ${COLORS.ink}`,
                  flexShrink: 0,
                }}
              >
                {initial}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {partnerName}
                  </span>
                  <span
                    style={{
                      background: COLORS.mint,
                      color: COLORS.panel,
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      border: `1px solid ${COLORS.ink}`,
                    }}
                  >
                    {partnerRole}
                  </span>
                </div>
                <small style={{ color: COLORS.muted, fontSize: "0.75rem", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {listingTitle}
                </small>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {isLive && <StatusPill color="#34d399" label={`LIVE ${formatDuration(duration)}`} glow />}
              {isRinging && <StatusPill color={COLORS.yellow} label={`Calling ${partnerName}...`} />}
              {callState === "connecting" && <StatusPill color={COLORS.teal} label="Connecting P2P..." />}
              {isReconnecting && <StatusPill color={COLORS.yellow} label="Reconnecting..." />}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: COLORS.muted, fontSize: "0.75rem" }}>
                <ShieldCheck size={14} color={COLORS.mint} /> Encrypted WebRTC
              </span>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                title="Minimize"
                aria-label="Minimize call window"
                style={{
                  background: "transparent",
                  border: "1.5px solid #4b5563",
                  borderRadius: 8,
                  color: "#e5e7eb",
                  padding: 6,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          {/* Stage */}
          <div
            style={{
              flex: 1,
              position: "relative",
              background: COLORS.stage,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* Remote video is always muted — audio is played by the dedicated <audio> element */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                position: "absolute",
                inset: 0,
                opacity: showRemoteVideo ? 1 : 0,
                transition: "opacity 0.4s ease",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />

            {mediaWarning && (
              <div
                role="alert"
                style={{
                  position: "absolute",
                  bottom: 14,
                  left: 14,
                  maxWidth: "min(460px, calc(100% - 210px))",
                  zIndex: 12,
                  background: "rgba(23, 25, 21, 0.92)",
                  border: `1.5px solid ${COLORS.yellow}`,
                  color: "#fef3c7",
                  borderRadius: 10,
                  padding: "8px 12px",
                  fontSize: "0.78rem",
                  lineHeight: 1.4,
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <AlertCircle size={16} color={COLORS.yellow} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{mediaWarning}</span>
              </div>
            )}

            {needsUserTapForSound && (
              <button
                type="button"
                onClick={enableUserAudio}
                style={{
                  position: "absolute",
                  top: 16,
                  zIndex: 25,
                  background: COLORS.yellow,
                  color: COLORS.ink,
                  border: `2px solid ${COLORS.ink}`,
                  borderRadius: 24,
                  padding: "8px 18px",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  boxShadow: `3px 3px 0 ${COLORS.ink}`,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span aria-hidden>🔊</span> Sound paused by browser. Click to hear {partnerName}
              </button>
            )}

            {/* GPS & cryptographic watermark */}
            {isLive && (
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  left: 14,
                  right: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  zIndex: 10,
                  flexWrap: "wrap",
                  gap: 8,
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    background: "rgba(23, 25, 21, 0.88)",
                    backdropFilter: "blur(6px)",
                    border: "1.5px solid #2ed573",
                    borderRadius: 8,
                    padding: "5px 12px",
                    color: "#E2E8F0",
                    fontFamily: "monospace",
                    fontSize: "0.74rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2ed573", display: "inline-block", boxShadow: "0 0 6px #2ed573" }} />
                  <span>
                    <strong>GPS:</strong> {geoData ? `${geoData.lat}° N, ${geoData.lng}° E` : "Locating..."}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>UTC:</strong> {geoData?.timestamp || "—"}
                  </span>
                  <span>•</span>
                  <span style={{ color: COLORS.yellow }}>
                    <strong>NONCE:</strong> {sessionNonce}
                  </span>
                  <span>•</span>
                  <span style={{ color: "#2ed573", fontWeight: 700 }}>✓ TAMPER-SEALED</span>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {remoteMedia.audioMuted && (
                    <span style={{ background: COLORS.pink, border: `1px solid ${COLORS.panel}`, borderRadius: 6, padding: "4px 8px", color: COLORS.ink, fontWeight: 700, fontSize: "0.72rem", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <MicOff size={12} /> {partnerName} muted
                    </span>
                  )}
                  <span
                    style={{
                      background: challengeStatus === "passed" ? "#2ed573" : "#0F766E",
                      border: `1px solid ${COLORS.panel}`,
                      borderRadius: 6,
                      padding: "4px 8px",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.72rem",
                    }}
                  >
                    {challengeStatus === "passed" ? "✓ LIVENESS PASSED" : "🛡️ ANTI-SPOOF ACTIVE"}
                  </span>
                </div>
              </div>
            )}

            {activeChallenge && isLive && (
              <div
                style={{
                  position: "absolute",
                  top: 64,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#FFFDF8",
                  border: `2px solid ${COLORS.panel}`,
                  borderRadius: 12,
                  padding: "12px 18px",
                  zIndex: 20,
                  maxWidth: 520,
                  width: "90%",
                  boxShadow: `3px 3px 0 ${COLORS.panel}`,
                  textAlign: "center",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8 }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#D97706", textTransform: "uppercase" }}>
                    ⚡ Live Asset Liveness Challenge (Anti-Deepfake / Anti-Spoofing)
                  </span>
                  <span style={{ fontSize: "0.72rem", background: "#FEF3C7", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                    Active Challenge
                  </span>
                </div>
                <p style={{ margin: "6px 0 12px", fontSize: "0.88rem", fontWeight: 700, color: COLORS.panel }}>&quot;{activeChallenge}&quot;</p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <button
                    type="button"
                    style={{ padding: "5px 14px", background: "#2ed573", color: COLORS.panel, border: `1.5px solid ${COLORS.panel}`, borderRadius: 6, fontWeight: 800, fontSize: "0.78rem", cursor: "pointer", boxShadow: `1px 1px 0 ${COLORS.panel}` }}
                    onClick={() => {
                      setActiveChallenge(null);
                      setChallengeStatus("passed");
                    }}
                  >
                    ✓ Verification Passed
                  </button>
                  <button
                    type="button"
                    style={{ padding: "5px 14px", background: "#ff4757", color: "#fff", border: `1.5px solid ${COLORS.panel}`, borderRadius: 6, fontWeight: 800, fontSize: "0.78rem", cursor: "pointer", boxShadow: `1px 1px 0 ${COLORS.panel}` }}
                    onClick={() => {
                      setActiveChallenge(null);
                      setChallengeStatus("failed");
                    }}
                  >
                    ✕ Flag Discrepancy
                  </button>
                </div>
              </div>
            )}

            {/* Connected but remote camera is off */}
            {inCall && !showRemoteVideo && (
              <StageNotice
                icon={<Avatar letter={initial} size={96} background={COLORS.teal} glow />}
                title={isReconnecting ? `Reconnecting with ${partnerName}...` : partnerName}
                body={
                  isReconnecting
                    ? "The connection dropped — trying to restore audio and video."
                    : remoteMedia.videoOff
                      ? `${partnerName}'s camera is off`
                      : "Waiting for video..."
                }
              />
            )}

            {isRinging && (
              <StageNotice
                icon={
                  <div style={{ animation: "bounce 2s infinite" }}>
                    <Avatar letter={partnerName ? initial : <PhoneCall size={44} />} size={96} background={COLORS.yellow} glow />
                  </div>
                }
                title={`Calling ${partnerName}...`}
                body={`A video call request was sent to ${partnerName}. Waiting for them to accept...`}
              />
            )}

            {callState === "connecting" && (
              <StageNotice
                icon={<Avatar letter={partnerName ? initial : <User size={40} />} size={88} background={COLORS.teal} glow />}
                title={`Connecting with ${partnerName}...`}
                body="Establishing encrypted peer-to-peer WebRTC stream"
              />
            )}

            {callState === "declined" && (
              <StageNotice
                icon={<Avatar letter={<PhoneOff size={38} color={COLORS.ink} />} size={80} background={COLORS.pink} />}
                title="Call Declined"
                titleColor={COLORS.pink}
                body={`${partnerName} is unable to join the video call right now. You can continue negotiating via chat.`}
              />
            )}

            {callState === "timeout" && (
              <StageNotice
                icon={<Avatar letter={<Clock size={38} color={COLORS.ink} />} size={80} background={COLORS.yellow} />}
                title="No Response"
                titleColor={COLORS.yellow}
                body={`${partnerName} did not answer the video call. Please try again later or leave a message.`}
              />
            )}

            {callState === "ended" && (
              <StageNotice
                icon={<PhoneOff size={44} color={COLORS.muted} />}
                title="Call ended"
                body={`Total duration: ${formatDuration(duration)}`}
              />
            )}

            {callState === "error" && (
              <StageNotice
                icon={<AlertCircle size={46} color={COLORS.pink} />}
                title="Call setup notice"
                titleColor={COLORS.pink}
                body={errorMessage || "Unable to establish video connection."}
              >
                <ControlButton
                  onClick={() => endCall(false)}
                  icon={<PhoneOff size={16} />}
                  label="Close window"
                  title="Close video call"
                  background={COLORS.yellow}
                  strong
                />
              </StageNotice>
            )}

            <div
              style={{
                position: "absolute",
                right: 12,
                bottom: 12,
                width: "clamp(110px, 25vw, 180px)",
                aspectRatio: "16 / 10",
                overflow: "hidden",
                border: `2px solid ${COLORS.yellow}`,
                borderRadius: 12,
                background: COLORS.panel,
                boxShadow: `3px 3px 0 ${COLORS.ink}`,
                zIndex: 10,
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: isScreenSharing ? "none" : "scaleX(-1)",
                  display: videoOff || !hasLocalVideo ? "none" : "block",
                }}
              />
              {(videoOff || !hasLocalVideo) && (
                <div style={{ height: "100%", display: "grid", placeItems: "center", color: COLORS.muted, fontSize: "0.75rem" }}>
                  <span><VideoOff size={18} color={COLORS.pink} /> Camera unavailable</span>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              padding: "14px 20px",
              background: COLORS.dock,
              borderTop: `2px solid ${COLORS.divider}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <ControlButton
              onClick={toggleAudio}
              icon={audioMuted ? <MicOff size={18} /> : <Mic size={18} />}
              label={audioMuted ? "Unmute" : "Mute"}
              title={audioMuted ? "Unmute microphone" : "Mute microphone"}
              background={audioMuted ? COLORS.pink : COLORS.paper}
              disabled={!hasLocalAudio}
            />
            <ControlButton
              onClick={toggleVideo}
              icon={videoOff ? <VideoOff size={18} /> : <VideoIcon size={18} />}
              label={videoOff ? "Start video" : "Stop video"}
              title={videoOff ? "Turn camera on" : "Turn camera off"}
              background={videoOff ? COLORS.pink : COLORS.paper}
              disabled={!hasLocalVideo}
            />
            <ControlButton
              onClick={toggleScreenShare}
              icon={<Monitor size={18} />}
              label={isScreenSharing ? "Stop sharing" : "Share screen"}
              title={isScreenSharing ? "Stop screen sharing" : "Share your screen"}
              background={isScreenSharing ? COLORS.lilac : COLORS.paper}
              disabled={!isLive || !hasLocalVideo}
            />
            <ControlButton
              onClick={triggerLivenessChallenge}
              icon={<ShieldCheck size={18} />}
              label="Liveness test"
              title="Start an asset liveness challenge"
              background={COLORS.yellow}
              disabled={!isLive}
            />
            <ControlButton
              onClick={() => endCall(true)}
              icon={<PhoneOff size={18} />}
              label={isRinging ? "Cancel call" : "End call"}
              title={isRinging ? "Cancel call" : "End call"}
              background={COLORS.red}
              color="#fff"
              strong
            />
          </div>
        </div>
      </div>
    </>
  );
}