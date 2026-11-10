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

      // 3. Bind to all order lifecycle events (order.*) and portal minting events (listing.minted)
      await ch.bindQueue(this.queue, this.exchange, "order.*");
      await ch.bindQueue(this.queue, this.exchange, "listing.minted");

      console.log(`✅ [Verify] RabbitMQ consumer listening on queue '${this.queue}' bound to 'order.*' and 'listing.minted'`);

      // 4. Consume messages
      await ch.consume(
        this.queue,
        async (msg) => {
          if (!msg) return;

          try {
            const content = JSON.parse(msg.content.toString());
            const routingKey = msg.fields.routingKey;
            const today = new Date().toISOString().split("T")[0];

            console.log(`📥 [Verify] Received event '${routingKey}'`);

            if (routingKey === "listing.minted" && content.data?.certificateId) {
              const d = content.data;
              const existing = await verifyRepository.findByCertId(d.certificateId);
              if (!existing) {
                await verifyRepository.createCertificate({
                  certId: d.certificateId,
                  maskSlug: d.maskSlug,
                  maskName: d.maskTitle || d.maskSlug,
                  artisanSlug: d.artisanSlug || "chandana-bandara",
                  artisanName: d.artisanName || "Chandana Bandara",
                  mintedAt: today,
                  status: "unclaimed",
                  chain: "Polygon",
                  contractAddress:
                    d.blockchain?.contractAddress || "0x38F087796d11eB40A5581B855Dcb2b3cEb78d3Fa",
                  tokenId: `42161 · #${d.blockchain?.tokenId || "0001"}`,
                  ipfsUri: d.blockchain?.ipfsMetadataUri || "ipfs://bafybeig7m2rvkq7xe4p3kqux3kqz9",
                  owner: null,
                  ownerWallet: null,
                  history: [
                    {
                      label: "Carved & awakened",
                      date: today,
                      actor: `${d.artisanName || "Chandana Bandara"} · Ambalangoda`,
                    },
                    {
                      label: "3D scanned",
                      date: today,
                      actor: "M&M studio, Ambalangoda",
                    },
                    {
                      label: "Certificate minted",
                      date: today,
                      actor: "Mask & Maker registry",
                    },
                    {
                      label: "NFC tag attached",
                      date: today,
                      actor: "Registry desk",
                    },
                  ],
                  qrCodeUrl: `https://maskandmaker.com/verify/${d.certificateId}`,
                  nfcTag: {
                    uid: d.nfc?.tagUid || "04:A1:B2:C3:D4:E5:80",
                    standard: "NTAG424_DNA",
                    tapCount: 1,
                    lastTappedAt: new Date(),
                    batch: "AMB-2026-B1",
                  },
                  artisanSignature:
                    d.blockchain?.transactionHash ||
                    "0x3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
                  hashProof:
                    d.blockchain?.assetSha256 ||
                    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                  isTampered: false,
                  tamperReports: [],
                });
                console.log(`📜 [Verify] Registered newly minted certificate '${d.certificateId}' from portal-service.`);
              }
            } else if (routingKey === "order.created" && Array.isArray(content.items)) {
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

  public static async publish(routingKey: string, payload: Record<string, unknown>): Promise<boolean> {
    if (!this.channel) return false;
    try {
      return this.channel.publish(
        this.exchange,
        routingKey,
        Buffer.from(JSON.stringify(payload)),
        { contentType: "application/json", persistent: true, timestamp: Date.now() }
      );
    } catch {
      return false;
    }
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
