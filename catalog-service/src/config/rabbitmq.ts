import amqp, { Channel, ChannelModel } from "amqplib";
import { maskRepository } from "../models/mask.repository.js";

/**
 * RabbitMQ Event Consumer for catalog-service
 * Listens for order events (order.created) and updates mask stock in MongoDB automatically.
 */
export class CatalogEventConsumer {
  private static connection: ChannelModel | null = null;
  private static channel: Channel | null = null;
  private static exchange: string = process.env.RABBITMQ_EXCHANGE || "maskandmaker.events";
  private static queue: string = "q.catalog.order-events";
  private static uri: string = process.env.RABBITMQ_URI || "amqp://guest:guest@localhost:5672";

  public static async start(): Promise<void> {
    try {
      console.log(`🐰 [Catalog] Connecting to RabbitMQ at ${this.uri.replace(/:[^:]*@/, ":***@")}...`);
      const conn = await amqp.connect(this.uri);
      this.connection = conn;

      conn.on("error", (err) => {
        console.error("❌ [Catalog] RabbitMQ error:", err.message);
      });

      conn.on("close", () => {
        console.warn("⚠️ [Catalog] RabbitMQ connection closed. Reconnecting in 5s...");
        this.channel = null;
        this.connection = null;
        setTimeout(() => this.start().catch(() => {}), 5000);
      });

      const ch = await conn.createChannel();
      this.channel = ch;

      // 1. Assert topic exchange
      await ch.assertExchange(this.exchange, "topic", { durable: true });

      // 2. Assert durable consumer queue
      await ch.assertQueue(this.queue, { durable: true });

      // 3. Bind to order creation, 3D media, and listing lifecycle events
      await ch.bindQueue(this.queue, this.exchange, "order.created");
      await ch.bindQueue(this.queue, this.exchange, "media.3d_generated");
      await ch.bindQueue(this.queue, this.exchange, "listing.minted");
      await ch.bindQueue(this.queue, this.exchange, "listing.published");

      console.log(
        `✅ [Catalog] RabbitMQ consumer listening on queue '${this.queue}' bound to 'order.created', 'media.3d_generated', 'listing.minted', 'listing.published'`
      );

      // 4. Consume messages
      await ch.consume(
        this.queue,
        async (msg) => {
          if (!msg) return;

          try {
            const content = JSON.parse(msg.content.toString());
            const routingKey = msg.fields.routingKey;

            console.log(`📥 [Catalog] Received event '${routingKey}'`);

            if (routingKey === "order.created" && Array.isArray(content.items)) {
              for (const item of content.items) {
                if (item.slug && item.qty) {
                  const updated = await maskRepository.updateStock(item.slug, -item.qty);
                  if (updated) {
                    console.log(`📦 [Catalog] Stock decremented: '${item.slug}' remaining stock: ${updated.stock}`);
                  } else {
                    console.warn(`⚠️ [Catalog] Mask '${item.slug}' stock could not be decremented (out of stock or not found)`);
                  }
                }
              }
            } else if (routingKey === "media.3d_generated") {
              const maskSlug = content.data?.maskSlug || content.maskSlug;
              if (maskSlug) {
                const updated = await maskRepository.setArAvailable(maskSlug, true);
                if (updated) {
                  console.log(`🥽 [Catalog] Mask '${maskSlug}' updated with arAvailable=true from 3D AI service!`);
                }
              }
            } else if (
              (routingKey === "listing.minted" || routingKey === "listing.published") &&
              content.data?.maskSlug
            ) {
              const d = content.data;
              const existing = await maskRepository.findBySlug(d.maskSlug);
              if (!existing) {
                const maskTitle = d.maskTitle || d.name || d.maskSlug;
                const certId = d.certificateId || `MM-2026-${Math.floor(Math.random() * 9000 + 1000)}`;
                const image = d.photos?.[0]
                  ? d.photos[0].startsWith("http") || d.photos[0].startsWith("/")
                    ? d.photos[0]
                    : `/api/media/stream/${d.photos[0]}`
                  : "/images/masks/default.jpg";

                await maskRepository.create({
                  slug: d.maskSlug,
                  name: maskTitle,
                  sinhala: d.sinhala || maskTitle,
                  tradition: d.tradition || "raksha",
                  artisanSlug: d.artisanSlug || "chandana-bandara",
                  priceLKR: d.priceLKR || 85000,
                  year: new Date().getFullYear(),
                  heightCm: d.heightCm || 44,
                  widthCm: d.widthCm || 36,
                  depthCm: d.depthCm || 18,
                  weightKg: d.weightKg || 1.4,
                  wood: d.woodType || d.woodSpecies || "Kaduru heartwood (Strychnos nux-vomica)",
                  dyes: ["Natural Pigments", "Beeswax polish"],
                  carvingDays: 24,
                  image,
                  plateSeed: 1,
                  plateVariant: 0,
                  story: d.story || `Hand-carved ${maskTitle} traditional wooden mask by master artisan.`,
                  context: `Carved from sacred Kaduru in the living ${d.tradition || "raksha"} lineage of Ambalangoda.`,
                  arAvailable: !!d.scanUrl,
                  verified: true,
                  stock: d.stock ?? 1,
                  region: "Ambalangoda, Sri Lanka",
                  certId,
                });
                console.log(`✨ [Catalog] Automatically created public catalog entry for newly minted mask: '${d.maskSlug}'`);
              }
            }

            // Acknowledge processed message
            ch.ack(msg);
          } catch (processError) {
            console.error("❌ [Catalog] Error processing RabbitMQ message:", processError);
            // Reject and re-queue or discard based on error
            ch.nack(msg, false, false);
          }
        },
        { noAck: false }
      );
    } catch (error: any) {
      console.warn(`⚠️ [Catalog] Failed to connect RabbitMQ consumer: ${error.message}. Will retry in 5s.`);
      setTimeout(() => this.start().catch(() => {}), 5000);
    }
  }

  public static isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }

  public static async stop(): Promise<void> {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch (error) {
      console.error("Error closing Catalog RabbitMQ consumer:", error);
    } finally {
      this.channel = null;
      this.connection = null;
    }
  }
}
