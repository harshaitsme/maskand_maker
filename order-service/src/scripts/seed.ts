import dotenv from "dotenv";
dotenv.config();

import { connectDB, disconnectDB } from "../config/db.js";
import { OrderModel } from "../models/order.schema.js";
import { seedOrders } from "../models/seed.data.js";

async function seed() {
  console.log("🌱 Starting Order Database Seeding...");

  try {
    await connectDB();

    const existingCount = await OrderModel.countDocuments();
    console.log(`Current orders in collection: ${existingCount}`);

    // Clean migration: drop existing order-svc collection and populate
    await OrderModel.deleteMany({});
    console.log("Cleared existing order-svc collection.");

    const inserted = await OrderModel.insertMany(seedOrders);
    console.log(`✅ Successfully seeded ${inserted.length} orders into 'order-svc'!`);

    const preparing = inserted.filter((o) => o.status === "preparing").length;
    const inTransit = inserted.filter((o) => o.status === "in-transit").length;
    const delivered = inserted.filter((o) => o.status === "delivered").length;
    console.log(`   - Preparing orders:  ${preparing}`);
    console.log(`   - In-transit orders: ${inTransit}`);
    console.log(`   - Delivered orders:  ${delivered}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

seed();
