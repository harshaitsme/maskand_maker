import { z } from "zod";
import { ArtisanGeneration, Tradition } from "../models/artisan.entity.js";

/**
 * Validation schema for list artisans query string
 */
export const ArtisanQuerySchema = z.object({
  tradition: z.enum(["raksha", "sanni", "kolam", "all"]).optional(),
  region: z.string().optional(),
  verifiedOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  q: z.string().optional(),
  sort: z.enum(["rating", "experience", "orders", "name"]).optional(),
});

export type ArtisanQueryParams = z.infer<typeof ArtisanQuerySchema>;

/**
 * Validation schema for registering a new artisan
 */
export const CreateArtisanSchema = z.object({
  slug: z.string().min(3),
  name: z.string().min(2),
  sinhalaName: z.string().min(1),
  role: z.string().min(3),
  region: z.string().min(2),
  village: z.string().min(2),
  born: z.number().int().min(1900).max(2015),
  since: z.number().int().min(1900).max(2026),
  ordersFulfilled: z.number().int().min(0).default(0),
  rating: z.number().min(1).max(5).default(5.0),
  verified: z.boolean().default(true),
  photo: z.string().optional(),
  initials: z.string().min(2).max(4),
  bio: z.string().min(10),
  story: z.string().min(10),
  tools: z.array(z.string()).default([]),
  styleNotes: z.array(z.string()).default([]),
  generations: z
    .array(
      z.object({
        name: z.string(),
        years: z.string(),
        note: z.string(),
      })
    )
    .default([]),
  focusTraditions: z.array(z.enum(["raksha", "sanni", "kolam"])).default([]),
});

export type CreateArtisanPayload = z.infer<typeof CreateArtisanSchema>;

/**
 * Exact representation expected by frontend src/lib/types.ts
 */
export interface ArtisanResponseDto {
  slug: string;
  name: string;
  sinhalaName: string;
  role: string;
  region: string;
  village: string;
  born: number;
  since: number;
  yearsOfMastery: number;
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
  _links: {
    self: string;
    masks: string;
    workshopStats: string;
  };
}
