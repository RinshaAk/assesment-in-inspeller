import dotenv from "dotenv";

dotenv.config({ path: ".env" });

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUrl: process.env.MONGO_URL,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173",
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret-change-me"
};
