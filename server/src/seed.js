import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDb } from "./db.js";
import { Product, User } from "./models.js";
import { seedProducts } from "./seedData.js";

await connectDb();

await User.updateOne(
  { email: "admin@example.com" },
  {
    $set: {
      name: "Admin",
      passwordHash: await bcrypt.hash("Admin@12345", 12),
      role: "admin"
    }
  },
  { upsert: true }
);

for (const product of seedProducts) {
  await Product.updateOne({ name: product.name }, { $set: product }, { upsert: true });
}

await mongoose.disconnect();

console.log("Seeded products and admin account.");
