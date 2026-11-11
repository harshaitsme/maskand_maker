import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { RabbitMQClient } from "./config/rabbitmq.js";
import { NotificationController } from "./controllers/notification.controller.js";
import { NotificationModel } from "./models/notification.schema.js";
import { initialNotifications } from "./models/seed.data.js";

const PORT = process.env.PORT || 3011;

async function bootstrap() {
  try {
    // 1. Connect MongoDB
    await connectDB();

    // 2. Auto-seed if empty
    const count = await NotificationModel.countDocuments();
    if (count === 0) {
      console.log("🌱 [notification-service] Empty collection detected. Auto-seeding initial notifications...");
      await NotificationModel.insertMany(initialNotifications);
      console.log(`✅ [notification-service] Seeded ${initialNotifications.length} notifications.`);
    }

    // 3. Connect RabbitMQ & Subscribe to all Mask & Maker events
    try {
      await RabbitMQClient.connect();
      await RabbitMQClient.subscribe(
        "notification-service.events",
        [
          "order.created",
          "order.status_updated",
          "mask.minted",
          "listing.minted",
          "listing.published",
          "twin.claimed",
          "settlement.recorded",
          "payout.processed",
          "nfc.tamper_reported",
          "media.3d_generated",
        ],
        async (routingKey, payload) => {
          await NotificationController.handleEvent(routingKey, payload);
        }
      );
    } catch (mqErr: any) {
      console.warn(`⚠️ [notification-service] RabbitMQ connection failed: ${mqErr.message}. Running in standalone mode.`);
    }

    // 4. Start HTTP Server
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`🚀 [notification-service] Notification Microservice running on http://localhost:${PORT}`);
      console.log(`📊 [notification-service] Healthcheck: http://localhost:${PORT}/health`);
      console.log(`🔔 [notification-service] Inbox: http://localhost:${PORT}/api/notifications`);
    });
  } catch (error: any) {
    console.error(`💥 [notification-service] Fatal startup error: ${error.message}`);
    process.exit(1);
  }
}

bootstrap();
