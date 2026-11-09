import { Router } from "express";
import { SettlementController } from "../controllers/settlement.controller.js";

const router = Router();

// Platform & Aggregate Statistics
router.get("/stats", SettlementController.getStats);

// Artisan Bench Ledger & Balance Lookups
router.get("/ledger", SettlementController.getArtisanLedger);
router.get("/ledger/:artisanSlug", SettlementController.getArtisanLedger);

// Transaction History & Filtering
router.get("/", SettlementController.getTransactions);
router.get("/:id", SettlementController.getTransactionById);

// Recording Sales & Triggering Payouts
router.post("/sale", SettlementController.recordSale);
router.post("/payout", SettlementController.requestPayout);
router.patch("/:id/status", SettlementController.updateStatus);

export { router as settlementRoutes };
