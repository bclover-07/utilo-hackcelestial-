import { z } from "zod";
import mongoose from "mongoose";
import { Annotation, StateGraph, START, END, invoke } from "./shared.js";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { Quote } from "../models/Quote.js";
import { getQuote } from "../services/quoteService.js";
import { adviceSchema, adviceInstruction } from "../services/agentContracts.js";

const NegState = Annotation.Root({
  context: Annotation(),
  question: Annotation(),
  answer: Annotation(),
  decision: Annotation(),
  history: Annotation({
    reducer: (a, b) => a.concat(b).slice(-12),
    default: () => [],
  }),
});

let negotiationGraph;
function getNegotiationGraph() {
  if (!negotiationGraph) {
    const checkpointer = new MongoDBSaver({
      client: mongoose.connection.getClient(),
      dbName: mongoose.connection.name,
    });
    negotiationGraph = new StateGraph(NegState)
      .addNode("advisor", async (s) => {
        const decision = await invoke(
          "You advise the viewerRole party in a B2B negotiation. Use only this actual quote and history. Suggest specific trade-offs in price, delivery, duration and terms supported by this quote. Highlight changed offer versions; historical advice is not current consent. Never invent market statistics or success probabilities. Do not accept offers or change data." + adviceInstruction,
          { context: s.context, history: s.history, question: s.question },
          adviceSchema, "Advise private negotiation",
        );
        return { decision, answer: decision.summary, history: [{ question: s.question, answer: decision.summary }] };
      })
      .addEdge(START, "advisor")
      .addEdge("advisor", END)
      .compile({ checkpointer });
  }
  return negotiationGraph;
}

export async function adviseNegotiation(user, id, raw) {
  await getQuote(user, id);
  const question = z.string().trim().min(3).max(1500).parse(raw.question);
  const q = await Quote.findById(id)
    .populate("listing", "title price unit conditions")
    .populate("request", "title budget start end");
  const result = await getNegotiationGraph().invoke(
    { context: { listing: q.listing, request: q.request, offers: q.offers.slice(-8), status: q.status, version: q.version, viewerRole: String(q.provider) === String(user._id) ? "provider" : "seeker" }, question },
    { configurable: { thread_id: `${user._id}:${id}` } },
  );
  return {
    answer: result.answer,
    decision: result.decision,
    trace: [
      "Supervisor: negotiation",
      "MongoDB checkpoint: private party thread",
      "Negotiation advisor: suggestion only",
    ],
  };
}
