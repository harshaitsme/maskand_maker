export type SearchHitKind = "mask" | "artisan" | "article" | "page";
export type Tradition = "raksha" | "sanni" | "kolam";

export interface SearchHit {
  kind: SearchHitKind;
  title: string;
  subtitle: string;
  href: string;
  tradition?: Tradition;
}

export interface SearchStats {
  totalMasks: number;
  totalArtisans: number;
  totalArticles: number;
  totalTraditions: number;
  lastIndexedAt: string;
}

export interface SearchSuggestion {
  text: string;
  kind: SearchHitKind;
  href: string;
}
