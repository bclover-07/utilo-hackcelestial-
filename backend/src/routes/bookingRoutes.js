import { Router } from "express";
import { bookingController as c } from "../controllers/bookingController.js";

export const bookingRoutes = Router();

bookingRoutes.get("/bookings", c.bookings);
bookingRoutes.patch("/bookings/:id/status", c.bookingStatus);
bookingRoutes.post("/bookings/:id/review", c.review);
bookingRoutes.post("/bookings/:id/dispute", c.dispute);
bookingRoutes.get("/bookings/:id/calendar", c.calendar);
bookingRoutes.get("/bookings/:id/summary", c.receipt);
bookingRoutes.get("/reviews", c.reviews);
bookingRoutes.get("/disputes", c.disputes);
