/**
 * Mask & Maker - Artisan Domain Entities
 * Mirrors domain specifications defined in frontend (src/lib/types.ts) and Backend.md
 */

export type Tradition = "raksha" | "sanni" | "kolam";

export interface ArtisanGeneration {
  name: string;
  years: string;
  note: string;
}

export interface Artisan {
  slug: string;
  name: string;
  sinhalaName: string;
  role: string;
  region: string;
  village: string;
  born: number;
  since: number;
  ordersFulfilled: number;
  rating: number;
  verified: boolean;
  photo?: string;
  initials: string;
  bio: string;
  story: string;
  tools: string[];
  styleNotes: string[];
  generations: ArtisanGeneration[];
  focusTraditions: Tradition[];
}

export interface ArtisanFilterQuery {
  tradition?: Tradition | "all";
  region?: string;
  verifiedOnly?: boolean;
  q?: string;
  sort?: "rating" | "experience" | "orders" | "name";
}
