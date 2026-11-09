import mongoose, { Document, Schema } from "mongoose";
import { PayoutDetails, SettlementStatus, TransactionType } from "./settlement.entity.js";

export interface ISettlementDocument extends Document {
  id: string;
  transactionType: TransactionType;
  orderId?: string;
  maskSlug: string;
  maskTitle: string;
  artisanSlug: string;
  grossAmountLKR: number;
  artisanCutLKR: number;
  reforestationCutLKR: number;
  guildCutLKR: number;
  platformCutLKR: number;
  status: SettlementStatus;
  payoutMethod?: string;
  payoutDetails?: PayoutDetails;
  onChainTxHash?: string;
  createdAt: Date;
  settledAt?: Date;
}

const PayoutDetailsSchema = new Schema(
  {
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    accountHolder: { type: String, trim: true },
    branchName: { type: String, trim: true },
    walletAddress: { type: String, trim: true },
    polygonTxHash: { type: String, trim: true },
    referenceNote: { type: String, trim: true },
  },
  { _id: false }
);

const SettlementSchema = new Schema<ISettlementDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    transactionType: {
      type: String,
      required: true,
      enum: ["primary_sale", "secondary_royalty", "payout_withdrawal"],
      index: true,
    },
    orderId: { type: String, index: true },
    maskSlug: { type: String, required: true, index: true },
    maskTitle: { type: String, required: true },
    artisanSlug: { type: String, required: true, index: true },
    grossAmountLKR: { type: Number, required: true, min: 0 },
    artisanCutLKR: { type: Number, required: true, min: 0 },
    reforestationCutLKR: { type: Number, required: true, default: 0 },
    guildCutLKR: { type: Number, required: true, default: 0 },
    platformCutLKR: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      required: true,
      enum: ["escrow", "available", "payout_pending", "settled", "reversed"],
      default: "escrow",
      index: true,
    },
    payoutMethod: {
      type: String,
      enum: ["bank_transfer", "polygon_crypto"],
    },
    payoutDetails: { type: PayoutDetailsSchema },
    onChainTxHash: { type: String, trim: true },
    settledAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

SettlementSchema.index({ artisanSlug: 1, status: 1 });
SettlementSchema.index({ createdAt: -1 });

export const SettlementModel = mongoose.model<ISettlementDocument>("Settlement", SettlementSchema);
