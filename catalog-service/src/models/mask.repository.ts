import { Mask, MaskFilterQuery, Tradition } from "./mask.entity.js";
import { MaskModel } from "./mask.schema.js";

/**
 * MaskRepository - MongoDB Data Access Layer (MVC Model)
 * Connects directly to the 'catalog-svc' MongoDB collection.
 * In-memory testing data has been replaced with database queries.
 */
export class MaskRepository {
  /**
   * Find a mask by its unique slug
   */
  public async findBySlug(slug: string): Promise<Mask | null> {
    const doc = await MaskModel.findOne({ slug }).lean();
    return doc ? (doc as unknown as Mask) : null;
  }

  /**
   * Find all featured museum-grade masks
   */
  public async findFeatured(): Promise<Mask[]> {
    const docs = await MaskModel.find({ featured: true }).sort({ priceLKR: -1 }).lean();
    return docs as unknown as Mask[];
  }

  /**
   * Find related masks in the same tradition, excluding the given slug
   */
  public async findRelated(slug: string, tradition: Tradition, limit = 3): Promise<Mask[]> {
    const docs = await MaskModel.find({
      tradition,
      slug: { $ne: slug },
    })
      .limit(limit)
      .lean();

    return docs as unknown as Mask[];
  }

  /**
   * Find all masks carved by an artisan
   */
  public async findByArtisan(artisanSlug: string): Promise<Mask[]> {
    const docs = await MaskModel.find({ artisanSlug }).sort({ year: -1 }).lean();
    return docs as unknown as Mask[];
  }

  /**
   * Multi-criteria catalog filtering and sorting directly in MongoDB
   */
  public async findAll(query: MaskFilterQuery = {}): Promise<Mask[]> {
    const filter: Record<string, any> = {};

    // 1. Tradition filter
    if (query.tradition && query.tradition !== "all") {
      filter.tradition = query.tradition;
    }

    // 2. Artisan filter
    if (query.artisan && query.artisan !== "all") {
      filter.artisanSlug = query.artisan;
    }

    // 3. AR availability
    if (query.arOnly) {
      filter.arAvailable = true;
    }

    // 4. Verification status
    if (query.verifiedOnly) {
      filter.verified = true;
    }

    // 5. Maximum price
    if (typeof query.maxPriceLKR === "number") {
      filter.priceLKR = { $lte: query.maxPriceLKR };
    }

    // 6. Size classification filter mapped to heightCm
    if (query.sizes && query.sizes.length > 0) {
      const sizeConditions: any[] = [];
      for (const size of query.sizes) {
        if (size === "compact") {
          sizeConditions.push({ heightCm: { $lt: 30 } });
        } else if (size === "display") {
          sizeConditions.push({ heightCm: { $gte: 30, $lt: 48 } });
        } else if (size === "monumental") {
          sizeConditions.push({ heightCm: { $gte: 48 } });
        }
      }
      if (sizeConditions.length > 0) {
        filter.$or = sizeConditions;
      }
    }

    // 7. Full text / regex search across name, sinhala, story, region, wood
    if (query.q) {
      const qRegex = new RegExp(query.q.trim(), "i");
      const searchConditions = [
        { name: qRegex },
        { sinhala: qRegex },
        { story: qRegex },
        { region: qRegex },
        { wood: qRegex },
      ];

      if (filter.$or) {
        // Combine size and search conditions
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    // Sorting definition
    let sortCriteria: Record<string, any> = { featured: -1, priceLKR: -1 };
    switch (query.sort) {
      case "price-asc":
        sortCriteria = { priceLKR: 1 };
        break;
      case "price-desc":
        sortCriteria = { priceLKR: -1 };
        break;
      case "newest":
        sortCriteria = { year: -1, createdAt: -1 };
        break;
      default:
        sortCriteria = { featured: -1, priceLKR: -1 };
    }

    const docs = await MaskModel.find(filter).sort(sortCriteria).lean();
    return docs as unknown as Mask[];
  }

  /**
   * Create a new mask document in MongoDB (Portal Step 4)
   */
  public async create(maskData: Partial<Mask>): Promise<Mask> {
    const created = await MaskModel.create(maskData);
    return created.toObject() as unknown as Mask;
  }

  /**
   * Atomic stock adjustment in MongoDB (for orders and inventory updates)
   */
  public async updateStock(slug: string, delta: number): Promise<Mask | null> {
    const updated = await MaskModel.findOneAndUpdate(
      {
        slug,
        ...(delta < 0 ? { stock: { $gte: Math.abs(delta) } } : {}),
      },
      { $inc: { stock: delta } },
      { new: true }
    ).lean();

    return updated ? (updated as unknown as Mask) : null;
  }

  /**
   * Total count of masks currently stored in the MongoDB collection
   */
  public async count(): Promise<number> {
    return await MaskModel.countDocuments();
  }
}

// Singleton repository instance for catalog-service
export const maskRepository = new MaskRepository();
