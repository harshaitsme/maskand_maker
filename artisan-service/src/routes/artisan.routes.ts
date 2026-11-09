import { Router } from "express";
import { ArtisanController } from "../controllers/artisan.controller.js";

const router = Router();

// Routes
router.get("/", ArtisanController.list);
router.post("/", ArtisanController.create);
router.get("/:slug", ArtisanController.getBySlug);
router.get("/:slug/stats", ArtisanController.getStats);
router.patch("/:slug/metrics", ArtisanController.updateMetrics);

export { router as artisanRoutes };
