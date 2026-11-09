import { z } from "zod";

export const PresignedUploadRequestSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  assetType: z.enum(["image", "model-3d", "document"]),
  maskSlug: z.string().optional(),
  artisanSlug: z.string().optional(),
});

export const RegisterAssetSchema = z.object({
  key: z.string().min(1, "Asset key is required"),
  originalName: z.string().min(1, "Original name is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  sizeBytes: z.number().positive("Size must be positive"),
  sha256: z.string().min(1, "SHA-256 hash is required"),
  assetType: z.enum(["image", "model-3d", "document"]),
  maskSlug: z.string().optional(),
  artisanSlug: z.string().optional(),
  dimensions: z
    .object({
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .optional(),
  modelMetadata: z
    .object({
      triangleCount: z.number().optional(),
      format: z.enum(["glb", "gltf"]).default("glb"),
      hasTextures: z.boolean().default(true),
      dracoCompressed: z.boolean().default(false),
    })
    .optional(),
  uploadedBy: z.string().optional(),
});

export const FilterMediaQuerySchema = z.object({
  assetType: z.enum(["image", "model-3d", "document"]).optional(),
  maskSlug: z.string().optional(),
  artisanSlug: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type PresignedUploadRequestDto = z.infer<typeof PresignedUploadRequestSchema>;
export type RegisterAssetDto = z.infer<typeof RegisterAssetSchema>;
export type FilterMediaQueryDto = z.infer<typeof FilterMediaQuerySchema>;
