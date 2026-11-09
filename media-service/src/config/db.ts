import mongoose from "mongoose";

/**
 * MongoDB Connection Manager for media-service
 */
export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/maskandmaker";

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    console.log(`🍃 Connected to MongoDB: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log("🍃 Disconnected from MongoDB cleanly.");
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error);
  }
}

export function isDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
