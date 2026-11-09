import amqp, { Channel, ChannelModel } from "amqplib";

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
      console.log(`🐰 [notification-service] Connecting to RabbitMQ at ${this.uri.replace(/:[^:]*@/, ":***@")}...`);
      const conn = await amqp.connect(this.uri);
      this.connection = conn;

      conn.on("error", (err) => {
        console.error("❌ [notification-service] RabbitMQ connection error:", err.message);
      });

      conn.on("close", () => {
        console.warn("⚠️ [notification-service] RabbitMQ connection closed. Attempting reconnect in 5s...");
        this.channel = null;
        this.connection = null;
        setTimeout(() => this.connect().catch(() => {}), 5000);
      });

      const ch = await conn.createChannel();
      this.channel = ch;

      await ch.assertExchange(this.exchange, "topic", { durable: true });
      console.log(`✅ [notification-service] RabbitMQ connected. Topic exchange: '${this.exchange}'`);
      return ch;
    } catch (error: any) {
      console.error(`❌ [notification-service] Failed to connect to RabbitMQ: ${error.message}`);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  public static async publish(routingKey: string, message: any): Promise<boolean> {
    try {
      const ch = await this.connect();
      const content = Buffer.from(JSON.stringify(message));
      return ch.publish(this.exchange, routingKey, content, {
        contentType: "application/json",
        persistent: true,
      });
    } catch (error: any) {
      console.error(`❌ [notification-service] Publish failed for key '${routingKey}':`, error.message);
      return false;
    }
  }

  public static async subscribe(
    queueName: string,
    bindingKeys: string[],
    onMessage: (routingKey: string, payload: any) => Promise<void>
  ): Promise<void> {
    try {
      const ch = await this.connect();
      const q = await ch.assertQueue(queueName, { durable: true });

      for (const key of bindingKeys) {
        await ch.bindQueue(q.queue, this.exchange, key);
        console.log(`📡 [notification-service] Bound queue '${queueName}' to routingKey: '${key}'`);
      }

      ch.consume(q.queue, async (msg) => {
        if (!msg) return;
        try {
          const payload = JSON.parse(msg.content.toString());
          const routingKey = msg.fields.routingKey;
          await onMessage(routingKey, payload);
          ch.ack(msg);
        } catch (err: any) {
          console.error(`❌ [notification-service] Error processing message on '${queueName}':`, err.message);
          ch.nack(msg, false, false);
        }
      });
    } catch (error: any) {
      console.error(`❌ [notification-service] Subscribe error:`, error.message);
    }
  }
}
