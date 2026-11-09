/**
 * Mask & Maker - Content & Heritage Domain Entities
 * Mirrors domain specifications defined in frontend (src/lib/types.ts) and Backend.md
 */

export type Tradition = "raksha" | "sanni" | "kolam";

export interface TraditionDoc {
  slug: Tradition;
  name: string;
  sinhala: string;
  marker: "vermilion" | "forest" | "gold";
  tagline: string;
  description: string;
  ritual: string[];
  examples: string[];
  palette: string[];
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  tradition?: Tradition;
  kind: "essay" | "film" | "field-notes";
  readMinutes: number;
  date: string;
  image?: string;
  body: string[];
}

export interface CraftStage {
  n: number;
  title: string;
  sinhala: string;
  body: string;
  detail: string;
}

export interface Workshop {
  id?: string;
  title: string;
  date: string;
  place: string;
  priceLKR: number;
  spotsLeft: number;
}

export interface ArticleFilterQuery {
  kind?: Article["kind"];
  tradition?: Tradition | "all";
  q?: string;
}
