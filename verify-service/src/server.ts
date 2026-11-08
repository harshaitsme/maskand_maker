import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { CertificateModel } from "./models/verify.schema.js";
import { seedCertificates } from "./models/seed.data.js";

const PORT = Number(process.env.PORT) || 3004;

async function bootstrap() {
  try {
    console.log("==================================================");
    console.log("  Mask & Maker NFC/QR Tag Authentication Service  ");
    console.log("==================================================");

    await connectDB();

    // Auto-seed if collection is empty
    const count = await CertificateModel.countDocuments();
    if (count === 0) {
      console.log("📦 Collection 'verify-svc' is empty. Seeding initial 18 mask provenance certificates...");
      await CertificateModel.insertMany(seedCertificates);
      console.log(`✅ Auto-seeded ${seedCertificates.length} certificates.`);
    } else {
      console.log(`📊 Registry contains ${count} active certificates in 'verify-svc'.`);
    }

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 verify-service running on port ${PORT}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔗 Verify API:   http://localhost:${PORT}/api/verify`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log("👋 Service stopped cleanly.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Fatal error starting verify-service:", error);
    process.exit(1);
  }
}

bootstrap();
