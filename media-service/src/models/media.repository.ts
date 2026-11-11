import { MediaAssetDoc, MediaStats } from "./media.entity.js";
import { MediaAssetModel, MediaAssetMongooseDoc } from "./media.schema.js";
import { SEED_MEDIA_ASSETS } from "./seed.data.js";

export class MediaRepository {
  async create(assetData: Partial<MediaAssetDoc>): Promise<MediaAssetMongooseDoc> {
    if (assetData.key) {
      const updated = await MediaAssetModel.findOneAndUpdate(
        { key: assetData.key },
        { $set: assetData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).exec();
      if (updated) return updated;
    }
    const asset = new MediaAssetModel(assetData);
    return await asset.save();
  }

  async findByKey(key: string): Promise<MediaAssetMongooseDoc | null> {
    return await MediaAssetModel.findOne({ key }).exec();
  }

  async findById(id: string): Promise<MediaAssetMongooseDoc | null> {
    return await MediaAssetModel.findById(id).exec();
  }

  async findAll(
    filter: { assetType?: string; maskSlug?: string; artisanSlug?: string } = {},
    limit = 50,
    offset = 0
  ): Promise<MediaAssetMongooseDoc[]> {
    const query: any = {};
    if (filter.assetType) query.assetType = filter.assetType;
    if (filter.maskSlug) query.maskSlug = filter.maskSlug;
    if (filter.artisanSlug) query.artisanSlug = filter.artisanSlug;

    return await MediaAssetModel.find(query)
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
  }

  async deleteById(id: string): Promise<MediaAssetMongooseDoc | null> {
    return await MediaAssetModel.findByIdAndDelete(id).exec();
  }

  async deleteByKey(key: string): Promise<MediaAssetMongooseDoc | null> {
    return await MediaAssetModel.findOneAndDelete({ key }).exec();
  }

  async getStats(): Promise<MediaStats> {
    const totalAssets = await MediaAssetModel.countDocuments();
    const imagesCount = await MediaAssetModel.countDocuments({ assetType: "image" });
    const models3DCount = await MediaAssetModel.countDocuments({ assetType: "model-3d" });

    const sizeAggregation = await MediaAssetModel.aggregate([
      { $group: { _id: null, totalBytes: { $sum: "$sizeBytes" } } },
    ]);

    const totalBytesStored = sizeAggregation.length > 0 ? sizeAggregation[0].totalBytes : 0;

    return {
      totalAssets,
      imagesCount,
      models3DCount,
      totalBytesStored,
    };
  }

  async seedInitialData(force = false): Promise<{ count: number }> {
    const count = await MediaAssetModel.countDocuments();
    if (count > 0 && !force) {
      return { count };
    }

    if (force) {
      await MediaAssetModel.deleteMany({});
    }

    await MediaAssetModel.insertMany(SEED_MEDIA_ASSETS);
    const newCount = await MediaAssetModel.countDocuments();
    return { count: newCount };
  }
}
