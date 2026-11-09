import dotenv from "dotenv";
dotenv.config();

import { connectDB, disconnectDB } from "../config/db.js";
import { UserRepository } from "../models/user.repository.js";

async function runSeed() {
  console.log("🌱 Starting Identity Service Seed Migration...");
  try {
    await connectDB();
    const repo = new UserRepository();
    const result = await repo.seedInitialData(true);
    console.log(`✅ Successfully seeded ${result.count} users into 'identity-svc' collection.`);
  } catch (error) {
    console.error("❌ Identity Service Seed failed:", error);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

runSeed();
