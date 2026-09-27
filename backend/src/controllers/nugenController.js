import { z } from "zod";
import * as nugen from "../services/nugenService.js";

export const nugenController = {
  status: async (req, res) => {
    const status = await nugen.getPipelineStatus();
    res.json(status);
  },

  listBaseModels: async (_req, res) => {
    const models = await nugen.listBaseModels();
    res.json(models);
  },

  listAlignedModels: async (_req, res) => {
    const models = await nugen.listAlignedModels();
    res.json(models);
  },

  getCorpus: async (_req, res) => {
    const corpus = await generateB2BRentalCorpus();
    res.json({ count: corpus.length, documents: corpus });
  },

  uploadCorpus: async (_req, res) => {
    const corpus = await generateB2BRentalCorpus();
    const result = await nugen.uploadDocuments(corpus);
    res.json({ message: "Domain corpus uploaded successfully", ...result });
  },

  listDocuments: async (_req, res) => {
    const docs = await nugen.listDocuments();
    res.json(docs);
  },

  documentStatus: async (req, res) => {
    const docId = z.string().min(1).parse(req.params.id);
    const status = await nugen.getDocumentStatus(docId);
    res.json(status);
  },

  createAlignment: async (req, res) => {
    const body = z.object({
      name: z.string().min(3).max(200).default("Utilo B2B Rental Domain Alignment"),
      documentIds: z.array(z.string()).min(1),
      description: z.string().max(500).default("Domain alignment for B2B industrial equipment rental platform"),
    }).parse(req.body);

    const result = await nugen.createAlignment(body.name, body.documentIds, body.description);
    res.json(result);
  },

  alignmentStatus: async (req, res) => {
    const alignmentId = z.string().min(1).parse(req.params.id);
    const status = await nugen.getAlignmentStatus(alignmentId);
    res.json(status);
  },

  listAlignments: async (_req, res) => {
    const alignments = await nugen.listAlignments();
    res.json(alignments);
  },

  deployModel: async (req, res) => {
    const modelId = z.string().min(1).parse(req.params.id);
    const result = await nugen.deployModel(modelId);
    res.json(result);
  },

  deploymentStatus: async (req, res) => {
    const modelId = z.string().min(1).parse(req.params.id);
    const status = await nugen.getDeploymentStatus(modelId);
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
