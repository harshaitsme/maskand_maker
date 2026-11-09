import dotenv from "dotenv";
dotenv.config();

import { connectDB, disconnectDB } from "../config/db.js";
import { PortalRepository } from "../models/portal.repository.js";

async function runSeed() {
  console.log("🌱 Starting Portal & Mint Service Seed Migration...");
  try {
    await connectDB();
    const repo = new PortalRepository();
    const result = await repo.seedInitialData(true);
    console.log(
      `✅ Successfully seeded: ${result.ordersCount} bench orders, ${result.listingsCount} listings, and ${result.settlementsCount} settlement records.`
    );
  } catch (error) {
    console.error("❌ Portal Service Seed failed:", error);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

runSeed();
