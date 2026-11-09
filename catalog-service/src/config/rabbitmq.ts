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

      // 3. Bind to order creation events
      await ch.bindQueue(this.queue, this.exchange, "order.created");

      console.log(`✅ [Catalog] RabbitMQ consumer listening on queue '${this.queue}' bound to 'order.created'`);

      // 4. Consume messages
      await ch.consume(
        this.queue,
        async (msg) => {
          if (!msg) return;

          try {
            const content = JSON.parse(msg.content.toString());
            const routingKey = msg.fields.routingKey;

            console.log(`📥 [Catalog] Received event '${routingKey}' for Order ${content.orderId}`);

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
