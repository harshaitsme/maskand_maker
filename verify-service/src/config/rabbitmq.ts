import amqp, { Channel, ChannelModel } from "amqplib";
import { verifyRepository } from "../models/verify.repository.js";

/**
 * RabbitMQ Event Consumer for verify-service
 * Listens for order lifecycle events (order.created, order.status_updated)
 * and appends physical-digital provenance events to the mask's certificate timeline.
 */
export class VerifyEventConsumer {
  private static connection: ChannelModel | null = null;
  private static channel: Channel | null = null;
  private static exchange: string = process.env.RABBITMQ_EXCHANGE || "maskandmaker.events";
  private static queue: string = "q.verify.order-events";
  private static uri: string = process.env.RABBITMQ_URI || "amqp://guest:guest@localhost:5672";

  public static async start(): Promise<void> {
    try {
      console.log(`🐰 [Verify] Connecting to RabbitMQ at ${this.uri.replace(/:[^:]*@/, ":***@")}...`);
      const conn = await amqp.connect(this.uri);
      this.connection = conn;

      conn.on("error", (err) => {
        console.error("❌ [Verify] RabbitMQ error:", err.message);
      });

      conn.on("close", () => {
        console.warn("⚠️ [Verify] RabbitMQ connection closed. Reconnecting in 5s...");
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

      // 3. Bind to all order lifecycle events (order.*)
      await ch.bindQueue(this.queue, this.exchange, "order.*");

      console.log(`✅ [Verify] RabbitMQ consumer listening on queue '${this.queue}' bound to 'order.*'`);

      // 4. Consume messages
      await ch.consume(
        this.queue,
        async (msg) => {
          if (!msg) return;

          try {
            const content = JSON.parse(msg.content.toString());
            const routingKey = msg.fields.routingKey;
            const today = new Date().toISOString().split("T")[0];

            console.log(`📥 [Verify] Received event '${routingKey}' for Order ${content.orderId}`);

            if (routingKey === "order.created" && Array.isArray(content.items)) {
              for (const item of content.items) {
                if (item.slug) {
                  const actor = content.customerName
                    ? `${content.customerName} · Order ${content.orderId}`
                    : `Order ${content.orderId}`;

                  const updated = await verifyRepository.appendProvenanceEvent(item.slug, {
                    label: "Purchased & packaged for dispatch",
                    date: today,
                    actor,
                  });

                  if (updated) {
                    console.log(`📜 [Verify] Certificate '${updated.certId}' updated with order provenance event.`);
                  }
                }
              }
            }

            ch.ack(msg);
          } catch (processError) {
            console.error("❌ [Verify] Error processing RabbitMQ message:", processError);
            ch.nack(msg, false, false);
          }
        },
        { noAck: false }
      );
    } catch (error: any) {
      console.warn(`⚠️ [Verify] Failed to connect RabbitMQ consumer: ${error.message}. Will retry in 5s.`);
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
      console.error("Error closing Verify RabbitMQ consumer:", error);
    } finally {
      this.channel = null;
      this.connection = null;
    }
  }
}
