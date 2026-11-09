import mongoose, { Document, Schema } from "mongoose";
import {
  ArtisanOnboardingDoc,
  BenchOrderDoc,
  BlockchainMetadata,
  NfcMetadata,
  PortalListingDoc,
  SettlementRecordDoc,
} from "./portal.entity.js";

export interface PortalListingMongooseDoc extends Omit<PortalListingDoc, "id">, Document {}
export interface BenchOrderMongooseDoc extends Omit<BenchOrderDoc, "id">, Document {}
export interface ArtisanOnboardingMongooseDoc extends Omit<ArtisanOnboardingDoc, "id">, Document {}
export interface SettlementRecordMongooseDoc extends Omit<SettlementRecordDoc, "id">, Document {}

const BlockchainMetadataSchema = new Schema<BlockchainMetadata>(
  {
    chain: { type: String, default: "Polygon" },
    contractAddress: { type: String, required: true },
    tokenId: { type: String, required: true },
    transactionHash: { type: String, required: true },
    ipfsMetadataUri: { type: String, required: true },
    assetSha256: { type: String, required: true },
    blockNumber: { type: Number, required: true },
  },
  { _id: false }
);

const NfcMetadataSchema = new Schema<NfcMetadata>(
  {
    tagUid: { type: String, required: true },
    verificationUrl: { type: String, required: true },
    counter: { type: Number, default: 0 },
  },
  { _id: false }
);

// 1. Portal Listings Schema
const PortalListingSchema = new Schema<PortalListingMongooseDoc>(
  {
    maskSlug: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    artisanSlug: { type: String, required: true, index: true },
    tradition: {
      type: String,
      enum: ["raksha", "sanni", "kolam"],
      required: true,
    },
    woodSpecies: { type: String, default: "Kaduru (Nux vomica)" },
    priceLKR: { type: Number, required: true },
    stock: { type: Number, default: 1 },
    photos: { type: [String], default: [] },
    scanUrl: { type: String, default: "" },
    scanProgress: { type: Number, default: 0 },
    mintStage: { type: Number, default: -1 },
    minted: { type: Boolean, default: false },
    certificateId: { type: String, default: null, index: true },
    status: {
      type: String,
      enum: ["draft", "minted", "pending_review", "published"],
      default: "draft",
      index: true,
    },
    blockchain: { type: BlockchainMetadataSchema, default: null },
    nfc: { type: NfcMetadataSchema, default: null },
  },
  {
    collection: "portal-listings",
    timestamps: true,
  }
);

PortalListingSchema.virtual("id").get(function () {
  return this._id.toHexString();
});
PortalListingSchema.set("toJSON", { virtuals: true });
PortalListingSchema.set("toObject", { virtuals: true });

// 2. Bench Order Schema
const BenchOrderSchema = new Schema<BenchOrderMongooseDoc>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    piece: { type: String, required: true },
    maskSlug: { type: String, required: true },
    buyer: { type: String, required: true },
    artisanSlug: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["In carving", "Hand-over Friday", "Export papers", "Delivered"],
      default: "In carving",
    },
    settlementShareLKR: { type: Number, required: true },
    deadline: { type: String, default: "" },
  },
  {
    collection: "portal-bench-orders",
    timestamps: true,
  }
);

BenchOrderSchema.virtual("id").get(function () {
  return this.orderId;
});
BenchOrderSchema.set("toJSON", { virtuals: true });
BenchOrderSchema.set("toObject", { virtuals: true });

// 3. Artisan Onboarding Schema
const ArtisanOnboardingSchema = new Schema<ArtisanOnboardingMongooseDoc>(
  {
    artisanSlug: { type: String, required: true, unique: true, index: true },
    language: { type: String, enum: ["en", "si", "ta"], default: "en" },
    village: { type: String, required: true },
    tradition: { type: String, enum: ["raksha", "sanni", "kolam"], required: true },
    firstPhotoUrl: { type: String, default: "" },
    makerStampCreated: { type: Boolean, default: false },
    makerStampHash: { type: String, default: "" },
    completed: { type: Boolean, default: false },
  },
  {
    collection: "portal-onboardings",
    timestamps: true,
  }
);

ArtisanOnboardingSchema.virtual("id").get(function () {
  return this._id.toHexString();
});
ArtisanOnboardingSchema.set("toJSON", { virtuals: true });
ArtisanOnboardingSchema.set("toObject", { virtuals: true });

// 4. Fair-Trade Settlement Schema
const SettlementRecordSchema = new Schema<SettlementRecordMongooseDoc>(
  {
    orderId: { type: String, required: true, index: true },
    artisanSlug: { type: String, required: true, index: true },
    pieceName: { type: String, required: true },
    grossAmountLKR: { type: Number, required: true },
    artisanCutLKR: { type: Number, required: true },
    settlementPercent: { type: Number, default: 61 },
    status: { type: String, enum: ["settled", "pending"], default: "pending" },
    settledAt: { type: Date, default: null },
  },
  {
    collection: "portal-settlements",
    timestamps: true,
  }
);

SettlementRecordSchema.virtual("id").get(function () {
  return this._id.toHexString();
});
SettlementRecordSchema.set("toJSON", { virtuals: true });
SettlementRecordSchema.set("toObject", { virtuals: true });

export const PortalListingModel =
  mongoose.models.PortalListing ||
  mongoose.model<PortalListingMongooseDoc>("PortalListing", PortalListingSchema);

export const BenchOrderModel =
  mongoose.models.BenchOrder ||
  mongoose.model<BenchOrderMongooseDoc>("BenchOrder", BenchOrderSchema);

export const ArtisanOnboardingModel =
  mongoose.models.ArtisanOnboarding ||
  mongoose.model<ArtisanOnboardingMongooseDoc>("ArtisanOnboarding", ArtisanOnboardingSchema);

export const SettlementRecordModel =
  mongoose.models.SettlementRecord ||
  mongoose.model<SettlementRecordMongooseDoc>("SettlementRecord", SettlementRecordSchema);
