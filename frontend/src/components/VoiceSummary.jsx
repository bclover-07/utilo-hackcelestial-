"use client";
import { useState, useEffect } from "react";
import { Action } from "./ui";
export default function VoiceSummary({ text }) {
  const [url, setUrl] = useState("");
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  return (
    <div className="voice-summary">
      <Action
        className="quiet"
        run={async () => {
          const response = await fetch("/api/ai/speech", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "X-Utlio-Request": "1",
            },
            body: JSON.stringify({ text: text.slice(0, 1500) }),
          });
          if (!response.ok) {
            const body = await response.json();
            throw new Error(body.error || "Voice playback unavailable.");
          }
          setUrl(URL.createObjectURL(await response.blob()));
        }}
      >
        Listen to this summary
      </Action>
      {url && <audio controls src={url} aria-label="AI summary narration" />}
    </div>
  );
}
