import dotenv from "dotenv";
import { connectDB, disconnectDB } from "../config/db.js";
import { initialArtisans } from "../models/seed.data.js";
import { ArtisanModel } from "../models/artisan.schema.js";

// Load environment variables
dotenv.config();

/**
 * Database Seed Script for artisan-service
 * Migrates all authentic artisan seed data into the MongoDB 'artisan-svc' collection.
 */
async function seedDatabase() {
  console.log("=================================================");
  console.log("🌱 Mask & Maker — Seeding MongoDB Collection: artisan-svc");
  console.log("=================================================");

  try {
    await connectDB();

    const collectionName = ArtisanModel.collection.name;
    console.log(`Target Collection: [${collectionName}]`);

    // Clear existing records in collection
    const deleteResult = await ArtisanModel.deleteMany({});
    console.log(`🧹 Cleared ${deleteResult.deletedCount} existing documents in '${collectionName}'.`);

    // Insert all authentic artisans
    const inserted = await ArtisanModel.insertMany(initialArtisans);
    console.log(`✅ Successfully seeded ${inserted.length} master artisans into '${collectionName}'!`);

    console.log("\nSample inserted artisans:");
    inserted.slice(0, 3).forEach((a) => {
      console.log(` - ${a.name} (${a.slug}) · ${a.role} [${a.village}]`);
    });

    console.log("\nDatabase seeding completed successfully.");
  } catch (error) {
    console.error("❌ Failed to seed artisan database:", error);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

seedDatabase();
