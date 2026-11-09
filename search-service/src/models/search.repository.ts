import { SearchHit, SearchHitKind, SearchStats, SearchSuggestion, Tradition } from "./search.entity.js";
import { ArticleSearchModel, ArtisanSearchModel, MaskSearchModel, TraditionSearchModel } from "./search.schema.js";

const STATIC_PAGES: SearchHit[] = [
  { kind: "page", title: "Collection", subtitle: "All masks", href: "/masks" },
  { kind: "page", title: "Artisans", subtitle: "The makers", href: "/artisans" },
  { kind: "page", title: "Folklore Hub", subtitle: "Traditions & essays", href: "/heritage" },
  { kind: "page", title: "Verify a certificate", subtitle: "QR / NFC check", href: "/verify" },
  { kind: "page", title: "Impact & mission", subtitle: "Why we exist", href: "/about" },
  { kind: "page", title: "Your account", subtitle: "Orders & digital twins", href: "/account" },
];

/**
 * SearchRepository - Model Layer (MVC)
 * Executes multi-collection text search across masks, master artisans, and folklore essays.
 */
export class SearchRepository {
  /**
   * Global unified search across all domains
   */
  public async search(
    query: string,
    filterKind?: SearchHitKind,
    limit: number = 8
  ): Promise<SearchHit[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const regex = new RegExp(cleanQuery, "i");
    const hits: SearchHit[] = [];

    // Helper: capitalized tradition helper
    const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

    // 1. Search Masks (catalog-svc)
    if (!filterKind || filterKind === "mask") {
      const masks = await MaskSearchModel.find({
        $or: [
          { name: regex },
          { sinhala: regex },
          { region: regex },
          { wood: regex },
          { tradition: regex },
          { story: regex },
        ],
      })
        .limit(limit)
        .lean();

      // Fetch corresponding artisan names for subtitle formatting
      const artisanSlugs = [...new Set(masks.map((m: any) => m.artisanSlug))];
      const artisans = await ArtisanSearchModel.find({ slug: { $in: artisanSlugs } }).lean();
      const artisanMap = new Map(artisans.map((a: any) => [a.slug, a.name]));

      for (const m of masks as any[]) {
        const artisanName = artisanMap.get(m.artisanSlug) || "Ambalangoda";
        hits.push({
          kind: "mask",
          title: m.name,
          subtitle: `${cap(m.tradition)} · ${artisanName}`,
          href: `/masks/${m.slug}`,
          tradition: m.tradition as Tradition,
        });
      }
    }

    // 2. Search Artisans (artisan-svc)
    if (!filterKind || filterKind === "artisan") {
      const artisans = await ArtisanSearchModel.find({
        $or: [
          { name: regex },
          { sinhala: regex },
          { role: regex },
          { village: regex },
          { region: regex },
          { bio: regex },
        ],
      })
        .limit(limit)
        .lean();

      for (const a of artisans as any[]) {
        hits.push({
          kind: "artisan",
          title: a.name,
          subtitle: `${a.role || "Master Carver"} · ${a.village || a.region || "Ambalangoda"}`,
          href: `/artisans/${a.slug}`,
        });
      }
    }

    // 3. Search Heritage Articles (content-articles)
    if (!filterKind || filterKind === "article") {
      const articles = await ArticleSearchModel.find({
        $or: [
          { title: regex },
          { excerpt: regex },
          { tradition: regex },
          { body: regex },
        ],
      })
        .limit(limit)
        .lean();

      for (const a of articles as any[]) {
        const kindLabel = a.kind === "film" ? "Film" : a.kind === "field-notes" ? "Field Notes" : "Essay";
        hits.push({
          kind: "article",
          title: a.title,
          subtitle: `${kindLabel} · ${a.readMinutes || 5} min read`,
          href: `/heritage?article=${a.slug}`,
          tradition: a.tradition as Tradition,
        });
      }
    }

    // 4. Search Static Platform Pages
    if (!filterKind || filterKind === "page") {
      const lower = cleanQuery.toLowerCase();
      const matchingPages = STATIC_PAGES.filter(
        (p) => p.title.toLowerCase().includes(lower) || p.subtitle.toLowerCase().includes(lower)
      );
      hits.push(...matchingPages);
    }

    return hits.slice(0, limit);
  }

  /**
   * Fast autocomplete suggestions for instant search overlay
   */
  public async getSuggestions(prefix: string): Promise<SearchSuggestion[]> {
    const clean = prefix.trim();
    if (!clean) return [];

    const regex = new RegExp(clean, "i");
    const suggestions: SearchSuggestion[] = [];

    const [masks, artisans, articles] = await Promise.all([
      MaskSearchModel.find({ name: regex }).limit(3).select("name slug").lean(),
      ArtisanSearchModel.find({ name: regex }).limit(3).select("name slug").lean(),
      ArticleSearchModel.find({ title: regex }).limit(3).select("title slug").lean(),
    ]);

    for (const m of masks as any[]) {
      suggestions.push({ text: m.name, kind: "mask", href: `/masks/${m.slug}` });
    }
    for (const a of artisans as any[]) {
      suggestions.push({ text: a.name, kind: "artisan", href: `/artisans/${a.slug}` });
    }
    for (const art of articles as any[]) {
      suggestions.push({ text: art.title, kind: "article", href: `/heritage?article=${art.slug}` });
    }

    return suggestions;
  }

  /**
   * Aggregate statistics
   */
  public async getStats(): Promise<SearchStats> {
    const [totalMasks, totalArtisans, totalArticles, totalTraditions] = await Promise.all([
      MaskSearchModel.countDocuments(),
      ArtisanSearchModel.countDocuments(),
      ArticleSearchModel.countDocuments(),
      TraditionSearchModel.countDocuments(),
    ]);

    return {
      totalMasks,
      totalArtisans,
      totalArticles,
      totalTraditions,
      lastIndexedAt: new Date().toISOString(),
    };
  }
}

export const searchRepository = new SearchRepository();
