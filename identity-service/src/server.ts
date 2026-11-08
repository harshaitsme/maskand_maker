import dotenv from "dotenv";
dotenv.config();

import { connectDB, disconnectDB } from "./config/db.js";
import { createApp } from "./app.js";
import { UserRepository } from "./models/user.repository.js";

const PORT = parseInt(process.env.PORT || "3007", 10);

async function startServer(): Promise<void> {
  try {
    console.log("🚀 Initializing Identity Service...");

    // 1. Connect to Database
    await connectDB();

    // 2. Auto-seed if empty
    const userRepo = new UserRepository();
    const seedResult = await userRepo.seedInitialData(false);
    console.log(`👤 Database populated with ${seedResult.count} users.`);

    // 3. Start Express server
    const app = createApp();
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Identity Service listening at http://0.0.0.0:${PORT}`);
      console.log(`🔐 Auth Endpoints: http://0.0.0.0:${PORT}/api/auth`);
      console.log(`👤 User Endpoints: http://0.0.0.0:${PORT}/api/users`);
      console.log(`🩺 Health: http://0.0.0.0:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await disconnectDB();
        console.log("👋 Identity Service shut down complete.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Failed to start Identity Service:", error);
    process.exit(1);
  }
}

startServer();
