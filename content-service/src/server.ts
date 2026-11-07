import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { contentRepository } from "./models/content.repository.js";
import { initialArticles, initialCraftStages, initialTraditions, initialWorkshops } from "./models/seed.data.js";
import { ArticleModel, CraftStageModel, TraditionModel, WorkshopModel } from "./models/content.schema.js";

// Load environment variables from .env
dotenv.config();

const PORT = process.env.PORT || 3003;
const app = createApp();

async function startServer() {
  try {
    // 1. Establish MongoDB connection
    await connectDB();

    // 2. Check if collections are empty; auto-seed if needed
    const stats = await contentRepository.countAll();
    if (stats.traditions === 0 || stats.articles === 0) {
      console.log("📦 Content collections are empty. Auto-seeding initial content data...");
      if (stats.traditions === 0) await TraditionModel.insertMany(initialTraditions);
      if (stats.articles === 0) await ArticleModel.insertMany(initialArticles);
      if (stats.stages === 0) await CraftStageModel.insertMany(initialCraftStages);
      if (stats.workshops === 0) await WorkshopModel.insertMany(initialWorkshops);
      console.log("✅ Successfully auto-seeded all heritage content collections.");
    } else {
      console.log(
        `📦 Content Collections: ${stats.traditions} traditions, ${stats.articles} articles, ${stats.stages} craft stages, ${stats.workshops} workshops.`
      );
    }

    // 3. Start Express server
    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🏛️ Mask & Maker — Content Service (MVC + MongoDB)`);
      console.log(`🚀 Server listening on: http://localhost:${PORT}`);
      console.log(`📡 Health Check:        http://localhost:${PORT}/health`);
      console.log(`📖 Traditions API:      http://localhost:${PORT}/api/traditions`);
      console.log(`📜 Articles API:        http://localhost:${PORT}/api/articles`);
      console.log(`🪵 Craft Stages API:    http://localhost:${PORT}/api/stages`);
      console.log(`🛠️ Workshops API:       http://localhost:${PORT}/api/workshops`);
      console.log(`=======================================================`);
    });

    // Graceful Shutdown Handler
    async function handleShutdown(signal: string) {
      console.log(`\n[${signal}] Initiating graceful shutdown...`);
      server.close(async () => {
        await disconnectDB();
        console.log("Content service stopped cleanly.");
        process.exit(0);
      });
    }

    process.on("SIGINT", () => handleShutdown("SIGINT"));
    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Failed to start content-service:", error);
    process.exit(1);
  }
}

startServer();
