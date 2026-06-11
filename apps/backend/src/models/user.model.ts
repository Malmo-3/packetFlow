import { Schema, model } from "mongoose";

export type UserRole = "admin" | "carrier" | "sender" | "recipient";

export interface IUser {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  /** When set, the carrier is currently on an active shift. Cleared on end-shift. */
  shiftStartedAt?: Date | null;
  /** Unique public identifier for carriers (e.g. `CR-7QF3K9PA`), assigned at approval. */
  carrierId?: string;
}

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      require: true,
      minLength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "carrier", "sender", "recipient"],
      default: "sender",
    },
    shiftStartedAt: {
      type: Date,
      required: false,
      default: null,
    },
    carrierId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = model<IUser>("User", userSchema); // This creates the Mongoose model. model name in code = User && MongoDB collection = users

export default User;
