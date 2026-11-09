import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { RabbitMQClient } from "./config/rabbitmq.js";
import { OrderModel } from "./models/order.schema.js";
import { seedOrders } from "./models/seed.data.js";

const PORT = Number(process.env.PORT) || 3005;

async function bootstrap() {
  try {
    console.log("==================================================");
    console.log("    Mask & Maker Order & Courier Service (MVC)    ");
    console.log("==================================================");

    // 1. Connect MongoDB
    await connectDB();

    // 2. Connect RabbitMQ Event Bus
    try {
      await RabbitMQClient.connect();
    } catch (err: any) {
      console.warn("⚠️ RabbitMQ connection deferred:", err.message);
    }

    // 3. Auto-seed if collection is empty
    const count = await OrderModel.countDocuments();
    if (count === 0) {
      console.log("📦 Collection 'order-svc' is empty. Seeding initial mock orders...");
      await OrderModel.insertMany(seedOrders);
      console.log(`✅ Auto-seeded ${seedOrders.length} orders.`);
    } else {
      console.log(`📊 Registry contains ${count} active orders in 'order-svc'.`);
    }

    // 4. Start HTTP Server
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 order-service running on port ${PORT}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔗 Orders API:   http://localhost:${PORT}/api/orders`);
    });

    // 5. Graceful Shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await RabbitMQClient.disconnect();
        await disconnectDB();
        console.log("👋 Service stopped cleanly.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Fatal error starting order-service:", error);
    process.exit(1);
  }
}

bootstrap();
