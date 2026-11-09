import { Article, CraftStage, TraditionDoc, Workshop } from "../models/content.entity.js";
import { ArticleResponseDto, TraditionResponseDto } from "./content.dto.js";

/**
 * ContentView - View / Presenter Layer (MVC)
 * Formats internal documents into standardized client representations
 * matching the frontend's expected data shape with enriched hypermedia links.
 */
export class ContentView {
  public static renderTradition(doc: TraditionDoc): TraditionResponseDto {
    return {
      ...doc,
      _links: {
        self: `/api/traditions/${doc.slug}`,
        masks: `/api/masks?tradition=${doc.slug}`,
      },
    };
  }

  public static renderTraditionList(docs: TraditionDoc[]): TraditionResponseDto[] {
    return docs.map((d) => this.renderTradition(d));
  }

  public static renderArticle(doc: Article): ArticleResponseDto {
    return {
      ...doc,
      _links: {
        self: `/api/articles/${doc.slug}`,
        tradition: doc.tradition ? `/api/traditions/${doc.tradition}` : undefined,
      },
    };
  }

  public static renderArticleList(docs: Article[]): ArticleResponseDto[] {
    return docs.map((d) => this.renderArticle(d));
  }

  public static renderCraftStages(stages: CraftStage[]) {
    return {
      title: "From Log to Mask: Eight Ritual Stages of Creation",
      count: stages.length,
      stages,
    };
  }

  public static renderWorkshops(workshops: Workshop[]) {
    return {
      count: workshops.length,
      workshops,
    };
  }
}
