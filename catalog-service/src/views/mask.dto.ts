import { z } from "zod";
import { MaskSize, Tradition } from "../models/mask.entity.js";

/**
 * Validation schema for list masks query string
 */
export const MaskQuerySchema = z.object({
  tradition: z.enum(["raksha", "sanni", "kolam", "all"]).optional(),
  artisan: z.string().optional(),
  q: z.string().optional(),
  arOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  verifiedOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  maxPriceLKR: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
  sizes: z
    .string()
    .optional()
    .transform((val) => (val ? (val.split(",") as MaskSize[]) : undefined)),
  sort: z.enum(["featured", "price-asc", "price-desc", "newest"]).optional(),
});

export type MaskQueryParams = z.infer<typeof MaskQuerySchema>;

/**
 * Request payload when creating a new mask listing from artisan portal
 */
export const CreateMaskSchema = z.object({
  slug: z.string().min(3),
  name: z.string().min(2),
  sinhala: z.string().min(1),
  tradition: z.enum(["raksha", "sanni", "kolam"]),
  artisanSlug: z.string().min(2),
  priceLKR: z.number().positive(),
  year: z.number().int().min(1900).max(2100),
  heightCm: z.number().positive(),
  widthCm: z.number().positive(),
  depthCm: z.number().positive(),
  weightKg: z.number().positive(),
  wood: z.string().min(3),
  dyes: z.array(z.string()).min(1),
  carvingDays: z.number().int().positive(),
  image: z.string().optional(),
  plateSeed: z.number().int().default(1),
  plateVariant: z.number().int().default(0),
  story: z.string().min(10),
  context: z.string().min(10),
  arAvailable: z.boolean().default(false),
  verified: z.boolean().default(true),
  stock: z.number().int().min(0).default(1),
  featured: z.boolean().optional(),
  region: z.string().min(2),
  certId: z.string().regex(/^MM-\d{4}-\d{4}$/, "Certificate must follow MM-YYYY-XXXX format"),
});

export type CreateMaskPayload = z.infer<typeof CreateMaskSchema>;

/**
 * Exact representation expected by frontend src/lib/types.ts
 */
export interface MaskResponseDto {
  slug: string;
  name: string;
  sinhala: string;
  tradition: Tradition;
  artisanSlug: string;
  priceLKR: number;
  priceUSD: number;
  year: number;
  heightCm: number;
  widthCm: number;
  depthCm: number;
  weightKg: number;
  sizeCategory: MaskSize;
  wood: string;
  dyes: string[];
  carvingDays: number;
  image?: string;
  plateSeed: number;
  plateVariant: number;
  story: string;
  context: string;
  arAvailable: boolean;
  verified: boolean;
  stock: number;
  featured?: boolean;
  region: string;
  certId: string;
  _links: {
    self: string;
    artisan: string;
    certificate: string;
    model3d?: string;
  };
}
