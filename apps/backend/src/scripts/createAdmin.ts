/**
 * Create (or update) an admin user.
 *
 * Admin accounts cannot be created through public registration anymore — this
 * script is the only sanctioned path. Run it from the backend/ directory:
 *
 *   npx tsx src/scripts/createAdmin.ts
 *
 * Credentials are read from env vars, falling back to safe-ish dev defaults.
 * Always override these in any shared environment:
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='strong-pass' npx tsx src/scripts/createAdmin.ts
 */

import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/user.model";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function run(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in environment variables");
  }

  const email = (process.env.ADMIN_EMAIL || "admin@packetflow.io").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const fullName = process.env.ADMIN_NAME || "PacketFlow Admin";

  await mongoose.connect(mongoUri);

  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.fullName = fullName;
    existing.password = hashedPassword;
    existing.role = "admin";
    await existing.save();
    console.log(`Updated existing user "${email}" and promoted to admin.`);
  } else {
    await User.create({ fullName, email, password: hashedPassword, role: "admin" });
    console.log(`Created admin user "${email}".`);
  }

  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      "WARNING: used the default admin password. Set ADMIN_PASSWORD and re-run before going live.",
    );
  }

  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to create admin:", error);
    process.exit(1);
  });
