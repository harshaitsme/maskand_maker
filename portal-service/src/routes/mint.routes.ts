import { Router } from "express";
import { PortalController } from "../controllers/portal.controller.js";

/**
 * Mint Service Dedicated Router (/api/mint)
 * Provides direct blockchain provenance minting endpoints
 */
export function createMintRouter(controller: PortalController): Router {
  const router = Router();

  router.post("/", controller.mintCertificate);
  router.post("/:id", controller.mintCertificate);

  return router;
}
