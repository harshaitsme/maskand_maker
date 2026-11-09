import amqp, { Channel, ChannelModel } from "amqplib";

const RABBITMQ_URI = process.env.RABBITMQ_URI || "amqp://guest:guest@localhost:5672";
const EXCHANGE_NAME = process.env.RABBITMQ_EXCHANGE || "maskandmaker.events";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export interface ListingMintedEvent {
  eventId: string;
  eventType: "listing.minted";
  timestamp: string;
  data: {
    listingId: string;
    certificateId: string;
    maskSlug: string;
    maskTitle: string;
    artisanSlug: string;
    artisanName: string;
    tradition: "raksha" | "sanni" | "kolam";
    woodType: string;
    priceLKR: number;
    blockchain: {
      chain: "Polygon";
      contractAddress: string;
      tokenId: string;
      transactionHash: string;
      ipfsMetadataUri: string;
      assetSha256: string;
    };
    nfc: {
      tagUid: string;
      verificationUrl: string;
    };
  };
}

export interface ListingPublishedEvent {
  eventId: string;
  eventType: "listing.published";
  timestamp: string;
  data: {
    listingId: string;
    certificateId: string;
    maskSlug: string;
    maskTitle: string;
    artisanSlug: string;
    priceLKR: number;
    stock: number;
    status: "published" | "pending_review";
  };
}

export async function connectRabbitMQ(): Promise<Channel | null> {
  try {
    console.log(`🐇 Connecting to RabbitMQ at ${RABBITMQ_URI}...`);
    const conn = await amqp.connect(RABBITMQ_URI);
    connection = conn;

    conn.on("error", (err: any) => {
      console.error("RabbitMQ connection error:", err.message);
      channel = null;
      connection = null;
    });

    conn.on("close", () => {
      console.warn("RabbitMQ connection closed.");
      channel = null;
      connection = null;
    });

    const ch = await conn.createChannel();
    channel = ch;

    // Ensure the durable topic exchange exists
    await ch.assertExchange(EXCHANGE_NAME, "topic", { durable: true });

    console.log(`✅ RabbitMQ connected & exchange '${EXCHANGE_NAME}' verified.`);
    return ch;
  } catch (error: any) {
    console.warn("⚠️ RabbitMQ connection unavailable (running in standalone/degraded mode):", error.message);
    return null;
  }
}

export async function publishListingMinted(event: ListingMintedEvent): Promise<boolean> {
  if (!channel) {
    console.warn("RabbitMQ channel not open, skipping event publish:", event.eventType);
    return false;
  }

  try {
    const routingKey = "listing.minted";
    const payload = Buffer.from(JSON.stringify(event));
    const published = channel.publish(EXCHANGE_NAME, routingKey, payload, {
      contentType: "application/json",
      persistent: true,
      timestamp: Date.now(),
      messageId: event.eventId,
    });
    console.log(`📢 Emitted RabbitMQ event '${event.eventType}' [routingKey=${routingKey}, cert=${event.data.certificateId}]`);
    return published;
  } catch (error) {
    console.error("Failed to publish listing.minted event:", error);
    return false;
  }
}

export async function publishListingPublished(event: ListingPublishedEvent): Promise<boolean> {
  if (!channel) {
    console.warn("RabbitMQ channel not open, skipping event publish:", event.eventType);
    return false;
  }

  try {
    const routingKey = "listing.published";
    const payload = Buffer.from(JSON.stringify(event));
    const published = channel.publish(EXCHANGE_NAME, routingKey, payload, {
      contentType: "application/json",
      persistent: true,
      timestamp: Date.now(),
      messageId: event.eventId,
    });
    console.log(`📢 Emitted RabbitMQ event '${event.eventType}' [routingKey=${routingKey}, slug=${event.data.maskSlug}]`);
    return published;
  } catch (error) {
    console.error("Failed to publish listing.published event:", error);
    return false;
  }
}

export async function closeRabbitMQ(): Promise<void> {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log("🐇 RabbitMQ connection closed cleanly.");
  } catch (error) {
    console.error("Error closing RabbitMQ connection:", error);
  }
}

export function isRabbitMQConnected(): boolean {
  return channel !== null;
}
