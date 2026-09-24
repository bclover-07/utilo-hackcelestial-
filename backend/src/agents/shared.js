import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { InferenceClient } from "@huggingface/inference";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { assert, ApiError } from "../middlewares/errors.js";
import { withDeadline } from "../services/deadline.js";

export { Annotation, StateGraph, START, END };

export function llm() {
  assert(process.env.GEMINI_API_KEY, 503, "Gemini is not configured.");
  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    temperature: 0.2,
    maxRetries: 1,
    maxOutputTokens: 1800,
  });
}

export async function invokeModel(system, input, schema) {
  try {
    const model = schema ? llm().withStructuredOutput(schema, { method: "jsonSchema" }) : llm();
    const result = await withDeadline((signal) =>
      model.invoke(
        [new SystemMessage(system), new HumanMessage(JSON.stringify(input))],
        { signal },
      ),
    );
    return schema
      ? schema.parse(result)
      : typeof result.content === "string"
        ? result.content
        : result.content
            .filter((p) => p.type === "text")
            .map((p) => p.text)
            .join("\n");
  } catch (error) {
    if (error instanceof ApiError) throw error;
    
    console.warn("AI invocation failed", { structured: !!schema, type: error.name, status: Number(error.status) || undefined });
    throw new ApiError(
      503,
      schema
        ? "AI could not produce a valid requirement draft. Retry or enter and confirm the requirements manually; no request was created."
        : "AI could not complete this response. Retry shortly; no generated result was saved.",
    );
  }
}

export async function invoke(system, input, schema) {
  const state = Annotation.Root({ answer: Annotation() });
  const agent = new StateGraph(state)
    .addNode("reason", async () => ({
      answer: await invokeModel(system, input, schema),
    }))
    .addEdge(START, "reason")
    .addEdge("reason", END)
    .compile();
  return (await agent.invoke({})).answer;
}

export async function embed(text) {
  assert(
    process.env.HF_TOKEN,
    503,
    "Hugging Face embeddings are not configured.",
  );
  try {
    const client = new InferenceClient(process.env.HF_TOKEN);
    const vector = await withDeadline((signal) =>
      client.featureExtraction(
        {
          model:
            process.env.HF_EMBEDDING_MODEL ||
            "sentence-transformers/all-MiniLM-L6-v2",
          inputs: text,
          provider: "hf-inference",
        },
        { signal },
      ),
    );
    assert(
      Array.isArray(vector) &&
        vector.length > 0 &&
        vector.every(Number.isFinite),
      502,
      "Embedding provider returned an invalid vector.",
    );
    return vector;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      503,
      "Hugging Face embeddings are unavailable. Check token permissions, model and inference quota.",
    );
  }
}

export function cosine(a, b) {
  if (a.length !== b.length) return 0;
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const norm = Math.sqrt(
    a.reduce((s, v) => s + v * v, 0) * b.reduce((s, v) => s + v * v, 0),
  );
  return norm ? dot / norm : 0;
}
