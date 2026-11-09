export type TransactionType = "primary_sale" | "secondary_royalty" | "payout_withdrawal";
export type SettlementStatus = "escrow" | "available" | "payout_pending" | "settled" | "reversed";
export type PayoutMethod = "bank_transfer" | "polygon_crypto";

export interface PayoutDetails {
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  branchName?: string;
  walletAddress?: string;
  polygonTxHash?: string;
  referenceNote?: string;
}

export interface SettlementTransaction {
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
  payoutMethod?: PayoutMethod;
  payoutDetails?: PayoutDetails;
  onChainTxHash?: string;
  createdAt: Date;
  settledAt?: Date;
}

export interface ArtisanLedgerSummary {
  artisanSlug: string;
  artisanName: string;
  totalGrossLKR: number;
  totalEarnedLKR: number;
  inEscrowLKR: number;
  availableLKR: number;
  withdrawnLKR: number;
  reforestationFundLKR: number;
  guildFundLKR: number;
  primarySalesCount: number;
  secondaryRoyaltiesCount: number;
  recentTransactions: SettlementTransaction[];
}
