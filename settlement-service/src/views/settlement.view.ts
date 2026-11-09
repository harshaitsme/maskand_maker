import { ArtisanLedgerSummary, SettlementTransaction } from "../models/settlement.entity.js";

export class SettlementView {
  public static renderTransaction(tx: SettlementTransaction) {
    return {
      id: tx.id,
      transactionType: tx.transactionType,
      orderId: tx.orderId || null,
      maskSlug: tx.maskSlug,
      maskTitle: tx.maskTitle,
      artisanSlug: tx.artisanSlug,
      breakdown: {
        grossAmountLKR: tx.grossAmountLKR,
        artisanCutLKR: tx.artisanCutLKR,
        artisanPercentage: tx.transactionType === "primary_sale" ? 61 : tx.transactionType === "secondary_royalty" ? 7.5 : 0,
        reforestationCutLKR: tx.reforestationCutLKR,
        reforestationPercentage: tx.transactionType === "primary_sale" ? 19 : tx.transactionType === "secondary_royalty" ? 2.5 : 0,
        guildCutLKR: tx.guildCutLKR,
        guildPercentage: tx.transactionType === "primary_sale" ? 12 : 0,
        platformCutLKR: tx.platformCutLKR,
        platformPercentage: tx.transactionType === "primary_sale" ? 8 : 0,
      },
      status: tx.status,
      payoutMethod: tx.payoutMethod || null,
      payoutDetails: tx.payoutDetails || null,
      onChainTxHash: tx.onChainTxHash || null,
      polygonExplorerUrl: tx.onChainTxHash ? `https://amoy.polygonscan.com/tx/${tx.onChainTxHash}` : null,
      createdAt: tx.createdAt,
      settledAt: tx.settledAt || null,
    };
  }

  public static renderTransactionsList(transactions: SettlementTransaction[], total: number) {
    return {
      total,
      count: transactions.length,
      items: transactions.map(this.renderTransaction),
    };
  }

  public static renderLedger(ledger: ArtisanLedgerSummary) {
    return {
      artisanSlug: ledger.artisanSlug,
      artisanName: ledger.artisanName,
      balances: {
        availableLKR: ledger.availableLKR,
        inEscrowLKR: ledger.inEscrowLKR,
        withdrawnLKR: ledger.withdrawnLKR,
        totalEarnedLKR: ledger.totalEarnedLKR,
      },
      communityImpact: {
        reforestationFundLKR: ledger.reforestationFundLKR,
        guildFundLKR: ledger.guildFundLKR,
        fairTradeRate: "61% of Primary Sales directly to Master Carver",
        eip2981RoyaltyRate: "7.5% Perpetual Secondary Royalty on Polygon",
      },
      salesStats: {
        totalGrossLKR: ledger.totalGrossLKR,
        primarySalesCount: ledger.primarySalesCount,
        secondaryRoyaltiesCount: ledger.secondaryRoyaltiesCount,
      },
      recentTransactions: ledger.recentTransactions.map(this.renderTransaction),
    };
  }

  public static renderStats(stats: any) {
    return {
      success: true,
      data: stats,
    };
  }
}
