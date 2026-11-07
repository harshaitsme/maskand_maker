import dotenv from "dotenv";
import { connectDB, disconnectDB } from "../config/db.js";
import { initialMasks } from "../models/seed.data.js";
import { MaskModel } from "../models/mask.schema.js";

// Load environment variables
dotenv.config();

/**
 * Database Seed Script
 * Migrates all authentic seed data from seed.data.ts into the MongoDB 'catalog-svc' collection.
 */
async function seedDatabase() {
  console.log("=================================================");
  console.log("🌱 Mask & Maker — Seeding MongoDB Collection: catalog-svc");
  console.log("=================================================");

  try {
    await connectDB();

    const collectionName = MaskModel.collection.name;
    console.log(`Target Collection: [${collectionName}]`);

    // Clear existing records in collection
    const deleteResult = await MaskModel.deleteMany({});
    console.log(`🧹 Cleared ${deleteResult.deletedCount} existing documents in '${collectionName}'.`);

    // Insert all authentic masks
    const inserted = await MaskModel.insertMany(initialMasks);
    console.log(`✅ Successfully seeded ${inserted.length} authentic masks into '${collectionName}'!`);

    console.log("\nSample inserted records:");
    inserted.slice(0, 3).forEach((m) => {
      console.log(` - [${m.tradition.toUpperCase()}] ${m.name} (${m.slug}) - LKR ${m.priceLKR.toLocaleString()}`);
    });

    console.log("\nDatabase seeding completed successfully.");
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

seedDatabase();
