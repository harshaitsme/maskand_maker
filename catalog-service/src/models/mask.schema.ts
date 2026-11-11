import mongoose, { Document, Schema } from "mongoose";
import { Mask } from "./mask.entity.js";

export interface MaskDocument extends Omit<Mask, "slug">, Document {
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const MaskSchema = new Schema<MaskDocument>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sinhala: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    tradition: {
      type: String,
      enum: ["raksha", "sanni", "kolam"],
      required: true,
      index: true,
    },
    artisanSlug: {
      type: String,
      required: true,
      index: true,
    },
    priceLKR: {
      type: Number,
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
    },
    heightCm: {
      type: Number,
      required: true,
    },
    widthCm: {
      type: Number,
      required: true,
    },
    depthCm: {
      type: Number,
      required: true,
    },
    weightKg: {
      type: Number,
      required: true,
    },
    wood: {
      type: String,
      required: true,
    },
    dyes: {
      type: [String],
      required: true,
      default: [],
    },
    carvingDays: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: false,
    },
    plateSeed: {
      type: Number,
      default: 1,
    },
    plateVariant: {
      type: Number,
      default: 0,
    },
    story: {
      type: String,
      required: false,
      default: "Traditional hand-carved mask from the living heritage of Ambalangoda.",
    },
    context: {
      type: String,
      required: false,
      default: "Ambalangoda woodcarving heritage.",
    },
    arAvailable: {
      type: Boolean,
      default: false,
      index: true,
    },
    verified: {
      type: Boolean,
      default: true,
      index: true,
    },
    stock: {
      type: Number,
      default: 1,
      min: 0,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    region: {
      type: String,
      required: true,
    },
    certId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Full-text search index across descriptive fields
MaskSchema.index({
  name: "text",
  sinhala: "text",
  story: "text",
  region: "text",
  wood: "text",
});

// Compound index for catalog browsing and price sorting
MaskSchema.index({ tradition: 1, priceLKR: 1 });

// Explicit collection name as requested: 'catalog-svc'
const collectionName = process.env.MONGODB_COLLECTION || "catalog-svc";

export const MaskModel = mongoose.model<MaskDocument>("Mask", MaskSchema, collectionName);
