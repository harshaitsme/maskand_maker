import { Router } from "express";
import { VerifyController } from "../controllers/verify.controller.js";

const router = Router();

// Registry Aggregates & Listing
router.get("/", VerifyController.listCertificates);
router.post("/", VerifyController.registerCertificate);
router.get("/stats", VerifyController.getStats);

// NFC Hardware Tap Authentication
router.post("/nfc/authenticate", VerifyController.authenticateNfc);

// Mask Slug Lookup
router.get("/mask/:maskSlug", VerifyController.verifyByMask);

// Certificate Verification & Digital Twin Actions
router.get("/:certId", VerifyController.verifyCert);
router.post("/:certId/claim", VerifyController.claimTwin);
router.post("/:certId/report", VerifyController.reportTamper);

export { router as verifyRoutes };
