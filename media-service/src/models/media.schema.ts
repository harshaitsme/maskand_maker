import mongoose, { Document, Schema } from "mongoose";
import { ImageDimensions, MediaAssetDoc, MediaAssetType, ModelMetadata } from "./media.entity.js";

export interface MediaAssetMongooseDoc extends Omit<MediaAssetDoc, "id">, Document {}

const ImageDimensionsSchema = new Schema<ImageDimensions>(
  {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { _id: false }
);

const ModelMetadataSchema = new Schema<ModelMetadata>(
  {
    triangleCount: { type: Number, default: 0 },
    format: { type: String, enum: ["glb", "gltf"], default: "glb" },
    hasTextures: { type: Boolean, default: true },
    dracoCompressed: { type: Boolean, default: false },
  },
  { _id: false }
);

const MediaAssetSchema = new Schema<MediaAssetMongooseDoc>(
  {
    key: { type: String, required: true, unique: true, index: true },
    bucket: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    sha256: { type: String, required: true, index: true },
    assetType: {
      type: String,
      enum: ["image", "model-3d", "document"],
      required: true,
      index: true,
    },
    maskSlug: { type: String, default: null, index: true },
    artisanSlug: { type: String, default: null, index: true },
    publicUrl: { type: String, required: true },
    dimensions: { type: ImageDimensionsSchema, default: null },
    modelMetadata: { type: ModelMetadataSchema, default: null },
    uploadedBy: { type: String, default: "system" },
  },
  {
    collection: "media-svc",
    timestamps: true,
  }
);

MediaAssetSchema.virtual("id").get(function () {
  return this._id.toHexString();
});
MediaAssetSchema.set("toJSON", { virtuals: true });
MediaAssetSchema.set("toObject", { virtuals: true });

export const MediaAssetModel =
  mongoose.models.MediaAsset ||
  mongoose.model<MediaAssetMongooseDoc>("MediaAsset", MediaAssetSchema);
