/**
 * GDPR retention job — anonymize delivery data past the retention window.
 *
 *   npx tsx src/scripts/anonymize.ts
 *
 * Schedule this (e.g. daily cron) in production. Window is DATA_RETENTION_DAYS
 * (default 365).
 */

import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { anonymizeExpiredData } from "../services/anonymize.service";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function run(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in environment variables");
  }

  await mongoose.connect(mongoUri);
  const result = await anonymizeExpiredData();
  console.log("Anonymization complete:", result);
  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Anonymization failed:", error);
    process.exit(1);
  });
