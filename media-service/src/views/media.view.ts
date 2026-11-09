import { MediaAssetDoc, MediaStats } from "../models/media.entity.js";

export class MediaView {
  static formatAsset(doc: MediaAssetDoc | any) {
    const raw = doc.toObject ? doc.toObject() : doc;
    const id = raw.id || raw._id?.toString() || "";

    const baseUrl =
      process.env.PUBLIC_MEDIA_BASE_URL || "http://localhost:3009/api/media/stream";
    const directStreamingUrl = `${baseUrl}/${raw.key}`;

    return {
      id,
      key: raw.key,
      bucket: raw.bucket,
      originalName: raw.originalName,
      mimeType: raw.mimeType,
      sizeBytes: raw.sizeBytes,
      sha256: raw.sha256,
      assetType: raw.assetType,
      maskSlug: raw.maskSlug || null,
      artisanSlug: raw.artisanSlug || null,
      publicUrl: directStreamingUrl,
      dimensions: raw.dimensions || null,
      modelMetadata: raw.modelMetadata || null,
      uploadedBy: raw.uploadedBy || "system",
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      _links: {
        self: `/api/media/files/${id}`,
        stream: directStreamingUrl,
        download: `/api/media/download/${id}`,
      },
    };
  }

  static formatAssetList(assets: (MediaAssetDoc | any)[], total: number, stats?: MediaStats) {
    return {
      success: true,
      count: assets.length,
      total,
      ...(stats ? { stats } : {}),
      assets: assets.map((a) => MediaView.formatAsset(a)),
    };
  }

  static formatPresignedUpload(
    uploadUrl: string,
    key: string,
    bucket: string,
    expiresInSeconds = 900
  ) {
    return {
      success: true,
      message: "Pre-signed S3 upload URL generated. Issue HTTP PUT with binary body.",
      uploadUrl,
      method: "PUT",
      key,
      bucket,
      expiresInSeconds,
      headers: {
        "Content-Type": "application/octet-stream",
      },
    };
  }

  static formatStats(stats: MediaStats) {
    return {
      success: true,
      data: stats,
    };
  }

  static formatSuccess(message: string, data?: any) {
    return {
      success: true,
      message,
      ...(data ? { data } : {}),
    };
  }
}
