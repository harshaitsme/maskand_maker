import { Router } from "express";
import { MaskController } from "../controllers/mask.controller.js";

const router = Router();

// Specialized routes placed BEFORE parameterized /:slug
router.get("/featured", MaskController.featured);
router.get("/artisan/:artisanSlug", MaskController.byArtisan);

// Standard catalog CRUD & detail routes
router.get("/", MaskController.list);
router.post("/", MaskController.create);
router.get("/:slug", MaskController.getBySlug);
router.get("/:slug/related", MaskController.related);
router.patch("/:slug/stock", MaskController.updateStock);

export { router as maskRoutes };
