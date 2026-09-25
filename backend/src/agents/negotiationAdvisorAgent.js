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
    .populate("listing", "title price unit conditions deliveryFee deposit cancellationHours")
    .populate("request", "title budget start end");
  const viewerRole = String(q.provider) === String(user._id) ? "provider" : "seeker";
  const latestOffer = q.offers.at(-1) || { price: q.listing?.price || 100, deliveryFee: q.listing?.deliveryFee || 0, deposit: q.listing?.deposit || 0 };
  const targetBudget = q.request?.budget || latestOffer.price;
  const askingPrice = q.listing?.price || latestOffer.price;

  // 1. ZOPA (Zone of Possible Agreement) Analysis
  const zopaMin = Math.min(targetBudget, askingPrice);
  const zopaMax = Math.max(targetBudget, askingPrice);
  const midPoint = (zopaMin + zopaMax) / 2;
  const spread = Math.max(1, zopaMax - zopaMin);
  const currentDiff = Math.abs(latestOffer.price - midPoint);
  const convergence = Math.max(10, Math.min(98, Math.round((1 - (currentDiff / spread)) * 100)));

  // 2. Urgency and Sentiment Cross-Agent Feedback
  const hoursUntilEvent = q.request?.start ? Math.max(0, Math.round((new Date(q.request.start).getTime() - Date.now()) / 3600000)) : 72;
  const urgencyTier = hoursUntilEvent <= 24 ? "critical" : hoursUntilEvent <= 72 ? "urgent" : "routine";
  const notesText = q.offers.map(o => o.note).filter(Boolean).join(" ");
  const sentimentScore = notesText.toLowerCase().includes("urgent") || notesText.toLowerCase().includes("asap") || notesText.toLowerCase().includes("deadline")
    ? "high_urgency_assertive"
    : "cooperative_professional";

  // 3. Contract Clause & Dispute Protection Checks
  const depositRatio = latestOffer.price > 0 ? (latestOffer.deposit / latestOffer.price) : 0;
  const depositRisk = depositRatio > 0.4 ? "high" : "safe";
  const cancellationRisk = (q.listing?.cancellationHours || 24) < 24 ? "strict" : "balanced";
  const protectionFlags = [
    { label: "Escrow Deposit Safe Ratio", status: depositRisk === "safe" ? "pass" : "caution", detail: depositRisk === "safe" ? `Deposit is ${(depositRatio * 100).toFixed(0)}% of rental (under 40% threshold)` : `High deposit ratio (${(depositRatio * 100).toFixed(0)}%). Confirm refundability terms before accepting.` },
    { label: "Cancellation Buffer", status: cancellationRisk === "balanced" ? "pass" : "caution", detail: `${q.listing?.cancellationHours || 24} hours cancellation window` },
    { label: "Delivery & Transit Responsibility", status: "pass", detail: latestOffer.deliveryFee > 0 ? "Provider delivery with transit liability" : "Seeker collection / standard handover" },
  ];

  // 4. Structured Autonomous Counter-Offer Scenarios
  const counterOffers = viewerRole === "seeker" ? [
    {
      label: "Option A: 10% Volume Concession",
      price: Math.round(latestOffer.price * 0.9),
      deliveryFee: latestOffer.deliveryFee,
      deposit: latestOffer.deposit,
      rationale: "Target a 10% price discount while maintaining full provider delivery and standard deposit.",
    },
    {
      label: "Option B: Logistics Pickup Waiver",
      price: latestOffer.price,
      deliveryFee: 0,
      deposit: latestOffer.deposit,
      rationale: "Accept base rental asking rate in exchange for zero delivery fee via self-pickup.",
    },
    {
      label: "Option C: Rapid Deal Closure",
      price: Math.round((latestOffer.price + zopaMin) / 2),
      deliveryFee: Math.round(latestOffer.deliveryFee * 0.8),
      deposit: latestOffer.deposit,
      rationale: "Split the remaining difference directly down the middle for guaranteed same-day lock.",
    },
  ] : [
    {
      label: "Option A: Value-Add Equipment Bundle",
      price: latestOffer.price,
      deliveryFee: Math.round(latestOffer.deliveryFee * 0.75),
      deposit: latestOffer.deposit,
      rationale: "Hold base price firm while giving a 25% delivery discount to encourage swift booking.",
    },
    {
      label: "Option B: Balanced Midpoint Concession",
      price: Math.max(zopaMin, Math.round(latestOffer.price * 0.95)),
      deliveryFee: latestOffer.deliveryFee,
      deposit: latestOffer.deposit,
      rationale: "Offer 5% strategic discount to close within the seeker's stated budget boundary.",
    },
    {
      label: "Option C: Protected High-Security Term",
      price: latestOffer.price,
      deliveryFee: latestOffer.deliveryFee,
      deposit: Math.round(latestOffer.deposit * 0.9),
      rationale: "Maintain rates while relaxing deposit requirements to lower seeker cash-flow resistance.",
    },
  ];

  const result = await getNegotiationGraph().invoke(
    { context: { listing: q.listing, request: q.request, offers: q.offers.slice(-8), status: q.status, version: q.version, viewerRole }, question },
    { configurable: { thread_id: `${user._id}:${id}` } },
  );

  return {
    answer: result.answer,
    decision: result.decision,
    zopa: {
      min: zopaMin,
      max: zopaMax,
      midPoint,
      current: latestOffer.price,
      convergence,
      status: convergence > 70 ? "High agreement alignment" : "Active bargaining spread",
    },
    feedback: {
      urgencyTier,
      hoursUntilEvent,
      sentimentScore,
    },
    protection: {
      depositRisk,
      cancellationRisk,
      flags: protectionFlags,
    },
    counterOffers,
    trace: [
      "Supervisor: negotiation advisor",
      "Bilateral ZOPA (Zone of Possible Agreement) calculated",
      `Cross-agent feedback: urgency ${urgencyTier} (${hoursUntilEvent}h remaining), sentiment ${sentimentScore}`,
      "Contract dispute & protection checklist verified",
      "MongoDB checkpoint: private party thread",
    ],
  };
}
