import { z } from "zod";
import { SearchHit, SearchHitKind } from "../models/search.entity.js";

export const SearchQuerySchema = z.object({
  q: z.string().default(""),
  kind: z.enum(["mask", "artisan", "article", "page"]).optional(),
  limit: z.coerce.number().int().positive().max(30).default(8),
});

export type SearchQueryParams = z.infer<typeof SearchQuerySchema>;

export const SuggestQuerySchema = z.object({
  q: z.string().min(1, "Search prefix 'q' is required"),
});

export interface SearchResponseDto {
  query: string;
  total: number;
  hits: SearchHit[];
}
