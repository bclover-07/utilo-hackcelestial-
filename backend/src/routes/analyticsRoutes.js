import { Router } from "express";
import { analyticsController as c } from "../controllers/analyticsController.js";

export const analyticsRoutes = Router();

analyticsRoutes.get("/analytics", c.analytics);
analyticsRoutes.get("/analytics/export", c.csv);
analyticsRoutes.get("/analytics/intelligence", c.intelligence);
analyticsRoutes.get("/analytics/demand-heatmap", c.demandHeatmap);
analyticsRoutes.get("/analytics/supply-utilization", c.supplyUtilization);
analyticsRoutes.get("/analytics/liquidity", c.liquidityRatios);
analyticsRoutes.get("/analytics/provider-performance", c.providerPerformance);
analyticsRoutes.get("/analytics/geo-clusters", c.geoClusters);
analyticsRoutes.get("/analytics/market-pulse", c.marketPulse);
analyticsRoutes.get("/analytics/revenue-trend", c.revenueTrend);
analyticsRoutes.get("/analytics/bundle-coverage", c.bundleCoverage);
