import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/maskandmaker";

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);
    console.log(`🌿 [settlement-service] MongoDB connected successfully to ${uri.replace(/\/\/.*@/, "//***@")}`);
  } catch (error: any) {
    console.error(`❌ [settlement-service] MongoDB connection failed: ${error.message}`);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log("🌿 [settlement-service] MongoDB disconnected.");
  } catch (error: any) {
    console.error(`❌ [settlement-service] Error disconnecting MongoDB: ${error.message}`);
  }
}
