import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { maskRepository } from "./models/mask.repository.js";
import { initialMasks } from "./models/seed.data.js";
import { MaskModel } from "./models/mask.schema.js";

// Load environment variables from .env
dotenv.config();

const PORT = process.env.PORT || 3001;
const app = createApp();

async function startServer() {
  try {
    // 1. Establish MongoDB connection
    await connectDB();

    // 2. Check if collection is empty; auto-seed if needed
    const count = await maskRepository.count();
    if (count === 0) {
      console.log(`📦 Collection '${MaskModel.collection.name}' is empty. Auto-seeding initial 18 masks...`);
      await MaskModel.insertMany(initialMasks);
      console.log(`✅ Successfully seeded 18 masks into '${MaskModel.collection.name}' collection.`);
    } else {
      console.log(`📦 Collection '${MaskModel.collection.name}' contains ${count} masks.`);
    }

    // 3. Start Express server
    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🏛️ Mask & Maker — Catalog Service (MVC + MongoDB)`);
      console.log(`🚀 Server listening on: http://localhost:${PORT}`);
      console.log(`📡 Health Check:        http://localhost:${PORT}/health`);
      console.log(`🎭 Catalog Endpoints:   http://localhost:${PORT}/api/masks`);
      console.log(`=======================================================`);
    });

    // Graceful Shutdown Handler
    async function handleShutdown(signal: string) {
      console.log(`\n[${signal}] Initiating graceful shutdown...`);
      server.close(async () => {
        await disconnectDB();
        console.log("Catalog service stopped cleanly.");
        process.exit(0);
      });
    }

    process.on("SIGINT", () => handleShutdown("SIGINT"));
    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Failed to start catalog-service:", error);
    process.exit(1);
  }
}

startServer();
