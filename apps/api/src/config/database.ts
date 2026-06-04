import mongoose from "mongoose";
import { env } from "#src/config/env.js";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MongoDB connection error";
    throw new Error(
      `MongoDB connection failed. Start MongoDB on 127.0.0.1:27017 or set MONGODB_URI to a MongoDB Atlas connection string. Details: ${message}`
    );
  }
}
