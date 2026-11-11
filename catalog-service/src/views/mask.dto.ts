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
  slug: z.string().min(1),
  name: z.string().min(1),
  sinhala: z.string().optional().default(""),
  tradition: z.enum(["raksha", "sanni", "kolam"]).default("raksha"),
  artisanSlug: z.string().min(1).default("chandana-bandara"),
  priceLKR: z.number().positive().default(85000),
  year: z.number().int().min(1900).max(2100).default(new Date().getFullYear()),
  heightCm: z.number().positive().default(44),
  widthCm: z.number().positive().default(36),
  depthCm: z.number().positive().default(18),
  weightKg: z.number().positive().default(1.4),
  wood: z.string().optional().default("Kaduru heartwood (Strychnos nux-vomica)"),
  dyes: z.array(z.string()).optional().default(["Natural Pigments"]),
  carvingDays: z.number().int().positive().default(24),
  image: z.string().optional().default("/images/masks/default.jpg"),
  plateSeed: z.number().int().default(1),
  plateVariant: z.number().int().default(0),
  story: z.string().optional().default(""),
  context: z.string().optional().default(""),
  arAvailable: z.boolean().default(false),
  verified: z.boolean().default(true),
  stock: z.number().int().min(0).default(1),
  featured: z.boolean().optional().default(false),
  region: z.string().optional().default("Ambalangoda, Sri Lanka"),
  certId: z.string().optional().default(""),
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
