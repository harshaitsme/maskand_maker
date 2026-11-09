import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { searchRepository } from "./models/search.repository.js";

const PORT = Number(process.env.PORT) || 3006;

async function bootstrap() {
  try {
    console.log("==================================================");
    console.log("    Mask & Maker Unified Search Service (MVC)     ");
    console.log("==================================================");

    // 1. Connect MongoDB
    await connectDB();

    // 2. Log Index Metrics
    const stats = await searchRepository.getStats();
    console.log(`🔍 Search Index Initialized:`);
    console.log(`   - Masks in Catalog:        ${stats.totalMasks}`);
    console.log(`   - Master Artisans:         ${stats.totalArtisans}`);
    console.log(`   - Heritage Essays & Films: ${stats.totalArticles}`);
    console.log(`   - Mask Traditions:         ${stats.totalTraditions}`);

    // 3. Start HTTP Server
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 search-service running on port ${PORT}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔗 Search API:   http://localhost:${PORT}/api/search?q=gini`);
    });

    // 4. Graceful Shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log("👋 Search service stopped cleanly.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Fatal error starting search-service:", error);
    process.exit(1);
  }
}

bootstrap();
