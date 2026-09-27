import { Router } from "express";
import { digitalTwinController } from "../controllers/digitalTwinController.js";

export const digitalTwinRoutes = Router();

digitalTwinRoutes.get("/digital-twin/state", digitalTwinController.state);
digitalTwinRoutes.get("/digital-twin/weather", digitalTwinController.weather);
digitalTwinRoutes.get("/digital-twin/forecast", digitalTwinController.forecast);
digitalTwinRoutes.get("/digital-twin/multi-city", digitalTwinController.multiCity);
digitalTwinRoutes.post("/digital-twin/simulate", digitalTwinController.simulate);
digitalTwinRoutes.get("/digital-twin/presets", digitalTwinController.presets);
digitalTwinRoutes.get("/digital-twin/social", digitalTwinController.socialSignals);
