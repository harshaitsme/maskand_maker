import { z } from "zod";
import { Article, CraftStage, Tradition, TraditionDoc, Workshop } from "../models/content.entity.js";

export const ArticleQuerySchema = z.object({
  kind: z.enum(["essay", "film", "field-notes"]).optional(),
  tradition: z.enum(["raksha", "sanni", "kolam", "all"]).optional(),
  q: z.string().optional(),
});

export type ArticleQueryParams = z.infer<typeof ArticleQuerySchema>;

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
