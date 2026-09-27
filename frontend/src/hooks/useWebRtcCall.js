"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { playConnectTone, playEndTone } from "@/lib/callSound";
import { getRtcConfig, hasTurnServer } from "@/lib/rtcConfig";

/*
 * Signaling protocol (caller = initiator = the ONLY offerer):
 *  1. Both sides join `call_<roomId>`, register listeners, grab camera/mic and build an RTCPeerConnection.
 *  2. Callee repeatedly announces `webrtc_ready { sessionId }` until it has answered an offer.
 *  3. Caller offers only after it receives `webrtc_ready`, so the offer can never be lost because the
 *     callee's UI wasn't mounted yet. Repeated `ready` → caller re-sends its pending offer (idempotent).
 *  4. Every signal carries `sessionId` (sender's PC instance) and `targetSessionId`, so stale signals
 *     from a refreshed/remounted peer are ignored and a fresh PC is negotiated automatically.
 */

const READY_RETRY_MS = 1500;
const READY_MAX_ATTEMPTS = 40;
const RING_TIMEOUT_MS = 45000;
const PEER_LOST_TIMEOUT_MS = 20000;
const ICE_FAIL_TIMEOUT_MS = 15000;
const MAX_ICE_RESTARTS = 2;
const CLOSE_DELAY_MS = 1200;

const MEDIA_CONSTRAINTS = [
  {
    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  },
  { video: true, audio: true },
  { video: false, audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } },
  { video: true, audio: false },
];

function createSessionId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function attachStream(el, stream) {
  if (!el) return;
  const next = stream || null;
  if (el.srcObject !== next) el.srcObject = next;
}

function findVideoSender(pc) {
  if (!pc) return null;
  return pc.getSenders().find((s) => s.track && s.track.kind === "video") || null;
}

function describeMediaError(err) {
  if (!err) return "";
  switch (err.name) {
    case "InsecureContextError":
      return "Camera & mic need HTTPS or localhost. You can still see and hear the other person.";
    case "NotAllowedError":
    case "SecurityError":
    case "PermissionDeniedError":
      return "Camera/microphone permission denied. Allow access from the address bar and rejoin to be seen and heard.";
    case "NotReadableError":
    case "TrackStartError":
      return "Your camera or mic is in use by another app/browser. Close it and rejoin to be seen.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No camera or microphone found on this device.";
    default:
      return `Could not access camera/microphone: ${err.message || err.name}`;
  }
}

async function acquireLocalMedia() {
  const md = typeof navigator !== "undefined" ? navigator.mediaDevices : null;
  if (!md || typeof md.getUserMedia !== "function") {
    const e = new Error("Media devices unavailable in an insecure context");
    e.name = "InsecureContextError";
    throw e;
  }
  let lastError = null;
  for (const constraints of MEDIA_CONSTRAINTS) {
    try {
      return await md.getUserMedia(constraints);
    } catch (err) {
      lastError = err;
      if (err.name === "NotAllowedError" || err.name === "SecurityError") break;
    }
  }
  throw lastError;
}

