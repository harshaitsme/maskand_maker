import dotenv from "dotenv";
dotenv.config();

import { connectDB, disconnectDB } from "./config/db.js";
import { initMinio } from "./config/minio.js";
import { closeRabbitMQ, connectRabbitMQ } from "./config/rabbitmq.js";
import { createApp } from "./app.js";
import { MediaRepository } from "./models/media.repository.js";

const PORT = parseInt(process.env.PORT || "3009", 10);

async function startServer(): Promise<void> {
  try {
    console.log("🚀 Initializing Media & 3D Asset Service...");

    // 1. Connect to Database
    await connectDB();

    // 2. Initialize MinIO / S3 Storage & Verify Bucket
    await initMinio();

    // 3. Connect to RabbitMQ event bus
    await connectRabbitMQ();

    // 4. Auto-seed if database is empty
    const mediaRepo = new MediaRepository();
    const seedResult = await mediaRepo.seedInitialData(false);
    console.log(`📦 Media registry populated with ${seedResult.count} asset records.`);

    // 5. Start Express server
    const app = createApp();
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Media Service listening at http://0.0.0.0:${PORT}`);
      console.log(`📸 Upload API: http://0.0.0.0:${PORT}/api/media/upload`);
      console.log(`🌐 Stream & 3D Viewer CDN: http://0.0.0.0:${PORT}/api/media/stream/*`);
      console.log(`🩺 Health: http://0.0.0.0:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await closeRabbitMQ();
        await disconnectDB();
        console.log("👋 Media Service shutdown complete.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Failed to start Media Service:", error);
    process.exit(1);
  }
}

startServer();
