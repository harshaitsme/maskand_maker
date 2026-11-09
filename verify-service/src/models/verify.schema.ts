import mongoose, { Document, Schema } from "mongoose";
import { CertificateDoc, CertificateEvent, NfcTagData, TamperReport } from "./verify.entity.js";

export interface CertificateMongooseDoc extends CertificateDoc, Document {}

const CertificateEventSchema = new Schema<CertificateEvent>(
  {
    label: { type: String, required: true },
    date: { type: String, required: true },
    actor: { type: String, required: true },
  },
  { _id: false }
);

const NfcTagSchema = new Schema<NfcTagData>(
  {
    uid: { type: String, required: true, uppercase: true, trim: true },
    standard: {
      type: String,
      enum: ["NTAG424_DNA", "NTAG213", "NTAG215"],
      default: "NTAG424_DNA",
    },
    tapCount: { type: Number, default: 0 },
    lastTappedAt: { type: Date, default: null },
    batch: { type: String, default: "AMB-2024-B1" },
  },
  { _id: false }
);

const TamperReportSchema = new Schema<TamperReport>(
  {
    reportedAt: { type: Date, default: () => new Date() },
    reason: { type: String, required: true },
    reporterContact: { type: String, default: "" },
    status: {
      type: String,
      enum: ["investigating", "resolved"],
      default: "investigating",
    },
  },
  { _id: false }
);

const CertificateSchema = new Schema<CertificateMongooseDoc>(
  {
    certId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    maskSlug: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    maskName: {
      type: String,
      required: true,
      trim: true,
    },
    artisanSlug: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    artisanName: {
      type: String,
      required: true,
      trim: true,
    },
    mintedAt: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["unclaimed", "claimed"],
      default: "unclaimed",
      index: true,
    },
    chain: {
      type: String,
      default: "Polygon",
    },
    contractAddress: {
      type: String,
      default: "0x38F087796d11eB40A5581B855Dcb2b3cEb78d3Fa",
    },
    tokenId: {
      type: String,
      required: true,
    },
    ipfsUri: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      default: null,
    },
    ownerWallet: {
      type: String,
      default: null,
    },
    history: {
      type: [CertificateEventSchema],
      default: [],
    },
    qrCodeUrl: {
      type: String,
      required: true,
    },
    nfcTag: {
      type: NfcTagSchema,
      required: true,
    },
    artisanSignature: {
      type: String,
      required: true,
    },
    hashProof: {
      type: String,
      required: true,
    },
    isTampered: {
      type: Boolean,
      default: false,
    },
    tamperReports: {
      type: [TamperReportSchema],
      default: [],
    },
  },
  {
    collection: "verify-svc",
    timestamps: true,
  }
);

// Secondary Indexes
CertificateSchema.index({ "nfcTag.uid": 1 });

export const CertificateModel =
  mongoose.models.Certificate || mongoose.model<CertificateMongooseDoc>("Certificate", CertificateSchema);
