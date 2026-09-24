import { Router } from "express";
import multer from "multer";
import { uploadController as c } from "../controllers/uploadController.js";

export const uploadRoutes = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
});

uploadRoutes.post("/uploads", upload.single("file"), c.upload);
uploadRoutes.get("/uploads/:id/document", c.document);
