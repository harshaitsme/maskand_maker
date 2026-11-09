import { Router } from "express";
import multer from "multer";
import { MediaController } from "../controllers/media.controller.js";

// Max 50 MB file size for 3D GLB models and high-res photography
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

export function createMediaRouter(controller: MediaController): Router {
  const router = Router();

  // Upload endpoints
  router.post("/upload", upload.single("file"), controller.uploadFile);
  router.post("/presigned-upload", controller.generatePresignedUpload);
  router.post("/register", controller.registerAsset);

  // Listing and metadata
  router.get("/files", controller.listMedia);
  router.get("/files/:id", controller.getMediaById);
  router.delete("/files/:id", controller.deleteMedia);
  router.get("/stats", controller.getStats);

  // Direct binary streaming proxy for images and .glb 3D models with CORS headers
  router.get("/stream/*", controller.streamMedia);

  return router;
}
