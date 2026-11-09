import dotenv from "dotenv";
dotenv.config();

import { connectDB, disconnectDB } from "./config/db.js";
import { closeRabbitMQ, connectRabbitMQ } from "./config/rabbitmq.js";
import { createApp } from "./app.js";
import { PortalRepository } from "./models/portal.repository.js";

const PORT = parseInt(process.env.PORT || "3008", 10);

async function startServer(): Promise<void> {
  try {
    console.log("🚀 Initializing Portal & Mint Service...");

    // 1. Connect to Database
    await connectDB();

    // 2. Connect to RabbitMQ event bus
    await connectRabbitMQ();

    // 3. Auto-seed if database is empty
    const portalRepo = new PortalRepository();
    const seedResult = await portalRepo.seedInitialData(false);
    console.log(
      `📦 Workbench data verified: ${seedResult.ordersCount} bench orders, ${seedResult.listingsCount} listings.`
    );

    // 4. Start Express server
    const app = createApp();
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Portal & Mint Service listening at http://0.0.0.0:${PORT}`);
      console.log(`🪵 Artisan Workbench Endpoints: http://0.0.0.0:${PORT}/api/portal`);
      console.log(`⛓️ Provenance Minting Endpoints: http://0.0.0.0:${PORT}/api/mint`);
      console.log(`🩺 Health: http://0.0.0.0:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await closeRabbitMQ();
        await disconnectDB();
        console.log("👋 Portal & Mint Service shutdown complete.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Failed to start Portal & Mint Service:", error);
    process.exit(1);
  }
}

startServer();
