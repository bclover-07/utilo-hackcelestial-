import { Router } from "express";
import { getWorkProcessHistory } from "../services/workProcessService.js";

export const workProcessRoutes = Router();

workProcessRoutes.get("/work-processes", async (req, res) => {
  const history = await getWorkProcessHistory(req.user._id, 50);
  res.json(history);
});
