import { Router } from "express";
import { SearchController } from "../controllers/search.controller.js";

const router = Router();

// Full-text search endpoint
router.get("/", SearchController.search);

// Autocomplete suggestions
router.get("/suggest", SearchController.suggest);

// Search metrics
router.get("/stats", SearchController.getStats);

export { router as searchRoutes };
