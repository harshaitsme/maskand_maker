import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { RabbitMQClient } from "./config/rabbitmq.js";
import { SettlementController } from "./controllers/settlement.controller.js";
import { initialSettlements } from "./models/seed.data.js";
import { SettlementModel } from "./models/settlement.schema.js";

const PORT = process.env.PORT || 3010;

async function bootstrap() {
  try {
    // 1. Connect MongoDB
    await connectDB();

    // 2. Auto-seed if empty
    const count = await SettlementModel.countDocuments();
    if (count === 0) {
      console.log("🌱 [settlement-service] Empty collection detected. Auto-seeding initial settlement records...");
      await SettlementModel.insertMany(initialSettlements);
      console.log(`✅ [settlement-service] Seeded ${initialSettlements.length} settlement transactions.`);
    }

    // 3. Connect RabbitMQ & Subscribe to Order/Verify events
    try {
      await RabbitMQClient.connect();
      await RabbitMQClient.subscribe(
        "settlement-service.events",
        ["order.created", "order.status_updated", "twin.claimed"],
        async (routingKey, payload) => {
          await SettlementController.handleEvent(routingKey, payload);
        }
      );
    } catch (mqErr: any) {
      console.warn(`⚠️ [settlement-service] RabbitMQ connection failed: ${mqErr.message}. Running in standalone mode.`);
    }

    // 4. Start HTTP Server
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`🚀 [settlement-service] Fair-Trade Settlement Service running on http://localhost:${PORT}`);
      console.log(`📊 [settlement-service] Healthcheck: http://localhost:${PORT}/health`);
      console.log(`💰 [settlement-service] Artisan Bench Ledger: http://localhost:${PORT}/api/settlement/ledger`);
    });
  } catch (error: any) {
    console.error(`💥 [settlement-service] Fatal startup error: ${error.message}`);
    process.exit(1);
  }
}

bootstrap();
