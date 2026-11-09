import dotenv from "dotenv";
dotenv.config();

import { connectDB, disconnectDB } from "../config/db.js";
import { initialSettlements } from "../models/seed.data.js";
import { SettlementModel } from "../models/settlement.schema.js";

async function seed() {
  console.log("🌱 [settlement-service] Seeding initial fair-trade settlement transactions...");
  await connectDB();

  const count = await SettlementModel.countDocuments();
  if (count > 0) {
    console.log(`ℹ️ [settlement-service] Found ${count} existing settlement records. Resetting...`);
    await SettlementModel.deleteMany({});
  }

  await SettlementModel.insertMany(initialSettlements);
  console.log(`✅ [settlement-service] Successfully seeded ${initialSettlements.length} settlement transactions!`);

  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ [settlement-service] Seeding failed:", err);
  process.exit(1);
});
