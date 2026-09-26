"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
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
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
  iceCandidatePoolSize: 10,
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
  const { user } = useAuth();
  const [callState, setCallState] = useState(isInitiator ? "calling" : "initializing");
  const [errorMessage, setErrorMessage] = useState("");
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [needsUserTapForSound, setNeedsUserTapForSound] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const remotePeerIdRef = useRef(partnerId);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const timerRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const durationRef = useRef(0);
  const pendingCandidatesRef = useRef([]);
  const earlySignalsBufferRef = useRef([]);
  const hasOfferedRef = useRef(false);
  const peerReadyReceivedRef = useRef(false);
  const seenCandidatesRef = useRef(new Set());
  const hasReceivedOfferRef = useRef(false);

  // Sync ref with duration and partnerId
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    if (partnerId) {
      remotePeerIdRef.current = partnerId;
    }
  }, [partnerId]);

  // Unmute and play media when user interacts
  const enableUserAudio = useCallback(() => {
    setNeedsUserTapForSound(false);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.play().catch(() => {});
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, []);

  // Ensure remote media plays when connected
  useEffect(() => {
    if (callState === "connected" && remoteStreamRef.current) {
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
      if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== remoteStreamRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.play().catch(() => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.muted = true;
            remoteVideoRef.current.play().catch(() => {});
          }
          setNeedsUserTapForSound(true);
        });
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.play().catch(() => {
          setNeedsUserTapForSound(true);
        });
      }
    }
  }, [callState]);

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

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
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

      const socket = getSocket();
      if (socket && socket.connected) {
        if (roomId) {
          socket.emit("leave_call_room", { quoteId, roomId });
        }
        if (notifyRemote) {
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
    let readyInterval = null;
    pendingCandidatesRef.current = [];
    earlySignalsBufferRef.current = [];
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

    const socket = getSocket();
    if (!socket) {
      setCallState("error");
      setErrorMessage("Real-time network connection is unavailable.");
      return;
    }

    // Join the call room immediately
    if (roomId) {
      socket.emit("join_call_room", { quoteId, roomId });
    }

    function drainCandidates(pcInstance) {
      if (!pcInstance || !pcInstance.remoteDescription) return;
      while (pendingCandidatesRef.current.length > 0) {
        const c = pendingCandidatesRef.current.shift();
        if (c) {
          try {
            const candidateInit = typeof c === "string" ? { candidate: c } : c;
            pcInstance.addIceCandidate(candidateInit).catch(() => {});
          } catch {}
        }
      }
    }

    function processSignal(pcInstance, signal, senderId) {
      if (!pcInstance || !signal) return;

      if (signal.type === "offer") {
        hasReceivedOfferRef.current = true;
        if (pcInstance.signalingState !== "stable") {
          console.warn("[WebRTC] Ignoring offer in non-stable state:", pcInstance.signalingState);
          return;
        }

        const sdpObj =
          signal.sessionDescription ||
          (typeof signal.sdp === "string"
            ? { type: "offer", sdp: signal.sdp }
            : signal.sdp);

        pcInstance
          .setRemoteDescription(new RTCSessionDescription(sdpObj))
          .then(() => {
            drainCandidates(pcInstance);
            return pcInstance.createAnswer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            });
          })
          .then((answer) => pcInstance.setLocalDescription(answer))
          .then(() => {
            const s = getSocket();
            if (s && s.connected) {
              s.emit("webrtc_signal", {
                quoteId,
                roomId,
                targetUserId: senderId || remotePeerIdRef.current || partnerId,
                signal: {
                  type: "answer",
                  sdp: pcInstance.localDescription.sdp,
                  sessionDescription: {
                    type: pcInstance.localDescription.type,
                    sdp: pcInstance.localDescription.sdp,
                  },
                },
              });
            }
            setCallState("connecting");
          })
          .catch((err) => {
            console.error("[WebRTC] Error handling WebRTC offer:", err);
          });
      } else if (signal.type === "answer") {
        if (pcInstance.signalingState !== "have-local-offer") {
          console.warn("[WebRTC] Ignoring answer in unexpected state:", pcInstance.signalingState);
          return;
        }

        const sdpObj =
          signal.sessionDescription ||
          (typeof signal.sdp === "string"
            ? { type: "answer", sdp: signal.sdp }
            : signal.sdp);

        pcInstance
          .setRemoteDescription(new RTCSessionDescription(sdpObj))
          .then(() => {
            drainCandidates(pcInstance);
            setCallState("connecting");
          })
          .catch((err) => {
            console.error("[WebRTC] Error setting remote description from answer:", err);
          });
      } else if (signal.type === "candidate") {
        const cand = signal.candidate;
        if (cand && (cand.candidate || typeof cand === "string")) {
          const candKey = typeof cand === "string" ? cand : (cand.candidate || JSON.stringify(cand));
          if (candKey && seenCandidatesRef.current.has(candKey)) return;
          if (candKey) seenCandidatesRef.current.add(candKey);

          if (pcInstance.remoteDescription && pcInstance.remoteDescription.type) {
            try {
              const candidateInit = typeof cand === "string" ? { candidate: cand } : cand;
              pcInstance
                .addIceCandidate(candidateInit)
                .catch((err) => console.warn("[WebRTC] Error adding ICE candidate:", err));
            } catch (e) {
              console.warn("[WebRTC] Exception adding candidate:", e);
            }
          } else {
            pendingCandidatesRef.current.push(cand);
          }
        }
      }
    }

    async function sendOffer(pcInstance, socketInstance) {
      if (!pcInstance || !socketInstance || hasOfferedRef.current) return;
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
          roomId,
          targetUserId: remotePeerIdRef.current || partnerId,
          signal: {
            type: "offer",
            sdp: offer.sdp,
            sessionDescription: {
              type: offer.type,
              sdp: offer.sdp,
            },
          },
        });
      } catch (err) {
        console.error("[WebRTC] Error creating WebRTC offer:", err);
        hasOfferedRef.current = false;
      }
    }

    // Register signaling listener IMMEDIATELY so early signals are never lost
    function handleSignal({ senderId, signal }) {
      if (!isMounted || !signal) return;
      // Filter out our own signals
      if (senderId && user?._id && String(senderId) === String(user._id)) return;
      if (senderId) {
        remotePeerIdRef.current = senderId;
      }
      const pc = pcRef.current;
      if (!pc) {
        earlySignalsBufferRef.current.push({ senderId, signal });
        return;
      }
      processSignal(pc, signal, senderId);
    }
    socket.on("webrtc_signal", handleSignal);

    // When counterparty announces ready or joins
    function handlePeerReady(data) {
      if (!isMounted) return;
      const sender = data?.senderId || data?.userId || data?.acceptedBy?._id;
      if (sender && user?._id && String(sender) === String(user._id)) return;
      if (sender) {
        remotePeerIdRef.current = sender;
      }
      peerReadyReceivedRef.current = true;
      if (isInitiator) {
        const pc = pcRef.current;
        if (pc && !hasOfferedRef.current) {
          sendOffer(pc, socket);
        }
      }
    }
    socket.on("peer_joined", handlePeerReady);
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

    async function startCall() {
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
          console.warn("[WebRTC] Could not get ideal video/audio, trying fallback:", mediaErr);
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
          } catch (audioOnlyErr) {
            console.warn("[WebRTC] Could not get video, trying audio only:", audioOnlyErr);
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

        // Ensure all audio and video tracks are unmuted and enabled
        stream.getTracks().forEach((t) => {
          t.enabled = true;
        });

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

        // Remote track arrival (audio + video)
        pc.ontrack = (event) => {
          if (!isMounted) return;
          let incomingStream = event.streams && event.streams[0];
          if (!incomingStream) {
            if (!remoteStreamRef.current) {
              remoteStreamRef.current = new MediaStream();
            }
            remoteStreamRef.current.addTrack(event.track);
            incomingStream = remoteStreamRef.current;
          } else {
            remoteStreamRef.current = incomingStream;
          }

          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = incomingStream;
            remoteVideoRef.current.play().catch(() => {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.muted = true;
                remoteVideoRef.current.play().catch(() => {});
              }
              setNeedsUserTapForSound(true);
            });
          }

          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = incomingStream;
            remoteAudioRef.current.play().catch(() => {
              setNeedsUserTapForSound(true);
            });
          }

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
        };

        // ICE candidate generation
        pc.onicecandidate = (event) => {
          if (event.candidate && event.candidate.candidate) {
            const currentSocket = getSocket();
            if (currentSocket && currentSocket.connected) {
              currentSocket.emit("webrtc_signal", {
                quoteId,
                roomId,
                targetUserId: remotePeerIdRef.current || partnerId,
                signal: {
                  type: "candidate",
                  candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate,
                },
              });
            }
          }
        };

        const checkConnectionState = () => {
          if (!isMounted) return;
          const connState = pc.connectionState;
          const iceState = pc.iceConnectionState;

          if (connState === "connected" || iceState === "connected" || iceState === "completed") {
            setCallState("connected");
            if (remoteVideoRef.current && remoteStreamRef.current) {
              remoteVideoRef.current.play().catch(() => {});
            }
            if (remoteAudioRef.current && remoteStreamRef.current) {
              remoteAudioRef.current.play().catch(() => {});
            }
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
            connState === "disconnected" ||
            connState === "failed" ||
            iceState === "failed"
          ) {
            if (callState === "connected") {
              setCallState("connecting");
            }
          }
        };

        pc.onconnectionstatechange = checkConnectionState;
        pc.oniceconnectionstatechange = checkConnectionState;

        // Drain any early signals received before PC was ready
        while (earlySignalsBufferRef.current.length > 0) {
          const item = earlySignalsBufferRef.current.shift();
          if (item) {
            processSignal(pc, item.signal, item.senderId);
          }
        }

        // 3. Initiator vs Recipient startup
        if (isInitiator) {
          if (peerReadyReceivedRef.current && !hasOfferedRef.current) {
            sendOffer(pc, socket);
          }
          callTimeoutRef.current = setTimeout(() => {
            if (isMounted && (callState === "calling" || callState === "initializing")) {
              playEndTone();
              setCallState("timeout");
              setTimeout(() => {
                if (isMounted) handleEndCall(false);
              }, 3000);
            }
          }, 45000);
        } else {
          // Recipient: announce ready immediately and on interval until offer is received
          socket.emit("webrtc_ready", {
            quoteId,
            roomId,
            targetUserId: remotePeerIdRef.current || partnerId,
          });

          let attempts = 0;
          readyInterval = setInterval(() => {
            if (!isMounted || hasReceivedOfferRef.current || callState === "connected") {
              clearInterval(readyInterval);
              return;
            }
            attempts++;
            if (attempts > 8) {
              clearInterval(readyInterval);
              return;
            }
            const s = getSocket();
            if (s && s.connected) {
              s.emit("webrtc_ready", {
                quoteId,
                roomId,
                targetUserId: remotePeerIdRef.current || partnerId,
              });
            }
          }, 1500);
        }
      } catch (err) {
        console.error("[WebRTC] Initialization error:", err);
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
      if (readyInterval) clearInterval(readyInterval);
      const s = getSocket();
      if (s) {
        if (roomId) s.emit("leave_call_room", { quoteId, roomId });
        s.off("webrtc_signal", handleSignal);
        s.off("webrtc_ready", handlePeerReady);
        s.off("peer_joined", handlePeerReady);
        s.off("video_call_accepted", handlePeerReady);
        s.off("video_call_ended", handleCallEnded);
        s.off("video_call_declined", handleCallDeclined);
      }
      cleanUpMedia();
    };
  }, [isOpen, quoteId, roomId, partnerId, isInitiator, cleanUpMedia, handleEndCall]);

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
              position: "absolute",
              inset: 0,
              opacity: callState === "connected" ? 1 : 0,
              transition: "opacity 0.4s ease",
              pointerEvents: callState === "connected" ? "auto" : "none",
              zIndex: 1,
            }}
          />

          {/* Dedicated Remote Audio Stream */}
          <audio ref={remoteAudioRef} autoPlay playsInline />

          {/* Autoplay Audio Unmute Prompt Banner */}
          {needsUserTapForSound && (
            <button
              type="button"
              onClick={enableUserAudio}
              style={{
                position: "absolute",
                top: "16px",
                zIndex: 25,
                background: "#FFE66D",
                color: "#20201e",
                border: "2px solid #20201e",
                borderRadius: "24px",
                padding: "8px 18px",
                fontWeight: 800,
                fontSize: "0.85rem",
                boxShadow: "3px 3px 0 #20201e",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>🔊</span> Sound paused by browser. Click anywhere to unmute {partnerName}
            </button>
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
              bottom: "12px",
              right: "12px",
              width: "clamp(110px, 25vw, 160px)",
              height: "clamp(75px, 17vw, 105px)",
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
