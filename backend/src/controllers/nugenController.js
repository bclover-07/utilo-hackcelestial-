import { z } from "zod";
import * as nugen from "../services/nugenService.js";

export const nugenController = {
  status: async (req, res) => {
    const status = await nugen.getPipelineStatus();
    res.json(status);
  },

  chat: async (req, res) => {
    const body = z.object({
      message: z.string().trim().min(1).max(2000),
      history: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).max(10).default([]),
    }).parse(req.body);

    const result = await nugen.assistantChat(body.message, body.history);
    const answer = result.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
    res.json({
      answer,
      source: result.source,
    });
  },

  negotiationAdvice: async (req, res) => {
    const body = z.object({
      context: z.record(z.string(), z.unknown()),
    }).parse(req.body);

    const result = await nugen.negotiationAdvice(body.context);
    const advice = result.choices?.[0]?.message?.content || "Unable to generate advice.";
    res.json({
      advice,
      marketStats: result.marketStats,
      recommendedCounter: result.recommendedCounter,
      estimatedSavings: result.estimatedSavings,
      source: result.source,
    });
  },

  optimizeListing: async (req, res) => {
    const body = z.object({
      listing: z.record(z.string(), z.unknown()),
    }).parse(req.body);

    const result = await nugen.optimizeListing(body.listing);
    const suggestions = result.choices?.[0]?.message?.content || "Unable to generate suggestions.";
    let parsed;
    try {
      parsed = JSON.parse(suggestions);
    } catch {
      parsed = { rawSuggestions: suggestions };
    }
    res.json({
      suggestions: parsed,
      marketStats: result.marketStats,
      source: result.source,
    });
  },
};
