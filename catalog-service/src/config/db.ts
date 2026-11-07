import mongoose from "mongoose";

/**
 * MongoDB Connection Manager
 * Connects to MongoDB using connection string configured via .env
 */
export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/maskandmaker";

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true, // Build indexes automatically in development
    });

    console.log(`🍃 Connected to MongoDB: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

/**
 * Gracefully disconnects from MongoDB
 */
export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log("🍃 Disconnected from MongoDB cleanly.");
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error);
  }
}

/**
 * Check if MongoDB connection is ready (1 = connected)
 */
export function isDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
