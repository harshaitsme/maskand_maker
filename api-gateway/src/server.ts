import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app.js";

const PORT = process.env.PORT || 5000;

function bootstrap() {
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`🌐 [api-gateway] Mask & Maker API Gateway listening on http://localhost:${PORT}`);
    console.log(`📊 [api-gateway] Healthcheck: http://localhost:${PORT}/health`);
    console.log(`🏥 [api-gateway] Cluster Diagnostic: http://localhost:${PORT}/health/all`);
  });
}

bootstrap();
