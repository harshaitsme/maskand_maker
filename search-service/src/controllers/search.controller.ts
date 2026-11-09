import { Request, Response, NextFunction } from "express";
import { searchRepository } from "../models/search.repository.js";
import { SearchView } from "../views/search.view.js";
import { SearchQuerySchema, SuggestQuerySchema } from "../views/search.dto.js";

/**
 * SearchController - Controller Layer (MVC)
 * Coordinates full-text search across masks, artisans, and folklore essays.
 */
export class SearchController {
  /**
   * GET /api/search?q=query&kind=&limit=
   * Unified search endpoint powering the CommandPalette and global search bar.
   */
  public static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q, kind, limit } = SearchQuerySchema.parse(req.query);

      if (!q.trim()) {
        res.status(200).json(SearchView.renderHits("", []));
        return;
      }

      const hits = await searchRepository.search(q, kind, limit);

      // Cache search results for 60 seconds (HTTP/CDN Cache-Control)
      res.setHeader("Cache-Control", "public, max-age=60");

      // If client requests raw array (format=raw), return array directly
      if (req.query.format === "raw") {
        res.status(200).json(hits);
        return;
      }

      res.status(200).json(SearchView.renderHits(q, hits));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/search/suggest?q=prefix
   * Instant autocomplete suggestions
   */
  public static async suggest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q } = SuggestQuerySchema.parse(req.query);
      const suggestions = await searchRepository.getSuggestions(q);

      res.setHeader("Cache-Control", "public, max-age=120");
      res.status(200).json(SearchView.renderSuggestions(q, suggestions));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/search/stats
   * Search index metrics
   */
  public static async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await searchRepository.getStats();
      res.setHeader("Cache-Control", "public, max-age=30");
      res.status(200).json(SearchView.renderStats(stats));
    } catch (error) {
      next(error);
    }
  }
}
