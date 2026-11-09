import { ArtisanLedgerSummary, SettlementTransaction } from "./settlement.entity.js";
import { SettlementModel } from "./settlement.schema.js";

export class SettlementRepository {
  public async getTransactions(filter: {
    artisanSlug?: string;
    status?: string;
    transactionType?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ transactions: SettlementTransaction[]; total: number }> {
    const query: any = {};
    if (filter.artisanSlug && filter.artisanSlug !== "all") query.artisanSlug = filter.artisanSlug;
    if (filter.status && filter.status !== "all") query.status = filter.status;
    if (filter.transactionType && filter.transactionType !== "all") query.transactionType = filter.transactionType;

    const limit = Math.min(filter.limit || 50, 100);
    const skip = filter.skip || 0;

    const [docs, total] = await Promise.all([
      SettlementModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SettlementModel.countDocuments(query),
    ]);

    return {
      transactions: docs.map(this.mapDocToEntity),
      total,
    };
  }

  public async findById(id: string): Promise<SettlementTransaction | null> {
    const doc = await SettlementModel.findOne({ id }).lean();
    return doc ? this.mapDocToEntity(doc) : null;
  }

  public async findByOrderId(orderId: string): Promise<SettlementTransaction[]> {
    const docs = await SettlementModel.find({ orderId }).lean();
    return docs.map(this.mapDocToEntity);
  }

  public async create(data: Omit<SettlementTransaction, "id" | "createdAt">): Promise<SettlementTransaction> {
    const id = `SET-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const doc = await SettlementModel.create({
      ...data,
      id,
      createdAt: new Date(),
    });
    return this.mapDocToEntity(doc.toObject());
  }

  public async updateStatus(
    id: string,
    status: SettlementTransaction["status"],
    payoutMethod?: SettlementTransaction["payoutMethod"],
    payoutDetails?: SettlementTransaction["payoutDetails"]
  ): Promise<SettlementTransaction | null> {
    const update: any = { status };
    if (status === "settled") {
      update.settledAt = new Date();
    }
    if (payoutMethod) update.payoutMethod = payoutMethod;
    if (payoutDetails) update.payoutDetails = payoutDetails;

    const doc = await SettlementModel.findOneAndUpdate({ id }, { $set: update }, { new: true }).lean();
    return doc ? this.mapDocToEntity(doc) : null;
  }

  public async releaseEscrowByOrderId(orderId: string): Promise<number> {
    const res = await SettlementModel.updateMany(
      { orderId, status: "escrow" },
      { $set: { status: "available" } }
    );
    return res.modifiedCount;
  }

  public async getArtisanLedger(artisanSlug: string): Promise<ArtisanLedgerSummary> {
    const docs = await SettlementModel.find({ artisanSlug }).sort({ createdAt: -1 }).lean();
    const transactions = docs.map(this.mapDocToEntity);

    let totalGrossLKR = 0;
    let totalEarnedLKR = 0;
    let inEscrowLKR = 0;
    let availableLKR = 0;
    let withdrawnLKR = 0;
    let reforestationFundLKR = 0;
    let guildFundLKR = 0;
    let primarySalesCount = 0;
    let secondaryRoyaltiesCount = 0;

    for (const t of transactions) {
      totalGrossLKR += t.grossAmountLKR;
      totalEarnedLKR += t.artisanCutLKR;
      reforestationFundLKR += t.reforestationCutLKR;
      guildFundLKR += t.guildCutLKR;

      if (t.transactionType === "primary_sale") primarySalesCount++;
      if (t.transactionType === "secondary_royalty") secondaryRoyaltiesCount++;

      if (t.status === "escrow") inEscrowLKR += t.artisanCutLKR;
      if (t.status === "available") availableLKR += t.artisanCutLKR;
      if (t.status === "settled") withdrawnLKR += t.artisanCutLKR;
    }

    const artisanNames: Record<string, string> = {
      "chandana-bandara": "W. A. Chandana Bandara",
      "piyal-wickramasinghe": "Piyal Wickramasinghe",
      "dayawansa-kalutara": "K. G. Dayawansa Kalutara",
    };

    return {
      artisanSlug,
      artisanName: artisanNames[artisanSlug] || artisanSlug,
      totalGrossLKR,
      totalEarnedLKR,
      inEscrowLKR,
      availableLKR,
      withdrawnLKR,
      reforestationFundLKR,
      guildFundLKR,
      primarySalesCount,
      secondaryRoyaltiesCount,
      recentTransactions: transactions.slice(0, 10),
    };
  }

  public async getPlatformStats(): Promise<{
    totalGrossLKR: number;
    totalArtisansEarnedLKR: number;
    totalReforestationFundLKR: number;
    totalGuildFundLKR: number;
    totalPrimarySales: number;
    totalSecondaryRoyalties: number;
    payoutsSettledLKR: number;
    escrowLockedLKR: number;
    activeArtisanCount: number;
  }> {
    const docs = await SettlementModel.find().lean();
    const artisanSet = new Set<string>();

    let totalGrossLKR = 0;
    let totalArtisansEarnedLKR = 0;
    let totalReforestationFundLKR = 0;
    let totalGuildFundLKR = 0;
    let totalPrimarySales = 0;
    let totalSecondaryRoyalties = 0;
    let payoutsSettledLKR = 0;
    let escrowLockedLKR = 0;

    for (const d of docs) {
      artisanSet.add(d.artisanSlug);
      totalGrossLKR += d.grossAmountLKR;
      totalArtisansEarnedLKR += d.artisanCutLKR;
      totalReforestationFundLKR += d.reforestationCutLKR;
      totalGuildFundLKR += d.guildCutLKR;

      if (d.transactionType === "primary_sale") totalPrimarySales++;
      if (d.transactionType === "secondary_royalty") totalSecondaryRoyalties++;

      if (d.status === "settled") payoutsSettledLKR += d.artisanCutLKR;
      if (d.status === "escrow") escrowLockedLKR += d.artisanCutLKR;
    }

    return {
      totalGrossLKR,
      totalArtisansEarnedLKR,
      totalReforestationFundLKR,
      totalGuildFundLKR,
      totalPrimarySales,
      totalSecondaryRoyalties,
      payoutsSettledLKR,
      escrowLockedLKR,
      activeArtisanCount: artisanSet.size,
    };
  }

  private mapDocToEntity(doc: any): SettlementTransaction {
    return {
      id: doc.id,
      transactionType: doc.transactionType,
      orderId: doc.orderId,
      maskSlug: doc.maskSlug,
      maskTitle: doc.maskTitle,
      artisanSlug: doc.artisanSlug,
      grossAmountLKR: doc.grossAmountLKR,
      artisanCutLKR: doc.artisanCutLKR,
      reforestationCutLKR: doc.reforestationCutLKR,
      guildCutLKR: doc.guildCutLKR,
      platformCutLKR: doc.platformCutLKR,
      status: doc.status,
      payoutMethod: doc.payoutMethod,
      payoutDetails: doc.payoutDetails,
      onChainTxHash: doc.onChainTxHash,
      createdAt: doc.createdAt,
      settledAt: doc.settledAt,
    };
  }
}
