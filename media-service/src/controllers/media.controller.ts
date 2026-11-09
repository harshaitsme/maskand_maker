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
import { MediaUploadedEvent, publishMediaUploaded } from "../config/rabbitmq.js";
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
      const baseUrl = process.env.PUBLIC_MEDIA_BASE_URL || "http://localhost:3009/api/media/stream";
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
}
