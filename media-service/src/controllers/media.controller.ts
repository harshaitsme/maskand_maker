import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import mime from "mime-types";
import { MediaRepository } from "../models/media.repository.js";
import { minioClient, MINIO_BUCKET } from "../config/minio.js";
import {
  FilterMediaQuerySchema,
  PresignedUploadRequestSchema,
  RegisterAssetSchema,
} from "../views/media.dto.js";
import { MediaView } from "../views/media.view.js";
import { MediaUploadedEvent, publishMediaUploaded, publish3DGenerated } from "../config/rabbitmq.js";
import { MediaAssetType } from "../models/media.entity.js";

export class MediaController {
  constructor(private mediaRepo: MediaRepository) {}

  // 1. Direct Multipart Upload
  uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: "BadRequest", message: "No file uploaded in 'file' field" });
        return;
      }

      const file = req.file;
      const maskSlug = req.body.maskSlug;
      const artisanSlug = req.body.artisanSlug || "chandana-bandara";

      // Detect asset type
      let assetType: MediaAssetType = "document";
      const ext = file.originalname.split(".").pop()?.toLowerCase();
      const detectedMime = mime.lookup(file.originalname) || file.mimetype;

      if (ext === "glb" || ext === "gltf" || detectedMime.includes("gltf") || req.body.assetType === "model-3d") {
        assetType = "model-3d";
      } else if (file.mimetype.startsWith("image/") || req.body.assetType === "image") {
        assetType = "image";
      }

      // Generate clean key
      let key = "";
      if (assetType === "model-3d") {
        key = `models/${maskSlug ? `${maskSlug}.glb` : `${crypto.randomUUID().slice(0, 8)}.glb`}`;
      } else if (assetType === "image") {
        key = `photos/${maskSlug || "misc"}/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      } else {
        key = `documents/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      }

      // Compute SHA-256
      const sha256 = crypto.createHash("sha256").update(file.buffer).digest("hex");

      // Upload to MinIO S3
      await minioClient.putObject(MINIO_BUCKET, key, file.buffer, file.size, {
        "Content-Type": detectedMime,
      });

      // Save metadata in MongoDB
      const baseUrl = process.env.PUBLIC_MEDIA_BASE_URL || "/api/media/stream";
      const publicUrl = `${baseUrl}/${key}`;

      const asset = await this.mediaRepo.create({
        key,
        bucket: MINIO_BUCKET,
        originalName: file.originalname,
        mimeType: detectedMime,
        sizeBytes: file.size,
        sha256,
        assetType,
        maskSlug,
        artisanSlug,
        publicUrl,
        modelMetadata:
          assetType === "model-3d"
            ? {
                format: ext === "gltf" ? "gltf" : "glb",
                hasTextures: true,
                dracoCompressed: false,
              }
            : undefined,
        uploadedBy: req.body.uploadedBy || "web-upload",
      });

      // Publish RabbitMQ event
      const event: MediaUploadedEvent = {
        eventId: crypto.randomUUID(),
        eventType: "media.uploaded",
        timestamp: new Date().toISOString(),
        data: {
          assetId: asset.id,
          assetType,
          key,
          bucket: MINIO_BUCKET,
          mimeType: detectedMime,
          sizeBytes: file.size,
          sha256,
          maskSlug,
          artisanSlug,
          publicUrl,
        },
      };
      await publishMediaUploaded(event);

      res.status(201).json({
        success: true,
        message: `File uploaded to MinIO bucket '${MINIO_BUCKET}' successfully`,
        asset: MediaView.formatAsset(asset),
      });
    } catch (error) {
      next(error);
    }
  };

  // 2. Pre-signed Upload URL Generator
  generatePresignedUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = PresignedUploadRequestSchema.parse(req.body);

      const ext = parsed.filename.split(".").pop()?.toLowerCase() || "";
      let key = "";
      if (parsed.assetType === "model-3d") {
        key = `models/${parsed.maskSlug ? `${parsed.maskSlug}.glb` : `${crypto.randomUUID().slice(0, 8)}.glb`}`;
      } else {
        key = `photos/${parsed.maskSlug || "misc"}/${Date.now()}-${parsed.filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      }

      // Generate pre-signed PUT url valid for 15 minutes
      const presignedUrl = await minioClient.presignedPutObject(MINIO_BUCKET, key, 15 * 60);

      res.status(200).json(MediaView.formatPresignedUpload(presignedUrl, key, MINIO_BUCKET, 15 * 60));
    } catch (error) {
      next(error);
    }
  };

  // 3. Register Pre-signed Uploaded Asset in MongoDB
  registerAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = RegisterAssetSchema.parse(req.body);

      const baseUrl = process.env.PUBLIC_MEDIA_BASE_URL || "http://localhost:3009/api/media/stream";
      const publicUrl = `${baseUrl}/${parsed.key}`;

      const asset = await this.mediaRepo.create({
        ...parsed,
        bucket: MINIO_BUCKET,
        publicUrl,
      });

      // Publish RabbitMQ event
      const event: MediaUploadedEvent = {
        eventId: crypto.randomUUID(),
        eventType: "media.uploaded",
        timestamp: new Date().toISOString(),
        data: {
          assetId: asset.id,
          assetType: parsed.assetType,
          key: parsed.key,
          bucket: MINIO_BUCKET,
          mimeType: parsed.mimeType,
          sizeBytes: parsed.sizeBytes,
          sha256: parsed.sha256,
          maskSlug: parsed.maskSlug,
          artisanSlug: parsed.artisanSlug,
          publicUrl,
        },
      };
      await publishMediaUploaded(event);

      res.status(201).json({
        success: true,
        message: "Asset registered successfully in catalog registry",
        asset: MediaView.formatAsset(asset),
      });
    } catch (error) {
      next(error);
    }
  };

  // 4. Stream / Proxy Media directly from MinIO (Ideal for <model-viewer> and WebXR with CORS)
  streamMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = (req.params as any)[0] || req.path.replace(/^\/stream\//, "");
      if (!key) {
        res.status(400).json({ success: false, error: "BadRequest", message: "Object key required" });
        return;
      }

      const mimeType = (mime.lookup(key) as string) || "application/octet-stream";

      // Set CORS and caching headers for 3D model streaming
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");

      const dataStream = await minioClient.getObject(MINIO_BUCKET, key);
      dataStream.on("error", (err: any) => {
        if (err.code === "NoSuchKey") {
          res.status(404).json({ success: false, error: "NotFound", message: `Object '${key}' not found in MinIO bucket '${MINIO_BUCKET}'` });
        } else {
          next(err);
        }
      });

      dataStream.pipe(res);
    } catch (error: any) {
      if (error.code === "NoSuchKey") {
        res.status(404).json({ success: false, error: "NotFound", message: "Object not found in storage" });
      } else {
        next(error);
      }
    }
  };

  // 5. List Media Assets
  listMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = FilterMediaQuerySchema.parse(req.query);
      const assets = await this.mediaRepo.findAll(
        {
          assetType: parsed.assetType,
          maskSlug: parsed.maskSlug,
          artisanSlug: parsed.artisanSlug,
        },
        parsed.limit,
        parsed.offset
      );

      const stats = await this.mediaRepo.getStats();

      res.status(200).json(MediaView.formatAssetList(assets, stats.totalAssets, stats));
    } catch (error) {
      next(error);
    }
  };

  // 6. Get Single Asset Metadata
  getMediaById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idOrKey = req.params.id;
      let asset = null;

      if (idOrKey.match(/^[0-9a-fA-F]{24}$/)) {
        asset = await this.mediaRepo.findById(idOrKey);
      }
      if (!asset) {
        asset = await this.mediaRepo.findByKey(idOrKey);
      }

      if (!asset) {
        res.status(404).json({ success: false, error: "NotFound", message: "Media asset not found" });
        return;
      }

      res.status(200).json({
        success: true,
        asset: MediaView.formatAsset(asset),
      });
    } catch (error) {
      next(error);
    }
  };

  // 7. Delete Asset
  deleteMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const asset = await this.mediaRepo.findById(id);

      if (!asset) {
        res.status(404).json({ success: false, error: "NotFound", message: "Asset not found" });
        return;
      }

      // Remove from MinIO
      try {
        await minioClient.removeObject(MINIO_BUCKET, asset.key);
      } catch (err) {
        console.warn(`MinIO removal failed for key '${asset.key}':`, err);
      }

      // Remove from DB
      await this.mediaRepo.deleteById(id);

      res.status(200).json({
        success: true,
        message: `Asset '${asset.key}' removed from storage and database`,
      });
    } catch (error) {
      next(error);
    }
  };

  // 8. Storage Statistics
  getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.mediaRepo.getStats();
      res.status(200).json(MediaView.formatStats(stats));
    } catch (error) {
      next(error);
    }
  };

  // 9. AI 3D Reconstruction Pipeline Link
  generate3DModel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let imageBuffer: Buffer | null = null;
      let filename = "image.jpg";
      const maskSlug = req.body.maskSlug || `mask-${Date.now()}`;
      const artisanSlug = req.body.artisanSlug || "chandana-bandara";
      const mcResolution = Number(req.body.mc_resolution || 256);
      const removeBg = req.body.remove_bg !== "false";

      // 1. Get input image either from uploaded file or existing MinIO asset
      if (req.file) {
        imageBuffer = req.file.buffer;
        filename = req.file.originalname;
      } else if (req.body.photoKey) {
        const dataStream = await minioClient.getObject(MINIO_BUCKET, req.body.photoKey);
        const chunks: Buffer[] = [];
        for await (const chunk of dataStream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        imageBuffer = Buffer.concat(chunks);
        filename = req.body.photoKey.split("/").pop() || "image.jpg";
      }

      if (!imageBuffer) {
        res.status(400).json({
          success: false,
          error: "BadRequest",
          message: "Please upload an image file or provide a valid 'photoKey' in request body",
        });
        return;
      }

      const aiUrl = process.env.AI_3D_SVC_URL || "http://localhost:8000";
      console.log(`🧠 [media-service] Forwarding image to 3D AI service at ${aiUrl}/convert...`);

      // 2. Prepare multipart request to 3D AI service
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: "image/jpeg" });
      formData.append("image", blob, filename);

      const aiRes = await fetch(
        `${aiUrl}/convert?mc_resolution=${mcResolution}&remove_bg=${removeBg}&smooth_mesh=true&orientation_fix=true`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!aiRes.ok) {
        const errorText = await aiRes.text().catch(() => "Unknown AI error");
        res.status(502).json({
          success: false,
          error: "BadGateway",
          message: `3D AI service conversion failed: ${errorText}`,
        });
        return;
      }

      const glbArrayBuffer = await aiRes.arrayBuffer();
      const glbBuffer = Buffer.from(glbArrayBuffer);
      const glbSize = glbBuffer.length;
      const key = `models/${maskSlug}.glb`;

      // 3. Compute SHA256 of generated GLB
      const sha256 = crypto.createHash("sha256").update(glbBuffer).digest("hex");

      // 4. Store GLB model into MinIO S3
      await minioClient.putObject(MINIO_BUCKET, key, glbBuffer, glbSize, {
        "Content-Type": "model/gltf-binary",
      });

      // 5. Register in MongoDB
      const baseUrl = process.env.PUBLIC_MEDIA_BASE_URL || "/api/media/stream";
      const publicUrl = `${baseUrl}/${key}`;

      const asset = await this.mediaRepo.create({
        key,
        bucket: MINIO_BUCKET,
        originalName: `${maskSlug}.glb`,
        mimeType: "model/gltf-binary",
        sizeBytes: glbSize,
        sha256,
        assetType: "model-3d",
        maskSlug,
        artisanSlug,
        publicUrl,
        modelMetadata: {
          triangleCount: 0,
          format: "glb",
          hasTextures: true,
          dracoCompressed: false,
        },
        uploadedBy: "3d-ai-service",
      });

      // 6. Publish RabbitMQ event
      await publish3DGenerated({
        eventId: crypto.randomUUID(),
        eventType: "media.3d_generated",
        timestamp: new Date().toISOString(),
        data: {
          assetId: asset.id,
          key,
          bucket: MINIO_BUCKET,
          sizeBytes: glbSize,
          sha256,
          maskSlug,
          artisanSlug,
          publicUrl,
          modelFormat: "glb",
        },
      });

      console.log(`✅ [media-service] 3D Model generated & stored in S3: ${key} (${glbSize} bytes)`);

      res.status(201).json({
        success: true,
        message: "3D GLB model generated and stored in S3 successfully",
        asset: MediaView.formatAsset(asset),
        modelViewerProps: {
          src: publicUrl,
          alt: `${maskSlug} 3D Model`,
          ar: true,
          autoRotate: true,
          cameraControls: true,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
