import mongoose, { Schema } from "mongoose";

// Lightweight read schemas for cross-collection unified search

const MaskSearchSchema = new Schema(
  {
    slug: { type: String, required: true },
    name: { type: String, required: true },
    sinhala: { type: String },
    tradition: { type: String, required: true },
    artisanSlug: { type: String, required: true },
    priceLKR: { type: Number },
    region: { type: String },
    wood: { type: String },
    story: { type: String },
    stock: { type: Number },
    verified: { type: Boolean },
    arAvailable: { type: Boolean },
  },
  { collection: "catalog-svc", timestamps: false }
);

const ArtisanSearchSchema = new Schema(
  {
    slug: { type: String, required: true },
    name: { type: String, required: true },
    sinhala: { type: String },
    role: { type: String },
    village: { type: String },
    region: { type: String },
    bio: { type: String },
    story: { type: String },
    tools: [String],
    styleNotes: [String],
    focusTraditions: [String],
  },
  { collection: "artisan-svc", timestamps: false }
);

const ArticleSearchSchema = new Schema(
  {
    slug: { type: String, required: true },
    title: { type: String, required: true },
    excerpt: { type: String },
    tradition: { type: String },
    kind: { type: String },
    readMinutes: { type: Number },
    date: { type: String },
    body: [String],
  },
  { collection: "content-articles", timestamps: false }
);

const TraditionSearchSchema = new Schema(
  {
    slug: { type: String, required: true },
    name: { type: String, required: true },
    sinhala: { type: String },
    tagline: { type: String },
    description: { type: String },
  },
  { collection: "content-traditions", timestamps: false }
);

export const MaskSearchModel =
  mongoose.models.MaskSearch || mongoose.model("MaskSearch", MaskSearchSchema);
export const ArtisanSearchModel =
  mongoose.models.ArtisanSearch || mongoose.model("ArtisanSearch", ArtisanSearchSchema);
export const ArticleSearchModel =
  mongoose.models.ArticleSearch || mongoose.model("ArticleSearch", ArticleSearchSchema);
export const TraditionSearchModel =
  mongoose.models.TraditionSearch || mongoose.model("TraditionSearch", TraditionSearchSchema);
