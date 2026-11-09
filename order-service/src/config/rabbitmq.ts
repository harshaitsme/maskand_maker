import amqp, { Channel, ChannelModel } from "amqplib";

/**
 * RabbitMQ Event Bus Manager for Mask & Maker Microservices
 */
export class RabbitMQClient {
  private static connection: ChannelModel | null = null;
  private static channel: Channel | null = null;
  private static exchange: string = process.env.RABBITMQ_EXCHANGE || "maskandmaker.events";
  private static uri: string = process.env.RABBITMQ_URI || "amqp://guest:guest@localhost:5672";
  private static isConnecting: boolean = false;

  public static async connect(): Promise<Channel> {
    if (this.channel) return this.channel;
    if (this.isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return this.channel!;
    }

    this.isConnecting = true;
    try {
      console.log(`🐰 Connecting to RabbitMQ at ${this.uri.replace(/:[^:]*@/, ":***@")}...`);
      const conn = await amqp.connect(this.uri);
      this.connection = conn;

      conn.on("error", (err) => {
        console.error("❌ RabbitMQ connection error:", err.message);
      });

      conn.on("close", () => {
        console.warn("⚠️ RabbitMQ connection closed. Attempting reconnect in 5s...");
        this.channel = null;
        this.connection = null;
        setTimeout(() => this.connect().catch(() => {}), 5000);
      });

      const ch = await conn.createChannel();
      this.channel = ch;

      // Assert durable topic exchange
      await ch.assertExchange(this.exchange, "topic", { durable: true });

      console.log(`✅ RabbitMQ connected. Topic exchange asserted: '${this.exchange}'`);
      return ch;
    } catch (error: any) {
      console.error(`❌ Failed to connect to RabbitMQ: ${error.message}`);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Publish an event to the RabbitMQ exchange with a specific routing key
   * e.g., routingKey = "order.created"
   */
  public static async publish(routingKey: string, message: any): Promise<boolean> {
    try {
      const ch = await this.connect();
      const content = Buffer.from(JSON.stringify(message));

      const published = ch.publish(this.exchange, routingKey, content, {
        persistent: true,
        contentType: "application/json",
        timestamp: Date.now(),
      });

      console.log(`📤 [RabbitMQ] Published event '${routingKey}' (${content.length} bytes)`);
      return published;
    } catch (error) {
      console.error(`❌ [RabbitMQ] Failed to publish event '${routingKey}':`, error);
      return false;
    }
  }

  public static isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }

  public static async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log("🐰 Disconnected from RabbitMQ cleanly.");
    } catch (error) {
      console.error("Error disconnecting from RabbitMQ:", error);
    } finally {
      this.channel = null;
      this.connection = null;
    }
  }
}
