import mongoose, { Document, Schema } from "mongoose";
import { Artisan, ArtisanGeneration, Tradition } from "./artisan.entity.js";

export interface ArtisanDocument extends Omit<Artisan, "slug">, Document {
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const ArtisanGenerationSchema = new Schema<ArtisanGeneration>(
  {
    name: { type: String, required: true },
    years: { type: String, required: true },
    note: { type: String, required: true },
  },
  { _id: false }
);

const ArtisanSchema = new Schema<ArtisanDocument>(
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
    sinhalaName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      required: true,
      index: true,
    },
    village: {
      type: String,
      required: true,
    },
    born: {
      type: Number,
      required: true,
    },
    since: {
      type: Number,
      required: true,
      index: true,
    },
    ordersFulfilled: {
      type: Number,
      default: 0,
      index: true,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1.0,
      max: 5.0,
      index: true,
    },
    verified: {
      type: Boolean,
      default: true,
      index: true,
    },
    photo: {
      type: String,
      required: false,
    },
    initials: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      required: true,
    },
    story: {
      type: String,
      required: true,
    },
    tools: {
      type: [String],
      default: [],
    },
    styleNotes: {
      type: [String],
      default: [],
    },
    generations: {
      type: [ArtisanGenerationSchema],
      default: [],
    },
    focusTraditions: {
      type: [String],
      enum: ["raksha", "sanni", "kolam"],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Full-text search index across name, sinhala name, village, bio, story
ArtisanSchema.index({
  name: "text",
  sinhalaName: "text",
  village: "text",
  bio: "text",
  story: "text",
});

// Explicit collection name as requested: 'artisan-svc'
const collectionName = process.env.MONGODB_COLLECTION || "artisan-svc";

export const ArtisanModel = mongoose.model<ArtisanDocument>("Artisan", ArtisanSchema, collectionName);
