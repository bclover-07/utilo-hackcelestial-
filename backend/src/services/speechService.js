import { z } from "zod";
import { assert, ApiError } from "../middlewares/errors.js";
export async function speak(raw) {
  const { text } = z
    .object({ text: z.string().trim().min(1).max(1500) })
    .parse(raw);
  assert(
    process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID,
    503,
    "Voice playback is not configured.",
  );
  let response;
  try {
    response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(process.env.ELEVENLABS_VOICE_ID)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
        signal: AbortSignal.timeout(30000),
      },
    );
  } catch {
    throw new ApiError(503, "Voice service is unavailable.");
  }
  assert(
    response.ok,
    503,
    "Voice generation failed. Check ElevenLabs credentials and quota.",
  );
  return Buffer.from(await response.arrayBuffer());
}
