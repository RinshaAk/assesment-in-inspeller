import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { connectDb } from "./db.js";
import { router } from "./routes.js";
import { errorHandler, notFound } from "./errors.js";

const app = express();

app.use(cors({
  origin(origin, callback) {
    if (!origin || config.clientOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  }
}));
app.use(express.json({ limit: "50kb" }));
app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/api", router);
app.use(notFound);
app.use(errorHandler);

await connectDb();

app.listen(config.port, () => {
  console.log(`API listening on http://127.0.0.1:${config.port}`);
});
