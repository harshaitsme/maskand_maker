import { NextFunction, Request, Response } from "express";
import { RabbitMQClient } from "../config/rabbitmq.js";
import { SettlementRepository } from "../models/settlement.repository.js";
import { CreateSettlementSchema, PayoutRequestSchema, QueryFilterSchema } from "../views/settlement.dto.js";
import { SettlementView } from "../views/settlement.view.js";

const repo = new SettlementRepository();

export class SettlementController {
  public static async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = QueryFilterSchema.parse(req.query);
      const result = await repo.getTransactions({
        artisanSlug: validated.artisanSlug,
        status: validated.status,
        transactionType: validated.transactionType,
        limit: validated.limit,
        skip: validated.skip,
      });

      res.setHeader("Cache-Control", "no-cache");
      res.status(200).json(SettlementView.renderTransactionsList(result.transactions, result.total));
    } catch (error) {
      next(error);
    }
  }

  public static async getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tx = await repo.findById(id);
      if (!tx) {
        res.status(404).json({ error: `Settlement transaction with id '${id}' not found` });
        return;
      }
      res.status(200).json(SettlementView.renderTransaction(tx));
    } catch (error) {
      next(error);
    }
  }

  public static async getArtisanLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const artisanSlug = req.params.artisanSlug || (req.query.artisanSlug as string) || "chandana-bandara";
      const ledger = await repo.getArtisanLedger(artisanSlug);
      res.status(200).json(SettlementView.renderLedger(ledger));
    } catch (error) {
      next(error);
    }
  }

  public static async recordSale(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = CreateSettlementSchema.parse(req.body);

      let artisanCutLKR = 0;
      let reforestationCutLKR = 0;
      let guildCutLKR = 0;
      let platformCutLKR = 0;

      if (body.transactionType === "primary_sale") {
        artisanCutLKR = Math.round(body.grossAmountLKR * 0.61);
        reforestationCutLKR = Math.round(body.grossAmountLKR * 0.19);
        guildCutLKR = Math.round(body.grossAmountLKR * 0.12);
        platformCutLKR = body.grossAmountLKR - (artisanCutLKR + reforestationCutLKR + guildCutLKR);
      } else if (body.transactionType === "secondary_royalty") {
        artisanCutLKR = Math.round(body.grossAmountLKR * 0.075);
        reforestationCutLKR = Math.round(body.grossAmountLKR * 0.025);
        guildCutLKR = 0;
        platformCutLKR = 0;
      }

      const tx = await repo.create({
        transactionType: body.transactionType,
        orderId: body.orderId,
        maskSlug: body.maskSlug,
        maskTitle: body.maskTitle,
        artisanSlug: body.artisanSlug,
        grossAmountLKR: body.grossAmountLKR,
        artisanCutLKR,
        reforestationCutLKR,
        guildCutLKR,
        platformCutLKR,
        status: body.transactionType === "secondary_royalty" ? "settled" : "escrow",
        onChainTxHash: body.onChainTxHash,
      });

      // Broadcast event
      RabbitMQClient.publish("settlement.recorded", {
        settlementId: tx.id,
        artisanSlug: tx.artisanSlug,
        artisanCutLKR: tx.artisanCutLKR,
        transactionType: tx.transactionType,
        timestamp: new Date().toISOString(),
      }).catch((e) => console.error("Failed to publish settlement.recorded:", e));

      res.status(201).json(SettlementView.renderTransaction(tx));
    } catch (error) {
      next(error);
    }
  }

  public static async requestPayout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = PayoutRequestSchema.parse(req.body);
      const ledger = await repo.getArtisanLedger(body.artisanSlug);

      if (body.amountLKR > ledger.availableLKR) {
        res.status(400).json({
          error: `Requested amount (${body.amountLKR} LKR) exceeds available balance (${ledger.availableLKR} LKR)`,
        });
        return;
      }

      const payoutTx = await repo.create({
        transactionType: "payout_withdrawal",
        maskSlug: "artisan-withdrawal",
        maskTitle: `Payout Withdrawal to ${ledger.artisanName}`,
        artisanSlug: body.artisanSlug,
        grossAmountLKR: body.amountLKR,
        artisanCutLKR: body.amountLKR,
        reforestationCutLKR: 0,
        guildCutLKR: 0,
        platformCutLKR: 0,
        status: "payout_pending",
        payoutMethod: body.payoutMethod,
        payoutDetails: {
          bankName: body.bankDetails?.bankName,
          accountNumber: body.bankDetails?.accountNumber,
          accountHolder: body.bankDetails?.accountHolder,
          branchName: body.bankDetails?.branchName,
          walletAddress: body.cryptoDetails?.walletAddress,
          referenceNote: body.referenceNote,
        },
      });

      // Broadcast event for notification service
      RabbitMQClient.publish("payout.requested", {
        payoutId: payoutTx.id,
        artisanSlug: body.artisanSlug,
        amountLKR: body.amountLKR,
        payoutMethod: body.payoutMethod,
        timestamp: new Date().toISOString(),
      }).catch((e) => console.error("Failed to publish payout.requested:", e));

      res.status(201).json(SettlementView.renderTransaction(payoutTx));
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, onChainTxHash } = req.body;

      const updated = await repo.updateStatus(id, status);
      if (!updated) {
        res.status(404).json({ error: `Settlement transaction with id '${id}' not found` });
        return;
      }

      if (status === "settled") {
        RabbitMQClient.publish("payout.processed", {
          payoutId: updated.id,
          artisanSlug: updated.artisanSlug,
          amountLKR: updated.artisanCutLKR,
          onChainTxHash,
          timestamp: new Date().toISOString(),
        }).catch((e) => console.error("Failed to publish payout.processed:", e));
      }

      res.status(200).json(SettlementView.renderTransaction(updated));
    } catch (error) {
      next(error);
    }
  }

  public static async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await repo.getPlatformStats();
      res.status(200).json(SettlementView.renderStats(stats));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Internal Event Handler for asynchronous RabbitMQ events
   */
  public static async handleEvent(routingKey: string, payload: any): Promise<void> {
    console.log(`📩 [settlement-service] Received event: '${routingKey}'`);

    if (routingKey === "order.created") {
      const { orderId, items } = payload;
      if (!items || !Array.isArray(items)) return;

      for (const item of items) {
        const itemGross = (item.priceLKR || 0) * (item.quantity || 1);
        if (itemGross <= 0) continue;

        const artisanCutLKR = Math.round(itemGross * 0.61);
        const reforestationCutLKR = Math.round(itemGross * 0.19);
        const guildCutLKR = Math.round(itemGross * 0.12);
        const platformCutLKR = itemGross - (artisanCutLKR + reforestationCutLKR + guildCutLKR);

        await repo.create({
          transactionType: "primary_sale",
          orderId,
          maskSlug: item.maskSlug || "unknown-mask",
          maskTitle: item.maskName || item.maskSlug || "Heritage Mask",
          artisanSlug: item.artisanSlug || "chandana-bandara",
          grossAmountLKR: itemGross,
          artisanCutLKR,
          reforestationCutLKR,
          guildCutLKR,
          platformCutLKR,
          status: "escrow",
        });
        console.log(`💰 [settlement-service] Recorded escrow settlement for order '${orderId}', item: ${item.maskSlug}`);
      }
    } else if (routingKey === "twin.claimed" || routingKey === "order.status_updated") {
      const orderId = payload.orderId;
      if (orderId && (payload.status === "delivered" || routingKey === "twin.claimed")) {
        const releasedCount = await repo.releaseEscrowByOrderId(orderId);
        console.log(`🔓 [settlement-service] Released escrow to available balance for ${releasedCount} items in order '${orderId}'`);
      }
    }
  }
}
