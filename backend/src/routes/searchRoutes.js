import { Router } from "express";
import { searchController as c } from "../controllers/searchController.js";

export const searchRoutes = Router();

searchRoutes.post("/search", c.search);
searchRoutes.get("/favorites", c.favorites);
searchRoutes.post("/favorites/:id", c.favorite);
searchRoutes.get("/saved-searches", c.savedSearches);
searchRoutes.post("/saved-searches", c.saveSearch);
searchRoutes.delete("/saved-searches/:id", c.deleteSearch);
