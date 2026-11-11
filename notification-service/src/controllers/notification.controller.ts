import { NextFunction, Request, Response } from "express";
import { NotificationRepository } from "../models/notification.repository.js";
import { CreateNotificationSchema, NotificationFilterSchema } from "../views/notification.dto.js";
import { NotificationView } from "../views/notification.view.js";

const repo = new NotificationRepository();

export class NotificationController {
  public static async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = NotificationFilterSchema.parse(req.query);
      const result = await repo.getNotifications({
        recipientId: validated.recipientId,
        recipientRole: validated.recipientRole,
        category: validated.category,
        channel: validated.channel,
        isRead: validated.isRead,
        limit: validated.limit,
        skip: validated.skip,
      });

      res.setHeader("Cache-Control", "no-cache");
      res.status(200).json(NotificationView.renderList(result.items, result.total, result.unreadCount));
    } catch (error) {
      next(error);
    }
  }

  public static async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const recipientId = (req.query.recipientId as string) || "chandana-bandara";
      const count = await repo.getUnreadCount(recipientId);
      res.status(200).json({ recipientId, unreadCount: count });
    } catch (error) {
      next(error);
    }
  }

  public static async createNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = CreateNotificationSchema.parse(req.body);
      const created = await repo.create(body);
      res.status(201).json(NotificationView.renderNotification(created));
    } catch (error) {
      next(error);
    }
  }

  public static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await repo.markAsRead(id);
      if (!updated) {
        res.status(404).json({ error: `Notification '${id}' not found` });
        return;
      }
      res.status(200).json(NotificationView.renderNotification(updated));
    } catch (error) {
      next(error);
    }
  }

  public static async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { recipientId } = req.body;
      if (!recipientId) {
        res.status(400).json({ error: "recipientId is required in body" });
        return;
      }
      const count = await repo.markAllAsRead(recipientId);
      res.status(200).json({ success: true, markedCount: count });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await repo.deleteById(id);
      if (!deleted) {
        res.status(404).json({ error: `Notification '${id}' not found` });
        return;
      }
      res.status(200).json({ success: true, message: `Notification '${id}' removed` });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Asynchronous event listener across Mask & Maker RabbitMQ ecosystem
   */
  public static async handleEvent(routingKey: string, payload: any): Promise<void> {
    console.log(`📩 [notification-service] Processing event: '${routingKey}'`);

    try {
      switch (routingKey) {
        case "order.created": {
          const { orderId, items, customerName, customerEmail } = payload;
          // 1. Notify artisan of new bench order
          if (items && Array.isArray(items)) {
            for (const item of items) {
              await repo.create({
                recipientId: item.artisanSlug || "chandana-bandara",
                recipientRole: "artisan",
                channel: "in_app",
                category: "order",
                priority: "high",
                title: `New Mask Order #${orderId}`,
                message: `A collector ordered your ${item.maskName || item.maskSlug}. Prepare workbench for packaging.`,
                data: { orderId, maskSlug: item.maskSlug },
                link: `/portal?tab=bench-orders`,
              });
            }
          }
          // 2. Notify buyer email confirmation
          if (customerEmail) {
            await repo.create({
              recipientId: customerEmail,
              recipientRole: "buyer",
              channel: "email",
              category: "order",
              priority: "high",
              title: `Mask & Maker Order Confirmation #${orderId}`,
              message: `Thank you ${customerName || "Collector"}! Your order has been placed with Ambalangoda master carvers.`,
              data: { orderId },
              link: `/checkout/confirmation?orderId=${orderId}`,
            });
          }
          break;
        }

        case "order.status_updated": {
          const { orderId, status, trackingNumber, customerEmail } = payload;
          if (customerEmail) {
            await repo.create({
              recipientId: customerEmail,
              recipientRole: "buyer",
              channel: "email",
              category: "order",
              priority: "medium",
              title: `Order #${orderId} Status: ${status.toUpperCase()}`,
              message: `Your heritage mask order is now ${status}. ${trackingNumber ? `Tracking: ${trackingNumber}` : ""}`,
              data: { orderId, status, trackingNumber },
              link: `/orders`,
            });
          }
          break;
        }

        case "listing.minted":
        case "mask.minted": {
          const d = payload.data || payload;
          const artisanSlug = d.artisanSlug || payload.artisanSlug || "chandana-bandara";
          const maskSlug = d.maskSlug || payload.maskSlug || "traditional-mask";
          const certId = d.certificateId || d.certId || payload.certId || payload.certificateId;
          const onChainTxHash = d.polygonAmoyTxHash || d.onChainTxHash || payload.onChainTxHash;
          await repo.create({
            recipientId: artisanSlug,
            recipientRole: "artisan",
            channel: "in_app",
            category: "minting",
            priority: "medium",
            title: `Certificate Minted: ${certId || maskSlug}`,
            message: `Physical-digital provenance certificate for ${maskSlug} has been verified on Polygon Amoy.`,
            data: { certId, maskSlug, onChainTxHash },
            link: certId ? `/verify/${certId}` : `/portal`,
          });
          break;
        }

        case "listing.published": {
          const d = payload.data || payload;
          const artisanSlug = d.artisanSlug || payload.artisanSlug || "chandana-bandara";
          const maskTitle = d.maskTitle || d.name || d.maskSlug || "Traditional Mask";
          const maskSlug = d.maskSlug || "traditional-mask";
          await repo.create({
            recipientId: artisanSlug,
            recipientRole: "artisan",
            channel: "in_app",
            category: "minting",
            priority: "medium",
            title: `Mask Published: ${maskTitle}`,
            message: `Your listing for ${maskTitle} is now live on the public registry!`,
            data: d,
            link: `/masks/${maskSlug}`,
          });
          break;
        }

        case "twin.claimed": {
          const { certId, maskSlug, ownerAddress, artisanSlug } = payload;
          if (artisanSlug) {
            await repo.create({
              recipientId: artisanSlug,
              recipientRole: "artisan",
              channel: "in_app",
              category: "verification",
              priority: "medium",
              title: `Digital Twin Claimed: ${maskSlug}`,
              message: `Collector ${ownerAddress ? ownerAddress.slice(0, 6) + "..." : ""} tapped the NFC tag and claimed the digital twin.`,
              data: { certId, maskSlug, ownerAddress },
              link: `/verify/${certId}`,
            });
          }
          break;
        }

        case "payout.processed": {
          const { artisanSlug, amountLKR, onChainTxHash } = payload;
          await repo.create({
            recipientId: artisanSlug || "chandana-bandara",
            recipientRole: "artisan",
            channel: "in_app",
            category: "payout",
            priority: "high",
            title: `Payout Released: LKR ${amountLKR?.toLocaleString()}`,
            message: `Fair-trade earnings of LKR ${amountLKR?.toLocaleString()} have been processed to your registered account.`,
            data: { amountLKR, onChainTxHash },
            link: `/portal?tab=settlement`,
          });
          break;
        }

        case "nfc.tamper_reported": {
          const { certId, reason } = payload;
          await repo.create({
            recipientId: "guild_curator",
            recipientRole: "guild_curator",
            channel: "in_app",
            category: "security",
            priority: "urgent",
            title: `NFC Tamper Report: ${certId}`,
            message: `A tamper report was filed for certificate ${certId}: "${reason || "No details"}"`,
            data: { certId, reason },
            link: `/verify/${certId}`,
          });
          break;
        }

        case "media.3d_generated": {
          const d = payload.data || payload;
          const maskSlug = d.maskSlug || "traditional-mask";
          const artisanSlug = d.artisanSlug || "chandana-bandara";
          const publicUrl = d.publicUrl || `/api/media/stream/${d.key || ""}`;

          await repo.create({
            recipientId: artisanSlug,
            recipientRole: "artisan",
            channel: "in_app",
            category: "verification",
            priority: "medium",
            title: `3D Model Ready: ${maskSlug}`,
            message: `AI 3D photogrammetry mesh has been reconstructed and published (${d.sizeBytes ? `${Math.round(d.sizeBytes / 1024)} KB` : "GLB"}). Ready for AR view!`,
            data: { maskSlug, key: d.key, publicUrl, modelFormat: d.modelFormat || "glb" },
            link: publicUrl,
          });
          break;
        }

        default:
          console.log(`ℹ️ [notification-service] Unhandled event routing key: '${routingKey}'`);
      }
    } catch (err: any) {
      console.error(`❌ [notification-service] Error handling event '${routingKey}':`, err.message);
    }
  }
}
