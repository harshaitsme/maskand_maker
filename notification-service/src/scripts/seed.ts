import dotenv from "dotenv";
dotenv.config();

import { connectDB, disconnectDB } from "../config/db.js";
import { NotificationModel } from "../models/notification.schema.js";
import { initialNotifications } from "../models/seed.data.js";

async function seed() {
  console.log("🌱 [notification-service] Seeding initial notifications...");
  await connectDB();

  const count = await NotificationModel.countDocuments();
  if (count > 0) {
    console.log(`ℹ️ [notification-service] Found ${count} existing notification records. Resetting...`);
    await NotificationModel.deleteMany({});
  }

  await NotificationModel.insertMany(initialNotifications);
  console.log(`✅ [notification-service] Successfully seeded ${initialNotifications.length} notifications!`);

  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ [notification-service] Seeding failed:", err);
  process.exit(1);
});
