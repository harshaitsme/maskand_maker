import { Router } from "express";
import { PortalController } from "../controllers/portal.controller.js";

export function createPortalRouter(controller: PortalController): Router {
  const router = Router();

  // Workbench Dashboard & Bench Orders
  router.get("/dashboard", controller.getDashboard);
  router.get("/bench-orders", controller.getBenchOrders);
  router.patch("/bench-orders/:orderId/status", controller.updateBenchOrderStatus);

  // Listings Workflow
  router.get("/listings", controller.getListings);
  router.get("/listings/:id", controller.getListingById);
  router.post("/listing", controller.createListingDraft);
  router.put("/listing/:id/photos", controller.uploadPhotos);
  router.put("/listing/:id/scan", controller.uploadScan);
  router.post("/listing/:id/mint", controller.mintCertificate);
  router.post("/listing/mint", controller.mintCertificate);
  router.post("/listing/:id/publish", controller.publishListing);

  // Settlement & Ledger
  router.get("/settlement/ledger", controller.getSettlementLedger);

  // Onboarding Wizard & Maker's Stamp
  router.get("/onboarding", controller.getOnboarding);
  router.post("/onboarding", controller.saveOnboarding);

  return router;
}
