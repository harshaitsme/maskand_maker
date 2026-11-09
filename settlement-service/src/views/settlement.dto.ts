import { z } from "zod";

export const CreateSettlementSchema = z.object({
  transactionType: z.enum(["primary_sale", "secondary_royalty", "payout_withdrawal"]),
  orderId: z.string().optional(),
  maskSlug: z.string().min(1, "maskSlug is required"),
  maskTitle: z.string().min(1, "maskTitle is required"),
  artisanSlug: z.string().min(1, "artisanSlug is required"),
  grossAmountLKR: z.number().positive("grossAmountLKR must be positive"),
  onChainTxHash: z.string().optional(),
});

export const PayoutRequestSchema = z.object({
  artisanSlug: z.string().min(1, "artisanSlug is required"),
  amountLKR: z.number().positive("amountLKR must be positive"),
  payoutMethod: z.enum(["bank_transfer", "polygon_crypto"]),
  bankDetails: z
    .object({
      bankName: z.string().min(1, "bankName is required"),
      accountNumber: z.string().min(1, "accountNumber is required"),
      accountHolder: z.string().min(1, "accountHolder is required"),
      branchName: z.string().optional(),
    })
    .optional(),
  cryptoDetails: z
    .object({
      walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM wallet address"),
    })
    .optional(),
  referenceNote: z.string().optional(),
});

export const QueryFilterSchema = z.object({
  artisanSlug: z.string().optional(),
  status: z.enum(["all", "escrow", "available", "payout_pending", "settled", "reversed"]).optional(),
  transactionType: z.enum(["all", "primary_sale", "secondary_royalty", "payout_withdrawal"]).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  skip: z.coerce.number().min(0).optional().default(0),
});
