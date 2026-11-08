import dotenv from "dotenv";
dotenv.config();

import { connectDB, disconnectDB } from "../config/db.js";
import { CertificateModel } from "../models/verify.schema.js";
import { seedCertificates } from "../models/seed.data.js";

async function seed() {
  console.log("🌱 Starting NFC/QR Registry Database Seeding...");

  try {
    await connectDB();

    const existingCount = await CertificateModel.countDocuments();
    console.log(`Current certificates in collection: ${existingCount}`);

    // Clean migration: drop existing verify-svc certificates and populate
    await CertificateModel.deleteMany({});
    console.log("Cleared existing verify-svc collection.");

    const inserted = await CertificateModel.insertMany(seedCertificates);
    console.log(`✅ Successfully seeded ${inserted.length} mask provenance certificates into 'verify-svc'!`);

    const unclaimed = inserted.filter((c) => c.status === "unclaimed").length;
    const claimed = inserted.filter((c) => c.status === "claimed").length;
    console.log(`   - Unclaimed physical twins: ${unclaimed}`);
    console.log(`   - Claimed physical twins: ${claimed}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

seed();
