/**
 * Mask & Maker - Domain Entities
 * Mirrors domain specifications defined in frontend (src/lib/types.ts) and Backend.md
 */

export type Tradition = "raksha" | "sanni" | "kolam";

export type MaskSize = "compact" | "display" | "monumental";

export interface Mask {
  slug: string;
  name: string;
  sinhala: string;
  tradition: Tradition;
  artisanSlug: string;
  priceLKR: number;
  year: number;
  heightCm: number;
  widthCm: number;
  depthCm: number;
  weightKg: number;
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
}

export interface MaskFilterQuery {
  tradition?: Tradition | "all";
  artisan?: string;
  q?: string;
  arOnly?: boolean;
  verifiedOnly?: boolean;
  maxPriceLKR?: number;
  sizes?: MaskSize[];
  sort?: "featured" | "price-asc" | "price-desc" | "newest";
}

/**
 * Computes size classification based on mask height
 * compact: < 30cm, display: 30-47cm, monumental: >= 48cm
 */
export function calculateSizeCategory(heightCm: number): MaskSize {
  if (heightCm < 30) return "compact";
  if (heightCm < 48) return "display";
  return "monumental";
}
