import { z } from "zod";

export const CreateListingDraftSchema = z.object({
  maskSlug: z.string().min(2).optional(),
  name: z.string().min(2, "Mask name must be at least 2 characters"),
  artisanSlug: z.string().min(2).default("chandana-bandara"),
  tradition: z.enum(["raksha", "sanni", "kolam"]),
  woodSpecies: z.string().optional().default("Kaduru (Strychnos nux-vomica)"),
  priceLKR: z.number().positive("Price must be a positive number"),
  stock: z.number().int().min(1).default(1),
});

export const UploadPhotosSchema = z.object({
  photos: z.array(z.string().min(1)).min(1, "At least 1 photograph required").max(4, "Max 4 photographs"),
});

export const UploadScanSchema = z.object({
  scanUrl: z.string().min(1, "Scan URL or model filename required"),
  scanProgress: z.number().min(0).max(100).default(100),
});

export const MintCertificateSchema = z.object({
  listingId: z.string().optional(),
  maskSlug: z.string().optional(),
  maskTitle: z.string().optional(),
  artisanSlug: z.string().optional().default("chandana-bandara"),
  tradition: z.enum(["raksha", "sanni", "kolam"]).optional().default("raksha"),
  woodSpecies: z.string().optional().default("Kaduru (Strychnos nux-vomica)"),
  priceLKR: z.number().optional().default(85000),
  photos: z.array(z.string()).optional(),
  scanUrl: z.string().optional(),
});

export const PublishListingSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
});

export const SaveOnboardingSchema = z.object({
  artisanSlug: z.string().optional().default("chandana-bandara"),
  language: z.enum(["en", "si", "ta"]).default("en"),
  village: z.string().min(2, "Village name is required"),
  tradition: z.enum(["raksha", "sanni", "kolam"]),
  firstPhotoUrl: z.string().optional().default(""),
});

export const UpdateBenchOrderStatusSchema = z.object({
  status: z.enum(["In carving", "Hand-over Friday", "Export papers", "Delivered"]),
});

export type CreateListingDraftDto = z.infer<typeof CreateListingDraftSchema>;
export type UploadPhotosDto = z.infer<typeof UploadPhotosSchema>;
export type UploadScanDto = z.infer<typeof UploadScanSchema>;
export type MintCertificateDto = z.infer<typeof MintCertificateSchema>;
export type PublishListingDto = z.infer<typeof PublishListingSchema>;
export type SaveOnboardingDto = z.infer<typeof SaveOnboardingSchema>;
export type UpdateBenchOrderStatusDto = z.infer<typeof UpdateBenchOrderStatusSchema>;
