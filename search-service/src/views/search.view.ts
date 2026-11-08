import { SearchHit, SearchStats, SearchSuggestion } from "../models/search.entity.js";

/**
 * SearchView - View / Presenter Layer (MVC)
 * Formats multi-domain search hits into client representations matching
 * the frontend's CommandPalette (Cmd+K) and Search Hit interfaces.
 */
export class SearchView {
  public static renderHits(query: string, hits: SearchHit[]) {
    return {
      query,
      count: hits.length,
      hits,
      _links: {
        self: `/api/search?q=${encodeURIComponent(query)}`,
      },
    };
  }

  public static renderSuggestions(query: string, suggestions: SearchSuggestion[]) {
    return {
      query,
      count: suggestions.length,
      suggestions,
    };
  }

  public static renderStats(stats: SearchStats) {
    return {
      service: "search-service",
      domain: "full-text-cross-collection-search",
      metrics: {
        ...stats,
        totalSearchableEntities:
          stats.totalMasks + stats.totalArtisans + stats.totalArticles + stats.totalTraditions,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
