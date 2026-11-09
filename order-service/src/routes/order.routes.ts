import { Router } from "express";
import { OrderController } from "../controllers/order.controller.js";

const router = Router();

// Order Aggregates & Listing
router.get("/", OrderController.listOrders);
router.post("/", OrderController.createOrder);
router.get("/stats", OrderController.getStats);

// Single Order & Status Progression
router.get("/:id", OrderController.getOrder);
router.patch("/:id/status", OrderController.updateOrderStatus);

export { router as orderRoutes };
