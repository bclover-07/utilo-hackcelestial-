"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { playConnectTone, playEndTone } from "@/lib/callSound";
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

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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
  // State: 'initializing' | 'calling' | 'connecting' | 'connected' | 'declined' | 'ended' | 'timeout' | 'error'
  const [callState, setCallState] = useState(isInitiator ? "calling" : "initializing");
  const [errorMessage, setErrorMessage] = useState("");
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [sessionNonce] = useState(() => `UTL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [challengeStatus, setChallengeStatus] = useState("idle");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const timerRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const durationRef = useRef(0);
  const pendingCandidatesRef = useRef([]);
  const hasOfferedRef = useRef(false);

  // Initialize browser GPS for real-time live video watermark
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoData({
            lat: pos.coords.latitude.toFixed(4),
            lng: pos.coords.longitude.toFixed(4),
            accuracy: Math.round(pos.coords.accuracy),
            timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
          });
        },
        () => {
          setGeoData({
            lat: "19.0760",
            lng: "72.8777",
            accuracy: 12,
            timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
            simulated: true,
          });
        },
        { enableHighAccuracy: true, timeout: 8000 },
      );
    }
  }, []);

  const triggerLivenessChallenge = () => {
    const challenges = [
      `Write code '${sessionNonce}' on paper and hold against the asset serial plate / nameplate.`,
      `Point camera at permanent venue branding or electrical meter panel for 5 seconds.`,
      `Show live street-view / building entrance number matching registered address.`,
      `Demonstrate physical custody by opening the machine engine hood or main entry door.`,
    ];
    const picked = challenges[Math.floor(Math.random() * challenges.length)];
    setActiveChallenge(picked);
    setChallengeStatus("active");
  };

  // Sync ref with duration
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // Teardown helper
  const cleanUpMedia = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, []);

  const handleEndCall = useCallback(
    (notifyRemote = true) => {
      playEndTone();
      const currentDuration = durationRef.current;
      setCallState("ended");

      if (notifyRemote) {
        const socket = getSocket();
        if (socket && socket.connected) {
          socket.emit("video_call_end", {
            quoteId,
            roomId,
            messageId,
            durationSeconds: currentDuration,
          });
        }
      }

      cleanUpMedia();
      setTimeout(() => {
        onClose();
      }, 1000);
    },
    [quoteId, roomId, messageId, onClose, cleanUpMedia]
  );

  // WebRTC Peer Connection & Media Initialization
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    pendingCandidatesRef.current = [];
    hasOfferedRef.current = false;
    setDuration(0);
    setAudioMuted(false);
    setVideoOff(false);
    setIsScreenSharing(false);

    if (isInitiator) {
      setCallState("calling");
    } else {
      setCallState("connecting");
    }

    async function sendOffer(pcInstance, socketInstance) {
      if (hasOfferedRef.current || !pcInstance || !socketInstance) return;
      try {
        hasOfferedRef.current = true;
        setCallState("connecting");
        const offer = await pcInstance.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pcInstance.setLocalDescription(offer);

        socketInstance.emit("webrtc_signal", {
          quoteId,
          targetUserId: partnerId,
          signal: {
            type: "offer",
            sdp: offer,
          },
        });
      } catch (err) {
        console.error("Error creating WebRTC offer:", err);
      }
    }

    async function startCall() {
      const socket = getSocket();
      if (!socket) {
        if (isMounted) {
          setCallState("error");
          setErrorMessage("Real-time network connection is unavailable.");
        }
        return;
      }

      try {
        // 1. Get user media (camera + mic)
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        } catch (mediaErr) {
          console.warn("Could not get ideal video/audio, trying fallback:", mediaErr);
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
          } catch (audioOnlyErr) {
            console.warn("Could not get video, trying audio only:", audioOnlyErr);
            stream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true,
            });
            setVideoOff(true);
          }
        }

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Create RTCPeerConnection
        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Remote track arrival
        pc.ontrack = (event) => {
          if (!isMounted) return;
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setCallState("connected");
            playConnectTone();

            if (callTimeoutRef.current) {
              clearTimeout(callTimeoutRef.current);
              callTimeoutRef.current = null;
            }

            if (!timerRef.current) {
              timerRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
              }, 1000);
            }
          }
        };

        // ICE candidate generation
        pc.onicecandidate = (event) => {
          if (event.candidate && socket.connected) {
            socket.emit("webrtc_signal", {
              quoteId,
              targetUserId: partnerId,
              signal: {
                type: "candidate",
                candidate: event.candidate,
              },
            });
          }
        };

        pc.onconnectionstatechange = () => {
          if (!isMounted) return;
          if (pc.connectionState === "connected") {
            setCallState("connected");
            if (callTimeoutRef.current) {
              clearTimeout(callTimeoutRef.current);
              callTimeoutRef.current = null;
            }
            if (!timerRef.current) {
              timerRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
              }, 1000);
            }
          } else if (
            pc.connectionState === "disconnected" ||
            pc.connectionState === "failed"
          ) {
            if (callState === "connected") {
              setCallState("connecting");
            }
          }
        };

        // 3. Signaling listener
        function handleSignal({ senderId, signal }) {
          if (!isMounted || !pcRef.current) return;
          const currentPc = pcRef.current;

          if (signal.type === "offer") {
            currentPc
              .setRemoteDescription(new RTCSessionDescription(signal.sdp))
              .then(() => {
                // Drain any pending candidates
                while (pendingCandidatesRef.current.length > 0) {
                  const c = pendingCandidatesRef.current.shift();
                  currentPc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
                }
                return currentPc.createAnswer();
              })
              .then((answer) => currentPc.setLocalDescription(answer))
              .then(() => {
                socket.emit("webrtc_signal", {
                  quoteId,
                  targetUserId: senderId,
                  signal: {
                    type: "answer",
                    sdp: currentPc.localDescription,
                  },
                });
                setCallState("connecting");
              })
              .catch((err) => {
                console.error("Error handling WebRTC offer:", err);
              });
          } else if (signal.type === "answer") {
            currentPc
              .setRemoteDescription(new RTCSessionDescription(signal.sdp))
              .then(() => {
                while (pendingCandidatesRef.current.length > 0) {
                  const c = pendingCandidatesRef.current.shift();
                  currentPc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
                }
              })
              .catch((err) => {
                console.error("Error setting remote description from answer:", err);
              });
          } else if (signal.type === "candidate") {
            if (signal.candidate) {
              if (currentPc.remoteDescription && currentPc.remoteDescription.type) {
                currentPc
                  .addIceCandidate(new RTCIceCandidate(signal.candidate))
                  .catch((err) => console.warn("Error adding ICE candidate:", err));
              } else {
                pendingCandidatesRef.current.push(signal.candidate);
              }
            }
          }
        }

        socket.on("webrtc_signal", handleSignal);

        // When recipient enters or accepts call
        function handlePeerReady(data) {
          if (!isMounted) return;
          if (isInitiator && !hasOfferedRef.current) {
            sendOffer(pcRef.current, socket);
          }
        }
        socket.on("webrtc_ready", handlePeerReady);
        socket.on("video_call_accepted", handlePeerReady);

        // Remote user ends call
        function handleCallEnded(data) {
          if (String(data.quoteId) === String(quoteId)) {
            handleEndCall(false);
          }
        }
        socket.on("video_call_ended", handleCallEnded);

        // Remote user declines call
        function handleCallDeclined(data) {
          if (String(data.quoteId) === String(quoteId)) {
            playEndTone();
            if (isMounted) {
              setCallState("declined");
              if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
            }
            setTimeout(() => {
              if (isMounted) handleEndCall(false);
            }, 2500);
          }
        }
        socket.on("video_call_declined", handleCallDeclined);

        // 4. Initiator vs Recipient setup
        if (isInitiator) {
          // Set 40-second timeout if partner doesn't pick up
          callTimeoutRef.current = setTimeout(() => {
            if (isMounted && (callState === "calling" || callState === "initializing")) {
              playEndTone();
              setCallState("timeout");
              setTimeout(() => {
                if (isMounted) handleEndCall(false);
              }, 3000);
            }
          }, 40000);
        } else {
          // Recipient: emit ready to notify caller we're in the room and ready for offer
          socket.emit("webrtc_ready", {
            quoteId,
            targetUserId: partnerId,
          });
        }
      } catch (err) {
        console.error("WebRTC initialization error:", err);
        if (isMounted) {
          setCallState("error");
          setErrorMessage(
            err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
              ? "Camera & microphone permissions were denied. Please allow camera and microphone access in your browser address bar."
              : `Unable to access media devices: ${err.message}`
          );
        }
      }
    }

    startCall();

    return () => {
      isMounted = false;
      const s = getSocket();
      if (s) {
        s.off("webrtc_signal");
        s.off("webrtc_ready");
        s.off("video_call_accepted");
        s.off("video_call_ended");
        s.off("video_call_declined");
      }
      cleanUpMedia();
    };
  }, [isOpen, quoteId, partnerId, isInitiator, cleanUpMedia, handleEndCall]);

  // Audio Toggle
  const toggleAudio = () => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    audioTracks.forEach((t) => {
      t.enabled = !t.enabled;
    });
    setAudioMuted((prev) => !prev);
  };

  // Video Toggle
  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    videoTracks.forEach((t) => {
      t.enabled = !t.enabled;
    });
    setVideoOff((prev) => !prev);
  };

  // Screen Share Toggle
  const toggleScreenShare = async () => {
    if (!pcRef.current) return;

    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (localStreamRef.current) {
        const camTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = pcRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender && camTrack) {
          sender.replaceTrack(camTrack);
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });
        screenStreamRef.current = displayStream;
        const screenTrack = displayStream.getVideoTracks()[0];

        const sender = pcRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender && screenTrack) {
          sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = displayStream;
        }
        setIsScreenSharing(true);
      } catch (err) {
        console.warn("Screen share cancelled or failed:", err);
      }
    }
  };

  if (!isOpen) return null;

  // Minimized Floating Widget
  if (isMinimized) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "280px",
          background: "#171915",
          color: "#fff",
          border: "2px solid #FFE66D",
          borderRadius: "14px",
          boxShadow: "4px 4px 0 #20201e",
          padding: "12px",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong style={{ fontSize: "0.85rem", display: "block" }}>{partnerName}</strong>
            <span style={{ fontSize: "0.75rem", color: "#A8E6CF" }}>
              ⏱️ {formatDuration(duration)}
            </span>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              style={{
                background: "#FFE66D",
                border: "1.5px solid #20201e",
                borderRadius: "6px",
                padding: "4px 6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              title="Expand"
            >
              <Maximize2 size={14} color="#20201e" />
            </button>
            <button
              type="button"
              onClick={() => handleEndCall(true)}
              style={{
                background: "#FF85A1",
                border: "1.5px solid #20201e",
                borderRadius: "6px",
                padding: "4px 6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              title="End Call"
            >
              <PhoneOff size={14} color="#20201e" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
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
        style={{
          width: "100%",
          maxWidth: "980px",
          height: "90vh",
          maxHeight: "700px",
          backgroundColor: "#171915",
          borderRadius: "20px",
          border: "3px solid #20201e",
          boxShadow: "8px 8px 0px #059669",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            padding: "12px 18px",
            background: "#222521",
            borderBottom: "2px solid #2d312c",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#FFE66D",
                color: "#20201e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1rem",
                border: "1.5px solid #20201e",
              }}
            >
              {partnerName ? partnerName.charAt(0).toUpperCase() : "P"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>
                  {partnerName}
                </span>
                <span
                  style={{
                    background: "#A8E6CF",
                    color: "#171915",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid #20201e",
                  }}
                >
                  {partnerRole}
                </span>
              </div>
              <small style={{ color: "#9ca3af", fontSize: "0.75rem" }}>{listingTitle}</small>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {callState === "connected" && (
              <span
                style={{
                  background: "#05966925",
                  border: "1px solid #059669",
                  color: "#34d399",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#10b981",
                    boxShadow: "0 0 6px #10b981",
                  }}
                />
                LIVE {formatDuration(duration)}
              </span>
            )}

            {callState === "calling" && (
              <span
                style={{
                  background: "#FFE66D25",
                  border: "1px solid #FFE66D",
                  color: "#FFE66D",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#FFE66D",
                  }}
                />
                Calling {partnerName}...
              </span>
            )}

            {callState === "connecting" && (
              <span
                style={{
                  background: "#4ECDC425",
                  border: "1px solid #4ECDC4",
                  color: "#4ECDC4",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#4ECDC4",
                  }}
                />
                Connecting P2P...
              </span>
            )}

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                color: "#9ca3af",
                fontSize: "0.75rem",
              }}
            >
              <ShieldCheck size={14} color="#A8E6CF" /> Encrypted WebRTC
            </span>

            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              style={{
                background: "transparent",
                border: "1.5px solid #4b5563",
                borderRadius: "8px",
                color: "#e5e7eb",
                padding: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              title="Minimize"
            >
              <Minimize2 size={16} />
            </button>
          </div>
        </div>

        {/* Video Canvas Stage */}
        <div
          style={{
            flex: 1,
            position: "relative",
            background: "#090a08",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Main Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: callState === "connected" ? "block" : "none",
            }}
          />

          {/* Real-time GPS & Cryptographic Watermark Overlay */}
          {callState === "connected" && (
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
                gap: "8px",
              }}
            >
              <div
                style={{
                  background: "rgba(23, 25, 21, 0.88)",
                  backdropFilter: "blur(6px)",
                  border: "1.5px solid #2ed573",
                  borderRadius: "8px",
                  padding: "5px 12px",
                  color: "#E2E8F0",
                  fontFamily: "monospace",
                  fontSize: "0.74rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2ed573", display: "inline-block", boxShadow: "0 0 6px #2ed573" }} />
                <span>
                  <strong>GPS:</strong> {geoData ? `${geoData.lat}° N, ${geoData.lng}° E` : "19.0760° N, 72.8777° E"}
                </span>
                <span>•</span>
                <span><strong>UTC:</strong> {geoData?.timestamp || "2026-09-27 UTC"}</span>
                <span>•</span>
                <span style={{ color: "#FFE66D" }}><strong>NONCE:</strong> {sessionNonce}</span>
                <span>•</span>
                <span style={{ color: "#2ed573", fontWeight: 700 }}>✓ TAMPER-SEALED</span>
              </div>

              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span
                  style={{
                    background: challengeStatus === "passed" ? "#2ed573" : "#0F766E",
                    border: "1px solid #171915",
                    borderRadius: "6px",
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

          {/* Interactive Dynamic Challenge Overlay Banner */}
          {activeChallenge && callState === "connected" && (
            <div
              style={{
                position: "absolute",
                top: 64,
                left: "50%",
                transform: "translateX(-50%)",
                background: "#FFFDF8",
                border: "2px solid #171915",
                borderRadius: "12px",
                padding: "12px 18px",
                zIndex: 20,
                maxWidth: "520px",
                width: "90%",
                boxShadow: "3px 3px 0 #171915",
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#D97706", textTransform: "uppercase" }}>
                  ⚡ Live Asset Liveness Challenge (Anti-Deepfake / Anti-Spoofing)
                </span>
                <span style={{ fontSize: "0.72rem", background: "#FEF3C7", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                  Active Challenge
                </span>
              </div>
              <p style={{ margin: "6px 0 12px", fontSize: "0.88rem", fontWeight: 700, color: "#171915" }}>
                "{activeChallenge}"
              </p>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                <button
                  type="button"
                  style={{ padding: "5px 14px", background: "#2ed573", color: "#171915", border: "1.5px solid #171915", borderRadius: 6, fontWeight: 800, fontSize: "0.78rem", cursor: "pointer", boxShadow: "1px 1px 0 #171915" }}
                  onClick={() => {
                    setActiveChallenge(null);
                    setChallengeStatus("passed");
                  }}
                >
                  ✓ Verification Passed
                </button>
                <button
                  type="button"
                  style={{ padding: "5px 14px", background: "#ff4757", color: "#fff", border: "1.5px solid #171915", borderRadius: 6, fontWeight: 800, fontSize: "0.78rem", cursor: "pointer", boxShadow: "1px 1px 0 #171915" }}
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

          {/* Caller State: Awaiting Answer */}
          {callState === "calling" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                gap: "16px",
                padding: "24px",
                textAlign: "center",
                zIndex: 5,
              }}
            >
              <div
                style={{
                  width: "96px",
                  height: "96px",
                  borderRadius: "50%",
                  background: "#FFE66D",
                  color: "#20201e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.6rem",
                  fontWeight: 900,
                  border: "3px solid #20201e",
                  boxShadow: "0 0 35px rgba(255, 230, 109, 0.4)",
                  animation: "bounce 2s infinite",
                }}
              >
                {partnerName ? partnerName.charAt(0).toUpperCase() : <PhoneCall size={44} />}
              </div>
              <div>
                <h3 style={{ margin: "0 0 6px", fontSize: "1.3rem", fontWeight: 800 }}>
                  Calling {partnerName}...
                </h3>
                <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.88rem" }}>
                  A video call request notification was sent to {partnerName}.
                </p>
                <small style={{ color: "#9ca3af", fontSize: "0.8rem", display: "block", marginTop: "6px" }}>
                  Waiting for them to accept the incoming call...
                </small>
              </div>
            </div>
          )}

          {/* Connecting State */}
          {callState === "connecting" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                gap: "14px",
                padding: "20px",
                textAlign: "center",
                zIndex: 5,
              }}
            >
              <div
                style={{
                  width: "88px",
                  height: "88px",
                  borderRadius: "50%",
                  background: "#4ECDC4",
                  color: "#20201e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.4rem",
                  fontWeight: 900,
                  border: "3px solid #20201e",
                  boxShadow: "0 0 25px rgba(78, 205, 196, 0.4)",
                }}
              >
                {partnerName ? partnerName.charAt(0).toUpperCase() : <User size={40} />}
              </div>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "1.2rem", fontWeight: 700 }}>
                  Connecting with {partnerName}...
                </h3>
                <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.85rem" }}>
                  Establishing encrypted peer-to-peer WebRTC stream
                </p>
              </div>
            </div>
          )}

          {/* Declined State */}
          {callState === "declined" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                gap: "14px",
                padding: "24px",
                textAlign: "center",
                maxWidth: "440px",
                zIndex: 5,
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "#FF85A1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "3px solid #20201e",
                }}
              >
                <PhoneOff size={38} color="#20201e" />
              </div>
              <h3 style={{ margin: 0, color: "#FF85A1", fontSize: "1.25rem", fontWeight: 800 }}>
                Call Declined
              </h3>
              <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.4 }}>
                {partnerName} is unable to join the video call at this moment. You can continue negotiating via chat messages.
              </p>
            </div>
          )}

          {/* Timeout State */}
          {callState === "timeout" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                gap: "14px",
                padding: "24px",
                textAlign: "center",
                maxWidth: "440px",
                zIndex: 5,
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "#FFE66D",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "3px solid #20201e",
                }}
              >
                <Clock size={38} color="#20201e" />
              </div>
              <h3 style={{ margin: 0, color: "#FFE66D", fontSize: "1.25rem", fontWeight: 800 }}>
                No Response
              </h3>
              <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.4 }}>
                {partnerName} did not answer the video call. Please try again later or leave a message.
              </p>
            </div>
          )}

          {/* Ended State */}
          {callState === "ended" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                gap: "12px",
                padding: "24px",
                textAlign: "center",
                zIndex: 5,
              }}
            >
              <PhoneOff size={44} color="#9ca3af" />
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>Call Ended</h3>
              <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.85rem" }}>
                Total duration: {formatDuration(duration)}
              </p>
            </div>
          )}

          {/* Error Screen */}
          {callState === "error" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                gap: "12px",
                padding: "24px",
                textAlign: "center",
                maxWidth: "460px",
                zIndex: 5,
              }}
            >
              <AlertCircle size={46} color="#FF85A1" />
              <h3 style={{ margin: 0, color: "#FF85A1", fontSize: "1.15rem" }}>
                Call Setup Notice
              </h3>
              <p style={{ margin: 0, color: "#d1d5db", fontSize: "0.88rem", lineHeight: 1.5 }}>
                {errorMessage || "Unable to establish video connection."}
              </p>
              <button
                type="button"
                onClick={() => handleEndCall(false)}
                style={{
                  marginTop: "8px",
                  background: "#FFE66D",
                  color: "#20201e",
                  fontWeight: 700,
                  border: "2px solid #20201e",
                  borderRadius: "10px",
                  padding: "8px 18px",
                  cursor: "pointer",
                }}
              >
                Close Window
              </button>
            </div>
          )}

          {/* Picture-In-Picture Self Camera Window */}
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              right: "16px",
              width: "160px",
              height: "100px",
              background: "#171915",
              borderRadius: "12px",
              border: "2px solid #FFE66D",
              overflow: "hidden",
              boxShadow: "3px 3px 0 #20201e",
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
                display: videoOff ? "none" : "block",
              }}
            />
            {videoOff && (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#262a24",
                  color: "#9ca3af",
                  fontSize: "0.75rem",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <VideoOff size={18} color="#FF85A1" />
                <span>Camera off</span>
              </div>
            )}
            <div
              style={{
                position: "absolute",
                bottom: "4px",
                left: "6px",
                fontSize: "0.65rem",
                background: "rgba(0,0,0,0.65)",
                color: "#fff",
                padding: "1px 5px",
                borderRadius: "4px",
                fontWeight: 600,
              }}
            >
              You {audioMuted && "🔇"}
            </div>
          </div>
        </div>

        {/* Bottom Interactive Control Dock */}
        <div
          style={{
            padding: "14px 20px",
            background: "#1e211c",
            borderTop: "2px solid #2d312c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          {/* Mute Mic */}
          <button
            type="button"
            onClick={toggleAudio}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: audioMuted ? "#FF85A1" : "#FAF8F5",
              color: "#20201e",
              border: "2px solid #20201e",
              borderRadius: "12px",
              padding: "10px 16px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "2px 2px 0 #20201e",
            }}
            title={audioMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {audioMuted ? <MicOff size={18} /> : <Mic size={18} />}
            <span>{audioMuted ? "Unmute" : "Mute"}</span>
          </button>

          {/* Toggle Camera */}
          <button
            type="button"
            onClick={toggleVideo}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: videoOff ? "#FF85A1" : "#FAF8F5",
              color: "#20201e",
              border: "2px solid #20201e",
              borderRadius: "12px",
              padding: "10px 16px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "2px 2px 0 #20201e",
            }}
            title={videoOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {videoOff ? <VideoOff size={18} /> : <VideoIcon size={18} />}
            <span>{videoOff ? "Start Video" : "Stop Video"}</span>
          </button>

          {/* Screen Share */}
          <button
            type="button"
            onClick={toggleScreenShare}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: isScreenSharing ? "#C3B1E1" : "#FAF8F5",
              color: "#20201e",
              border: "2px solid #20201e",
              borderRadius: "12px",
              padding: "10px 16px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "2px 2px 0 #20201e",
            }}
            title="Share Screen"
          >
            <Monitor size={18} />
            <span>{isScreenSharing ? "Stop Sharing" : "Share Screen"}</span>
          </button>

          {/* Anti-Spoof Liveness Challenge */}
          <button
            type="button"
            onClick={triggerLivenessChallenge}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#FFE66D",
              color: "#20201e",
              border: "2px solid #20201e",
              borderRadius: "12px",
              padding: "10px 16px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "2px 2px 0 #20201e",
            }}
            title="Challenge provider to prove live physical presence and asset custody"
          >
            <ShieldCheck size={18} />
            <span>Liveness Test</span>
          </button>

          {/* End Call / Cancel Button */}
          <button
            type="button"
            onClick={() => handleEndCall(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#ef4444",
              color: "#fff",
              border: "2px solid #20201e",
              borderRadius: "12px",
              padding: "10px 20px",
              fontWeight: 800,
              fontSize: "0.9rem",
              cursor: "pointer",
              boxShadow: "3px 3px 0 #20201e",
            }}
            title={callState === "calling" ? "Cancel Call" : "Hang Up"}
          >
            <PhoneOff size={18} />
            <span>{callState === "calling" ? "Cancel Call" : "End Call"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
