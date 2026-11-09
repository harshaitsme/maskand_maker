import dotenv from "dotenv";
import { connectDB, disconnectDB } from "../config/db.js";
import { initialArticles, initialCraftStages, initialTraditions, initialWorkshops } from "../models/seed.data.js";
import { ArticleModel, CraftStageModel, TraditionModel, WorkshopModel } from "../models/content.schema.js";

// Load environment variables
dotenv.config();

/**
 * Database Seed Script for content-service
 * Seeds all traditions, articles, stages, and workshops into MongoDB collections.
 */
async function seedDatabase() {
  console.log("=================================================");
  console.log("🌱 Mask & Maker — Seeding Heritage Content Collections");
  console.log("=================================================");

  try {
    await connectDB();

    // 1. Seed Traditions
    await TraditionModel.deleteMany({});
    const insertedTraditions = await TraditionModel.insertMany(initialTraditions);
    console.log(`✅ Seeded ${insertedTraditions.length} traditions into 'content-traditions'.`);

    // 2. Seed Articles
    await ArticleModel.deleteMany({});
    const insertedArticles = await ArticleModel.insertMany(initialArticles);
    console.log(`✅ Seeded ${insertedArticles.length} articles into 'content-articles'.`);

    // 3. Seed Craft Stages
    await CraftStageModel.deleteMany({});
    const insertedStages = await CraftStageModel.insertMany(initialCraftStages);
    console.log(`✅ Seeded ${insertedStages.length} craft stages into 'content-stages'.`);

    // 4. Seed Workshops
    await WorkshopModel.deleteMany({});
    const insertedWorkshops = await WorkshopModel.insertMany(initialWorkshops);
    console.log(`✅ Seeded ${insertedWorkshops.length} workshops into 'content-workshops'.`);

    console.log("\nDatabase content seeding completed successfully.");
  } catch (error) {
    console.error("❌ Failed to seed content database:", error);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

seedDatabase();
