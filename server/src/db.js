import mongoose from "mongoose";
import { config } from "./config.js";

export async function connectDb() {
  if (!config.mongoUrl) {
    throw new Error("MONGO_URL is required. Add it to your .env file.");
  }
  if (config.mongoUrl.includes("cluster.example.mongodb.net") || config.mongoUrl.includes("username:password")) {
    throw new Error("MONGO_URL is still the placeholder value. Replace it with your real MongoDB Atlas connection string in .env.");
  }

  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(config.mongoUrl);
  return mongoose.connection;
}
