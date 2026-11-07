import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { artisanRepository } from "./models/artisan.repository.js";
import { initialArtisans } from "./models/seed.data.js";
import { ArtisanModel } from "./models/artisan.schema.js";

// Load environment variables from .env
dotenv.config();

const PORT = process.env.PORT || 3002;
const app = createApp();

async function startServer() {
  try {
    // 1. Establish MongoDB connection
    await connectDB();

    // 2. Check if collection is empty; auto-seed if needed
    const count = await artisanRepository.count();
    if (count === 0) {
      console.log(`📦 Collection '${ArtisanModel.collection.name}' is empty. Auto-seeding initial 8 artisans...`);
      await ArtisanModel.insertMany(initialArtisans);
      console.log(`✅ Successfully seeded 8 artisans into '${ArtisanModel.collection.name}' collection.`);
    } else {
      console.log(`📦 Collection '${ArtisanModel.collection.name}' contains ${count} artisans.`);
    }

    // 3. Start Express server
    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🏛️ Mask & Maker — Artisan Service (MVC + MongoDB)`);
      console.log(`🚀 Server listening on: http://localhost:${PORT}`);
      console.log(`📡 Health Check:        http://localhost:${PORT}/health`);
      console.log(`🎨 Artisan Endpoints:   http://localhost:${PORT}/api/artisans`);
      console.log(`=======================================================`);
    });

    // Graceful Shutdown Handler
    async function handleShutdown(signal: string) {
      console.log(`\n[${signal}] Initiating graceful shutdown...`);
      server.close(async () => {
        await disconnectDB();
        console.log("Artisan service stopped cleanly.");
        process.exit(0);
      });
    }

    process.on("SIGINT", () => handleShutdown("SIGINT"));
    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Failed to start artisan-service:", error);
    process.exit(1);
  }
}

startServer();
