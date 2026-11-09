import { z } from "zod";
import { Article, CraftStage, Tradition, TraditionDoc, Workshop } from "../models/content.entity.js";

export const ArticleQuerySchema = z.object({
  kind: z.enum(["essay", "film", "field-notes"]).optional(),
  tradition: z.enum(["raksha", "sanni", "kolam", "all"]).optional(),
  q: z.string().optional(),
});

export type ArticleQueryParams = z.infer<typeof ArticleQuerySchema>;

/**
 * Validation schema for publishing a new heritage article / essay / field-notes
 */
export const CreateArticleSchema = z.object({
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens (e.g. 'kaduru-wood-lore')"),
  title: z.string().min(3),
  excerpt: z.string().min(5),
  tradition: z.enum(["raksha", "sanni", "kolam"]).optional(),
  kind: z.enum(["essay", "film", "field-notes"]),
  readMinutes: z.number().int().positive().default(5),
  date: z
    .string()
    .default(() => new Date().toISOString().split("T")[0]),
  image: z.string().optional(),
  body: z.array(z.string().min(1)).min(1, "Article body must contain at least one paragraph"),
});

export type CreateArticlePayload = z.infer<typeof CreateArticleSchema>;

export interface TraditionResponseDto extends TraditionDoc {
  _links: {
    self: string;
    masks: string;
  };
}

export interface ArticleResponseDto extends Article {
  _links: {
    self: string;
    tradition?: string;
  };
}
