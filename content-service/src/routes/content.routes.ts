import { Router } from "express";
import { ContentController } from "../controllers/content.controller.js";

const router = Router();

// Traditions
router.get("/traditions", ContentController.listTraditions);
router.get("/traditions/:slug", ContentController.getTradition);

// Articles & Essays
router.get("/articles", ContentController.listArticles);
router.get("/articles/:slug", ContentController.getArticle);

// Craft Stages
router.get("/stages", ContentController.listStages);

// Experiential Workshops
router.get("/workshops", ContentController.listWorkshops);
router.post("/workshops/:id/book", ContentController.bookWorkshop);

export { router as contentRoutes };
