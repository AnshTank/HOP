import mongoose from "mongoose";

// Use environment variable for MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI as string;

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  if (!MONGODB_URI)
    throw new Error("MONGODB_URI is not defined in environment variables.");
  return mongoose.connect(MONGODB_URI);
}
