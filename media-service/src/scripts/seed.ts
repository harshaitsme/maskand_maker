import dotenv from "dotenv";
dotenv.config();

import { connectDB, disconnectDB } from "../config/db.js";
import { initMinio } from "../config/minio.js";
import { MediaRepository } from "../models/media.repository.js";

async function runSeed() {
  console.log("🌱 Starting Media Service Seed Migration...");
  try {
    await connectDB();
    await initMinio();

    const repo = new MediaRepository();
    const result = await repo.seedInitialData(true);
    console.log(`✅ Successfully seeded ${result.count} media asset records into 'media-svc' collection.`);
  } catch (error) {
    console.error("❌ Media Service Seed failed:", error);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

runSeed();
