/**
 * Danger: delete all packages, deliveries and notifications (dev/demo reset).
 * Users and trips are left intact.
 *
 *   npx tsx src/scripts/clearPackages.ts
 */

import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import Package from "../models/package.model";
import { Delivery } from "../models/delivery.model";
import { Notification } from "../models/notification.model";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function run(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in environment variables");
  }

  await mongoose.connect(mongoUri);

  const pkgs = await Package.deleteMany({});
  const deliveries = await Delivery.deleteMany({});
  const notifs = await Notification.deleteMany({});

  console.log(
    `Deleted ${pkgs.deletedCount} packages, ${deliveries.deletedCount} deliveries, ${notifs.deletedCount} notifications.`,
  );

  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to clear packages:", error);
    process.exit(1);
  });
