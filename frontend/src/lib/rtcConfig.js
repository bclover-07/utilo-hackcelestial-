// ICE server configuration for WebRTC calls.
// STUN works for most home/office networks. For strict NATs, mobile carriers or
// corporate firewalls, a TURN relay is required — configure it via env vars:
//   NEXT_PUBLIC_TURN_URLS=turn:turn.example.com:3478,turns:turn.example.com:5349
//   NEXT_PUBLIC_TURN_USERNAME=...
//   NEXT_PUBLIC_TURN_CREDENTIAL=...

const STUN_URLS = [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
  "stun:stun2.l.google.com:19302",
  "stun:global.stun.twilio.com:3478",
];

const TURN_URLS = (process.env.NEXT_PUBLIC_TURN_URLS || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

export function getRtcConfig() {
  const iceServers = [{ urls: STUN_URLS }];
  if (TURN_URLS.length) {
    iceServers.push({
      urls: TURN_URLS,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME || "",
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || "",
    });
  }
  return {
    iceServers,
    iceCandidatePoolSize: 4,
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
  };
}

export const hasTurnServer = TURN_URLS.length > 0;
