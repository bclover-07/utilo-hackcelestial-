import { z } from "zod";
import { analytics, csv } from "../services/analyticsService.js";
import * as pipelines from "../services/aggregationPipelines.js";

const send = (fn) => async (req, res) => res.json(await fn(req, res));
const accountMode = (req) =>
  z.enum(["provider", "seeker"]).optional().parse(req.query.mode);
const filters = (req) =>
  z
    .object({
      city: z.string().max(100).optional(),
      category: z.string().max(100).optional(),
    })
    .parse(req.query);

export const analyticsController = {
  analytics: send((req) => analytics(req.user, accountMode(req))),

  csv: async (req, res) =>
    res
      .type("text/csv")
      .attachment("utlio-bookings.csv")
      .send(await csv(req.user, accountMode(req))),

  demandHeatmap: send((req) => pipelines.demandHeatmap(filters(req))),

  supplyUtilization: send((req) =>
    pipelines.supplyUtilization(req.user._id, filters(req)),
  ),

  liquidityRatios: send((req) => pipelines.liquidityRatios(filters(req))),

  providerPerformance: send((req) =>
    pipelines.providerPerformance(req.user._id),
  ),

  geoClusters: send((req) => pipelines.geoClusters(filters(req))),

  marketPulse: send(() => pipelines.marketPulse()),

  revenueTrend: send((req) =>
    pipelines.revenueTrend(req.user._id, accountMode(req)),
  ),

  bundleCoverage: send((req) => pipelines.bundleCoverage(req.user._id)),

  intelligence: send(async (req) => {
    const market = filters(req);
    const owner = req.user.role === "admin" ? undefined : req.user._id;
    const [demand, supply, liquidity, clusters, coverage, revenue] =
      await Promise.all([
        pipelines.demandHeatmap(market),
        pipelines.supplyUtilization(owner, market),
        pipelines.liquidityRatios(market),
        pipelines.geoClusters(market),
        pipelines.bundleCoverage(owner),
        pipelines.revenueTrend(owner, accountMode(req)),
      ]);
    return { demand, supply, liquidity, clusters, coverage, revenue, filters: market, checkedAt: new Date().toISOString() };
  }),
};
