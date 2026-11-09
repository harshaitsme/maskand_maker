import mongoose, { Document, Schema } from "mongoose";
import { Article, CraftStage, Tradition, TraditionDoc, Workshop } from "./content.entity.js";

// --- Tradition Document ---
export interface TraditionDocument extends Omit<TraditionDoc, "slug">, Document {
  slug: Tradition;
  createdAt: Date;
  updatedAt: Date;
}

const TraditionSchema = new Schema<TraditionDocument>(
  {
    slug: {
      type: String,
      enum: ["raksha", "sanni", "kolam"],
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true },
    sinhala: { type: String, required: true },
    marker: { type: String, enum: ["vermilion", "forest", "gold"], required: true },
    tagline: { type: String, required: true },
    description: { type: String, required: true },
    ritual: { type: [String], default: [] },
    examples: { type: [String], default: [] },
    palette: { type: [String], default: [] },
  },
  { timestamps: true, versionKey: false }
);

export const TraditionModel = mongoose.model<TraditionDocument>(
  "Tradition",
  TraditionSchema,
  "content-traditions"
);

// --- Article Document ---
export interface ArticleDocument extends Omit<Article, "slug">, Document {
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<ArticleDocument>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, required: true },
    tradition: { type: String, enum: ["raksha", "sanni", "kolam"], index: true },
    kind: { type: String, enum: ["essay", "film", "field-notes"], required: true, index: true },
    readMinutes: { type: Number, required: true },
    date: { type: String, required: true },
    image: { type: String },
    body: { type: [String], default: [] },
  },
  { timestamps: true, versionKey: false }
);

ArticleSchema.index({ title: "text", excerpt: "text", body: "text" });

export const ArticleModel = mongoose.model<ArticleDocument>(
  "Article",
  ArticleSchema,
  "content-articles"
);

// --- Craft Stage Document ---
export interface CraftStageDocument extends CraftStage, Document {
  createdAt: Date;
  updatedAt: Date;
}

const CraftStageSchema = new Schema<CraftStageDocument>(
  {
    n: { type: Number, required: true, unique: true, index: true },
    title: { type: String, required: true },
    sinhala: { type: String, required: true },
    body: { type: String, required: true },
    detail: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

export const CraftStageModel = mongoose.model<CraftStageDocument>(
  "CraftStage",
  CraftStageSchema,
  "content-stages"
);

// --- Workshop Document ---
export interface WorkshopDocument extends Workshop, Document {
  createdAt: Date;
  updatedAt: Date;
}

const WorkshopSchema = new Schema<WorkshopDocument>(
  {
    title: { type: String, required: true },
    date: { type: String, required: true },
    place: { type: String, required: true },
    priceLKR: { type: Number, required: true },
    spotsLeft: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, versionKey: false }
);

export const WorkshopModel = mongoose.model<WorkshopDocument>(
  "Workshop",
  WorkshopSchema,
  "content-workshops"
);