export function useWebRtcCall({
  isOpen,
  quoteId,
  roomId,
  partnerId,
  isInitiator,
  messageId,
  selfId,
  onClose,
}) {
  const [callState, setCallStateValue] = useState(isInitiator ? "calling" : "connecting");
  const [errorMessage, setErrorMessage] = useState("");
  const [mediaWarning, setMediaWarning] = useState("");
  const [duration, setDuration] = useState(0);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [hasLocalVideo, setHasLocalVideo] = useState(false);
  const [hasLocalAudio, setHasLocalAudio] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [remoteMedia, setRemoteMedia] = useState({ audioMuted: false, videoOff: false });
  const [needsUserTapForSound, setNeedsUserTapForSound] = useState(false);

  const callStateRef = useRef(callState);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoEl = useRef(null);
  const remoteVideoEl = useRef(null);
  const remoteAudioEl = useRef(null);
  const partnerIdRef = useRef(partnerId);
  const messageIdRef = useRef(messageId);
  const onCloseRef = useRef(onClose);
  const endCallRef = useRef(null);
  const sendMediaStateRef = useRef(null);
  const audioMutedRef = useRef(false);
  const videoOffRef = useRef(false);

  // Keep latest props in refs so the connection effect never restarts because of them.
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (partnerId) partnerIdRef.current = partnerId;
  }, [partnerId]);
  useEffect(() => {
    messageIdRef.current = messageId;
  }, [messageId]);

  const setCallState = useCallback((next) => {
    callStateRef.current = next;
    setCallStateValue(next);
  }, []);

  const playRemoteMedia = useCallback(() => {
    const stream = remoteStreamRef.current;
    if (!stream) return;
    const video = remoteVideoEl.current;
    if (video) {
      attachStream(video, stream);
      video.play().catch(() => {});
    }
    const audio = remoteAudioEl.current;
    if (audio) {
      attachStream(audio, stream);
      audio.muted = false;
      audio
        .play()
        .then(() => setNeedsUserTapForSound(false))
        .catch((err) => {
          if (err?.name === "NotAllowedError") setNeedsUserTapForSound(true);
        });
    }
  }, []);

  // Callback refs: re-attach streams whenever <video>/<audio> elements (re)mount, e.g. after minimize/expand.
  const localVideoRef = useCallback((el) => {
    localVideoEl.current = el;
    if (el) {
      attachStream(el, screenStreamRef.current || localStreamRef.current);
      if (el.srcObject) el.play().catch(() => {});
    }
  }, []);

  const remoteVideoRef = useCallback(
    (el) => {
      remoteVideoEl.current = el;
      if (el) playRemoteMedia();
    },
    [playRemoteMedia],
  );

  const remoteAudioRef = useCallback(
    (el) => {
      remoteAudioEl.current = el;
      if (el) playRemoteMedia();
    },
    [playRemoteMedia],
  );

  const enableUserAudio = useCallback(() => {
    setNeedsUserTapForSound(false);
    playRemoteMedia();
  }, [playRemoteMedia]);

  useEffect(() => {
    if (!isOpen) return undefined;

    let disposed = false;
    let ended = false;
    let pc = null;
    let remoteSessionId = null;
    let offerSent = false;
    let peerReadyBeforePc = false;
    let earlyOffer = null;
    let answeredSinceReady = false;
    let pendingCandidates = [];
    let signalQueue = Promise.resolve();
    let readyTimer = null;
    let ringTimer = null;
    let peerLostTimer = null;
    let iceFailTimer = null;
    let durationTimer = null;
    let closeTimer = null;
    let connectedAt = 0;
    let connectTonePlayed = false;
    let iceRestarts = 0;
    const localSessionId = createSessionId();

    // A new external WebRTC session starts with fresh UI state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCallState(isInitiator ? "calling" : "connecting");
    setErrorMessage("");
    setMediaWarning("");
    setDuration(0);
    setIsScreenSharing(false);
    setHasRemoteVideo(false);
    setRemoteMedia({ audioMuted: false, videoOff: false });
    setNeedsUserTapForSound(false);

    const socket = getSocket();
    if (!socket || !roomId) {
      setErrorMessage(
        !socket
          ? "Real-time network connection is unavailable."
          : "This call session is missing its room. Please start the call again.",
      );
      setCallState("error");
      endCallRef.current = () => onCloseRef.current?.();
      return undefined;
    }

    const isSelf = (id) => Boolean(id && selfId && String(id) === String(selfId));
    const isThisCall = (data) => !data?.roomId || String(data.roomId) === String(roomId);
    const enqueue = (task) => {
      signalQueue = signalQueue
        .then(task)
        .catch((err) => console.error("[WebRTC] Signal handling failed:", err));
    };

    function emitSignal(signal) {
      socket.emit("webrtc_signal", {
        quoteId,
        roomId,
        targetUserId: partnerIdRef.current,
        signal: { ...signal, sessionId: localSessionId, targetSessionId: remoteSessionId },
      });
    }

    function sendMediaState() {
      const local = localStreamRef.current;
      const sharing = Boolean(screenStreamRef.current);
      const hasVideo = Boolean(local && local.getVideoTracks().length);
      emitSignal({
        type: "media-state",
        audioMuted: audioMutedRef.current,
        videoOff: !sharing && (videoOffRef.current || !hasVideo),
      });
    }
    sendMediaStateRef.current = sendMediaState;

    // ---------- Callee "ready" handshake ----------
    function announceReady() {
      socket.emit("webrtc_ready", {
        quoteId,
        roomId,
        targetUserId: partnerIdRef.current,
        sessionId: localSessionId,
      });
    }

    function stopReadyLoop() {
      if (readyTimer) {
        clearInterval(readyTimer);
        readyTimer = null;
      }
    }

    function startReadyLoop() {
      if (isInitiator || disposed || ended) return;
      stopReadyLoop();
      answeredSinceReady = false;
      let attempts = 0;
      announceReady();
      readyTimer = setInterval(() => {
        if (disposed || answeredSinceReady) {
          stopReadyLoop();
          return;
        }
        attempts += 1;
        if (attempts >= READY_MAX_ATTEMPTS) {
          stopReadyLoop();
          if (callStateRef.current !== "connected") {
            setErrorMessage("The other participant could not be reached. They may have closed the call.");
            setCallState("error");
          }
          return;
        }
        announceReady();
      }, READY_RETRY_MS);
    }

    // ---------- Connection lifecycle ----------
    function currentDuration() {
      return connectedAt ? Math.floor((Date.now() - connectedAt) / 1000) : 0;
    }

    function startDurationTimer() {
      if (durationTimer) return;
      connectedAt = Date.now();
      durationTimer = setInterval(() => setDuration(currentDuration()), 1000);
    }

    function markConnected() {
      if (disposed || ended) return;
      clearTimeout(ringTimer);
      clearTimeout(peerLostTimer);
      clearTimeout(iceFailTimer);
      ringTimer = peerLostTimer = iceFailTimer = null;
      iceRestarts = 0;
      stopReadyLoop();
      if (callStateRef.current !== "connected") {
        setCallState("connected");
        if (!connectTonePlayed) {
          connectTonePlayed = true;
          playConnectTone();
        }
        sendMediaState();
      }
      startDurationTimer();
      playRemoteMedia();
    }

    function closePeerConnection() {
      const conn = pc;
      pc = null;
      pcRef.current = null;
      if (!conn) return;
      conn.ontrack = null;
      conn.onicecandidate = null;
      conn.onconnectionstatechange = null;
      conn.oniceconnectionstatechange = null;
      try {
        conn.close();
      } catch {
        /* already closed */
      }
    }

    function scheduleIceFailure() {
      if (iceFailTimer) return;
      iceFailTimer = setTimeout(() => {
        iceFailTimer = null;
        if (disposed || ended) return;
        const state = pc?.connectionState;
        if (state === "connected") return;
        setErrorMessage(
          hasTurnServer
            ? "Could not establish a media connection. Check your network and try again."
            : "Could not establish a peer-to-peer connection — your networks are blocking direct media. A TURN relay server (NEXT_PUBLIC_TURN_URLS) is required for these networks.",
        );
        setCallState("error");
      }, ICE_FAIL_TIMEOUT_MS);
    }

    function restartIce(conn) {
      if (!isInitiator || conn !== pc || iceRestarts >= MAX_ICE_RESTARTS) return;
      iceRestarts += 1;
      enqueue(async () => {
        if (conn !== pc || conn.signalingState !== "stable") return;
        if (typeof conn.restartIce === "function") conn.restartIce();
        await makeOffer({ iceRestart: true });
      });
    }

    function buildPeerConnection() {
      closePeerConnection();
      offerSent = false;
      const conn = new RTCPeerConnection(getRtcConfig());
      pc = conn;
      pcRef.current = conn;

      let remoteStream = new MediaStream();
      remoteStreamRef.current = remoteStream;
      setHasRemoteVideo(false);

      const local = localStreamRef.current;
      const audioTrack = local?.getAudioTracks()[0] || null;
      const videoTrack =
        screenStreamRef.current?.getVideoTracks()[0] || local?.getVideoTracks()[0] || null;

      if (audioTrack) conn.addTrack(audioTrack, local);
      else if (isInitiator) conn.addTransceiver("audio", { direction: "recvonly" });

      if (videoTrack) {
        if (local) conn.addTrack(videoTrack, local);
        else conn.addTrack(videoTrack);
      } else if (isInitiator) {
        conn.addTransceiver("video", { direction: "recvonly" });
      }

      conn.ontrack = (event) => {
        if (disposed || pc !== conn) return;
        const { track } = event;
        const incoming = event.streams && event.streams[0];
        if (incoming && incoming !== remoteStream) {
          remoteStream = incoming;
          remoteStreamRef.current = incoming;
        } else if (!remoteStream.getTracks().some((t) => t.id === track.id)) {
          remoteStream.addTrack(track);
        }
        if (track.kind === "video") setHasRemoteVideo(true);
        track.onended = () => {
          if (track.kind === "video") {
            setHasRemoteVideo(remoteStream.getVideoTracks().some((t) => t.readyState === "live"));
          }
        };
        playRemoteMedia();
      };

      conn.onicecandidate = (event) => {
        if (event.candidate && pc === conn) {
          emitSignal({ type: "candidate", candidate: event.candidate.toJSON() });
        }
      };

      const handleStateChange = () => {
        if (disposed || pc !== conn) return;
        const state = conn.connectionState;
        const ice = conn.iceConnectionState;
        if (state === "connected" || ice === "connected" || ice === "completed") {
          markConnected();
          return;
        }
        if (state === "failed" || ice === "failed") {
          if (callStateRef.current === "connected") setCallState("reconnecting");
          restartIce(conn);
          scheduleIceFailure();
          return;
        }
        if (state === "disconnected" || ice === "disconnected") {
          if (callStateRef.current === "connected") setCallState("reconnecting");
        }
      };
      conn.onconnectionstatechange = handleStateChange;
      conn.oniceconnectionstatechange = handleStateChange;
      return conn;
    }

    // ---------- SDP / ICE handling (serialized through signalQueue) ----------
    async function drainCandidates(conn) {
      const ready = pendingCandidates.filter(
        (c) => !c.sessionId || !remoteSessionId || c.sessionId === remoteSessionId,
      );
      pendingCandidates = pendingCandidates.filter((c) => !ready.includes(c));
      for (const item of ready) {
        try {
          await conn.addIceCandidate(item.candidate);
        } catch {
          /* candidate from an outdated negotiation */
        }
      }
    }

    async function makeOffer(options) {
      const conn = pc;
      if (!conn || disposed || ended) return;
      const offer = await conn.createOffer(options);
      if (conn !== pc || disposed) return;
      await conn.setLocalDescription(offer);
      offerSent = true;
      emitSignal({ type: "offer", sdp: conn.localDescription.sdp });
    }

    async function handleOffer(signal) {
      if (signal.targetSessionId && signal.targetSessionId !== localSessionId) return;
      if (!pc) {
        earlyOffer = signal;
        return;
      }
      const sid = signal.sessionId || null;
      if (sid && remoteSessionId && sid !== remoteSessionId) {
        // Caller rejoined with a brand-new peer connection → start fresh.
        if (callStateRef.current === "connected") setCallState("reconnecting");
        pendingCandidates = pendingCandidates.filter((c) => c.sessionId === sid);
        buildPeerConnection();
      }
      if (sid) remoteSessionId = sid;
      const conn = pc;

      if (conn.remoteDescription && conn.remoteDescription.sdp === signal.sdp) {
        // Duplicate offer (our answer was probably lost) → resend the answer.
        if (conn.localDescription && conn.localDescription.type === "answer") {
          answeredSinceReady = true;
          emitSignal({ type: "answer", sdp: conn.localDescription.sdp });
        }
        return;
      }

      if (conn.signalingState !== "stable") {
        try {
          await conn.setLocalDescription({ type: "rollback" });
        } catch {
          /* nothing to roll back */
        }
      }

      await conn.setRemoteDescription({ type: "offer", sdp: signal.sdp });
      await drainCandidates(conn);
      const answer = await conn.createAnswer();
      if (conn !== pc || disposed) return;
      await conn.setLocalDescription(answer);
      answeredSinceReady = true;
      stopReadyLoop();
      emitSignal({ type: "answer", sdp: conn.localDescription.sdp });
    }

    async function handleAnswer(signal) {
      const conn = pc;
      if (!conn) return;
      if (signal.targetSessionId && signal.targetSessionId !== localSessionId) return;
      const sid = signal.sessionId || null;
      if (sid && remoteSessionId && sid !== remoteSessionId) return;
      if (conn.signalingState !== "have-local-offer") return; // duplicate answer
      if (sid) remoteSessionId = sid;
      await conn.setRemoteDescription({ type: "answer", sdp: signal.sdp });
      await drainCandidates(conn);
    }

    async function handleCandidate(signal) {
      if (!signal.candidate) return;
      if (signal.targetSessionId && signal.targetSessionId !== localSessionId) return;
      const sid = signal.sessionId || null;
      const conn = pc;
      const sameSession = !sid || !remoteSessionId || sid === remoteSessionId;
      if (!conn || !conn.remoteDescription || !sameSession) {
        pendingCandidates.push({ sessionId: sid, candidate: signal.candidate });
        if (pendingCandidates.length > 200) pendingCandidates.shift();
        return;
      }
      try {
        await conn.addIceCandidate(signal.candidate);
      } catch (err) {
        console.warn("[WebRTC] Could not add ICE candidate:", err);
      }
    }

    // ---------- Socket listeners ----------
    // Dedup ring: prevents processing the same signal twice if it arrives
    // via both the call room and the user personal room.
    const recentSignalHashes = [];
    const DEDUP_RING_SIZE = 30;

    function signalHash(signal) {
      // SDP signals are uniquely identified by type + first 64 chars of sdp
      if (signal.sdp) return `${signal.type}:${signal.sdp.slice(0, 64)}`;
      // ICE candidates by their foundation + priority
      if (signal.candidate) {
        const c = signal.candidate;
        return `candidate:${c.candidate || ""}`.slice(0, 80);
      }
      return `${signal.type}:${signal.sessionId || ""}`;
    }

    function isDuplicateSignal(signal) {
      if (signal.type === "media-state") return false; // always process latest
      const hash = signalHash(signal);
      if (recentSignalHashes.includes(hash)) return true;
      recentSignalHashes.push(hash);
      if (recentSignalHashes.length > DEDUP_RING_SIZE) recentSignalHashes.shift();
      return false;
    }

    function handleSignal(data) {
      if (disposed || ended || !data?.signal) return;
      if (!isThisCall(data) || isSelf(data.senderId)) return;
      if (isDuplicateSignal(data.signal)) return;
      if (data.senderId) partnerIdRef.current = data.senderId;
      const { signal } = data;
      switch (signal.type) {
        case "offer":
          if (!isInitiator) enqueue(() => handleOffer(signal));
          break;
        case "answer":
          if (isInitiator) enqueue(() => handleAnswer(signal));
          break;
        case "candidate":
          enqueue(() => handleCandidate(signal));
          break;
        case "media-state":
          setRemoteMedia({ audioMuted: Boolean(signal.audioMuted), videoOff: Boolean(signal.videoOff) });
          break;
        default:
          break;
      }
    }

    function handlePeerReady(data) {
      if (disposed || ended || !isInitiator) return;
      if (!isThisCall(data) || isSelf(data?.senderId)) return;
      if (data?.senderId) partnerIdRef.current = data.senderId;
      clearTimeout(peerLostTimer);
      peerLostTimer = null;
      const sid = data?.sessionId || null;

      if (callStateRef.current === "calling") {
        clearTimeout(ringTimer);
        ringTimer = null;
        setCallState("connecting");
      }

      if (!pc) {
        peerReadyBeforePc = true;
        if (sid) remoteSessionId = sid;
        return;
      }

      enqueue(async () => {
        if (!pc || disposed || ended) return;
        if (sid && remoteSessionId && sid !== remoteSessionId) {
          // Callee reloaded / rejoined → renegotiate on a fresh connection.
          remoteSessionId = sid;
          pendingCandidates = pendingCandidates.filter((c) => c.sessionId === sid);
          if (callStateRef.current === "connected") setCallState("reconnecting");
          buildPeerConnection();
          await makeOffer();
          return;
        }
        if (sid) remoteSessionId = sid;
        if (!offerSent) {
          await makeOffer();
          return;
        }
        if (pc.signalingState === "have-local-offer" && pc.localDescription) {
          emitSignal({ type: "offer", sdp: pc.localDescription.sdp }); // resend lost offer
        }
      });
    }

    function handlePeerJoined(data) {
      if (disposed || ended || !isThisCall(data) || isSelf(data?.senderId)) return;
      if (data?.senderId) partnerIdRef.current = data.senderId;
      clearTimeout(peerLostTimer);
      peerLostTimer = null;
      if (!isInitiator && pc) startReadyLoop();
    }

    function handlePeerLeft(data) {
      if (disposed || ended || !isThisCall(data) || isSelf(data?.senderId)) return;
      if (callStateRef.current === "calling") return;
      if (pc?.connectionState !== "connected" && callStateRef.current === "connected") {
        setCallState("reconnecting");
      }
      clearTimeout(peerLostTimer);
      peerLostTimer = setTimeout(() => {
        if (disposed || ended) return;
        if (pc?.connectionState !== "connected") finishCall(false);
      }, PEER_LOST_TIMEOUT_MS);
    }

    function handleSocketConnect() {
      socket.emit("join_call_room", { quoteId, roomId });
      if (!isInitiator && pc && callStateRef.current !== "connected") startReadyLoop();
    }

    function handleCallEnded(data) {
      if (disposed || ended || String(data?.quoteId) !== String(quoteId)) return;
      if (data?.roomId && String(data.roomId) !== String(roomId)) return;
      if (isSelf(data?.endedBy?._id)) return;
      finishCall(false);
    }

    function handleCallDeclined(data) {
      if (disposed || ended || !isInitiator || String(data?.quoteId) !== String(quoteId)) return;
      if (data?.roomId && String(data.roomId) !== String(roomId)) return;
      clearTimeout(ringTimer);
      ringTimer = null;
      setCallState("declined");
      finishCall(false, { keepState: true, closeDelay: 2500 });
    }

    // ---------- Teardown ----------
    function teardownMedia() {
      stopReadyLoop();
      clearTimeout(ringTimer);
      clearTimeout(peerLostTimer);
      clearTimeout(iceFailTimer);
      ringTimer = peerLostTimer = iceFailTimer = null;
      if (durationTimer) {
        clearInterval(durationTimer);
        durationTimer = null;
      }
      closePeerConnection();
      [screenStreamRef, localStreamRef].forEach((ref) => {
        ref.current?.getTracks().forEach((t) => {
          t.onended = null;
          t.stop();
        });
        ref.current = null;
      });
      remoteStreamRef.current = null;
      attachStream(localVideoEl.current, null);
      attachStream(remoteVideoEl.current, null);
      attachStream(remoteAudioEl.current, null);
    }

    function finishCall(notifyRemote, { keepState = false, closeDelay = CLOSE_DELAY_MS } = {}) {
      if (ended) return;
      ended = true;
      playEndTone();
      const seconds = currentDuration();
      setDuration(seconds);
      if (!keepState) setCallState("ended");
      socket.emit("leave_call_room", { quoteId, roomId });
      if (notifyRemote) {
        socket.emit("video_call_end", {
          quoteId,
          roomId,
          messageId: messageIdRef.current,
          durationSeconds: seconds,
        });
      }
      teardownMedia();
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => onCloseRef.current?.(), closeDelay);
    }
    endCallRef.current = (notifyRemote = true) => finishCall(notifyRemote);

    socket.on("webrtc_signal", handleSignal);
    socket.on("webrtc_ready", handlePeerReady);
    socket.on("peer_joined", handlePeerJoined);
    socket.on("peer_left", handlePeerLeft);
    socket.on("video_call_ended", handleCallEnded);
    socket.on("video_call_declined", handleCallDeclined);
    socket.on("connect", handleSocketConnect);

    if (!socket.connected) socket.connect();
    socket.emit("join_call_room", { quoteId, roomId });

    if (isInitiator) {
      ringTimer = setTimeout(() => {
        if (disposed || ended || callStateRef.current !== "calling") return;
        setCallState("timeout");
        // Notify so the callee's ringing popup is dismissed as well.
        finishCall(true, { keepState: true, closeDelay: 3000 });
      }, RING_TIMEOUT_MS);
    }

    (async () => {
      let stream = null;
      try {
        stream = await acquireLocalMedia();
      } catch (err) {
        console.warn("[WebRTC] Local media unavailable, joining receive-only:", err);
        if (!disposed) setMediaWarning(describeMediaError(err));
      }
      if (disposed || ended) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      localStreamRef.current = stream;
      const hasVideo = Boolean(stream?.getVideoTracks().length);
      const hasAudio = Boolean(stream?.getAudioTracks().length);
      setHasLocalVideo(hasVideo);
      setHasLocalAudio(hasAudio);
      videoOffRef.current = !hasVideo;
      audioMutedRef.current = !hasAudio;
      setVideoOff(!hasVideo);
      setAudioMuted(!hasAudio);
      if (stream && !hasVideo) setMediaWarning("Camera unavailable — you joined with audio only.");
      else if (stream && !hasAudio) setMediaWarning("Microphone unavailable — the other person won't hear you.");

      if (localVideoEl.current) {
        attachStream(localVideoEl.current, stream);
        if (stream) localVideoEl.current.play().catch(() => {});
      }

      try {
        buildPeerConnection();
      } catch (err) {
        console.error("[WebRTC] RTCPeerConnection failed:", err);
        setErrorMessage(`Your browser could not start a WebRTC connection: ${err.message}`);
        setCallState("error");
        return;
      }

      if (isInitiator) {
        if (peerReadyBeforePc) enqueue(() => makeOffer());
      } else {
        if (earlyOffer) {
          const offer = earlyOffer;
          earlyOffer = null;
          enqueue(() => handleOffer(offer));
        }
        startReadyLoop();
      }
    })();

    return () => {
      disposed = true;
      socket.off("webrtc_signal", handleSignal);
      socket.off("webrtc_ready", handlePeerReady);
      socket.off("peer_joined", handlePeerJoined);
      socket.off("peer_left", handlePeerLeft);
      socket.off("video_call_ended", handleCallEnded);
      socket.off("video_call_declined", handleCallDeclined);
      socket.off("connect", handleSocketConnect);
      if (!ended) socket.emit("leave_call_room", { quoteId, roomId });
      clearTimeout(closeTimer);
      teardownMedia();
      endCallRef.current = null;
      sendMediaStateRef.current = null;
    };
  }, [isOpen, quoteId, roomId, isInitiator, selfId, setCallState, playRemoteMedia]);

  const endCall = useCallback((notifyRemote = true) => {
    if (endCallRef.current) endCallRef.current(notifyRemote);
    else onCloseRef.current?.();
  }, []);

  const toggleAudio = useCallback(() => {
    const tracks = localStreamRef.current?.getAudioTracks() || [];
    if (!tracks.length) return;
    const nextMuted = !audioMutedRef.current;
    tracks.forEach((t) => {
      t.enabled = !nextMuted;
    });
    audioMutedRef.current = nextMuted;
    setAudioMuted(nextMuted);
    sendMediaStateRef.current?.();
  }, []);

  const toggleVideo = useCallback(() => {
    const tracks = localStreamRef.current?.getVideoTracks() || [];
    if (!tracks.length) return;
    const nextOff = !videoOffRef.current;
    tracks.forEach((t) => {
      t.enabled = !nextOff;
    });
    videoOffRef.current = nextOff;
    setVideoOff(nextOff);
    sendMediaStateRef.current?.();
  }, []);

  const stopScreenShare = useCallback(async () => {
    const screen = screenStreamRef.current;
    if (!screen) return;
    screen.getTracks().forEach((t) => {
      t.onended = null;
      t.stop();
    });
    screenStreamRef.current = null;
    const camTrack = localStreamRef.current?.getVideoTracks()[0] || null;
    const sender = findVideoSender(pcRef.current);
    if (sender) await sender.replaceTrack(camTrack).catch(() => {});
    attachStream(localVideoEl.current, localStreamRef.current);
    setIsScreenSharing(false);
    sendMediaStateRef.current?.();
  }, []);

  const startScreenShare = useCallback(async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setMediaWarning("Screen sharing is not supported in this browser.");
      return;
    }
    const sender = findVideoSender(pcRef.current);
    if (!sender) {
      setMediaWarning("Screen sharing needs an active camera track in this call.");
      return;
    }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const track = display.getVideoTracks()[0];
      if (!track) return;
      screenStreamRef.current = display;
      await sender.replaceTrack(track);
      track.onended = () => {
        stopScreenShare();
      };
      attachStream(localVideoEl.current, display);
      setIsScreenSharing(true);
      sendMediaStateRef.current?.();
    } catch (err) {
      console.warn("[WebRTC] Screen share cancelled or failed:", err);
    }
  }, [stopScreenShare]);

  const toggleScreenShare = useCallback(() => {
    if (screenStreamRef.current) stopScreenShare();
    else startScreenShare();
  }, [startScreenShare, stopScreenShare]);

  return {
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
  };
}
