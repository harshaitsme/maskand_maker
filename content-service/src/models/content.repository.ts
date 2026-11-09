import { Article, ArticleFilterQuery, CraftStage, Tradition, TraditionDoc, Workshop } from "./content.entity.js";
import { ArticleModel, CraftStageModel, TraditionModel, WorkshopModel } from "./content.schema.js";

/**
 * ContentRepository - MongoDB Data Access Layer (MVC Model)
 * Queries content collections: content-traditions, content-articles, content-stages, content-workshops.
 */
export class ContentRepository {
  // --- Traditions ---
  public async findTraditions(): Promise<TraditionDoc[]> {
    const docs = await TraditionModel.find().lean();
    return docs as unknown as TraditionDoc[];
  }

  public async findTraditionBySlug(slug: Tradition): Promise<TraditionDoc | null> {
    const doc = await TraditionModel.findOne({ slug }).lean();
    return doc ? (doc as unknown as TraditionDoc) : null;
  }

  // --- Articles ---
  public async findArticles(query: ArticleFilterQuery = {}): Promise<Article[]> {
    const filter: Record<string, any> = {};

    if (query.kind) {
      filter.kind = query.kind;
    }

    if (query.tradition && query.tradition !== "all") {
      filter.tradition = query.tradition;
    }

    if (query.q) {
      const qRegex = new RegExp(query.q.trim(), "i");
      filter.$or = [{ title: qRegex }, { excerpt: qRegex }];
    }

    const docs = await ArticleModel.find(filter).sort({ date: -1 }).lean();
    return docs as unknown as Article[];
  }

  public async findArticleBySlug(slug: string): Promise<Article | null> {
    const doc = await ArticleModel.findOne({ slug }).lean();
    return doc ? (doc as unknown as Article) : null;
  }

  public async createArticle(articleData: Partial<Article>): Promise<Article> {
    const created = await ArticleModel.create(articleData);
    return created.toObject() as unknown as Article;
  }

  // --- Craft Stages ---
  public async findCraftStages(): Promise<CraftStage[]> {
    const docs = await CraftStageModel.find().sort({ n: 1 }).lean();
    return docs as unknown as CraftStage[];
  }

  // --- Workshops ---
  public async findWorkshops(): Promise<Workshop[]> {
    const docs = await WorkshopModel.find().sort({ date: 1 }).lean();
    return docs as unknown as Workshop[];
  }

  public async bookWorkshopSpot(id: string): Promise<Workshop | null> {
    const updated = await WorkshopModel.findOneAndUpdate(
      { _id: id, spotsLeft: { $gt: 0 } },
      { $inc: { spotsLeft: -1 } },
      { new: true }
    ).lean();

    return updated ? (updated as unknown as Workshop) : null;
  }

  // --- Count Statistics ---
  public async countAll(): Promise<{ traditions: number; articles: number; stages: number; workshops: number }> {
    const [traditions, articles, stages, workshops] = await Promise.all([
      TraditionModel.countDocuments(),
      ArticleModel.countDocuments(),
      CraftStageModel.countDocuments(),
      WorkshopModel.countDocuments(),
    ]);

    return { traditions, articles, stages, workshops };
  }
}

export const contentRepository = new ContentRepository();
